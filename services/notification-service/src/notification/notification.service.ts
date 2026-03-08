import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueueService } from './notification-queue.service';
import { 
  CreateNotificationDto, 
  NotificationResponseDto,
  NotificationListResponseDto,
  PaginationQueryDto,
  UnreadCountResponseDto,
  MarkReadResponseDto,
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferencesDto,
} from '../dto/notification.dto';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { QUEUE_NAMES, JOB_TYPES } from '../queue/queue-config.module';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueueService: NotificationQueueService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async getMyNotifications(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<NotificationListResponseDto> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          title: true,
          body: true,
          type: true,
          entityType: true,
          entityId: true,
          isRead: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ 
        where: { userId, isRead: false } 
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponseDto> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean }> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { 
        isRead: true, 
        readAt: new Date() 
      },
    });

    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<MarkReadResponseDto> {
    const result = await this.prisma.notification.updateMany({
      where: { 
        userId, 
        isRead: false 
      },
      data: { 
        isRead: true, 
        readAt: new Date() 
      },
    });

    return { 
      success: true, 
      markedCount: result.count 
    };
  }

  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean }> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async getNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferencesResponseDto> {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          marketingEnabled: true,
        },
      });
    }

    return {
      userId: preferences.userId,
      emailEnabled: preferences.emailEnabled,
      pushEnabled: preferences.pushEnabled,
      inAppEnabled: preferences.inAppEnabled,
      marketingEnabled: preferences.marketingEnabled,
      typePreferences: preferences.typePreferences as Record<string, { email?: boolean; push?: boolean; inApp?: boolean }> | undefined,
    };
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    const preferences = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        emailEnabled: dto.emailEnabled ?? true,
        pushEnabled: dto.pushEnabled ?? true,
        inAppEnabled: dto.inAppEnabled ?? true,
        marketingEnabled: dto.marketingEnabled ?? true,
        typePreferences: dto.typePreferences ?? {},
      },
      update: {
        ...(dto.emailEnabled !== undefined && { emailEnabled: dto.emailEnabled }),
        ...(dto.pushEnabled !== undefined && { pushEnabled: dto.pushEnabled }),
        ...(dto.inAppEnabled !== undefined && { inAppEnabled: dto.inAppEnabled }),
        ...(dto.marketingEnabled !== undefined && { marketingEnabled: dto.marketingEnabled }),
        ...(dto.typePreferences !== undefined && { typePreferences: dto.typePreferences }),
      },
    });

    return {
      userId: preferences.userId,
      emailEnabled: preferences.emailEnabled,
      pushEnabled: preferences.pushEnabled,
      inAppEnabled: preferences.inAppEnabled,
      marketingEnabled: preferences.marketingEnabled,
      typePreferences: preferences.typePreferences as Record<string, { email?: boolean; push?: boolean; inApp?: boolean }> | undefined,
    };
  }

  // For internal use - create notification immediately
  async createNotification(data: CreateNotificationDto): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      data.userId,
      data.title,
      data.body,
      data.type,
      {
        entityType: data.entityType,
        entityId: data.entityId,
        sendEmail: data.sendEmail,
        sendPush: data.sendPush,
      },
    );
  }

  // Event handlers for different notification types
  async handleCourseEnrolled(studentId: string, courseId: string, courseTitle: string): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      studentId,
      'Welcome to your new course!',
      `You have been enrolled in "${courseTitle}". Start learning now!`,
      NotificationType.COURSE_ENROLLED,
      {
        entityType: 'course',
        entityId: courseId,
        sendEmail: true,
      },
    );
  }

  async handleCoursePurchased(studentId: string, courseId: string, courseTitle: string): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      studentId,
      'Course Purchase Successful',
      `Thank you for purchasing "${courseTitle}". You can now access all course content.`,
      NotificationType.COURSE_PURCHASED,
      {
        entityType: 'course',
        entityId: courseId,
        sendEmail: true,
      },
    );
  }

  async handleAssessmentPublished(studentId: string, assessmentId: string, assessmentTitle: string): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      studentId,
      'New Assessment Available',
      `A new assessment "${assessmentTitle}" has been published. Check it out!`,
      NotificationType.ASSESSMENT_PUBLISHED,
      {
        entityType: 'assessment',
        entityId: assessmentId,
        sendEmail: true,
      },
    );
  }

  async handleAssessmentGraded(studentId: string, assessmentId: string, assessmentTitle: string, score: number): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      studentId,
      'Assessment Graded',
      `Your assessment "${assessmentTitle}" has been graded. Your score: ${score}%`,
      NotificationType.ASSESSMENT_GRADED,
      {
        entityType: 'assessment',
        entityId: assessmentId,
        sendEmail: true,
      },
    );
  }

  async handleAssignmentFeedback(studentId: string, assignmentId: string, assignmentTitle: string): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      studentId,
      'New Feedback Available',
      `You have received feedback on your assignment "${assignmentTitle}"`,
      NotificationType.ASSIGNMENT_FEEDBACK,
      {
        entityType: 'assignment',
        entityId: assignmentId,
        sendEmail: true,
      },
    );
  }

  async handlePaymentRecorded(studentId: string, paymentId: string, amount: number): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      studentId,
      'Payment Recorded',
      `Your payment of ${amount} EGP has been recorded and confirmed.`,
      NotificationType.PAYMENT_RECORDED,
      {
        entityType: 'payment',
        entityId: paymentId,
        sendEmail: true,
      },
    );
  }

  async handleLessonUnlocked(studentId: string, courseId: string, lessonId: string, lessonTitle: string): Promise<void> {
    await this.notificationQueueService.enqueueSingleNotification(
      studentId,
      'New Lesson Unlocked',
      `Lesson "${lessonTitle}" is now available. Continue your learning journey!`,
      NotificationType.LESSON_UNLOCKED,
      {
        entityType: 'lesson',
        entityId: lessonId,
        sendEmail: false, // Lower priority, just in-app
      },
    );
  }
}
