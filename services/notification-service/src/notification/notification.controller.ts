import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { 
  NotificationListResponseDto, 
  PaginationQueryDto,
  UnreadCountResponseDto,
  MarkReadResponseDto,
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferencesDto,
} from '../dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, type: NotificationListResponseDto })
  async getMyNotifications(
    @CurrentUser('sub') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<NotificationListResponseDto> {
    return this.notificationService.getMyNotifications(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDto })
  async getUnreadCount(
    @CurrentUser('sub') userId: string,
  ): Promise<UnreadCountResponseDto> {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: boolean }> {
    return this.notificationService.markAsRead(notificationId, userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, type: MarkReadResponseDto })
  async markAllAsRead(
    @CurrentUser('sub') userId: string,
  ): Promise<MarkReadResponseDto> {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: boolean }> {
    return this.notificationService.deleteNotification(notificationId, userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  async getPreferences(
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.notificationService.getNotificationPreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  async updatePreferences(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.notificationService.updateNotificationPreferences(userId, dto);
  }
}
