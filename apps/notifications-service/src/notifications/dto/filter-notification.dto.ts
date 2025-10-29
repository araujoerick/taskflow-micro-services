import { IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../entities/notification.entity';

export class FilterNotificationDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  read?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
