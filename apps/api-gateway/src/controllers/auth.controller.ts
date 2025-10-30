import { Controller, Post, Get, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProxyService } from '../proxy/proxy.service';
import { environment } from '../config/environment';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly proxyService: ProxyService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() body: unknown): Promise<unknown> {
    return this.proxyService.proxyRequest(
      environment.services.auth,
      '/auth/register',
      'POST',
      body,
    );
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: unknown): Promise<unknown> {
    return this.proxyService.proxyRequest(
      environment.services.auth,
      '/auth/login',
      'POST',
      body,
    );
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() body: unknown,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.auth,
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
    @User() user: JwtPayload,
    @Headers('authorization') authHeader?: string,
  ): Promise<unknown> {
    const headers = authHeader ? { authorization: authHeader } : undefined;
    return this.proxyService.proxyRequest(
      environment.services.auth,
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
  async validate(@User() user: JwtPayload): Promise<unknown> {
    return {
      valid: true,
      user: {
        id: user.sub,
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
      environment.services.auth,
      '/auth/validate',
      'GET',
      undefined,
      headers,
    );
  }
}
