import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);

    this.logger.log(`New user registered: ${user.id} (${email})`);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.tokenId);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user: ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User ${user.id} logged in successfully`);

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.tokenId);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtRefreshSecret) {
      throw new Error('JWT Refresh configuration is missing');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    // Check if token was revoked (logout support)
    if (!user.refreshTokenId) {
      throw new UnauthorizedException('Token has been revoked');
    }

    if (payload.jti !== user.refreshTokenId) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.tokenId);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async logout(userId: string) {
    // Use query builder to explicitly set NULL
    await this.usersRepository
      .createQueryBuilder()
      .update()
      .set({ refreshTokenId: () => 'NULL' })
      .where('id = :id', { id: userId })
      .execute();

    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User) {
    // Generate unique token ID for revocation support
    const tokenId = crypto.randomUUID();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      jti: tokenId,
    };

    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    const jwtRefreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    if (!jwtRefreshSecret || !jwtRefreshExpiresIn) {
      throw new Error(
        'JWT Refresh configuration is missing in environment variables',
      );
    }

    // Access token usa a configuração global do JwtModule
    const accessToken = await this.jwtService.signAsync(payload);

    // Refresh token precisa de configuração separada
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: jwtRefreshSecret,
      expiresIn: jwtRefreshExpiresIn as StringValue,
    });

    return {
      accessToken,
      refreshToken,
      tokenId,
    };
  }

  private async updateRefreshToken(userId: string, tokenId: string) {
    // Store only the token ID for revocation purposes (no need to hash JWT)
    await this.usersRepository.update(userId, {
      refreshTokenId: tokenId,
    });
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshTokenId, ...result } = user;
    return result;
  }
}
