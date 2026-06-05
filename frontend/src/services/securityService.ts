import api from './api';
import type {
  Security, SecurityDetail, SecuritySearchResult,
  ApiResponse, PaginatedResponse, SecuritySortField, SortDirection,
} from '../types';

export const securityService = {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    sector?: string;
    search?: string;
    sort_by?: SecuritySortField;
    sort_dir?: SortDirection;
  }): Promise<PaginatedResponse<Security>> {
    const response = await api.get<PaginatedResponse<Security>>('/securities', { params });
    return response.data;
  },

  async getBySymbol(symbol: string): Promise<SecurityDetail> {
    const response = await api.get<ApiResponse<SecurityDetail>>(`/securities/${symbol}`);
    return response.data.data;
  },

  async search(query: string): Promise<SecuritySearchResult[]> {
    const response = await api.get<ApiResponse<SecuritySearchResult[]>>('/securities/search', {
      params: { q: query },
    });
    return response.data.data;
  },

  async getSectors(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/securities/sectors');
    return response.data.data;
  },
};
