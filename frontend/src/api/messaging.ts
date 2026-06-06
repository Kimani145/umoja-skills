import api from './axios';
import { Conversation, Message, PaginatedResponse } from '../types';

export const messagingApi = {
  getConversations: () => api.get<PaginatedResponse<Conversation>>('/conversations/'),

  createOrGetConversation: (participantId: string) =>
    api.post<Conversation>('/conversations/get_or_create/', { participant_id: participantId }),

  getMessages: (conversationId: string, page = 1) =>
    api.get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages/`, { params: { page } }),

  sendMessage: (conversationId: string, body: string) =>
    api.post<Message>(`/conversations/${conversationId}/messages/`, { body }),

  markRead: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/mark_read/`),

  sendTyping: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/typing/`),
};

