import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_NAMES, JOB_TYPES } from './queue-config.module';
import { NotificationChannel, DeliveryStatus } from '@prisma/client';
import { EmailService } from './email.service';

interface NotificationJobData {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  channel: NotificationChannel;
  metadata?: Record<string, any>;
}

@Processor(QUEUE_NAMES.NOTIFICATION, {
  concurrency: 10,
})
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, channel } = job.data;

    this.logger.debug(`Processing notification ${notificationId} for channel ${channel}`);

    try {
      switch (channel) {
        case NotificationChannel.IN_APP:
          await this.processInAppNotification(job.data);
          break;
        case NotificationChannel.EMAIL:
          await this.processEmailNotification(job.data);
          break;
        case NotificationChannel.PUSH:
          await this.processPushNotification(job.data);
          break;
        default:
          this.logger.warn(`Unknown channel: ${channel}`);
      }

      // Mark job as completed
      await this.updateDeliveryStatus(notificationId, channel, DeliveryStatus.SENT);
    } catch (error) {
      this.logger.error(
        `Failed to process notification ${notificationId}: ${error.message}`,
        error.stack,
      );

      // Update delivery status with error
      await this.updateDeliveryStatus(
        notificationId,
        channel,
        DeliveryStatus.FAILED,
        error.message,
      );

      throw error; // Re-throw to trigger retry
    }
  }

  private async processInAppNotification(data: NotificationJobData): Promise<void> {
    // In-app notifications are already created in the database
    // This worker just ensures delivery tracking
    this.logger.log(`In-app notification ${data.notificationId} delivered to user ${data.userId}`);
  }

  private async processEmailNotification(data: NotificationJobData): Promise<void> {
    await this.emailService.sendEmail({
      to: data.userId, // This would be resolved to actual email via identity service
      subject: data.title,
      html: this.formatEmailBody(data.body, data.type, data.metadata),
    });

    this.logger.log(`Email notification ${data.notificationId} sent to user ${data.userId}`);
  }

  private async processPushNotification(data: NotificationJobData): Promise<void> {
    // TODO: Implement push notification via Firebase/OneSignal
    this.logger.warn(`Push notification not yet implemented for ${data.notificationId}`);
  }

  private formatEmailBody(body: string, type: string, metadata?: Record<string, any>): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LMS Notification</h1>
            </div>
            <div class="content">
              <p>${body.replace(/\n/g, '<br>')}</p>
              ${metadata?.actionUrl ? `<p><a href="${metadata.actionUrl}" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated message from the LMS platform.</p>
              <p>You can manage your notification preferences in your account settings.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private async updateDeliveryStatus(
    notificationId: string,
    channel: NotificationChannel,
    status: DeliveryStatus,
    error?: string,
  ): Promise<void> {
    const delivery = await this.prisma.notificationDelivery.findFirst({
      where: { notificationId, channel },
    });

    if (delivery) {
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status,
          attempts: { increment: 1 },
          lastError: error || null,
          sentAt: status === DeliveryStatus.SENT ? new Date() : undefined,
        },
      });
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<NotificationJobData>) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<NotificationJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(`Worker error: ${error.message}`, error.stack);
  }
}
