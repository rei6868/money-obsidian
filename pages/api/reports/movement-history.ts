import type { NextApiRequest, NextApiResponse } from "next";
import { getMovementHistory } from "../../../../lib/logic/reportingLogic";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { startDate, endDate, accountId, categoryId, page, pageSize } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const size = pageSize ? parseInt(pageSize as string, 10) : 50;

    const result = await getMovementHistory(
      start,
      end,
      accountId as string | undefined,
      categoryId as string | undefined,
      pageNum,
      size
    );

    res.status(200).json({
      data: result.movements,
      pagination: {
        page: pageNum,
        pageSize: size,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / size)
      }
    });
  } catch (error) {
    console.error("Failed to fetch movement history", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
