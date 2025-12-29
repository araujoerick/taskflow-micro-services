import { apiClient } from '../client';
import type { Notification, PaginatedResponse } from '@repo/types';

interface NotificationFilters {
  type?: string;
  read?: boolean;
  page?: number;
  limit?: number;
}

export const notificationsService = {
  async getNotifications(filters: NotificationFilters): Promise<PaginatedResponse<Notification>> {
    const { data } = await apiClient.get<PaginatedResponse<Notification>>('/notifications', {
      params: filters,
    });
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },

  async markAsRead(notificationIds: string[]): Promise<void> {
    await apiClient.post('/notifications/mark-as-read', { notificationIds });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-as-read');
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
