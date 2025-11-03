import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/db/client';
import { cashbackLedger } from '../../../src/db/schema/cashbackLedger';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const { id } = req.query;
  const cashbackLedgerId = Array.isArray(id) ? id[0] : id;

  if (!cashbackLedgerId) {
    return res.status(400).json({ error: 'cashbackLedgerId is required' });
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const [updated] = await db.update(cashbackLedger).set(body).where(eq(cashbackLedger.cashbackLedgerId, cashbackLedgerId)).returning();
      if (!updated) {
        return res.status(404).json({ error: 'Cashback ledger not found' });
      }
      return res.status(200).json(updated);
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ error: 'Failed to update cashback ledger', details: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const [deleted] = await db.delete(cashbackLedger).where(eq(cashbackLedger.cashbackLedgerId, cashbackLedgerId)).returning();
      if (!deleted) {
        return res.status(404).json({ error: 'Cashback ledger not found' });
      }
      return res.status(200).json({ message: 'Cashback ledger deleted successfully' });
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ error: 'Failed to delete cashback ledger', details: err.message });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).json({ error: 'Method not allowed' });
}
