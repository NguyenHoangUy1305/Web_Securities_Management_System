import api from './api';
import type { ChatRequest, ChatResponse, Conversation, ApiResponse } from '../types';

export const chatService = {
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ApiResponse<ChatResponse>>('/ai/chat', data);
    return response.data.data;
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<ApiResponse<Conversation[]>>('/ai/conversations');
    return response.data.data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get<ApiResponse<Conversation>>(`/ai/conversations/${id}`);
    return response.data.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/ai/conversations/${id}`);
  },
};
