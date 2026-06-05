import api from './api';
import type { Order, PaginatedResponse } from '../types';

interface OrderResponse {
  data: Order;
}

export async function getOrders(
  params?: Record<string, string | number | undefined>,
): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get<PaginatedResponse<Order>>('/orders', { params });
  return data;
}

export async function placeOrder(payload: {
  portfolio_id: number;
  security_id: number;
  type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
}): Promise<Order> {
  const { data } = await api.post<OrderResponse>('/orders', payload);
  return data.data;
}

export async function cancelOrder(id: number): Promise<void> {
  await api.delete(`/orders/${id}`);
}

export async function getOrderBook(securityId: number): Promise<OrderBookData> {
  const { data } = await api.get<{ data: OrderBookData }>(`/securities/${securityId}/order-book`);
  return data.data;
}

export interface OrderBookData {
  security_id: number;
  bids: Array<{ price: number; quantity: number; total: number }>;
  asks: Array<{ price: number; quantity: number; total: number }>;
}
