import { getDb } from '../../lib/db/client';
import { transactions } from '../../src/db/schema/transactions';
import { sql, sum, gte, lte, and } from 'drizzle-orm';
import dayjs from 'dayjs';

async function generateDailySummary() {
  console.log('Starting daily summary generation...');

  const db = getDb();
  if (!db) {
    console.error('Database connection not available. Exiting daily summary.');
    return;
  }

  const today = dayjs().startOf('day');
  const yesterday = dayjs().subtract(1, 'day').startOf('day');

  try {
    const dailyTransactions = await db.select()
      .from(transactions)
      .where(and(gte(transactions.createdAt, yesterday.toDate()), lte(transactions.createdAt, today.toDate())));

    const totalIncome = dailyTransactions
      .filter(t => t.amount !== null && t.amount > 0)
      .reduce((acc, t) => acc + t.amount!, 0);

    const totalExpenses = dailyTransactions
      .filter(t => t.amount !== null && t.amount < 0)
      .reduce((acc, t) => acc + t.amount!, 0);

    console.log(`--- Daily Summary for ${yesterday.format('YYYY-MM-DD')} ---`);
    console.log(`Total Income: ${totalIncome.toFixed(2)}`);
    console.log(`Total Expenses: ${totalExpenses.toFixed(2)}`);
    console.log(`Net Change: ${(totalIncome + totalExpenses).toFixed(2)}`);
    console.log(`Number of transactions: ${dailyTransactions.length}`);
    console.log('------------------------------------');

    // In a real application, you might save this summary to a database,
    // send an email, or push a notification.

  } catch (error) {
    console.error('Error generating daily summary:', error);
  } finally {
    console.log('Daily summary generation finished.');
  }
}

generateDailySummary().catch(console.error);
