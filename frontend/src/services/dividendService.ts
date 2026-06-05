import api from './api';
import type { Dividend, PaginatedResponse } from '../types';

interface DividendListResponse {
  data: Dividend[];
}

export async function getDividends(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedResponse<Dividend>> {
  const { data } = await api.get<PaginatedResponse<Dividend>>('/dividends', { params });
  return data;
}

export async function getUpcoming(): Promise<Dividend[]> {
  const { data } = await api.get<DividendListResponse>('/dividends/upcoming');
  return data.data;
}
