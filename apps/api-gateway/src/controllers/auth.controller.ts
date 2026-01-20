import { Controller, Post, Get, Body, Headers, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { ValidatedUser } from '../auth/jwt.strategy';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly authServiceUrl: string;

  constructor(
    private readonly proxyService: ProxyService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001';
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() body: RegisterDto): Promise<unknown> {
    return this.proxyService.proxyRequest(this.authServiceUrl, '/auth/register', 'POST', body);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto): Promise<unknown> {
    return this.proxyService.proxyRequest(this.authServiceUrl, '/auth/login', 'POST', body);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.authServiceUrl,
      '/auth/refresh',
      'POST',
      body,
      headers,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @User() user: ValidatedUser,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.authServiceUrl,
      '/auth/logout',
      'POST',
      undefined,
      headers,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validate(@User() user: ValidatedUser): Promise<unknown> {
    return {
      valid: true,
      user: {
        id: user.userId,
        email: user.email,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Headers('authorization') authHeader?: string): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      this.authServiceUrl,
      '/auth/validate',
      'GET',
      undefined,
      headers,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users by IDs' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsersByIds(
    @Headers('authorization') authHeader: string,
    @Query('ids') ids: string,
  ): Promise<unknown> {
    const headers = { authorization: authHeader };
    return this.proxyService.proxyRequest(
      this.authServiceUrl,
      `/auth/users?ids=${ids}`,
      'GET',
      undefined,
      headers,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllUsers(@Headers('authorization') authHeader: string): Promise<unknown> {
    const headers = { authorization: authHeader };
    return this.proxyService.proxyRequest(
      this.authServiceUrl,
      '/auth/users/all',
      'GET',
      undefined,
      headers,
    );
  }
}
