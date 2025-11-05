
import { runJob, jobs } from '../lib/automation/jobScheduler';

const jobName = process.argv[2] as keyof typeof jobs;

if (!jobName) {
  console.error('Please provide a job name to run.');
  console.log(`Available jobs: ${Object.keys(jobs).join(', ')}`);
  process.exit(1);
}

runJob(jobName);
