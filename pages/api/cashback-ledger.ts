import { randomUUID } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db/client';
import { cashbackLedger, type NewCashbackLedger } from '../../src/db/schema/cashbackLedger';

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
      const ledgers = await db.select().from(cashbackLedger);
      return res.status(200).json(ledgers);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch cashback ledgers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { accountId, cycleTag, totalSpend, totalCashback, budgetCap, eligibility, remainingBudget, status, notes } = req.body;

      // Validate required fields
      const requiredFields = ['accountId', 'cycleTag', 'totalSpend', 'totalCashback', 'budgetCap', 'eligibility', 'remainingBudget', 'status'];
      const missing = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);
      if (missing.length > 0) {
        return res.status(400).json({ error: 'Missing fields', details: missing });
      }

      // Validate numeric fields
      const numericFields = ['totalSpend', 'totalCashback', 'budgetCap', 'remainingBudget'];
      for (const field of numericFields) {
        const value = parseFloat(req.body[field]);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({ error: `${field} must be a non-negative number` });
        }
      }

      const newLedger: NewCashbackLedger = {
        cashbackLedgerId: randomUUID(),
        accountId,
        cycleTag,
        totalSpend: parseFloat(totalSpend).toFixed(2),
        totalCashback: parseFloat(totalCashback).toFixed(2),
        budgetCap: parseFloat(budgetCap).toFixed(2),
        eligibility,
        remainingBudget: parseFloat(remainingBudget).toFixed(2),
        status,
        notes: notes || null,
        lastUpdated: new Date(),
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
