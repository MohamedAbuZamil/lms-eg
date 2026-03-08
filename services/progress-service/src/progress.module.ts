import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { PrismaService } from './prisma.service';
import { ContentClient } from './integrations/content.client';
import { EnrollmentClient } from './integrations/enrollment.client';
import { CourseClient } from './integrations/course.client';
import { StaffClient } from './integrations/staff.client';
import { HttpModule } from '@nestjs/axios';
import { ProgressEventEmitterService } from './events/progress-event-emitter.service';

@Module({
  imports: [HttpModule],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    PrismaService,
    ContentClient,
    EnrollmentClient,
    CourseClient,
    StaffClient,
    ProgressEventEmitterService,
  ],
  exports: [ProgressService],
})
export class ProgressModule {}
