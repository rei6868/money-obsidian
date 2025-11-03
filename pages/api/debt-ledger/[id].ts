import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/db/client';
import { debtLedger, debtLedgerStatusEnum } from '../../../src/db/schema/debtLedger';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDb();

  // Basic authentication check
  const authToken = req.headers['authorization'];
  if (!authToken || authToken !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
      const updatePayload: Record<string, any> = { lastUpdated: new Date() };

      // Validate and add fields to updatePayload
      const numericFields = ['initialDebt', 'newDebt', 'repayments', 'debtDiscount', 'netDebt'];
      for (const field of numericFields) {
        if (body[field] !== undefined) {
          const value = parseFloat(body[field]);
          if (isNaN(value)) {
            return res.status(400).json({ error: `${field} must be a valid number` });
          }
          updatePayload[field] = value.toFixed(2);
        }
      }

      if (body.status !== undefined) {
        const allowedStatuses = debtLedgerStatusEnum.enumValues as readonly string[];
        if (!allowedStatuses.includes(body.status)) {
          return res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(", ")}` });
        }
        updatePayload.status = body.status;
      }

      if (body.notes !== undefined) {
        updatePayload.notes = body.notes;
      }

      if (Object.keys(updatePayload).length === 1 && updatePayload.lastUpdated) { // Only lastUpdated was set
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const [updated] = await db.update(debtLedger).set(updatePayload).where(eq(debtLedger.debtLedgerId, debtLedgerId)).returning();
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

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']); // Added GET to allowed methods for consistency, though not implemented here
  res.status(405).json({ error: 'Method not allowed' });
}
