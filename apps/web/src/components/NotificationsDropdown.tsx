import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/queries/useNotifications';
import { useWebSocket } from '@/hooks/useWebSocket';
import { notificationTypeLabels } from '@/utils/enum-mappers';
import { formatRelativeTime } from '@/utils/date-formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X, Check } from 'lucide-react';
import { NotificationType } from '@repo/types';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const accessToken = localStorage.getItem('accessToken');
  useWebSocket(accessToken);

  const { data: notificationsData } = useNotifications({ limit: 20 });
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.data || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    if (!notification.read) {
      await markAsRead.mutateAsync([notification.id]);
    }
    if (notification.taskId) {
      navigate({ to: `/tasks/${notification.taskId}` });
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const icons = {
      [NotificationType.TASK_CREATED]: '📝',
      [NotificationType.TASK_UPDATED]: '✏️',
      [NotificationType.TASK_ASSIGNED]: '👤',
      [NotificationType.TASK_COMMENTED]: '💬',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 hover:bg-(--color-accent) rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount && unreadCount > 0 ? (
          <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-(--color-destructive) text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-(--color-muted-foreground) text-white text-xs flex items-center justify-center font-bold">
            0
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notificações</CardTitle>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead.mutate()}
                    className="text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-(--color-muted-foreground) opacity-50" />
                    <p className="mt-2 text-sm text-(--color-muted-foreground)">
                      Nenhuma notificação ainda
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        border-b last:border-b-0 p-4 hover:bg-(--color-accent) cursor-pointer transition-colors
                        ${!notification.read ? 'bg-(--color-secondary)' : ''}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <h4 className="font-medium text-sm truncate">
                              {notificationTypeLabels[notification.type]}
                            </h4>
                          </div>
                          <p className="text-sm text-(--color-muted-foreground) line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-(--color-muted-foreground) mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteNotification.mutateAsync(notification.id);
                          }}
                          className="p-1 hover:bg-(--color-destructive) hover:text-white rounded transition-colors"
                          title="Excluir notificação"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
