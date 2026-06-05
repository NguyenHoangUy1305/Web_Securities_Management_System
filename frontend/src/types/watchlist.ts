export interface Watchlist {
  id: number;
  name: string;
  description?: string;
  items: WatchlistItem[];
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: number;
  watchlist_id: number;
  security_id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  added_at: string;
}

export interface CreateWatchlistRequest {
  name: string;
  description?: string;
}

export interface AddToWatchlistRequest {
  watchlist_id: number;
  security_symbol: string;
}

export interface Alert {
  id: number;
  watchlist_item_id: number;
  symbol: string;
  alert_type: AlertType;
  condition: AlertCondition;
  target_price: number;
  is_active: boolean;
  triggered_at?: string;
  created_at: string;
}

export type AlertType = 'price_above' | 'price_below' | 'change_percent';
export type AlertCondition = 'crosses' | 'above' | 'below';

export interface CreateAlertRequest {
  watchlist_item_id: number;
  alert_type: AlertType;
  condition: AlertCondition;
  target_price: number;
}
