import { randomUUID } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db/client';
import { cashbackLedger, type NewCashbackLedger } from '../../src/db/schema/cashbackLedger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  if (req.method === 'GET') {
    try {
      const ledgers = await db.select().from(cashbackLedger);
      return res.status(200).json(ledgers);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch cashback ledgers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { accountId, totalEarned, notes } = req.body;

      if (!accountId) {
        return res.status(400).json({ error: 'accountId is required' });
      }

      const now = new Date();
      const cycleTag = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

      const newLedger: NewCashbackLedger = {
        cashbackLedgerId: randomUUID(),
        accountId,
        cycleTag,
        totalCashback: totalEarned || '0',
        eligibility: 'eligible',
        status: 'open',
        notes: notes || null,
      };

      const result = await db.insert(cashbackLedger).values(newLedger).returning();
      return res.status(201).json(result[0]);
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ error: 'Failed to create cashback ledger', details: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method not allowed' });
}
