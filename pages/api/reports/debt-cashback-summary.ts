import type { NextApiRequest, NextApiResponse } from 'next';
import { getDebtCashbackSummary } from '../../../lib/reporting/debtCashbackReportLogic';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { personId, fromDate, toDate } = req.query;

  if (typeof personId !== 'string') {
    return res.status(400).json({ error: 'personId must be a string' });
  }

  try {
    const summary = await getDebtCashbackSummary(
      personId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined
    );
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get debt and cashback summary' });
  }
}
