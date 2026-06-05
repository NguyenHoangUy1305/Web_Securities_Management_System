import api from './api';
import type { OHLC, RsiIndicator, MacdIndicator, SmaIndicator, EmaIndicator, TickerData, MarketOverview, ApiResponse, TimeFrame } from '../types';

export const marketService = {
  async getOHLC(symbol: string, timeframe: TimeFrame = '1d', limit: number = 100): Promise<OHLC[]> {
    const response = await api.get<ApiResponse<OHLC[]>>(`/market/ohlc/${symbol}`, {
      params: { timeframe, limit },
    });
    return response.data.data;
  },

  async getRSI(symbol: string, period: number = 14): Promise<RsiIndicator[]> {
    const response = await api.get<ApiResponse<RsiIndicator[]>>(`/market/rsi/${symbol}`, {
      params: { period },
    });
    return response.data.data;
  },

  async getMACD(symbol: string): Promise<MacdIndicator[]> {
    const response = await api.get<ApiResponse<MacdIndicator[]>>(`/market/macd/${symbol}`);
    return response.data.data;
  },

  async getSMA(symbol: string, period: number = 20): Promise<SmaIndicator[]> {
    const response = await api.get<ApiResponse<SmaIndicator[]>>(`/market/sma/${symbol}`, {
      params: { period },
    });
    return response.data.data;
  },

  async getEMA(symbol: string, period: number = 12): Promise<EmaIndicator[]> {
    const response = await api.get<ApiResponse<EmaIndicator[]>>(`/market/ema/${symbol}`, {
      params: { period },
    });
    return response.data.data;
  },

  async getTickers(): Promise<TickerData[]> {
    const response = await api.get<ApiResponse<TickerData[]>>('/market/tickers');
    return response.data.data;
  },

  async getOverview(): Promise<MarketOverview> {
    const response = await api.get<ApiResponse<MarketOverview>>('/market/overview');
    return response.data.data;
  },
};
