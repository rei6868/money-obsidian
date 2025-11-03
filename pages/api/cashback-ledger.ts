import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db/client';
import { cashbackLedger, type NewCashbackLedger } from '../../src/db/schema/cashbackLedger';
import { eq } from 'drizzle-orm';

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
      const { accountId, balance, totalEarned, notes } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ error: 'accountId is required' });
      }

      const newLedger: NewCashbackLedger = {
        accountId,
        balance: balance || 0,
        totalEarned: totalEarned || 0,
        notes: notes || null,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.insert(cashbackLedger).values(newLedger).returning();
      return res.status(201).json(result[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create cashback ledger' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method not allowed' });
}
