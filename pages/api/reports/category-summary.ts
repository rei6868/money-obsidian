import type { NextApiRequest, NextApiResponse } from 'next';
import { getCategorySummary } from '../../../lib/reporting/categoryReportLogic';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { categoryId, fromDate, toDate } = req.query;

  if (typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'categoryId must be a string' });
  }

  try {
    const summary = await getCategorySummary(
      categoryId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined
    );
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category summary' });
  }
}
