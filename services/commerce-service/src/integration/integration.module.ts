import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CourseService } from './course.service';
import { EnrollmentService } from './enrollment.service';
import { StaffService } from './staff.service';

@Module({
  imports: [HttpModule],
  providers: [CourseService, EnrollmentService, StaffService],
  exports: [CourseService, EnrollmentService, StaffService],
})
export class IntegrationModule {}
