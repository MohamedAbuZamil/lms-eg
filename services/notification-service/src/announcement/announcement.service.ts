import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueueService } from '../notification/notification-queue.service';
import { 
  CreateSystemAnnouncementDto,
  CreateCourseAnnouncementDto,
  SystemAnnouncementResponseDto,
} from '../dto/notification.dto';
import { NotificationType, TargetRole, SystemAnnouncement, NotificationChannel } from '@prisma/client';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueueService: NotificationQueueService,
  ) {}

  async createSystemAnnouncement(
    dto: CreateSystemAnnouncementDto,
    userId: string,
    userRole: string,
  ): Promise<SystemAnnouncementResponseDto> {
    // Only admins can create platform-wide announcements
    if (dto.targetRole === TargetRole.ALL && userRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create platform-wide announcements');
    }

    const publishAt = dto.publishAt ? new Date(dto.publishAt) : new Date();
    const expireAt = dto.expireAt ? new Date(dto.expireAt) : null;

    const announcement = await this.prisma.systemAnnouncement.create({
      data: {
        title: dto.title,
        message: dto.message,
        targetRole: dto.targetRole || TargetRole.ALL,
        targetCourseId: dto.targetCourseId,
        publishAt,
        expireAt,
        createdBy: userId,
        isPublished: publishAt <= new Date(),
      },
    });

    // If immediate publish, queue for processing
    if (publishAt <= new Date()) {
      await this.notificationQueueService.enqueueAnnouncement(announcement.id);
    }

    return this.mapToResponseDto(announcement);
  }

  async createCourseAnnouncement(
    courseId: string,
    dto: CreateCourseAnnouncementDto,
    teacherId: string,
    userRole: string,
  ): Promise<string> {
    // Verify teacher owns the course (or is admin)
    if (userRole === 'TEACHER') {
      // TODO: Verify via Course Service that teacher owns this course
      this.logger.log(`Teacher ${teacherId} creating announcement for course ${courseId}`);
    }

    const channels: NotificationChannel[] = [];
    if (dto.showInApp) channels.push(NotificationChannel.IN_APP);
    if (dto.sendAsEmail) channels.push(NotificationChannel.EMAIL);

    const jobId = await this.notificationQueueService.enqueueCourseAnnouncement(
      courseId,
      teacherId,
      {
        title: dto.title,
        body: dto.message,
        type: NotificationType.ANNOUNCEMENT,
      },
      {
        sendAsEmail: dto.sendAsEmail,
        showInApp: dto.showInApp,
      },
    );

    return jobId;
  }

  async getAnnouncements(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: SystemAnnouncementResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const [items, total] = await Promise.all([
      this.prisma.systemAnnouncement.findMany({
        where: {
          isPublished: true,
          publishAt: { lte: now },
          OR: [
            { expireAt: null },
            { expireAt: { gt: now } },
          ],
        },
        orderBy: { publishAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.systemAnnouncement.count({
        where: {
          isPublished: true,
          publishAt: { lte: now },
          OR: [
            { expireAt: null },
            { expireAt: { gt: now } },
          ],
        },
      }),
    ]);

    return {
      items: items.map(this.mapToResponseDto),
      total,
    };
  }

  async getJobStatus(jobId: string): Promise<{
    status: string;
    totalCount: number;
    processedCount: number;
    failedCount: number;
    progress: number;
  }> {
    // Try to find in bulk jobs first
    const bulkJob = await this.prisma.bulkNotificationJob.findUnique({
      where: { id: jobId },
    });

    if (bulkJob) {
      const progress = bulkJob.totalCount > 0 
        ? (bulkJob.processedCount / bulkJob.totalCount) * 100 
        : 0;

      return {
        status: bulkJob.status,
        totalCount: bulkJob.totalCount,
        processedCount: bulkJob.processedCount,
        failedCount: bulkJob.failedCount,
        progress: Math.round(progress * 100) / 100,
      };
    }

    // Check if it's an announcement
    const announcement = await this.prisma.systemAnnouncement.findUnique({
      where: { id: jobId },
    });

    if (announcement) {
      const progress = announcement.totalTargetCount > 0
        ? (announcement.processedCount / announcement.totalTargetCount) * 100
        : 0;

      return {
        status: announcement.processingStatus,
        totalCount: announcement.totalTargetCount,
        processedCount: announcement.processedCount,
        failedCount: 0, // Not tracked separately for announcements
        progress: Math.round(progress * 100) / 100,
      };
    }

    throw new Error(`Job ${jobId} not found`);
  }

  private mapToResponseDto(announcement: SystemAnnouncement): SystemAnnouncementResponseDto {
    return {
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      targetRole: announcement.targetRole,
      targetCourseId: announcement.targetCourseId,
      publishAt: announcement.publishAt,
      expireAt: announcement.expireAt,
      isPublished: announcement.isPublished,
      processingStatus: announcement.processingStatus,
      processedCount: announcement.processedCount,
      totalTargetCount: announcement.totalTargetCount,
      createdAt: announcement.createdAt,
    };
  }
}
