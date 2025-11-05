import { getDb } from '../db/client';
import { debtLedger } from '../../src/db/schema/debtLedger';
import { cashbackLedger } from '../../src/db/schema/cashbackLedger';
import { debtMovements } from '../../src/db/schema/debtMovements';
import { cashbackMovements } from '../../src/db/schema/cashbackMovements';
import { and, eq, gte, lte, sum, sql } from 'drizzle-orm';

export async function getDebtCashbackSummary(personId: string, fromDate?: Date, toDate?: Date) {
  const db = getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Build date filters
  const dateFilters = [];
  if (fromDate) dateFilters.push(gte(debtMovements.createdAt, fromDate));
  if (toDate) dateFilters.push(lte(debtMovements.createdAt, toDate));

  // Get total debt movements for the person
  const debtResult = await db
    .select({ total: sum(debtMovements.amount) })
    .from(debtMovements)
    .where(and(
      eq(debtMovements.personId, personId),
      eq(debtMovements.status, 'active'),
      ...dateFilters
    ));

  const totalDebt = parseFloat(debtResult[0]?.total || '0');

  // Get total cashback for accounts associated with the person
  // First, get accounts linked to the person via transactions
  const accountIds = await db
    .select({ accountId: debtMovements.accountId })
    .from(debtMovements)
    .where(eq(debtMovements.personId, personId));

  let totalCashback = 0;
  if (accountIds.length > 0) {
    const uniqueAccountIds = [...new Set(accountIds.map(a => a.accountId))];

    // Build date filters for cashback movements
    const cashbackDateFilters = [];
    if (fromDate) cashbackDateFilters.push(gte(cashbackMovements.createdAt, fromDate));
    if (toDate) cashbackDateFilters.push(lte(cashbackMovements.createdAt, toDate));

    for (const accountId of uniqueAccountIds) {
      const cashbackResult = await db
        .select({ total: sum(cashbackMovements.cashbackAmount) })
        .from(cashbackMovements)
        .where(and(
          eq(cashbackMovements.accountId, accountId),
          eq(cashbackMovements.status, 'applied'),
          ...cashbackDateFilters
        ));

      totalCashback += parseFloat(cashbackResult[0]?.total || '0');
    }
  }

  return {
    personId,
    totalDebt,
    totalCashback,
  };
}
