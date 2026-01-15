import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ maxRetriesPerRequest: null });

// Queue dedicated to running AI analysis per prompt once a module
// moves into the processing state.
const aiAnalysisQueue = new Queue('aiAnalysisQueue', { connection });

export default aiAnalysisQueue;