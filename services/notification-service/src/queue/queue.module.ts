import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueConfigModule, QUEUE_NAMES } from './queue-config.module';
import { NotificationWorker } from './notification.worker';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    QueueConfigModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.BULK_NOTIFICATION },
      { name: QUEUE_NAMES.ANNOUNCEMENT },
    ),
  ],
  providers: [
    NotificationWorker,
    EmailService,
  ],
  exports: [
    BullModule,
    EmailService,
  ],
})
export class QueueModule {}
