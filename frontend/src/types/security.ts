export interface Security {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  currency: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap?: number;
  updated_at: string;
}

export interface SecurityDetail extends Security {
  eps?: number;
  pe_ratio?: number;
  pb_ratio?: number;
  dividend_yield?: number;
  beta?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  avg_volume?: number;
  shares_outstanding?: number;
  description?: string;
  website?: string;
}

export interface SecuritySearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface FinancialIndicator {
  eps: number;
  pe: number;
  pb: number;
  market_cap: number;
  dividend_yield: number;
  roe?: number;
  roa?: number;
  debt_to_equity?: number;
  current_ratio?: number;
}

export type SecuritySortField = 'symbol' | 'price' | 'change_percent' | 'volume' | 'market_cap';
export type SortDirection = 'asc' | 'desc';
