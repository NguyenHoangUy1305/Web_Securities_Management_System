import api from './api';
import type { PaginatedResponse, Transaction } from '../types';

interface ExportResponse {
  data: Blob;
}

export async function getTransactions(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedResponse<Transaction>> {
  const { data } = await api.get<PaginatedResponse<Transaction>>('/transactions', { params });
  return data;
}

export async function exportData(format: 'pdf' | 'excel'): Promise<Blob> {
  const { data } = await api.get<ExportResponse>('/transactions/export', {
    params: { format },
    responseType: 'blob',
  });
  return data as unknown as Blob;
}
