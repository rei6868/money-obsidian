import { getDb } from '../db/client';
import { transactions } from '../../src/db/schema/transactions';
import { accounts } from '../../src/db/schema/accounts';
import { and, eq, gte, lte, sum, sql } from 'drizzle-orm';

export async function getAccountSummary(accountId: string, fromDate?: Date, toDate?: Date) {
  const db = getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Build date filters
  const dateFilters = [];
  if (fromDate) dateFilters.push(gte(transactions.occurredOn, fromDate));
  if (toDate) dateFilters.push(lte(transactions.occurredOn, toDate));

  // Get total income in period
  const incomeResult = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(
      eq(transactions.accountId, accountId),
      eq(transactions.type, 'income'),
      eq(transactions.status, 'active'),
      ...dateFilters
    ));

  const totalIncome = parseFloat(incomeResult[0]?.total || '0');

  // Get total expenses in period
  const expenseResult = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(
      eq(transactions.accountId, accountId),
      eq(transactions.type, 'expense'),
      eq(transactions.status, 'active'),
      ...dateFilters
    ));

  const totalExpenses = parseFloat(expenseResult[0]?.total || '0');

  // Get account opening balance
  const accountResult = await db
    .select({ openingBalance: accounts.openingBalance, currentBalance: accounts.currentBalance })
    .from(accounts)
    .where(eq(accounts.accountId, accountId));

  if (!accountResult.length) {
    throw new Error('Account not found');
  }

  const openingBalance = parseFloat(accountResult[0].openingBalance);
  const currentBalance = parseFloat(accountResult[0].currentBalance);

  // Calculate opening balance for the period
  // If no date range, opening balance is the account's opening balance
  // If date range, opening balance is current balance minus net transactions in period
  let periodOpeningBalance = openingBalance;
  if (fromDate || toDate) {
    periodOpeningBalance = currentBalance - (totalIncome - totalExpenses);
  }

  const closingBalance = periodOpeningBalance + totalIncome - totalExpenses;

  return {
    accountId,
    openingBalance: periodOpeningBalance,
    closingBalance,
    totalIncome,
    totalExpenses,
  };
}
