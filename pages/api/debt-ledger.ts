import { randomUUID } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db/client';
import { debtLedger, type NewDebtLedger, debtLedgerStatusEnum } from '../../src/db/schema/debtLedger';
import { people } from '../../src/db/schema/people';
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
      const { personId, cycleTag, initialDebt, newDebt, repayments, debtDiscount, netDebt, status, notes } = req.body;

      // Validate required fields
      const requiredFields = ['personId', 'initialDebt', 'newDebt', 'repayments', 'netDebt', 'status'];
      const missing = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);
      if (missing.length > 0) {
        return res.status(400).json({ error: 'Missing fields', details: missing });
      }

      // Validate numeric fields
      const numericFields = ['initialDebt', 'newDebt', 'repayments', 'debtDiscount', 'netDebt'];
      for (const field of numericFields) {
        const value = parseFloat(req.body[field]);
        if (isNaN(value)) {
          return res.status(400).json({ error: `${field} must be a valid number` });
        }
      }

      // Validate status
      const allowedStatuses = debtLedgerStatusEnum.enumValues as readonly string[];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(", ")}` });
      }

      // Validate personId exists
      const personExists = await db.select().from(people).where(eq(people.personId, personId)).limit(1);
      if (personExists.length === 0) {
        return res.status(400).json({ error: "Invalid personId", details: `Person with ID ${personId} does not exist.` });
      }

      const newLedger: NewDebtLedger = {
        debtLedgerId: randomUUID(),
        personId,
        cycleTag: cycleTag || null,
        initialDebt: parseFloat(initialDebt).toFixed(2),
        newDebt: parseFloat(newDebt).toFixed(2),
        repayments: parseFloat(repayments).toFixed(2),
        debtDiscount: parseFloat(debtDiscount || '0').toFixed(2),
        netDebt: parseFloat(netDebt).toFixed(2),
        status,
        notes: notes || null,
        lastUpdated: new Date(),
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
