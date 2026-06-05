import api from './api';
import type { PaginatedResponse, NewsItem } from '../types';

interface SummaryResponse {
  data: Record<string, unknown>;
}

export async function getNews(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedResponse<NewsItem>> {
  const { data } = await api.get<PaginatedResponse<NewsItem>>('/news', { params });
  return data;
}

export async function getMarketSummary(): Promise<Record<string, unknown>> {
  const { data } = await api.get<SummaryResponse>('/news/market-summary');
  return data.data;
}
