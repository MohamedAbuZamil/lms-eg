import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [EventController],
})
export class EventModule {}
