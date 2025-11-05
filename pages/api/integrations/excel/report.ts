import type { NextApiRequest, NextApiResponse } from 'next';
import ExcelJS from 'exceljs';
import { getDb } from '../../../../lib/db/client';
import { transactions } from '../../../../src/db/schema/transactions';
import { eq, and, gte, lte } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Missing or invalid startDate or endDate query parameters.' });
    }

    const db = getDb();
    if (!db) {
      throw new Error('Database connection not available');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const transactionsData = await db.select()
      .from(transactions)
      .where(and(gte(transactions.createdAt, start), lte(transactions.createdAt, end)));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions Report');

    worksheet.columns = [
      { header: 'Transaction ID', key: 'transactionId', width: 36 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Date', key: 'createdAt', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Account ID', key: 'accountId', width: 36 },
    ];

    transactionsData.forEach(txn => {
      worksheet.addRow({
        transactionId: txn.transactionId,
        description: txn.description,
        amount: txn.amount,
        type: txn.type,
        createdAt: txn.createdAt?.toISOString().split('T')[0], // Format date
        category: txn.category,
        accountId: txn.accountId,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${startDate}-${endDate}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
