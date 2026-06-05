export interface MarketData {
  id: number;
  security_id: number;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  id: number;
  security_id: number;
  timestamp: string;
  rsi_14?: number;
  macd_line?: number;
  macd_signal?: number;
  macd_histogram?: number;
  sma_20?: number;
  sma_50?: number;
  sma_200?: number;
  ema_12?: number;
  ema_26?: number;
}

export interface OHLC {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandlestickSeries {
  data: OHLC[];
  title?: string;
  upColor?: string;
  downColor?: string;
}

export interface LineSeriesData {
  time: string | number;
  value: number;
}

export interface HistogramSeriesData {
  time: string | number;
  value: number;
  color?: string;
}

export interface RsiIndicator {
  time: string | number;
  value: number;
}

export interface MacdIndicator {
  time: string | number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface SmaIndicator {
  time: string | number;
  value: number;
  period: number;
}

export interface EmaIndicator {
  time: string | number;
  value: number;
  period: number;
}

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
}

export interface MarketOverview {
  indices: IndexData[];
  gainers: TickerData[];
  losers: TickerData[];
  most_active: TickerData[];
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  change_percent: number;
}
