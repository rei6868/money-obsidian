import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/db/client';
import { debtLedger } from '../../../src/db/schema/debtLedger';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const { id } = req.query;
  const debtLedgerId = Array.isArray(id) ? id[0] : id;

  if (!debtLedgerId) {
    return res.status(400).json({ error: 'debtLedgerId is required' });
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const [updated] = await db.update(debtLedger).set(body).where(eq(debtLedger.debtLedgerId, debtLedgerId)).returning();
      if (!updated) {
        return res.status(404).json({ error: 'Debt ledger not found' });
      }
      return res.status(200).json(updated);
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ error: 'Failed to update debt ledger', details: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const [deleted] = await db.delete(debtLedger).where(eq(debtLedger.debtLedgerId, debtLedgerId)).returning();
      if (!deleted) {
        return res.status(404).json({ error: 'Debt ledger not found' });
      }
      return res.status(200).json({ message: 'Debt ledger deleted successfully' });
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ error: 'Failed to delete debt ledger', details: err.message });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).json({ error: 'Method not allowed' });
}
