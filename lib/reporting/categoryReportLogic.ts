import { getDb } from '../db/client';
import { transactions } from '../../src/db/schema/transactions';
import { and, eq, gte, lte, sum, count } from 'drizzle-orm';

export async function getCategorySummary(categoryId: string, fromDate?: Date, toDate?: Date) {
  const db = getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Build date filters
  const dateFilters = [];
  if (fromDate) dateFilters.push(gte(transactions.occurredOn, fromDate));
  if (toDate) dateFilters.push(lte(transactions.occurredOn, toDate));

  // Get total spending and transaction count for the category
  const result = await db
    .select({
      totalSpending: sum(transactions.amount),
      numberOfTransactions: count(transactions.transactionId)
    })
    .from(transactions)
    .where(and(
      eq(transactions.categoryId, categoryId),
      eq(transactions.type, 'expense'),
      eq(transactions.status, 'active'),
      ...dateFilters
    ));

  const totalSpending = parseFloat(result[0]?.totalSpending?.toString() || '0');
  const numberOfTransactions = parseInt(result[0]?.numberOfTransactions?.toString() || '0');

  return {
    categoryId,
    totalSpending,
    numberOfTransactions,
  };
}
