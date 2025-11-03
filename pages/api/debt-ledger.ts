import { randomUUID } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db/client';
import { debtLedger, type NewDebtLedger } from '../../src/db/schema/debtLedger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  if (req.method === 'GET') {
    try {
      const ledgers = await db.select().from(debtLedger);
      return res.status(200).json(ledgers);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch debt ledgers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { personId, balance, notes } = req.body;

      if (!personId) {
        return res.status(400).json({ error: 'personId is required' });
      }

      const newLedger: NewDebtLedger = {
        debtLedgerId: randomUUID(),
        personId,
        netDebt: balance || '0',
        status: 'open',
        notes: notes || null,
      };

      const result = await db.insert(debtLedger).values(newLedger).returning();
      return res.status(201).json(result[0]);
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ error: 'Failed to create debt ledger', details: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method not allowed' });
}
