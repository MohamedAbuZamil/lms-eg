import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_NAMES, JOB_TYPES } from '../queue/queue-config.module';
import { 
  NotificationChannel, 
  DeliveryStatus, 
  NotificationType,
  NotificationPreference 
} from '@prisma/client';

interface NotificationJobData {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

interface BulkNotificationJobData {
  jobId: string;
  announcementId?: string;
  courseId?: string;
  teacherId?: string;
  notificationData: {
    title: string;
    body: string;
    type: NotificationType;
    entityType?: string;
    entityId?: string;
  };
  channels: NotificationChannel[];
  batchSize: number;
  offset: number;
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BULK_NOTIFICATION) private readonly bulkQueue: Queue,
  ) {}

  async enqueueSingleNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    options: {
      entityType?: string;
      entityId?: string;
      sendEmail?: boolean;
      sendPush?: boolean;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<void> {
    const { entityType, entityId, sendEmail = true, sendPush = false, metadata } = options;

    // Get user preferences
    const preferences = await this.getUserPreferences(userId);

    // Skip if user has disabled in-app notifications
    if (!preferences?.inAppEnabled) {
      this.logger.debug(`Skipping in-app notification for user ${userId} - disabled in preferences`);
      return;
    }

    // Create notification and delivery records in database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        entityType,
        entityId,
        deliveries: {
          create: [
            {
              channel: NotificationChannel.IN_APP,
              status: DeliveryStatus.SENT, // In-app is immediate
              sentAt: new Date(),
            },
            ...(sendEmail && preferences.emailEnabled
              ? [{ channel: NotificationChannel.EMAIL, status: DeliveryStatus.PENDING }]
              : []),
            ...(sendPush && preferences.pushEnabled
              ? [{ channel: NotificationChannel.PUSH, status: DeliveryStatus.PENDING }]
              : []),
          ],
        },
      },
      include: {
        deliveries: true,
      },
    });

    // Queue email delivery
    if (sendEmail && preferences.emailEnabled) {
      const emailDelivery = notification.deliveries.find(
        (d) => d.channel === NotificationChannel.EMAIL,
      );
      if (emailDelivery) {
        await this.emailQueue.add(
          JOB_TYPES.SEND_EMAIL,
          {
            notificationId: notification.id,
            userId,
            title,
            body,
            type,
            channel: NotificationChannel.EMAIL,
            metadata,
          },
          {
            jobId: `email-${notification.id}`,
            priority: this.getPriorityForType(type),
          },
        );
      }
    }

    // Queue push notification
    if (sendPush && preferences.pushEnabled) {
      await this.notificationQueue.add(
        JOB_TYPES.SEND_PUSH,
        {
          notificationId: notification.id,
          userId,
          title,
          body,
          type,
          channel: NotificationChannel.PUSH,
          metadata,
        },
        {
          jobId: `push-${notification.id}`,
          priority: this.getPriorityForType(type),
        },
      );
    }

    this.logger.log(`Enqueued notification ${notification.id} for user ${userId}`);
  }

  async enqueueBulkNotifications(
    targetUserIds: string[],
    notificationData: {
      title: string;
      body: string;
      type: NotificationType;
      entityType?: string;
      entityId?: string;
    },
    options: {
      announcementId?: string;
      courseId?: string;
      teacherId?: string;
      channels?: NotificationChannel[];
      batchSize?: number;
    } = {},
  ): Promise<string> {
    const { 
      announcementId, 
      courseId, 
      teacherId, 
      channels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      batchSize = 1000 
    } = options;

    // Create bulk job record
    const bulkJob = await this.prisma.bulkNotificationJob.create({
      data: {
        announcementId,
        courseId,
        teacherId,
        status: 'PENDING',
        totalCount: targetUserIds.length,
        processedCount: 0,
        failedCount: 0,
      },
    });

    // Split into batches and queue
    const batches = this.chunkArray(targetUserIds, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      await this.bulkQueue.add(
        JOB_TYPES.PROCESS_BULK_NOTIFICATION,
        {
          jobId: bulkJob.id,
          batchIndex: i,
          totalBatches: batches.length,
          userIds: batches[i],
          notificationData,
          channels,
        },
        {
          jobId: `bulk-${bulkJob.id}-${i}`,
          priority: 5,
        },
      );
    }

    this.logger.log(
      `Enqueued bulk notification job ${bulkJob.id} with ${batches.length} batches for ${targetUserIds.length} users`,
    );

    return bulkJob.id;
  }

  async enqueueAnnouncement(announcementId: string): Promise<void> {
    await this.bulkQueue.add(
      JOB_TYPES.PROCESS_ANNOUNCEMENT,
      { announcementId },
      {
        jobId: `announcement-${announcementId}`,
        priority: 3,
      },
    );

    this.logger.log(`Enqueued announcement processing for ${announcementId}`);
  }

  async enqueueCourseAnnouncement(
    courseId: string,
    teacherId: string,
    notificationData: {
      title: string;
      body: string;
      type: NotificationType;
    },
    options: {
      sendAsEmail?: boolean;
      showInApp?: boolean;
    } = {},
  ): Promise<string> {
    const { sendAsEmail = true, showInApp = true } = options;

    const channels: NotificationChannel[] = [];
    if (showInApp) channels.push(NotificationChannel.IN_APP);
    if (sendAsEmail) channels.push(NotificationChannel.EMAIL);

    // Create bulk job record
    const bulkJob = await this.prisma.bulkNotificationJob.create({
      data: {
        courseId,
        teacherId,
        status: 'PENDING',
        totalCount: 0, // Will be updated during processing
        processedCount: 0,
        failedCount: 0,
      },
    });

    // Queue the course announcement processor
    await this.bulkQueue.add(
      JOB_TYPES.PROCESS_COURSE_ANNOUNCEMENT,
      {
        jobId: bulkJob.id,
        courseId,
        teacherId,
        notificationData,
        channels,
      },
      {
        jobId: `course-announcement-${bulkJob.id}`,
        priority: 4,
      },
    );

    this.logger.log(`Enqueued course announcement job ${bulkJob.id} for course ${courseId}`);

    return bulkJob.id;
  }

  async getJobStatus(jobId: string): Promise<{
    status: string;
    totalCount: number;
    processedCount: number;
    failedCount: number;
    progress: number;
  }> {
    const job = await this.prisma.bulkNotificationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const progress = job.totalCount > 0 ? (job.processedCount / job.totalCount) * 100 : 0;

    return {
      status: job.status,
      totalCount: job.totalCount,
      processedCount: job.processedCount,
      failedCount: job.failedCount,
      progress: Math.round(progress * 100) / 100,
    };
  }

  private async getUserPreferences(userId: string): Promise<NotificationPreference> {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences
      return this.prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          marketingEnabled: true,
        },
      });
    }

    return preferences;
  }

  private getPriorityForType(type: NotificationType): number {
    // Higher priority = lower number (1 = highest)
    switch (type) {
      case NotificationType.ASSESSMENT_GRADED:
      case NotificationType.ASSIGNMENT_FEEDBACK:
        return 1; // High priority
      case NotificationType.COURSE_ENROLLED:
      case NotificationType.COURSE_PURCHASED:
        return 2;
      case NotificationType.ANNOUNCEMENT:
        return 3;
      default:
        return 5; // Normal priority
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async cleanupOldNotifications(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 180); // 180 days

    const deleted = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} old notifications`);
  }
}
