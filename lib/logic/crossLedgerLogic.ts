import { getDb } from '../db/client';
import { cashbackLedger } from '../../src/db/schema/cashbackLedger';
import { debtLedger, debtLedgerStatusEnum, NewDebtLedger } from '../../src/db/schema/debtLedger';
import { debtMovements, debtMovementTypeEnum, debtMovementStatusEnum, NewDebtMovement } from '../../src/db/schema/debtMovements';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const updateLedgersOnTransaction = async (transaction: any, body: any) => {
  const db = getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }

  // Debt logic
  if (body.personId && body.debtMovement) {
    const { movementType, cycleTag } = body.debtMovement;
    const amount = parseFloat(transaction.amount);

    const allowedMovementTypes = debtMovementTypeEnum.enumValues as readonly string[];
    if (!allowedMovementTypes.includes(movementType)) {
      throw new Error(`Invalid movementType: ${movementType}`);
    }

    const [ledger] = await db
      .select()
      .from(debtLedger)
      .where(
        and(
          eq(debtLedger.personId, body.personId),
          cycleTag ? eq(debtLedger.cycleTag, cycleTag) : isNull(debtLedger.cycleTag)
        )
      );

    let debtLedgerId: string;
    let ledgerStatus: typeof debtLedgerStatusEnum.enumValues[number] = "open";
    let newDebt = 0, repayments = 0, netDebt = 0, initialDebt = 0, debtDiscount = 0;

    if (!ledger) {
      debtLedgerId = randomUUID();
      if (movementType === "borrow") newDebt = amount;
      if (movementType === "repay") repayments = amount;
      netDebt = newDebt - repayments;
      const newLedger: NewDebtLedger = {
        debtLedgerId,
        personId: body.personId,
        cycleTag: cycleTag || null,
        initialDebt: "0",
        newDebt: newDebt.toFixed(2),
        repayments: repayments.toFixed(2),
        debtDiscount: "0",
        netDebt: netDebt.toFixed(2),
        status: ledgerStatus,
        lastUpdated: new Date(),
        notes: body.notes || null,
      };
      await db.insert(debtLedger).values(newLedger);
    } else {
      debtLedgerId = ledger.debtLedgerId;
      initialDebt = parseFloat(ledger.initialDebt ?? "0");
      newDebt = parseFloat(ledger.newDebt ?? "0");
      repayments = parseFloat(ledger.repayments ?? "0");
      debtDiscount = parseFloat(ledger.debtDiscount ?? "0");

      if (movementType === "borrow") newDebt += amount;
      if (movementType === "repay") repayments += amount;
      if (movementType === "discount") debtDiscount += amount;

      netDebt = initialDebt + newDebt - repayments - debtDiscount;

      await db.update(debtLedger).set({
        newDebt: newDebt.toFixed(2),
        repayments: repayments.toFixed(2),
        debtDiscount: debtDiscount.toFixed(2),
        netDebt: netDebt.toFixed(2),
        lastUpdated: new Date(),
        status: ledgerStatus,
        notes: body.notes || ledger.notes || null
      }).where(eq(debtLedger.debtLedgerId, debtLedgerId));
    }

    const movementStatus: typeof debtMovementStatusEnum.enumValues[number] = "active";
    const newDebtMovement: NewDebtMovement = {
      debtMovementId: randomUUID(),
      transactionId: transaction.transactionId,
      personId: body.personId,
      accountId: transaction.accountId,
      movementType,
      amount: amount.toFixed(2),
      cycleTag: cycleTag || null,
      status: movementStatus,
      notes: body.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(debtMovements).values(newDebtMovement);
  }

  // Placeholder for cashback ledger update logic

  return { success: true };
};
