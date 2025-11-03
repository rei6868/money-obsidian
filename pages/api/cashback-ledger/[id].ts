import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../lib/db/client';
import { cashbackLedger, cashbackEligibilityEnum, cashbackLedgerStatusEnum } from '../../../src/db/schema/cashbackLedger';
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
  const cashbackLedgerId = Array.isArray(id) ? id[0] : id;

  if (!cashbackLedgerId) {
    return res.status(400).json({ error: 'cashbackLedgerId is required' });
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const updatePayload: Record<string, any> = { updatedAt: new Date() };

      // Validate and add fields to updatePayload
      const numericFields = ['totalSpend', 'totalCashback', 'budgetCap', 'remainingBudget'];
      for (const field of numericFields) {
        if (body[field] !== undefined) {
          const value = parseFloat(body[field]);
          if (isNaN(value) || value < 0) {
            return res.status(400).json({ error: `${field} must be a non-negative number` });
          }
          updatePayload[field] = value.toFixed(2);
        }
      }

      if (body.eligibility !== undefined) {
        const allowedEligibilities = cashbackEligibilityEnum.enumValues as readonly string[];
        if (!allowedEligibilities.includes(body.eligibility)) {
          return res.status(400).json({ error: `eligibility must be one of: ${allowedEligibilities.join(", ")}` });
        }
        updatePayload.eligibility = body.eligibility;
      }

      if (body.status !== undefined) {
        const allowedStatuses = cashbackLedgerStatusEnum.enumValues as readonly string[];
        if (!allowedStatuses.includes(body.status)) {
          return res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(", ")}` });
        }
        updatePayload.status = body.status;
      }

      if (body.notes !== undefined) {
        updatePayload.notes = body.notes;
      }

      const [updated] = await db.update(cashbackLedger).set(updatePayload).where(eq(cashbackLedger.cashbackLedgerId, cashbackLedgerId)).returning();
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
