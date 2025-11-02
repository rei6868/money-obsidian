import { db } from '../db/client';

export async function updateDebtLedger(personId: string, amount: number, txnId: string) {
  // Update debt ledger when debt transaction occurs
  return db.transaction(async (tx) => {
    // Update ledger balance and create movement record
    return { personId, amount };
  });
}

export async function getDebtBalance(personId: string) {
  // Get current debt balance for a person
  return { balance: 0 };
}
