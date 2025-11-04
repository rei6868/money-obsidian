import { db } from '../db/client';
import { transactions } from '../../src/db/schema/transactions';
import { accounts } from '../../src/db/schema/accounts';
import { categories } from '../../src/db/schema/categories';
import { debtLedger } from '../../src/db/schema/debtLedger';
import { cashbackLedger } from '../../src/db/schema/cashbackLedger';
import { eq, and, gte, lte, sql, desc, sum, count } from 'drizzle-orm';

export interface AccountBalanceSummary {
  accountId: string;
  accountName: string;
  currentBalance: number;
  totalIn: number;
  totalOut: number;
  netFlow: number;
  period: string;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  period: string;
}

export interface MovementHistoryItem {
  transactionId: string;
  occurredOn: string;
  amount: number;
  type: string;
  accountName: string;
  categoryName?: string;
  notes?: string;
}

export interface TopExpense {
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface RecurringTrend {
  categoryName: string;
  frequency: string; // monthly, weekly, etc.
  averageAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ForecastItem {
  type: 'debt' | 'cashback';
  projectedAmount: number;
  confidence: number;
  period: string;
}

export async function getAccountBalances(
  accountId?: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  pageSize: number = 50
): Promise<{ summaries: AccountBalanceSummary[]; totalCount: number }> {
  if (!db) throw new Error('Database not available');

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const whereConditions = [];
  if (accountId) whereConditions.push(eq(accounts.accountId, accountId));
  if (startDate) whereConditions.push(gte(transactions.occurredOn, startDate));
  if (endDate) whereConditions.push(lte(transactions.occurredOn, endDate));

  const accountQuery = db
    .select({
      accountId: accounts.accountId,
      accountName: accounts.accountName,
      currentBalance: accounts.currentBalance,
      totalIn: accounts.totalIn,
      totalOut: accounts.totalOut,
      period: sql<string>`CONCAT(${startDate ? sql`${startDate}::date` : sql`'all-time'`}, ' to ', ${endDate ? sql`${endDate}::date` : sql`'present'`})`
    })
    .from(accounts)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(accounts.accountId, accounts.accountName, accounts.currentBalance, accounts.totalIn, accounts.totalOut)
    .limit(pageSize)
    .offset(offset);

  const summaries = await accountQuery;

  // Get total count
  const countQuery = db
    .select({ count: count() })
    .from(accounts)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const [{ count: totalCount }] = await countQuery;

  return {
    summaries: summaries.map(s => ({
      ...s,
      currentBalance: parseFloat(s.currentBalance || '0'),
      totalIn: parseFloat(s.totalIn || '0'),
      totalOut: parseFloat(s.totalOut || '0'),
      netFlow: parseFloat(s.totalIn || '0') - parseFloat(s.totalOut || '0')
    })),
    totalCount: totalCount as number
  };
}

export async function getCategorySummaries(
  categoryId?: string,
  startDate?: Date,
  endDate?: Date,
  groupBy: 'monthly' | 'yearly' = 'monthly',
  page: number = 1,
  pageSize: number = 50
): Promise<{ summaries: CategorySummary[]; totalCount: number }> {
  if (!db) throw new Error('Database not available');

  const offset = (page - 1) * pageSize;

  const groupByExpr = groupBy === 'monthly'
    ? sql<string>`TO_CHAR(${transactions.occurredOn}, 'YYYY-MM')`
    : sql<string>`TO_CHAR(${transactions.occurredOn}, 'YYYY')`;

  const whereConditions = [];
  if (categoryId) whereConditions.push(eq(categories.categoryId, categoryId));
  if (startDate) whereConditions.push(gte(transactions.occurredOn, startDate));
  if (endDate) whereConditions.push(lte(transactions.occurredOn, endDate));

  const categoryQuery = db
    .select({
      categoryId: categories.categoryId,
      categoryName: categories.name,
      totalAmount: sum(transactions.amount),
      transactionCount: count(),
      period: groupByExpr
    })
    .from(categories)
    .leftJoin(transactions, eq(categories.categoryId, transactions.categoryId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(categories.categoryId, categories.name, groupByExpr)
    .orderBy(desc(sum(transactions.amount)))
    .limit(pageSize)
    .offset(offset);

  const summaries = await categoryQuery;

  // Get total count
  const countQuery = db
    .select({ count: count() })
    .from(categories)
    .leftJoin(transactions, eq(categories.categoryId, transactions.categoryId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(categories.categoryId, categories.name, groupByExpr);

  const countResult = await countQuery;
  const totalCount = countResult.length;

  return {
    summaries: summaries.map(s => ({
      ...s,
      totalAmount: parseFloat(s.totalAmount || '0'),
      averageAmount: parseFloat(s.totalAmount || '0') / (s.transactionCount as number || 1)
    })),
    totalCount
  };
}

export async function getMovementHistory(
  startDate?: Date,
  endDate?: Date,
  accountId?: string,
  categoryId?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ movements: MovementHistoryItem[]; totalCount: number }> {
  if (!db) throw new Error('Database not available');

  const offset = (page - 1) * pageSize;

  const whereConditions = [];
  if (startDate) whereConditions.push(gte(transactions.occurredOn, startDate));
  if (endDate) whereConditions.push(lte(transactions.occurredOn, endDate));
  if (accountId) whereConditions.push(eq(transactions.accountId, accountId));
  if (categoryId) whereConditions.push(eq(transactions.categoryId, categoryId));

  const movementQuery = db
    .select({
      transactionId: transactions.transactionId,
      occurredOn: transactions.occurredOn,
      amount: transactions.amount,
      type: transactions.type,
      accountName: accounts.accountName,
      categoryName: categories.name,
      notes: transactions.notes
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.accountId))
    .leftJoin(categories, eq(transactions.categoryId, categories.categoryId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(transactions.occurredOn))
    .limit(pageSize)
    .offset(offset);

  const movements = await movementQuery;

  // Get total count
  const countQuery = db
    .select({ count: count() })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.accountId))
    .leftJoin(categories, eq(transactions.categoryId, categories.categoryId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const [{ count: totalCount }] = await countQuery;

  return {
    movements: movements.map(m => ({
      ...m,
      amount: parseFloat(m.amount || '0'),
      occurredOn: m.occurredOn?.toISOString().split('T')[0] || '',
      categoryName: m.categoryName || undefined, // Ensure categoryName is string | undefined
    })),
    totalCount: totalCount as number
  };
}

export async function getTopExpenses(
  startDate?: Date,
  endDate?: Date,
  limit: number = 10
): Promise<TopExpense[]> {
  if (!db) throw new Error('Database not available');

  const whereConditions = [
    eq(transactions.type, 'expense' as const)
  ];
  if (startDate) whereConditions.push(gte(transactions.occurredOn, startDate));
  if (endDate) whereConditions.push(lte(transactions.occurredOn, endDate));

  const totalExpenseQuery = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(...whereConditions));

  const [{ total: totalExpenses }] = await totalExpenseQuery;

  const topExpensesQuery = db
    .select({
      categoryName: categories.name,
      totalAmount: sum(transactions.amount)
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.categoryId))
    .where(and(...whereConditions))
    .groupBy(categories.name)
    .orderBy(desc(sum(transactions.amount)))
    .limit(limit);

  const topExpenses = await topExpensesQuery;

  const totalExpenseAmount = parseFloat(totalExpenses || '0');

  return topExpenses.map(te => ({
    categoryName: te.categoryName || 'Uncategorized',
    totalAmount: parseFloat(te.totalAmount || '0'),
    percentage: totalExpenseAmount > 0 ? (parseFloat(te.totalAmount || '0') / totalExpenseAmount) * 100 : 0
  }));
}

export async function getRecurringTrends(
  startDate?: Date,
  endDate?: Date,
  limit: number = 10
): Promise<RecurringTrend[]> {
  if (!db) throw new Error('Database not available');

  // This is a simplified implementation - in a real scenario, you'd analyze transaction patterns
  // For now, we'll return categories with monthly averages
  const whereConditions = [];
  if (startDate) whereConditions.push(gte(transactions.occurredOn, startDate));
  if (endDate) whereConditions.push(lte(transactions.occurredOn, endDate));

  const trendsQuery = db
    .select({
      categoryName: categories.name,
      month: sql<string>`TO_CHAR(${transactions.occurredOn}, 'YYYY-MM')`,
      totalAmount: sum(transactions.amount),
      transactionCount: count()
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.categoryId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(categories.name, sql`TO_CHAR(${transactions.occurredOn}, 'YYYY-MM')`)
    .orderBy(categories.name, sql`TO_CHAR(${transactions.occurredOn}, 'YYYY-MM')`);

  const trendsData = await trendsQuery;

  // Group by category and calculate trends
  const categoryTrends = new Map<string, { amounts: number[]; months: string[] }>();

  trendsData.forEach(td => {
    const catName = td.categoryName || 'Uncategorized';
    if (!categoryTrends.has(catName)) {
      categoryTrends.set(catName, { amounts: [], months: [] });
    }
    const catData = categoryTrends.get(catName)!;
    catData.amounts.push(parseFloat(td.totalAmount || '0'));
    catData.months.push(td.month);
  });

  const trends: RecurringTrend[] = [];
  for (const [categoryName, data] of categoryTrends) {
    if (data.amounts.length < 2) continue; // Need at least 2 months for trend

    const averageAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
    const trend = data.amounts.length >= 3
      ? (data.amounts[data.amounts.length - 1] > data.amounts[data.amounts.length - 2] ? 'increasing' :
         data.amounts[data.amounts.length - 1] < data.amounts[data.amounts.length - 2] ? 'decreasing' : 'stable')
      : 'stable';

    trends.push({
      categoryName,
      frequency: 'monthly',
      averageAmount,
      trend: trend as 'increasing' | 'decreasing' | 'stable'
    });
  }

  return trends.sort((a, b) => b.averageAmount - a.averageAmount).slice(0, limit);
}

export async function getForecasts(
  period: 'next-month' | 'next-quarter' | 'next-year' = 'next-month'
): Promise<ForecastItem[]> {
  if (!db) throw new Error('Database not available');

  // Simplified forecasting based on historical averages
  const forecasts: ForecastItem[] = [];

  // Debt forecast
  const debtQuery = db
    .select({ totalNetDebt: sum(debtLedger.netDebt) })
    .from(debtLedger);

  const [{ totalNetDebt }] = await debtQuery;
  const debtAmount = parseFloat(totalNetDebt || '0');

  forecasts.push({
    type: 'debt',
    projectedAmount: debtAmount * 1.05, // 5% increase assumption
    confidence: 0.7,
    period
  });

  // Cashback forecast
  const cashbackQuery = db
    .select({ totalBalance: sum(cashbackLedger.totalCashback) })
    .from(cashbackLedger);

  const [{ totalBalance }] = await cashbackQuery;
  const cashbackAmount = parseFloat(totalBalance || '0');

  forecasts.push({
    type: 'cashback',
    projectedAmount: cashbackAmount * 1.1, // 10% increase assumption
    confidence: 0.8,
    period
  });

  return forecasts;
}
