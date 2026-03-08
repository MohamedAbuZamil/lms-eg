import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_NAMES, JOB_TYPES } from './queue-config.module';
import { NotificationQueueService } from '../notification/notification-queue.service';

interface BulkNotificationJobData {
  jobId: string;
  announcementId?: string;
  courseId?: string;
  teacherId?: string;
  targetUserIds?: string[];
  notificationData?: {
    title: string;
    body: string;
    type: string;
  };
  channels?: {
    inApp?: boolean;
    email?: boolean;
    push?: boolean;
  };
  batchSize?: number;
  lastProcessedId?: string;
}

@Processor(QUEUE_NAMES.BULK_NOTIFICATION, {
  concurrency: 3,
})
export class BulkNotificationWorker extends WorkerHost {
  private readonly logger = new Logger(BulkNotificationWorker.name);
  private readonly DEFAULT_BATCH_SIZE = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueueService: NotificationQueueService,
  ) {
    super();
  }

  async process(job: Job<BulkNotificationJobData>): Promise<void> {
    const { jobId, announcementId, courseId, teacherId, targetUserIds, notificationData, channels, batchSize } = job.data;

    this.logger.log(`Processing bulk notification job ${jobId}`);

    try {
      // Update job status to processing
      await this.prisma.bulkNotificationJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      // Get target users
      const users = targetUserIds || await this.getTargetUsers(courseId, announcementId);
      
      if (!users || users.length === 0) {
        this.logger.warn(`No target users found for job ${jobId}`);
        await this.completeJob(jobId, 0, 0);
        return;
      }

      // Update total count
      await this.prisma.bulkNotificationJob.update({
        where: { id: jobId },
        data: { totalCount: users.length },
      });

      const actualBatchSize = batchSize || this.DEFAULT_BATCH_SIZE;
      let processedCount = 0;
      let failedCount = 0;

      // Process in batches
      for (let i = 0; i < users.length; i += actualBatchSize) {
        const batch = users.slice(i, i + actualBatchSize);
        
        try {
          await this.processBatch(batch, notificationData, channels, jobId);
          processedCount += batch.length;
        } catch (error) {
          this.logger.error(`Failed to process batch: ${error.message}`);
          failedCount += batch.length;
        }

        // Update progress
        await this.prisma.bulkNotificationJob.update({
          where: { id: jobId },
          data: {
            processedCount,
            failedCount,
            lastProcessedId: batch[batch.length - 1],
          },
        });

        // Log progress
        this.logger.log(`Job ${jobId} progress: ${processedCount}/${users.length}`);
      }

      await this.completeJob(jobId, processedCount, failedCount);
      
      this.logger.log(`Bulk notification job ${jobId} completed: ${processedCount} processed, ${failedCount} failed`);
    } catch (error) {
      this.logger.error(`Failed to process bulk job ${jobId}: ${error.message}`, error.stack);
      
      await this.prisma.bulkNotificationJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  private async getTargetUsers(courseId?: string, announcementId?: string): Promise<string[]> {
    if (courseId) {
      // TODO: Fetch enrolled students from course service
      this.logger.log(`Fetching enrolled students for course ${courseId}`);
      // Mock implementation - replace with actual API call
      return [];
    }

    if (announcementId) {
      const announcement = await this.prisma.systemAnnouncement.findUnique({
        where: { id: announcementId },
      });

      if (!announcement) {
        return [];
      }

      // TODO: Fetch users by role from identity service
      this.logger.log(`Fetching users for role ${announcement.targetRole}`);
      // Mock implementation - replace with actual API call
      return [];
    }

    return [];
  }

  private async processBatch(
    userIds: string[],
    notificationData: any,
    channels: any,
    jobId: string,
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        await this.notificationQueueService.enqueueSingleNotification(
          userId,
          notificationData.title,
          notificationData.body,
          notificationData.type,
          {
            sendEmail: channels?.email,
            sendPush: channels?.push,
          },
        );
      } catch (error) {
        this.logger.error(`Failed to enqueue notification for user ${userId}: ${error.message}`);
        throw error;
      }
    }
  }

  private async completeJob(jobId: string, processedCount: number, failedCount: number): Promise<void> {
    await this.prisma.bulkNotificationJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        processedCount,
        failedCount,
        completedAt: new Date(),
      },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BulkNotificationJobData>) {
    this.logger.log(`Bulk job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BulkNotificationJobData>, error: Error) {
    this.logger.error(`Bulk job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Bulk worker error: ${error.message}`, error.stack);
  }
}
