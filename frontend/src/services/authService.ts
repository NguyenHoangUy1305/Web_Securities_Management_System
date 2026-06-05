import api from './api';
import type { LoginRequest, RegisterRequest, User } from '../types';
import type { AxiosError } from 'axios';

interface AuthApiResponse {
  data: { token: string; user: User };
}

export async function login(credentials: LoginRequest): Promise<{ token: string; user: User }> {
  const { data } = await api.post<AuthApiResponse>('/login', credentials);
  return data.data;
}

export async function register(payload: RegisterRequest): Promise<{ token: string; user: User }> {
  const { data } = await api.post<AuthApiResponse>('/register', payload);
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/logout');
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get('/me');
  return data?.data?.user ?? data?.data ?? data;
}

export async function updateProfile(payload: Partial<User>): Promise<User> {
  const { data } = await api.put<{ data: User }>('/profile', payload);
  return data.data;
}
