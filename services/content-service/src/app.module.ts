import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PrismaService } from './prisma.service';
import { CourseClientService } from './course-client.service';
import { StaffClientService } from './staff-client.service';
import { EnrollmentClientService } from './enrollment-client.service';
import { PlaybackTokenService } from './playback-token.service';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    HttpModule,
  ],
  controllers: [ContentController],
  providers: [
    ContentService,
    PrismaService,
    CourseClientService,
    StaffClientService,
    EnrollmentClientService,
    PlaybackTokenService,
  ],
})
export class AppModule {}
