import { getDb } from '../db/client';
import { transactions, NewTransaction } from '../../src/db/schema/transactions';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { updateLedgersOnTransaction, rollbackLedgersOnTransaction } from './crossLedgerLogic';

export async function createTransaction(data: NewTransaction) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    const newTransaction: NewTransaction = {
      ...data,
      transactionId: data.transactionId || randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [insertedTransaction] = await tx.insert(transactions).values(newTransaction).returning();
    await updateLedgersOnTransaction(insertedTransaction, data); // Assuming data contains necessary info for ledgers
    return insertedTransaction;
  });
}

export async function updateTransaction(id: string, data: Partial<NewTransaction>) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    const [updatedTransaction] = await tx.update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transactions.transactionId, id))
      .returning();
    await updateLedgersOnTransaction(updatedTransaction, data); // Assuming data contains necessary info for ledgers
    return updatedTransaction;
  });
}

export async function deleteTransaction(id: string) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    const [deletedTransaction] = await tx.delete(transactions)
      .where(eq(transactions.transactionId, id))
      .returning();
    await rollbackLedgersOnTransaction(id, deletedTransaction); // Assuming deletedTransaction contains necessary info for rollback
    return deletedTransaction;
  });
}
