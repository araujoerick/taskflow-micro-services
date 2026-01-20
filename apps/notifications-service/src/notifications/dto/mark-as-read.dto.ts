import { IsArray, IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @IsArray()
  @IsUUID('4', { each: true })
  notificationIds: string[];
}
