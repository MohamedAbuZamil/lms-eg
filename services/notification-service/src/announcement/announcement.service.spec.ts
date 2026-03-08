import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementService } from './announcement.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueueService } from '../notification/notification-queue.service';
import { TargetRole, SystemAnnouncement, BulkNotificationJob } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let prismaService: PrismaService;
  let notificationQueueService: NotificationQueueService;

  const mockPrisma = {
    systemAnnouncement: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bulkNotificationJob: {
      findUnique: jest.fn(),
    },
  };

  const mockNotificationQueueService = {
    enqueueAnnouncement: jest.fn(),
    enqueueCourseAnnouncement: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: NotificationQueueService,
          useValue: mockNotificationQueueService,
        },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationQueueService = module.get<NotificationQueueService>(NotificationQueueService);

    jest.clearAllMocks();
  });

  describe('createSystemAnnouncement', () => {
    it('should create system announcement successfully', async () => {
      const dto = {
        title: 'Test Announcement',
        message: 'Test message',
        targetRole: TargetRole.STUDENT,
      };
      const userId = 'admin-123';
      const userRole = 'ADMIN';

      const mockAnnouncement: SystemAnnouncement = {
        id: 'announce-1',
        title: dto.title,
        message: dto.message,
        targetRole: dto.targetRole,
        targetCourseId: null,
        publishAt: new Date(),
        expireAt: null,
        isPublished: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        processingStatus: 'PENDING',
        processedCount: 0,
        totalTargetCount: 0,
      };

      mockPrisma.systemAnnouncement.create.mockResolvedValue(mockAnnouncement);
      mockNotificationQueueService.enqueueAnnouncement.mockResolvedValue(undefined);

      const result = await service.createSystemAnnouncement(dto, userId, userRole);

      expect(result.id).toBe('announce-1');
      expect(mockPrisma.systemAnnouncement.create).toHaveBeenCalled();
      expect(mockNotificationQueueService.enqueueAnnouncement).toHaveBeenCalledWith('announce-1');
    });

    it('should allow admin to create platform-wide announcements', async () => {
      const dto = {
        title: 'Platform Update',
        message: 'System maintenance scheduled',
        targetRole: TargetRole.ALL,
      };
      const userId = 'admin-123';
      const userRole = 'ADMIN';

      const mockAnnouncement: SystemAnnouncement = {
        id: 'announce-2',
        title: dto.title,
        message: dto.message,
        targetRole: dto.targetRole,
        targetCourseId: null,
        publishAt: new Date(),
        expireAt: null,
        isPublished: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        processingStatus: 'PENDING',
        processedCount: 0,
        totalTargetCount: 0,
      };

      mockPrisma.systemAnnouncement.create.mockResolvedValue(mockAnnouncement);

      const result = await service.createSystemAnnouncement(dto, userId, userRole);

      expect(result.id).toBe('announce-2');
    });

    it('should throw ForbiddenException when teacher tries to create platform-wide announcement', async () => {
      const dto = {
        title: 'Test',
        message: 'Test',
        targetRole: TargetRole.ALL,
      };
      const userId = 'teacher-123';
      const userRole = 'TEACHER';

      await expect(service.createSystemAnnouncement(dto, userId, userRole)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createCourseAnnouncement', () => {
    it('should create course announcement successfully', async () => {
      const courseId = 'course-456';
      const dto = {
        title: 'New Assignment',
        message: 'Assignment due tomorrow',
        sendAsEmail: true,
        showInApp: true,
      };
      const teacherId = 'teacher-123';
      const userRole = 'TEACHER';

      mockNotificationQueueService.enqueueCourseAnnouncement.mockResolvedValue('job-123');

      const result = await service.createCourseAnnouncement(courseId, dto, teacherId, userRole);

      expect(result).toBe('job-123');
      expect(mockNotificationQueueService.enqueueCourseAnnouncement).toHaveBeenCalledWith(
        courseId,
        teacherId,
        {
          title: dto.title,
          body: dto.message,
          type: 'ANNOUNCEMENT',
        },
        {
          sendAsEmail: dto.sendAsEmail,
          showInApp: dto.showInApp,
        },
      );
    });
  });

  describe('getAnnouncements', () => {
    it('should return active announcements', async () => {
      const mockAnnouncements: SystemAnnouncement[] = [
        {
          id: 'announce-1',
          title: 'Announcement 1',
          message: 'Message 1',
          targetRole: TargetRole.ALL,
          targetCourseId: null,
          publishAt: new Date(),
          expireAt: null,
          isPublished: true,
          createdBy: 'admin-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          processingStatus: 'COMPLETED',
          processedCount: 100,
          totalTargetCount: 100,
        },
      ];

      mockPrisma.systemAnnouncement.findMany.mockResolvedValue(mockAnnouncements);
      mockPrisma.systemAnnouncement.count.mockResolvedValue(1);

      const result = await service.getAnnouncements(1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('announce-1');
    });
  });

  describe('getJobStatus', () => {
    it('should return bulk job status', async () => {
      const mockJob: BulkNotificationJob = {
        id: 'job-123',
        announcementId: 'announce-1',
        courseId: null,
        teacherId: null,
        status: 'PROCESSING',
        totalCount: 1000,
        processedCount: 500,
        failedCount: 10,
        lastProcessedId: 'user-500',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        errorMessage: null,
      };

      mockPrisma.bulkNotificationJob.findUnique.mockResolvedValue(mockJob);

      const result = await service.getJobStatus('job-123');

      expect(result.status).toBe('PROCESSING');
      expect(result.totalCount).toBe(1000);
      expect(result.processedCount).toBe(500);
      expect(result.progress).toBe(50);
    });

    it('should return announcement processing status', async () => {
      const mockAnnouncement: SystemAnnouncement = {
        id: 'announce-1',
        title: 'Test',
        message: 'Test',
        targetRole: TargetRole.ALL,
        targetCourseId: null,
        publishAt: new Date(),
        expireAt: null,
        isPublished: true,
        createdBy: 'admin-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        processingStatus: 'PROCESSING',
        processedCount: 750,
        totalTargetCount: 1000,
      };

      mockPrisma.bulkNotificationJob.findUnique.mockResolvedValue(null);
      mockPrisma.systemAnnouncement.findUnique.mockResolvedValue(mockAnnouncement);

      const result = await service.getJobStatus('announce-1');

      expect(result.status).toBe('PROCESSING');
      expect(result.progress).toBe(75);
    });

    it('should throw error for non-existent job', async () => {
      mockPrisma.bulkNotificationJob.findUnique.mockResolvedValue(null);
      mockPrisma.systemAnnouncement.findUnique.mockResolvedValue(null);

      await expect(service.getJobStatus('non-existent')).rejects.toThrow('Job non-existent not found');
    });
  });
});
