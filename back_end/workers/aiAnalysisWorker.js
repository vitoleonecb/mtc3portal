import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { runPromptAIAnalysis } from '../services/aiAnalysisService.js';

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

// Worker to process AI analysis jobs for prompts.
// Each job payload: { promptId, templateId? }
const aiAnalysisWorker = new Worker(
  'aiAnalysisQueue',
  async (job) => {
    console.log('AI analysis worker received job:', job.name, job.data);

    const { promptId, templateId } = job.data || {};

    if (!promptId) {
      console.warn('AI analysis job missing promptId');
      return;
    }

    try {
      await runPromptAIAnalysis({ promptId, templateId });
      console.log('AI analysis completed for prompt', promptId);
    } catch (err) {
      console.error('AI analysis job failed for prompt', promptId, err);
      throw err;
    }
  },
  { connection }
);

export default aiAnalysisWorker;