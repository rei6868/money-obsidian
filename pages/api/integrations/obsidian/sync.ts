import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransaction, updateTransaction } from '../../../../lib/logic/transactionsLogic'; // Adjust path as needed

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { transactions: incomingTransactions } = req.body;

    if (!Array.isArray(incomingTransactions)) {
      return res.status(400).json({ status: 'error', message: 'Invalid payload: transactions array expected.' });
    }

    const results = [];
    for (const transactionData of incomingTransactions) {
      try {
        // Assuming transactionData might contain an ID for updates, or be new for creation
        if (transactionData.transactionId) {
          // Attempt to update existing transaction
          const updated = await updateTransaction(transactionData.transactionId, transactionData);
          results.push({ id: transactionData.transactionId, status: 'updated', data: updated });
        } else {
          // Create new transaction
          const created = await createTransaction(transactionData);
          results.push({ id: created.transactionId, status: 'created', data: created });
        }
      } catch (error: any) {
        console.error('Error processing Obsidian sync transaction:', error);
        results.push({ id: transactionData.transactionId || 'new', status: 'failed', message: error.message });
      }
    }

    res.status(200).json({ status: 'success', message: 'Obsidian sync processed.', results });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
