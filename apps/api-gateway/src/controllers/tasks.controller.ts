import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';
import { environment } from '../config/environment';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'assignedTo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() queryParams: Record<string, unknown>,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      '/tasks',
      'GET',
      undefined,
      headers,
      queryParams,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      `/tasks/${id}`,
      'GET',
      undefined,
      headers,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      '/tasks',
      'POST',
      body,
      headers,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not allowed to update this task' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      `/tasks/${id}`,
      'PATCH',
      body,
      headers,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not allowed to delete this task' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      `/tasks/${id}`,
      'DELETE',
      undefined,
      headers,
    );
  }

  @Get(':taskId/comments')
  @ApiOperation({ summary: 'Get all comments for a task' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getComments(
    @Param('taskId') taskId: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      `/tasks/${taskId}/comments`,
      'GET',
      undefined,
      headers,
    );
  }

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createComment(
    @Param('taskId') taskId: string,
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      `/tasks/${taskId}/comments`,
      'POST',
      body,
      headers,
    );
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get task history' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.tasks,
      `/tasks/${id}/history`,
      'GET',
      undefined,
      headers,
    );
  }
}
