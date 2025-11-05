
import type { NextApiRequest, NextApiResponse } from 'next';
import { runJob, jobs } from '../../../lib/automation/jobScheduler';

type Data = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'POST') {
    const { jobName } = req.body;

    if (!jobName || !jobs[jobName as keyof typeof jobs]) {
      return res.status(400).json({ message: 'Invalid job name' });
    }

    try {
      runJob(jobName);
      res.status(200).json({ message: `Job '${jobName}' executed successfully` });
    } catch (error) {
      res.status(500).json({ message: `Job '${jobName}' failed to execute` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
