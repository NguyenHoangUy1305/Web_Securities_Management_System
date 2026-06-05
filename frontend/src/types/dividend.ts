export interface Dividend {
  id: number;
  security_id: number;
  symbol: string;
  name: string;
  dividend_per_share: number;
  dividend_yield: number;
  ex_dividend_date: string;
  payment_date: string;
  record_date?: string;
  dividend_type: DividendType;
  frequency: DividendFrequency;
  currency: string;
  status: DividendStatus;
  created_at: string;
  updated_at: string;
}

export type DividendType = 'cash' | 'stock';
export type DividendFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'irregular';
export type DividendStatus = 'announced' | 'paid' | 'cancelled';

export interface DividendRecord {
  id: number;
  portfolio_id: number;
  dividend_id: number;
  symbol: string;
  shares_owned: number;
  dividend_per_share: number;
  total_received: number;
  paid_at: string;
  created_at: string;
}

export interface DividendTrackerSummary {
  total_dividends_received: number;
  yearly_projection: number;
  monthly_average: number;
  portfolio_yield: number;
  upcoming_dividends: Dividend[];
  recent_payments: DividendRecord[];
}
