import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils/query-keys';
import { toast } from 'sonner';
import type { Notification } from '@repo/types';

interface TaskChangedEvent {
  taskId: string;
  type: string;
}

export function useWebSocket(accessToken: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const handleNotification = useCallback(
    (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      if (notification.taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(notification.taskId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(notification.taskId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.history(notification.taskId) });
      }

      toast.info(notification.message, {
        duration: 5000,
      });
    },
    [queryClient],
  );

  // Handler for task_changed broadcast event (invalidates cache for all users)
  const handleTaskChanged = useCallback(
    (event: TaskChangedEvent) => {
      // Invalidate task lists for all users when any task changes
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

      // Also invalidate specific task details if we have the taskId
      if (event.taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(event.taskId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(event.taskId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.history(event.taskId) });
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Create socket connection
    const socket = io('/notifications', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('connected', (data: { message: string; userId: string }) => {
      console.log('WebSocket authenticated:', data.message);
    });

    socket.on('notification', handleNotification);

    // Listen for task_changed broadcast (cache invalidation for all users)
    socket.on('task_changed', handleTaskChanged);

    socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    // Ping/pong for keepalive
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000);

    socket.on('pong', () => {
      // Connection is alive
    });

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, handleNotification, handleTaskChanged]);

  return socketRef.current;
}
