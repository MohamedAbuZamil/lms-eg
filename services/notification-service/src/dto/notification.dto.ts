import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, IsJSON, IsDateString } from 'class-validator';
import { NotificationType, TargetRole } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to send notification to' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification body/message' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ description: 'Entity type (course, assessment, etc.)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Send email notification', default: true })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = true;

  @ApiPropertyOptional({ description: 'Send push notification', default: false })
  @IsOptional()
  @IsBoolean()
  sendPush?: boolean = false;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiPropertyOptional()
  entityType?: string;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  unreadCount: number;
}

export class CreateSystemAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Announcement message/body' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: TargetRole, default: TargetRole.ALL, description: 'Target audience role' })
  @IsEnum(TargetRole)
  @IsOptional()
  targetRole?: TargetRole = TargetRole.ALL;

  @ApiPropertyOptional({ description: 'Target specific course (for course announcements)' })
  @IsOptional()
  @IsUUID()
  targetCourseId?: string;

  @ApiPropertyOptional({ description: 'Publish at specific time (ISO 8601)', default: 'immediate' })
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional({ description: 'Expire at specific time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expireAt?: string;

  @ApiPropertyOptional({ description: 'Send as email', default: true })
  @IsOptional()
  @IsBoolean()
  sendAsEmail?: boolean = true;

  @ApiPropertyOptional({ description: 'Show as in-app notification', default: true })
  @IsOptional()
  @IsBoolean()
  showInApp?: boolean = true;
}

export class SystemAnnouncementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: TargetRole })
  targetRole: TargetRole;

  @ApiPropertyOptional()
  targetCourseId?: string;

  @ApiProperty()
  publishAt: Date;

  @ApiPropertyOptional()
  expireAt?: Date;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty()
  processingStatus: string;

  @ApiProperty()
  processedCount: number;

  @ApiProperty()
  totalTargetCount: number;

  @ApiProperty()
  createdAt: Date;
}

export class CreateCourseAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Announcement message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Send as email', default: true })
  @IsOptional()
  @IsBoolean()
  sendAsEmail?: boolean = true;

  @ApiPropertyOptional({ description: 'Show as in-app notification', default: true })
  @IsOptional()
  @IsBoolean()
  showInApp?: boolean = true;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable in-app notifications' })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable marketing notifications' })
  @IsOptional()
  @IsBoolean()
  marketingEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Type-specific preferences as JSON' })
  @IsOptional()
  typePreferences?: Record<string, { email?: boolean; push?: boolean; inApp?: boolean }>;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  pushEnabled: boolean;

  @ApiProperty()
  inAppEnabled: boolean;

  @ApiProperty()
  marketingEnabled: boolean;

  @ApiPropertyOptional()
  typePreferences?: Record<string, { email?: boolean; push?: boolean; inApp?: boolean }>;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count: number;
}

export class MarkReadResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  markedCount: number;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number = 20;
}

export class EventNotificationDto {
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  entityType?: string;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}
