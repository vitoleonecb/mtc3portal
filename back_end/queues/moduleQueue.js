import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ maxEntriesPerRequest: null });

const moduleQueue = new Queue('moduleQueue', { connection });

export default moduleQueue;
