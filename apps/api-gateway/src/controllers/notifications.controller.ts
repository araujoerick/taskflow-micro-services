import { Controller, Get, Post, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly notificationsServiceUrl: string;

  constructor(
    private readonly proxyService: ProxyService,
    private readonly configService: ConfigService,
  ) {
    this.notificationsServiceUrl =
      this.configService.get<string>('NOTIFICATIONS_SERVICE_URL') || 'http://localhost:3003';
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'read', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() queryParams: Record<string, unknown>,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.notificationsServiceUrl,
      '/notifications',
      'GET',
      undefined,
      headers,
      queryParams,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Headers('authorization') authHeader?: string): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.notificationsServiceUrl,
      '/notifications/unread-count',
      'GET',
      undefined,
      headers,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.notificationsServiceUrl,
      `/notifications/${id}`,
      'GET',
      undefined,
      headers,
    );
  }

  @Post('mark-as-read')
  @ApiOperation({ summary: 'Mark notification(s) as read' })
  @ApiResponse({ status: 200, description: 'Notification(s) marked as read' })
  @ApiResponse({ status: 404, description: 'Notification(s) not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.notificationsServiceUrl,
      '/notifications/mark-as-read',
      'POST',
      body,
      headers,
    );
  }

  @Post('mark-all-as-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Headers('authorization') authHeader?: string): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.notificationsServiceUrl,
      '/notifications/mark-all-as-read',
      'POST',
      undefined,
      headers,
    );
  }
}
