export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';

export interface Order {
  id: number;
  portfolio_id: number;
  security_id: number;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  filled_quantity: number;
  price?: number;
  filled_price?: number;
  total: number;
  status: OrderStatus;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  portfolio_id: number;
  security_symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
}

export interface CancelOrderRequest {
  order_id: number;
}

export interface ModifyOrderRequest {
  order_id: number;
  quantity?: number;
  price?: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  order_count: number;
}
