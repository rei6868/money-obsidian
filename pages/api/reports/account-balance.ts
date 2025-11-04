import type { NextApiRequest, NextApiResponse } from "next";
import { getAccountBalances } from "../../../../lib/logic/reportingLogic";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accountId, startDate, endDate, page, pageSize } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 50;

    const result = await getAccountBalances(
      accountId as string | undefined,
      start,
      end,
      pageNum,
      size
    );

    res.status(200).json({
      data: result.summaries,
      pagination: {
        page: pageNum,
        pageSize: size,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / size)
      }
    });
  } catch (error) {
    console.error("Failed to fetch account balances", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
