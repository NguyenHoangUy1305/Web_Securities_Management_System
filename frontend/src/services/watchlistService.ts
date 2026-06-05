import api from './api';
import type { Watchlist } from '../types';

interface WatchlistListResponse {
  data: Watchlist[];
}

interface WatchlistResponse {
  data: Watchlist;
}

export async function getWatchlists(): Promise<Watchlist[]> {
  const { data } = await api.get<WatchlistListResponse>('/watchlists');
  return data.data;
}

export async function createWatchlist(name: string): Promise<Watchlist> {
  const { data } = await api.post<WatchlistResponse>('/watchlists', { name });
  return data.data;
}

export async function addSymbol(
  watchlistId: number,
  securityId: number,
): Promise<void> {
  await api.post(`/watchlists/${watchlistId}/items`, { security_id: securityId });
}

export async function removeSymbol(
  watchlistId: number,
  securityId: number,
): Promise<void> {
  await api.delete(`/watchlists/${watchlistId}/items/${securityId}`);
}
