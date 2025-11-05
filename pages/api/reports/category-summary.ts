import type { NextApiRequest, NextApiResponse } from 'next';
import { getCategorySummary } from '../../../lib/reporting/categoryReportLogic';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { categoryId, fromDate, toDate, page, pageSize, sortBy, sortDir } = req.query;

  if (typeof categoryId !== 'string') {
    return res.status(400).json({ error: 'categoryId must be a string' });
  }

  // Validate date formats
  if (fromDate && isNaN(Date.parse(fromDate as string))) {
    return res.status(400).json({ error: 'Invalid fromDate format' });
  }
  if (toDate && isNaN(Date.parse(toDate as string))) {
    return res.status(400).json({ error: 'Invalid toDate format' });
  }

  // Validate pagination
  const pageNum = page ? parseInt(page as string, 10) : 1;
  const pageSizeNum = pageSize ? parseInt(pageSize as string, 10) : 20;
  if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  // Validate sorting
  const validSortFields = ['occurredOn', 'amount', 'type'];
  const sortByField = sortBy as string;
  const sortDirValue = sortDir as string;
  if (sortBy && !validSortFields.includes(sortByField)) {
    return res.status(400).json({ error: 'Invalid sortBy field' });
  }
  if (sortDir && !['asc', 'desc'].includes(sortDirValue)) {
    return res.status(400).json({ error: 'Invalid sortDir value' });
  }

  try {
    const summary = await getCategorySummary(
      categoryId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined
    );
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting category summary:', error);
    res.status(500).json({ error: 'Failed to get category summary' });
  }
}
