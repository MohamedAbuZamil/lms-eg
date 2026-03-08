import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { GradingService } from './grading.service';
import { ReportingService } from './reporting.service';
import { PrismaService } from './prisma.service';
import { CourseClient } from './integrations/course.client';
import { EnrollmentClient } from './integrations/enrollment.client';
import { StaffClient } from './integrations/staff.client';
import { ContentClient } from './integrations/content.client';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    GradingService,
    ReportingService,
    PrismaService,
    CourseClient,
    EnrollmentClient,
    StaffClient,
    ContentClient,
  ],
  exports: [AssessmentService, GradingService, ReportingService],
})
export class AssessmentModule {}
