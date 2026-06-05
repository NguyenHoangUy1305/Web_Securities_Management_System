export interface Portfolio {
  id: number;
  name: string;
  description?: string;
  total_value: number;
  total_invested: number;
  total_return: number;
  total_return_percent: number;
  created_at: string;
  updated_at: string;
}

export interface Holding {
  id: number;
  portfolio_id: number;
  security_id: number;
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_pl_percent: number;
  allocation_percent: number;
  updated_at: string;
}

export interface AssetAllocation {
  sector: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  total_return: number;
  total_return_percent: number;
  day_change: number;
  day_change_percent: number;
  holdings_count: number;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface AddHoldingRequest {
  security_symbol: string;
  quantity: number;
  avg_price: number;
}
