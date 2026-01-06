import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { WebSocketPublisherService } from '../websocket/websocket-publisher.service';
import { NotFoundException } from '@nestjs/common';
import { TaskEvent } from '../rabbitmq/rabbitmq.service';
import {
  TaskStatus,
  TaskPriority,
} from '../rabbitmq/interfaces/task-event.interface';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockUserId = 'user-123';
  const mockTaskId = 'task-456';
  const mockNotificationId = 'notification-789';

  const mockNotification: Notification = {
    id: mockNotificationId,
    userId: mockUserId,
    type: NotificationType.TASK_ASSIGNED,
    message: 'You have been assigned to task "Test Task"',
    taskId: mockTaskId,
    metadata: {
      taskTitle: 'Test Task',
      taskStatus: 'TODO',
      taskPriority: 'MEDIUM',
      assignedBy: 'assigner-123',
    },
    read: false,
    createdAt: new Date(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockTransactionManager = {
    save: jest.fn(),
  };

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    manager: {
      transaction: jest.fn(
        (callback: (manager: typeof mockTransactionManager) => unknown) =>
          callback(mockTransactionManager),
      ),
    },
  };

  const mockWebSocketPublisher = {
    publishNotification: jest.fn(),
    publishNotifications: jest.fn(),
    publishTaskChanged: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: WebSocketPublisherService,
          useValue: mockWebSocketPublisher,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTaskAssignedNotification', () => {
    it('should create notification for assignee', async () => {
      const payload = {
        event: TaskEvent.TASK_ASSIGNED,
        taskId: mockTaskId,
        userId: 'assigner-123',
        timestamp: new Date(),
        data: {
          title: 'Test Task',
          assignedToId: mockUserId,
          createdById: 'assigner-123',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        },
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createTaskAssignedNotification(payload);

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: NotificationType.TASK_ASSIGNED,
        }),
      );
      expect(mockWebSocketPublisher.publishNotification).toHaveBeenCalledWith(
        mockNotification,
      );
    });

    it('should not create notification for self-assignment', async () => {
      const payload = {
        event: TaskEvent.TASK_ASSIGNED,
        taskId: mockTaskId,
        userId: mockUserId, // Same as assignee
        timestamp: new Date(),
        data: {
          title: 'Test Task',
          assignedToId: mockUserId, // Self-assignment
          createdById: mockUserId,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        },
      };

      const result = await service.createTaskAssignedNotification(payload);

      expect(result).toBeNull();
      expect(mockNotificationRepository.create).not.toHaveBeenCalled();
    });

    it('should return null if no assignee', async () => {
      const payload = {
        event: TaskEvent.TASK_ASSIGNED,
        taskId: mockTaskId,
        userId: 'assigner-123',
        timestamp: new Date(),
        data: {
          title: 'Test Task',
          assignedToId: '',
          createdById: 'assigner-123',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        },
      };

      const result = await service.createTaskAssignedNotification(payload);

      expect(result).toBeNull();
    });
  });

  describe('createTaskCreatedNotification', () => {
    it('should create notification for assignee on task creation', async () => {
      const payload = {
        event: TaskEvent.TASK_CREATED,
        taskId: mockTaskId,
        userId: 'creator-123',
        timestamp: new Date(),
        data: {
          title: 'New Task',
          assignedToId: mockUserId,
          createdById: 'creator-123',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
        },
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createTaskCreatedNotification(payload);

      expect(result).toEqual(mockNotification);
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: NotificationType.TASK_CREATED,
        }),
      );
    });

    it('should return null if no assignee', async () => {
      const payload = {
        event: TaskEvent.TASK_CREATED,
        taskId: mockTaskId,
        userId: 'creator-123',
        timestamp: new Date(),
        data: {
          title: 'New Task',
          assignedToId: undefined,
          createdById: 'creator-123',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
        },
      };

      const result = await service.createTaskCreatedNotification(payload);

      expect(result).toBeNull();
    });
  });

  describe('createTaskUpdatedNotification', () => {
    it('should notify both assignee and creator', async () => {
      const payload = {
        event: TaskEvent.TASK_UPDATED,
        taskId: mockTaskId,
        userId: 'updater-123',
        timestamp: new Date(),
        data: {
          title: 'Updated Task',
          assignedToId: 'assignee-123',
          createdById: 'creator-123',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          changes: { status: { old: 'TODO', new: 'IN_PROGRESS' } },
        },
      };

      const notifications = [
        { ...mockNotification, userId: 'assignee-123' },
        { ...mockNotification, userId: 'creator-123' },
      ];

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockTransactionManager.save.mockResolvedValue(notifications);

      const result = await service.createTaskUpdatedNotification(payload);

      expect(result).toEqual(notifications);
      expect(mockWebSocketPublisher.publishNotifications).toHaveBeenCalled();
    });

    it('should not notify the updater', async () => {
      const payload = {
        event: TaskEvent.TASK_UPDATED,
        taskId: mockTaskId,
        userId: 'user-123',
        timestamp: new Date(),
        data: {
          title: 'Updated Task',
          assignedToId: 'user-123',
          createdById: 'user-123',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          changes: {},
        },
      };

      const result = await service.createTaskUpdatedNotification(payload);

      expect(result).toEqual([]);
    });
  });

  describe('createTaskCommentedNotification', () => {
    it('should notify assignee, creator, and previous commenters', async () => {
      const payload = {
        event: TaskEvent.TASK_COMMENTED,
        taskId: mockTaskId,
        userId: 'commenter-123',
        timestamp: new Date(),
        data: {
          title: 'Task with Comment',
          assignedToId: 'assignee-123',
          createdById: 'creator-123',
          commentId: 'comment-123',
          previousCommenterIds: ['previous-commenter-1'],
        },
      };

      const notifications = [
        { ...mockNotification, userId: 'assignee-123' },
        { ...mockNotification, userId: 'creator-123' },
        { ...mockNotification, userId: 'previous-commenter-1' },
      ];

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockTransactionManager.save.mockResolvedValue(notifications);

      const result = await service.createTaskCommentedNotification(payload);

      expect(result).toEqual(notifications);
    });

    it('should not notify the commenter', async () => {
      const payload = {
        event: TaskEvent.TASK_COMMENTED,
        taskId: mockTaskId,
        userId: 'user-123',
        timestamp: new Date(),
        data: {
          title: 'Task',
          assignedToId: 'user-123',
          createdById: 'user-123',
          commentId: 'comment-123',
          previousCommenterIds: [],
        },
      };

      const result = await service.createTaskCommentedNotification(payload);

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const notifications = [mockNotification];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([notifications, 1]);

      const result = await service.findAll(mockUserId, { page: 1, limit: 20 });

      expect(result).toEqual({
        data: notifications,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should filter by type', async () => {
      const notifications = [mockNotification];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([notifications, 1]);

      await service.findAll(mockUserId, {
        type: NotificationType.TASK_ASSIGNED,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.type = :type',
        { type: NotificationType.TASK_ASSIGNED },
      );
    });

    it('should filter by read status', async () => {
      const notifications = [mockNotification];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([notifications, 1]);

      await service.findAll(mockUserId, { read: false });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.read = :read',
        { read: false },
      );
    });
  });

  describe('findOne', () => {
    it('should return a notification', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne(mockNotificationId, mockUserId);

      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark notifications as read', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 2 });

      const result = await service.markAsRead(mockUserId, {
        notificationIds: ['id-1', 'id-2'],
      });

      expect(result).toEqual({
        message: '2 notification(s) marked as read',
        affected: 2,
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 5 });

      const result = await service.markAllAsRead(mockUserId);

      expect(result).toEqual({
        message: '5 notification(s) marked as read',
        affected: 5,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockNotificationRepository.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toEqual({ count: 3 });
      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, read: false },
      });
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
      mockNotificationRepository.remove.mockResolvedValue(mockNotification);

      const result = await service.delete(mockNotificationId, mockUserId);

      expect(result).toEqual({ message: 'Notification deleted successfully' });
      expect(mockNotificationRepository.remove).toHaveBeenCalledWith(
        mockNotification,
      );
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.delete('non-existent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleTaskDeleted', () => {
    it('should mark notifications as obsolete', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 3 });

      await service.handleTaskDeleted({
        event: TaskEvent.TASK_DELETED,
        taskId: mockTaskId,
        userId: 'deleter-123',
        timestamp: new Date(),
        data: {
          title: 'Deleted Task',
          createdById: 'deleter-123',
        },
      });

      expect(mockWebSocketPublisher.publishTaskChanged).toHaveBeenCalledWith(
        mockTaskId,
        'TASK_DELETED',
      );
    });
  });
});
