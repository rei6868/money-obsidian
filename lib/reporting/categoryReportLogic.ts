import { getDb } from '../db/client';
import { transactions } from '../../src/db/schema/transactions';
import { and, eq, gte, lte } from 'drizzle-orm';

export async function getCategorySummary(categoryId: string, fromDate?: Date, toDate?: Date) {
  // TODO: Implement actual logic
  return {
    categoryId,
    totalSpending: 500,
    numberOfTransactions: 10,
  };
}
