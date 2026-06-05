import api from './api';
import type { Portfolio, PortfolioSummary, AssetAllocation } from '../types';

interface PortfolioListResponse {
  data: Portfolio[];
}

interface PortfolioResponse {
  data: Portfolio;
}

interface SummaryResponse {
  data: PortfolioSummary;
}

interface AllocationResponse {
  data: AssetAllocation[];
}

interface PerformanceResponse {
  data: Record<string, number>;
}

export async function getPortfolios(): Promise<Portfolio[]> {
  const { data } = await api.get<PortfolioListResponse>('/portfolios');
  return data.data;
}

export async function getPortfolio(id: number): Promise<Portfolio> {
  const { data } = await api.get<PortfolioResponse>(`/portfolios/${id}`);
  return data.data;
}

export async function createPortfolio(payload: {
  name: string;
  description?: string;
}): Promise<Portfolio> {
  const { data } = await api.post<PortfolioResponse>('/portfolios', payload);
  return data.data;
}

export async function getPortfolioSummary(id: number): Promise<PortfolioSummary> {
  const { data } = await api.get<SummaryResponse>(`/portfolios/${id}/summary`);
  return data.data;
}

export async function getAssetAllocation(id: number): Promise<AssetAllocation[]> {
  const { data } = await api.get<AllocationResponse>(`/portfolios/${id}/allocation`);
  return data.data;
}

export async function getPerformance(id: number): Promise<Record<string, number>> {
  const { data } = await api.get<PerformanceResponse>(`/portfolios/${id}/performance`);
  return data.data;
}
