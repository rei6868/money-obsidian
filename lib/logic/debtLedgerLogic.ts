import { getDb } from '../db/client';
import { debtLedger, NewDebtLedger, debtLedgerStatusEnum } from '../../src/db/schema/debtLedger';
import { debtMovements, NewDebtMovement, debtMovementStatusEnum } from '../../src/db/schema/debtMovements';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function createDebtMovement(data: NewDebtMovement) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    const newMovement: NewDebtMovement = {
      ...data,
      debtMovementId: data.debtMovementId || randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [insertedMovement] = await tx.insert(debtMovements).values(newMovement).returning();

    // Update debt ledger
    const amount = parseFloat(insertedMovement.amount as string);
    const personId = insertedMovement.personId;
    const cycleTag = insertedMovement.cycleTag;
    const movementType = insertedMovement.movementType;

    const [ledger] = await tx.select().from(debtLedger)
      .where(
        and(
          eq(debtLedger.personId, personId),
          cycleTag ? eq(debtLedger.cycleTag, cycleTag) : isNull(debtLedger.cycleTag)
        )
      );

    let newDebt = 0, repayments = 0, debtDiscount = 0;

    if (movementType === "borrow") newDebt = amount;
    if (movementType === "repay") repayments = amount;
    if (movementType === "discount") debtDiscount = amount;

    if (ledger) {
      const currentInitialDebt = parseFloat(ledger.initialDebt as string);
      const currentNewDebt = parseFloat(ledger.newDebt as string);
      const currentRepayments = parseFloat(ledger.repayments as string);
      const currentDebtDiscount = parseFloat(ledger.debtDiscount as string);

      const updatedNewDebt = currentNewDebt + newDebt;
      const updatedRepayments = currentRepayments + repayments;
      const updatedDebtDiscount = currentDebtDiscount + debtDiscount;
      const updatedNetDebt = currentInitialDebt + updatedNewDebt - updatedRepayments - updatedDebtDiscount;

      await tx.update(debtLedger)
        .set({
          newDebt: updatedNewDebt.toFixed(2),
          repayments: updatedRepayments.toFixed(2),
          debtDiscount: updatedDebtDiscount.toFixed(2),
          netDebt: updatedNetDebt.toFixed(2),
          lastUpdated: new Date(),
          status: updatedNetDebt > 0 ? 'open' : 'repaid', // Simple status logic
        })
        .where(eq(debtLedger.debtLedgerId, ledger.debtLedgerId));
    } else {
      const netDebt = newDebt - repayments - debtDiscount;
      await tx.insert(debtLedger).values({
        debtLedgerId: randomUUID(),
        personId,
        cycleTag: cycleTag || null,
        initialDebt: "0.00",
        newDebt: newDebt.toFixed(2),
        repayments: repayments.toFixed(2),
        debtDiscount: debtDiscount.toFixed(2),
        netDebt: netDebt.toFixed(2),
        status: netDebt > 0 ? 'open' : 'repaid',
        lastUpdated: new Date(),
      });
    }

    return insertedMovement;
  });
}

export async function getDebtBalance(personId: string, cycleTag?: string) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  const [ledger] = await db.select().from(debtLedger)
    .where(
      and(
        eq(debtLedger.personId, personId),
        cycleTag ? eq(debtLedger.cycleTag, cycleTag) : isNull(debtLedger.cycleTag)
      )
    );

  return { balance: ledger ? parseFloat(ledger.netDebt as string) : 0 };
}

export async function rollbackDebtMovement(movementId: string) {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  return db.transaction(async (tx) => {
    const [movement] = await tx.select().from(debtMovements)
      .where(eq(debtMovements.debtMovementId, movementId));

    if (!movement || movement.status === 'reversed') {
      throw new Error('Debt movement not found or already reversed');
    }

    await tx.update(debtMovements)
      .set({ status: 'reversed', updatedAt: new Date() })
      .where(eq(debtMovements.debtMovementId, movementId));

    // Rollback debt ledger
    const amount = parseFloat(movement.amount as string);
    const personId = movement.personId;
    const cycleTag = movement.cycleTag;
    const movementType = movement.movementType;

    const [ledger] = await tx.select().from(debtLedger)
      .where(
        and(
          eq(debtLedger.personId, personId),
          cycleTag ? eq(debtLedger.cycleTag, cycleTag) : isNull(debtLedger.cycleTag)
        )
      );

    if (ledger) {
      const currentInitialDebt = parseFloat(ledger.initialDebt as string);
      let currentNewDebt = parseFloat(ledger.newDebt as string);
      let currentRepayments = parseFloat(ledger.repayments as string);
      let currentDebtDiscount = parseFloat(ledger.debtDiscount as string);

      if (movementType === "borrow") currentNewDebt -= amount;
      if (movementType === "repay") currentRepayments -= amount;
      if (movementType === "discount") currentDebtDiscount -= amount;

      const updatedNetDebt = currentInitialDebt + currentNewDebt - currentRepayments - currentDebtDiscount;

      await tx.update(debtLedger)
        .set({
          newDebt: currentNewDebt.toFixed(2),
          repayments: currentRepayments.toFixed(2),
          debtDiscount: currentDebtDiscount.toFixed(2),
          netDebt: updatedNetDebt.toFixed(2),
          lastUpdated: new Date(),
          status: updatedNetDebt > 0 ? 'open' : 'repaid',
        })
        .where(eq(debtLedger.debtLedgerId, ledger.debtLedgerId));
    }
    return { success: true, movementId };
  });
}
