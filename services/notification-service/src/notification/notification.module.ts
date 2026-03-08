import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationQueueService } from './notification-queue.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { BulkNotificationWorker } from '../queue/bulk-notification.worker';

@Module({
  imports: [PrismaModule, QueueModule, AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationQueueService, BulkNotificationWorker],
  exports: [NotificationService, NotificationQueueService],
})
export class NotificationModule {}
