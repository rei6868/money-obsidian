export interface EnrichedTransaction {
  id?: string;
  date?: string;
  occurredOn?: string;
  displayDate?: string;
  sortDate?: number;
  year?: string;
  month?: string;
  account?: string;
  shop?: string;
  notes?: string;
  amount?: number;
  percentBack?: number;
  fixedBack?: number;
  totalBack?: number;
  finalPrice?: number;
  debtTag?: string;
  cycleTag?: string;
  category?: string;
  linkedTxn?: string;
  owner?: string;
  type?: string;
}

export function getMockTransactions(): EnrichedTransaction[] {
  return [];
}
