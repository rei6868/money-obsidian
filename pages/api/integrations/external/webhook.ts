import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    // TODO: Implement external system webhook logic here
    // For now, just acknowledge receipt
    console.log('Received external webhook request:', req.body);

    res.status(200).json({ status: 'received', id: `webhook-${Date.now()}` });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
