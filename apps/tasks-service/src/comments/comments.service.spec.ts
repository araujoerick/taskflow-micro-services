import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Task, TaskStatus, TaskPriority } from '../tasks/entities/task.entity';
import {
  TaskHistory,
  TaskAction,
} from '../history/entities/task-history.entity';
import { RabbitMQService, TaskEvent } from '../rabbitmq/rabbitmq.service';
import { NotFoundException } from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockUserId = 'user-123';
  const mockTaskId = 'task-456';
  const mockCommentId = 'comment-789';

  const mockTask: Task = {
    id: mockTaskId,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assignedTo: 'assigned-user',
    createdBy: 'creator-user',
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
    history: [],
  };

  const mockComment: Comment = {
    id: mockCommentId,
    taskId: mockTaskId,
    userId: mockUserId,
    content: 'This is a test comment',
    createdAt: new Date(),
    task: mockTask,
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockTaskRepository = {
    findOne: jest.fn(),
  };

  const mockHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRabbitMQService = {
    publishEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(TaskHistory),
          useValue: mockHistoryRepository,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      const createCommentDto = { content: 'New comment' };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});
      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockRabbitMQService.publishEvent.mockResolvedValue(undefined);

      const result = await service.create(
        mockTaskId,
        createCommentDto,
        mockUserId,
      );

      expect(result).toEqual(mockComment);
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        ...createCommentDto,
        taskId: mockTaskId,
        userId: mockUserId,
      });
      expect(mockCommentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if task does not exist', async () => {
      const createCommentDto = { content: 'New comment' };
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('non-existent-task', createCommentDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should publish TASK_COMMENTED event', async () => {
      const createCommentDto = { content: 'New comment' };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.create(mockTaskId, createCommentDto, mockUserId);

      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledWith(
        TaskEvent.TASK_COMMENTED,
        mockTaskId,
        mockUserId,
        expect.objectContaining({
          title: mockTask.title,
          createdById: mockTask.createdBy,
          assignedToId: mockTask.assignedTo,
          commentId: mockComment.id,
          commentText: mockComment.content,
        }),
      );
    });

    it('should include previous commenters in event payload', async () => {
      const createCommentDto = { content: 'New comment' };
      const previousCommenters = [
        { userId: 'previous-user-1' },
        { userId: 'previous-user-2' },
      ];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});
      mockQueryBuilder.getRawMany.mockResolvedValue(previousCommenters);

      await service.create(mockTaskId, createCommentDto, mockUserId);

      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledWith(
        TaskEvent.TASK_COMMENTED,
        mockTaskId,
        mockUserId,
        expect.objectContaining({
          previousCommenterIds: ['previous-user-1', 'previous-user-2'],
        }),
      );
    });

    it('should create history entry for comment', async () => {
      const createCommentDto = { content: 'New comment' };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.create(mockTaskId, createCommentDto, mockUserId);

      expect(mockHistoryRepository.create).toHaveBeenCalledWith({
        taskId: mockTaskId,
        userId: mockUserId,
        action: TaskAction.COMMENTED,
        changes: { comment: mockComment },
      });
      expect(mockHistoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('findByTask', () => {
    it('should return comments for a task', async () => {
      const comments = [mockComment];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.find.mockResolvedValue(comments);

      const result = await service.findByTask(mockTaskId);

      expect(result).toEqual(comments);
      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { taskId: mockTaskId },
        order: { createdAt: 'ASC' },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findByTask('non-existent-task')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array if task has no comments', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockCommentRepository.find.mockResolvedValue([]);

      const result = await service.findByTask(mockTaskId);

      expect(result).toEqual([]);
    });
  });
});
