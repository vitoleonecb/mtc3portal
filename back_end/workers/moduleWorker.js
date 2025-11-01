import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config({ path: '../.env' });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    waitForConnections: true
});

const connection = new IORedis({ maxRetriesPerRequest: null });

const moduleWorker = new Worker('moduleQueue', async job => {
	
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
			console.log(`Unknown jon: ${job.name}`);
	}

	await db.execute(
		'UPDATE workshop_modules SET workshop_module_status = ? WHERE workshop_module_id = ?',
		[newStatus, moduleId]
	);

	console.log(`Status of module with ID: ${moduleId} is updated to ${newStatus}`);

}, { connection });
