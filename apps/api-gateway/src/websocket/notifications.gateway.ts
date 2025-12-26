import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RabbitMQService, NotificationPayload } from './rabbitmq.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly rabbitmqService: RabbitMQService,
    private readonly configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    this.jwtSecret = secret;
  }

  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway initialized');

    // Register handler for RabbitMQ notifications
    this.rabbitmqService.onNotification(this.handleNotification.bind(this));
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtSecret,
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      client.userId = payload.sub;
      this.addUserConnection(payload.sub, client.id);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);

      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId: payload.sub,
      });
    } catch (error) {
      this.logger.error(
        `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    if (client.userId) {
      this.removeUserConnection(client.userId, client.id);
      this.logger.log(`Client disconnected: ${client.id} (user: ${client.userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: Date.now() });
  }

  private handleNotification(notification: NotificationPayload): void {
    const { userId, ...data } = notification;

    // Get all socket IDs for this user
    const socketIds = this.connectedUsers.get(userId);

    if (socketIds && socketIds.size > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('notification', data);
        this.logger.debug(`Sent notification to user ${userId} (socket: ${socketId})`);
      });
    } else {
      this.logger.debug(`No active connections for user ${userId}`);
    }
  }

  private extractToken(client: Socket): string | null {
    // Try to get from auth object (recommended way)
    const auth = client.handshake.auth as { token?: string };
    if (auth?.token) {
      return auth.token;
    }

    // Try to get from headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get from query parameter as fallback
    const token = client.handshake.query.token;
    if (typeof token === 'string') {
      return token;
    }

    return null;
  }

  private addUserConnection(userId: string, socketId: string): void {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)?.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  // Public method to send notification to specific user (can be used by controllers)
  sendToUser(userId: string, event: string, data: unknown): void {
    const socketIds = this.connectedUsers.get(userId);
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && (this.connectedUsers.get(userId)?.size ?? 0) > 0;
  }
}
