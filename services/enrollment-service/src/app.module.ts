import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';
import { PrismaService } from './prisma.service';
import { CourseClientService } from './course-client.service';
import { StaffClientService } from './staff-client.service';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    HttpModule,
  ],
  controllers: [EnrollmentController],
  providers: [
    EnrollmentService,
    PrismaService,
    CourseClientService,
    StaffClientService,
  ],
})
export class AppModule {}
