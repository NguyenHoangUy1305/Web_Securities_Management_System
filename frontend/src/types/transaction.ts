export type TransactionType = 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: number;
  portfolio_id: number;
  security_id?: number;
  symbol?: string;
  type: TransactionType;
  quantity?: number;
  price?: number;
  total: number;
  fee?: number;
  tax?: number;
  net_total: number;
  status: TransactionStatus;
  description?: string;
  executed_at: string;
  created_at: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  status?: TransactionStatus;
  symbol?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface ExportRequest {
  format: 'excel' | 'pdf';
  filters?: TransactionFilter;
}
