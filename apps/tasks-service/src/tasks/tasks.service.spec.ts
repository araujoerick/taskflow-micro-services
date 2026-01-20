import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import {
  TaskHistory,
  TaskAction,
} from '../history/entities/task-history.entity';
import { RabbitMQService, TaskEvent } from '../rabbitmq/rabbitmq.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;

  const mockUserId = 'user-123';
  const mockTaskId = 'task-456';

  const mockTask: Task = {
    id: mockTaskId,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assignedTo: null,
    createdBy: mockUserId,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
    history: [],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockRabbitMQService = {
    publishEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
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

    service = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'Task description',
        priority: TaskPriority.HIGH,
      };

      const createdTask = {
        ...mockTask,
        ...createTaskDto,
        id: 'new-task-id',
      };

      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});
      mockRabbitMQService.publishEvent.mockResolvedValue(undefined);

      const result = await service.create(createTaskDto, mockUserId);

      expect(result).toEqual(createdTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        createdBy: mockUserId,
      });
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });

    it('should publish TASK_CREATED event', async () => {
      const createTaskDto = { title: 'New Task' };
      const createdTask = { ...mockTask, id: 'new-task-id' };

      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});

      await service.create(createTaskDto, mockUserId);

      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledWith(
        TaskEvent.TASK_CREATED,
        createdTask.id,
        mockUserId,
        expect.objectContaining({
          title: createdTask.title,
          status: createdTask.status,
        }),
      );
    });

    it('should create history entry for task creation', async () => {
      const createTaskDto = { title: 'New Task' };
      const createdTask = { ...mockTask, id: 'new-task-id' };

      mockTaskRepository.create.mockReturnValue(createdTask);
      mockTaskRepository.save.mockResolvedValue(createdTask);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});

      await service.create(createTaskDto, mockUserId);

      expect(mockHistoryRepository.create).toHaveBeenCalledWith({
        taskId: createdTask.id,
        userId: mockUserId,
        action: TaskAction.CREATED,
        changes: { task: createdTask },
      });
      expect(mockHistoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const tasks = [mockTask];
      const total = 1;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([tasks, total]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: tasks,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter tasks by status', async () => {
      const tasks = [mockTask];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([tasks, 1]);

      await service.findAll({ status: TaskStatus.TODO });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.status = :status',
        { status: TaskStatus.TODO },
      );
    });

    it('should filter tasks by priority', async () => {
      const tasks = [mockTask];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([tasks, 1]);

      await service.findAll({ priority: TaskPriority.HIGH });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.priority = :priority',
        { priority: TaskPriority.HIGH },
      );
    });

    it('should search tasks by title or description', async () => {
      const tasks = [mockTask];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([tasks, 1]);

      await service.findAll({ search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: '%test%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTaskId);

      expect(result).toEqual(mockTask);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('task.id = :id', {
        id: mockTaskId,
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const updateTaskDto = { title: 'Updated Title' };
      const updatedTask = { ...mockTask, ...updateTaskDto };

      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);
      mockTaskRepository.findOneOrFail.mockResolvedValue(updatedTask);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});

      const result = await service.update(
        mockTaskId,
        updateTaskDto,
        mockUserId,
      );

      expect(result.title).toBe('Updated Title');
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not creator or assigned', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);

      await expect(
        service.update(mockTaskId, { title: 'Updated' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow assigned user to update', async () => {
      const taskWithAssignment = { ...mockTask, assignedTo: 'assigned-user' };
      const updateTaskDto = { status: TaskStatus.IN_PROGRESS };

      mockQueryBuilder.getOne.mockResolvedValue(taskWithAssignment);
      mockTaskRepository.save.mockResolvedValue({
        ...taskWithAssignment,
        ...updateTaskDto,
      });
      mockTaskRepository.findOneOrFail.mockResolvedValue({
        ...taskWithAssignment,
        ...updateTaskDto,
      });
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});

      const result = await service.update(
        mockTaskId,
        updateTaskDto,
        'assigned-user',
      );

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should publish TASK_UPDATED event', async () => {
      const updateTaskDto = { title: 'Updated Title' };
      const updatedTask = { ...mockTask, ...updateTaskDto };

      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);
      mockTaskRepository.findOneOrFail.mockResolvedValue(updatedTask);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});

      await service.update(mockTaskId, updateTaskDto, mockUserId);

      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledWith(
        TaskEvent.TASK_UPDATED,
        mockTaskId,
        mockUserId,
        expect.any(Object),
      );
    });

    it('should publish TASK_ASSIGNED event when assignedTo changes', async () => {
      const updateTaskDto = { assignedTo: 'new-assigned-user' };
      const updatedTask = { ...mockTask, ...updateTaskDto };

      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);
      mockTaskRepository.findOneOrFail.mockResolvedValue(updatedTask);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});

      await service.update(mockTaskId, updateTaskDto, mockUserId);

      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledWith(
        TaskEvent.TASK_ASSIGNED,
        mockTaskId,
        mockUserId,
        expect.any(Object),
      );
    });

    it('should create history entry with changes', async () => {
      const updateTaskDto = { status: TaskStatus.IN_PROGRESS };
      const updatedTask = { ...mockTask, status: TaskStatus.IN_PROGRESS };

      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);
      mockTaskRepository.findOneOrFail.mockResolvedValue(updatedTask);
      mockHistoryRepository.create.mockReturnValue({});
      mockHistoryRepository.save.mockResolvedValue({});

      await service.update(mockTaskId, updateTaskDto, mockUserId);

      expect(mockHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: mockTaskId,
          userId: mockUserId,
          action: TaskAction.STATUS_CHANGED,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      mockTaskRepository.remove.mockResolvedValue(mockTask);

      const result = await service.remove(mockTaskId, mockUserId);

      expect(result).toEqual({ message: 'Task deleted successfully' });
      expect(mockTaskRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw ForbiddenException if user is not the creator', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);

      await expect(service.remove(mockTaskId, 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should publish TASK_DELETED event', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      mockTaskRepository.remove.mockResolvedValue(mockTask);

      await service.remove(mockTaskId, mockUserId);

      expect(mockRabbitMQService.publishEvent).toHaveBeenCalledWith(
        TaskEvent.TASK_DELETED,
        mockTaskId,
        mockUserId,
        expect.objectContaining({
          title: mockTask.title,
          createdById: mockTask.createdBy,
        }),
      );
    });
  });

  describe('getHistory', () => {
    it('should return task history', async () => {
      const history = [
        {
          id: 'history-1',
          taskId: mockTaskId,
          userId: mockUserId,
          action: TaskAction.CREATED,
          changes: {},
          createdAt: new Date(),
        },
      ];

      mockQueryBuilder.getOne.mockResolvedValue(mockTask);
      mockHistoryRepository.find.mockResolvedValue(history);

      const result = await service.getHistory(mockTaskId);

      expect(result).toEqual(history);
      expect(mockHistoryRepository.find).toHaveBeenCalledWith({
        where: { taskId: mockTaskId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.getHistory('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
