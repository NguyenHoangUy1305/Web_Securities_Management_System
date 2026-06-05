import api from './api';
import type { MarketData, TechnicalIndicator } from '../types';

interface MarketDataResponse {
  data: MarketData[];
}

interface SingleMarketDataResponse {
  data: MarketData;
}

interface IndicatorResponse {
  data: TechnicalIndicator[];
}

export async function getOHLC(
  securityId: number,
  from?: string,
  to?: string,
): Promise<MarketData[]> {
  const { data } = await api.get<MarketDataResponse>(`/securities/${securityId}/market-data`, {
    params: { from, to },
  });
  return data.data;
}

export async function getLatest(securityId: number): Promise<MarketData> {
  const { data } = await api.get<SingleMarketDataResponse>(`/securities/${securityId}/market-data/latest`);
  return data.data;
}

export async function getIndicators(securityId: number): Promise<TechnicalIndicator[]> {
  const { data } = await api.get<IndicatorResponse>(`/securities/${securityId}/indicators`);
  return data.data;
}
