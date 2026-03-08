import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Queue names
export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  PUSH: 'push',
  BULK_NOTIFICATION: 'bulk-notification',
  ANNOUNCEMENT: 'announcement',
  DEAD_LETTER: 'dead-letter',
} as const;

// Job types
export const JOB_TYPES = {
  // Notification jobs
  SEND_IN_APP: 'send-in-app',
  SEND_EMAIL: 'send-email',
  SEND_PUSH: 'send-push',
  
  // Bulk jobs
  PROCESS_BULK_NOTIFICATION: 'process-bulk-notification',
  PROCESS_ANNOUNCEMENT: 'process-announcement',
  PROCESS_COURSE_ANNOUNCEMENT: 'process-course-announcement',
  
  // Event-based jobs
  COURSE_PURCHASED: 'course-purchased',
  COURSE_ENROLLED: 'course-enrolled',
  LESSON_UNLOCKED: 'lesson-unlocked',
  ASSESSMENT_PUBLISHED: 'assessment-published',
  ASSESSMENT_GRADED: 'assessment-graded',
  ASSIGNMENT_FEEDBACK: 'assignment-feedback',
  PAYMENT_RECORDED: 'payment-recorded',
  
  // Cleanup
  CLEANUP_OLD_NOTIFICATIONS: 'cleanup-old-notifications',
} as const;

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.NOTIFICATION,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: QUEUE_NAMES.EMAIL,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: QUEUE_NAMES.PUSH,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: QUEUE_NAMES.BULK_NOTIFICATION,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 1000,
          },
          removeOnComplete: 10,
          removeOnFail: 10,
        },
      },
      {
        name: QUEUE_NAMES.ANNOUNCEMENT,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: 10,
          removeOnFail: 10,
        },
      },
      {
        name: QUEUE_NAMES.DEAD_LETTER,
        defaultJobOptions: {
          attempts: 0,
          removeOnComplete: false,
          removeOnFail: false,
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class QueueConfigModule {}
