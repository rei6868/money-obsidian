import type { NextApiRequest, NextApiResponse } from "next";
import { getTopExpenses, getRecurringTrends, getForecasts } from "../../../../lib/logic/reportingLogic";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, startDate, endDate, limit, period } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    const forecastPeriod = (period as 'next-month' | 'next-quarter' | 'next-year') || 'next-month';

    let result;

    switch (action) {
      case 'top-expenses':
        result = await getTopExpenses(start, end, limitNum);
        break;
      case 'recurring-trends':
        result = await getRecurringTrends(start, end, limitNum);
        break;
      case 'forecasts':
        result = await getForecasts(forecastPeriod);
        break;
      default:
        return res.status(400).json({ error: "Invalid action. Use: top-expenses, recurring-trends, or forecasts" });
    }

    res.status(200).json({
      action,
      data: result
    });
  } catch (error) {
    console.error("Failed to fetch analytics", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
