import api from './api';
import type { PaginatedResponse, Security } from '../types';
import type { AxiosError } from 'axios';

export async function getSecurities(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedResponse<Security>> {
  const { data } = await api.get<PaginatedResponse<Security>>('/securities', { params });
  return data;
}

export async function getSecurity(id: number): Promise<Security> {
  const { data } = await api.get<{ data: Security }>(`/securities/${id}`);
  return data.data;
}

export async function searchSecurities(query: string): Promise<Security[]> {
  const { data } = await api.get<{ data: Security[] }>('/securities/search', { params: { q: query } });
  return data.data;
}

export async function getTopGainers(limit: number = 10): Promise<Security[]> {
  const { data } = await api.get<{ data: Security[] }>('/securities/top-gainers', { params: { limit } });
  return data.data;
}

export async function getTopLosers(limit: number = 10): Promise<Security[]> {
  const { data } = await api.get<{ data: Security[] }>('/securities/top-losers', { params: { limit } });
  return data.data;
}

/* ------------------------------------------------------------------ */
/*  CRUD payload types                                                 */
/* ------------------------------------------------------------------ */

export interface CreateSecurityPayload {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  sector?: string;
  industry?: string;
  current_price: number;
  market_cap?: number;
  eps?: number;
  pe_ratio?: number;
  dividend_yield?: number;
}

export type UpdateSecurityPayload = Partial<CreateSecurityPayload>;

/* ------------------------------------------------------------------ */
/*  Create                                                             */
/* ------------------------------------------------------------------ */

export async function createSecurity(payload: CreateSecurityPayload): Promise<Security> {
  const response = await api.post('/securities', payload);
  const body = response.data;
  // Handle both { data: Security } and ApiResponse<Security> wrappers
  return (body.data ?? body) as Security;
}

/* ------------------------------------------------------------------ */
/*  Update                                                             */
/* ------------------------------------------------------------------ */

export async function updateSecurity(id: number, payload: UpdateSecurityPayload): Promise<Security> {
  const response = await api.put(`/securities/${id}`, payload);
  const body = response.data;
  return (body.data ?? body) as Security;
}

/* ------------------------------------------------------------------ */
/*  Delete                                                             */
/* ------------------------------------------------------------------ */

export async function deleteSecurity(id: number): Promise<void> {
  await api.delete(`/securities/${id}`);
}
