export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const APP_NAME = 'Securities Management System';

export const TIME_FRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as const;

export const INDICATORS = {
  RSI: { label: 'RSI (14)', periods: 14 },
  MACD: { label: 'MACD', fast: 12, slow: 26, signal: 9 },
  SMA: [
    { label: 'SMA 20', period: 20 },
    { label: 'SMA 50', period: 50 },
    { label: 'SMA 200', period: 200 },
  ],
  EMA: [
    { label: 'EMA 12', period: 12 },
    { label: 'EMA 26', period: 26 },
  ],
} as const;

export const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'broker', label: 'Broker' },
  { value: 'investor', label: 'Investor' },
] as const;

export const ORDER_TYPES = [
  { value: 'market', label: 'Market Order' },
  { value: 'limit', label: 'Limit Order' },
] as const;

export const EXPORT_FORMATS = [
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
] as const;

export const ITEMS_PER_PAGE = 20;
