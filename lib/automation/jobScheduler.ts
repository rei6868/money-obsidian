
import cron from 'node-cron';

// Define the jobs
const jobs = {
  'reconcile-balances': () => {
    console.log('Running daily balance reconciliation...');
    // Add your reconciliation logic here
  },
  'generate-reports': () => {
    console.log('Generating monthly reports...');
    // Add your report generation logic here
  },
  'audit-ledgers': () => {
    console.log('Auditing debt/cashback ledgers...');
    // Add your ledger auditing logic here
  },
};

// Schedule the jobs
const scheduleJobs = () => {
  // Schedule daily balance reconciliation to run at midnight every day
  cron.schedule('0 0 * * *', jobs['reconcile-balances']);

  // Schedule monthly report generation to run at 1 AM on the first day of every month
  cron.schedule('0 1 1 * *', jobs['generate-reports']);

  // Schedule ledger auditing to run at 2 AM every Sunday
  cron.schedule('0 2 * * 0', jobs['audit-ledgers']);

  console.log('Jobs scheduled.');
};

// Function to run a specific job manually
const runJob = (jobName: keyof typeof jobs) => {
  if (jobs[jobName]) {
    console.log(`Manually running job: ${jobName}`);
    jobs[jobName]();
  } else {
    console.error(`Job not found: ${jobName}`);
  }
};

export { scheduleJobs, runJob, jobs };
