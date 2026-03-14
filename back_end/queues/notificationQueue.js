import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ maxRetriesPerRequest: null });

const notificationQueue = new Queue('notificationQueue', { connection });

export default notificationQueue;
