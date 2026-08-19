import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('cleanup expired orders and gift requests', { hours: 1 }, internal.cleanup.removeExpiredRecords);

export default crons;
