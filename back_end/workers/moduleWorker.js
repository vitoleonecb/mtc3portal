import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import aiAnalysisQueue from '../queues/aiAnalysisQueue.js';
import notificationQueue from '../queues/notificationQueue.js';
import { scheduleNextCycle } from '../services/cycleService.js';

dotenv.config({ path: '../.env' });

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  multipleStatements: true,
  waitForConnections: true,
});

const connection = new IORedis({ maxRetriesPerRequest: null });

const moduleWorker = new Worker(
  'moduleQueue',
  async (job) => {
    console.log(`Worker received job: ${job.name}`, job.data);

    const { moduleId } = job.data;

    let newStatus;

    switch (job.name) {
      case 'openModule':
        newStatus = 'open';
        break;

      case 'processModule':
        newStatus = 'processing';
        break;

      case 'completeModule':
        newStatus = 'completed';
        break;

      default:
        console.log(`Unknown job: ${job.name}`);
    }

    await db.execute(
      'UPDATE workshop_modules SET workshop_module_status = ? WHERE workshop_module_id = ?',
      [newStatus, moduleId]
    );

    console.log(`Status of module with ID: ${moduleId} is updated to ${newStatus}`);

    // ── Notification: module opened ──
    if (newStatus === 'open' && job.data.workshopId) {
      try {
        await notificationQueue.add('moduleOpen', { moduleId, workshopId: job.data.workshopId });
        console.log(`Enqueued moduleOpen notification for module ${moduleId}`);
      } catch (e) {
        console.error('Failed to enqueue moduleOpen notification:', e.message);
      }
    }

    // Mark the corresponding cycle_jobs row as completed
    try {
      await db.execute(
        `UPDATE cycle_jobs SET status = 'completed'
         WHERE module_id = ? AND job_name = ? AND status = 'pending'
         ORDER BY scheduled_for ASC LIMIT 1`,
        [moduleId, job.name]
      );
    } catch (e) {
      console.warn('Could not update cycle_jobs:', e.message);
    }

    // When a module enters processing, enqueue AI analysis jobs
    if (newStatus === 'processing') {
      try {
        const [promptRows] = await db.query(
          'SELECT workshop_prompt_id, prompt_template_id FROM workshop_prompts WHERE workshop_module_id = ?',
          [moduleId]
        );

        for (const row of promptRows) {
          await aiAnalysisQueue.add('analyzePrompt', {
            promptId: row.workshop_prompt_id,
            templateId: row.prompt_template_id,
          });
        }

        console.log(
          `Enqueued AI analysis jobs for ${promptRows.length} prompts in module`,
          moduleId
        );
      } catch (err) {
      console.error('Failed to enqueue AI analysis jobs for module', moduleId, err);
      }
    }

    // Auto-repeat: when all modules in the workshop are completed, schedule next cycle
    if (newStatus === 'completed' && job.data.workshopId) {
      try {
        const [remaining] = await db.query(
          `SELECT COUNT(*) AS cnt FROM workshop_modules
           WHERE workshop_id = ? AND workshop_module_status != 'completed'`,
          [job.data.workshopId]
        );
        if (Number(remaining[0].cnt) === 0) {
          console.log(`All modules completed for workshop ${job.data.workshopId}, checking auto-repeat...`);
          await scheduleNextCycle(job.data.workshopId);

          // ── Notification: materials ready ──
          // Find users who responded to ALL modules in this workshop
          try {
            const workshopId = job.data.workshopId;
            const [modules] = await db.query(
              'SELECT workshop_module_id FROM workshop_modules WHERE workshop_id = ?',
              [workshopId]
            );
            const moduleIds = modules.map(m => m.workshop_module_id);
            const totalModules = moduleIds.length;

            if (totalModules > 0) {
              // Users who have at least one response in every module
              const [eligibleRows] = await db.query(
                `SELECT wr.user_id, COUNT(DISTINCT wp.workshop_module_id) AS modules_responded
                 FROM workshop_responses wr
                 JOIN workshop_prompts wp ON wr.workshop_prompt_id = wp.workshop_prompt_id
                 WHERE wp.workshop_module_id IN (?)
                 GROUP BY wr.user_id
                 HAVING modules_responded = ?`,
                [moduleIds, totalModules]
              );
              const eligibleUserIds = eligibleRows.map(r => r.user_id);
              if (eligibleUserIds.length > 0) {
                await notificationQueue.add('materialsReady', { workshopId, eligibleUserIds });
                console.log(`Enqueued materialsReady notification for ${eligibleUserIds.length} users`);
              }
            }
          } catch (notifErr) {
            console.error('Failed to enqueue materialsReady notification:', notifErr.message);
          }
        }
      } catch (e) {
        console.error('Auto-repeat check error:', e);
      }
    }
  },
  { connection }
);

export default moduleWorker;
