import { Injectable, Logger } from '@nestjs/common';
import { 
  LessonOpenedEvent, 
  VideoProgressUpdatedEvent, 
  LessonCompletedEvent, 
  CourseCompletedEvent,
  ProgressResetEvent 
} from './progress.events';

@Injectable()
export class ProgressEventEmitterService {
  private readonly logger = new Logger(ProgressEventEmitterService.name);

  // Future NATS implementation
  async emitLessonOpened(payload: Omit<LessonOpenedEvent, 'eventType' | 'timestamp'>) {
    const event: LessonOpenedEvent = {
      eventType: 'progress.lesson.opened',
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // TODO: Emit to NATS
    this.logger.log(`Emitting lesson opened event: ${JSON.stringify(event)}`);
  }

  async emitVideoProgressUpdated(payload: Omit<VideoProgressUpdatedEvent, 'eventType' | 'timestamp'>) {
    const event: VideoProgressUpdatedEvent = {
      eventType: 'progress.video.updated',
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // TODO: Emit to NATS
    this.logger.log(`Emitting video progress updated event: ${JSON.stringify(event)}`);
  }

  async emitLessonCompleted(payload: Omit<LessonCompletedEvent, 'eventType' | 'timestamp'>) {
    const event: LessonCompletedEvent = {
      eventType: 'progress.lesson.completed',
      timestamp: new Date().toISOString(),
      completionTime: new Date().toISOString(),
      ...payload,
    };

    // TODO: Emit to NATS
    this.logger.log(`Emitting lesson completed event: ${JSON.stringify(event)}`);
  }

  async emitCourseCompleted(payload: Omit<CourseCompletedEvent, 'eventType' | 'timestamp'>) {
    const event: CourseCompletedEvent = {
      eventType: 'progress.course.completed',
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // TODO: Emit to NATS
    this.logger.log(`Emitting course completed event: ${JSON.stringify(event)}`);
  }

  async emitProgressReset(payload: Omit<ProgressResetEvent, 'eventType' | 'timestamp'>) {
    const event: ProgressResetEvent = {
      eventType: 'progress.reset',
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // TODO: Emit to NATS
    this.logger.log(`Emitting progress reset event: ${JSON.stringify(event)}`);
  }
}
