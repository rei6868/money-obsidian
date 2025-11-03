import { getDb } from '../db/client';
import { cashbackLedger } from '../../src/db/schema/cashbackLedger';
import { cashbackMovements, NewCashbackMovement, cashbackStatusEnum } from '../../src/db/schema/cashbackMovements';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function createCashbackMovement(data: NewCashbackMovement) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    const newMovement: NewCashbackMovement = {
      ...data,
      cashbackMovementId: data.cashbackMovementId || randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [insertedMovement] = await tx.insert(cashbackMovements).values(newMovement).returning();

    // Update cashback ledger
    const amount = parseFloat(insertedMovement.cashbackAmount as string);
    const accountId = insertedMovement.accountId;
    const cycleTag = insertedMovement.cycleTag;

    const [ledger] = await tx.select().from(cashbackLedger)
      .where(and(eq(cashbackLedger.accountId, accountId), eq(cashbackLedger.cycleTag, cycleTag)));

    if (ledger) {
      const totalCashback = parseFloat(ledger.totalCashback as string);
      const remainingBudget = parseFloat(ledger.remainingBudget as string);
      await tx.update(cashbackLedger)
        .set({
          totalCashback: (totalCashback + amount).toFixed(2),
          remainingBudget: (remainingBudget - amount).toFixed(2),
          lastUpdated: new Date(),
        })
        .where(eq(cashbackLedger.cashbackLedgerId, ledger.cashbackLedgerId));
    } else {
      await tx.insert(cashbackLedger).values({
        cashbackLedgerId: randomUUID(),
        accountId,
        cycleTag,
        totalSpend: "0.00", // Initialize with 0
        totalCashback: amount.toFixed(2),
        budgetCap: "0.00", // Initialize with 0
        eligibility: "pending", // Initialize with a default status
        remainingBudget: amount.toFixed(2), // Initialize with cashback amount
        status: 'open',
        lastUpdated: new Date(),
      });
    }

    return insertedMovement;
  });
}

export async function getCashbackBalance(accountId: string, cycleTag: string) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const [ledger] = await db.select().from(cashbackLedger)
    .where(and(eq(cashbackLedger.accountId, accountId), eq(cashbackLedger.cycleTag, cycleTag)));

  return { balance: ledger ? parseFloat(ledger.totalCashback as string) : 0 };
}

export async function rollbackCashbackMovement(movementId: string) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    const [movement] = await tx.select().from(cashbackMovements)
      .where(eq(cashbackMovements.cashbackMovementId, movementId));

    if (!movement || movement.status === 'invalidated') {
      throw new Error('Cashback movement not found or already invalidated');
    }

    await tx.update(cashbackMovements)
      .set({ status: 'invalidated', updatedAt: new Date() })
      .where(eq(cashbackMovements.cashbackMovementId, movementId));

    // Rollback cashback ledger
    const amount = parseFloat(movement.cashbackAmount as string);
    const accountId = movement.accountId;
    const cycleTag = movement.cycleTag;

    const [ledger] = await tx.select().from(cashbackLedger)
      .where(and(eq(cashbackLedger.accountId, accountId), eq(cashbackLedger.cycleTag, cycleTag)));

    if (ledger) {
      const totalCashback = parseFloat(ledger.totalCashback as string);
      const remainingBudget = parseFloat(ledger.remainingBudget as string);
      await tx.update(cashbackLedger)
        .set({
          totalCashback: (totalCashback - amount).toFixed(2),
          remainingBudget: (remainingBudget + amount).toFixed(2),
          lastUpdated: new Date(),
        })
        .where(eq(cashbackLedger.cashbackLedgerId, ledger.cashbackLedgerId));
    }
    return { success: true, movementId };
  });
}
