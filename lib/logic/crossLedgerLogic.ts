import { getDb } from '../db/client';
import { cashbackLedger } from '../../src/db/schema/cashbackLedger';
import { debtLedger, debtLedgerStatusEnum, NewDebtLedger } from '../../src/db/schema/debtLedger';
import { debtMovements, debtMovementTypeEnum, debtMovementStatusEnum, NewDebtMovement } from '../../src/db/schema/debtMovements';
import { cashbackMovements } from '../../src/db/schema/cashbackMovements'; // Added import
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createCashbackMovement, rollbackCashbackMovement } from './cashbackLedgerLogic';
import { createDebtMovement, rollbackDebtMovement } from './debtLedgerLogic';
import { NewTransaction } from '../../src/db/schema/transactions';
import { NewCashbackMovement } from '../../src/db/schema/cashbackMovements';

export const updateLedgersOnTransaction = async (transaction: NewTransaction, body: any) => {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    // Debt logic
    if (body.personId && body.debtMovement) {
      const { movementType, cycleTag } = body.debtMovement;
      const amount = parseFloat(transaction.amount as string);

      const newDebtMovement: NewDebtMovement = {
        debtMovementId: randomUUID(),
        transactionId: transaction.transactionId,
        personId: body.personId,
        accountId: transaction.accountId,
        movementType,
        amount: amount.toFixed(2),
        cycleTag: cycleTag || null,
        status: "active", // Default status
        notes: body.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await createDebtMovement(newDebtMovement);
    }

    // Cashback logic
    if (body.accountId && body.cashbackMovement) {
      const { cashbackType, cashbackValue, cycleTag } = body.cashbackMovement;
      const transactionAmount = parseFloat(transaction.amount as string);
      let cashbackAmount = 0;

      if (cashbackType === "percent") {
        cashbackAmount = transactionAmount * (parseFloat(cashbackValue) / 100);
      } else if (cashbackType === "fixed") {
        cashbackAmount = parseFloat(cashbackValue);
      } else {
        throw new Error(`Invalid cashbackType: ${cashbackType}`);
      }

      const newCashbackMovement: NewCashbackMovement = {
        cashbackMovementId: randomUUID(),
        transactionId: transaction.transactionId,
        accountId: transaction.accountId,
        cycleTag: cycleTag || null,
        cashbackType,
        cashbackValue: parseFloat(cashbackValue).toFixed(4),
        cashbackAmount: cashbackAmount.toFixed(2),
        status: "applied", // Default status
        note: body.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await createCashbackMovement(newCashbackMovement);
    }

    return { success: true };
  });
};

export const rollbackLedgersOnTransaction = async (transactionId: string, body: any) => {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    // Rollback Debt
    if (body.personId && body.debtMovement) {
      // Find the debt movement associated with the transaction
      const [debtMovement] = await tx.select().from(debtMovements)
        .where(eq(debtMovements.transactionId, transactionId));
      if (debtMovement) {
        await rollbackDebtMovement(debtMovement.debtMovementId);
      }
    }

    // Rollback Cashback
    if (body.accountId && body.cashbackMovement) {
      // Find the cashback movement associated with the transaction
      const [cashbackMovement] = await tx.select().from(cashbackMovements)
        .where(eq(cashbackMovements.transactionId, transactionId));
      if (cashbackMovement) {
        await rollbackCashbackMovement(cashbackMovement.cashbackMovementId);
      }
    }
    return { success: true };
  });
};
