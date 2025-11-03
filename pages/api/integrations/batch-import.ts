import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransaction } from '../../../lib/logic/transactionsLogic';
import { NewTransaction } from '../../../src/db/schema/transactions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ status: 'error', message: 'Missing type or payload in request body.' });
    }

    let transactionsToImport: NewTransaction[] = [];

    try {
      if (type === 'json') {
        if (!Array.isArray(payload)) {
          return res.status(400).json({ status: 'error', message: 'Invalid JSON payload: array of transactions expected.' });
        }
        transactionsToImport = payload;
      } else if (type === 'csv') {
        // Basic CSV parsing - in a real scenario, use a robust CSV parser library
        const lines = payload.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
          return res.status(400).json({ status: 'error', message: 'Empty CSV payload.' });
        }
        const headers = lines[0].split(',').map((h: string) => h.trim());
        transactionsToImport = lines.slice(1).map((line: string) => {
          const values = line.split(',').map((v: string) => v.trim());
          const transaction: Partial<NewTransaction> = {};
          headers.forEach((header: string, index: number) => {
            // Simple mapping, needs more robust type conversion and validation
            if (header === 'amount') {
              transaction[header as keyof NewTransaction] = parseFloat(values[index]) as any;
            } else if (header === 'createdAt' || header === 'updatedAt') {
              transaction[header as keyof NewTransaction] = new Date(values[index]) as any;
            } else {
              transaction[header as keyof NewTransaction] = values[index] as any;
            }
          });
          return transaction as NewTransaction;
        });
      } else {
        return res.status(400).json({ status: 'error', message: 'Unsupported import type. Expected "json" or "csv".' });
      }

      const results = [];
      for (const transactionData of transactionsToImport) {
        try {
          const created = await createTransaction(transactionData);
          results.push({ id: created.transactionId, status: 'created', data: created });
        } catch (error: any) {
          console.error('Error importing transaction:', error);
          results.push({ id: transactionData.transactionId || 'new', status: 'failed', message: error.message });
        }
      }

      res.status(200).json({ status: 'success', message: 'Batch import processed.', results });

    } catch (error: any) {
      console.error('Batch import error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error during batch import.', error: error.message });
    }

  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
