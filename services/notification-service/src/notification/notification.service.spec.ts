import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationQueueService } from './notification-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue-config.module';

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaService: PrismaService;
  let notificationQueueService: NotificationQueueService;

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    bulkNotificationJob: {
      findUnique: jest.fn(),
    },
  };

  const mockNotificationQueueService = {
    enqueueSingleNotification: jest.fn(),
  };

  const mockNotificationQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: NotificationQueueService,
          useValue: mockNotificationQueueService,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.NOTIFICATION),
          useValue: mockNotificationQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationQueueService = module.get<NotificationQueueService>(NotificationQueueService);

    jest.clearAllMocks();
  });

  describe('getMyNotifications', () => {
    it('should return paginated notifications with unread count', async () => {
      const userId = 'user-123';
      const mockNotifications = [
        { id: 'notif-1', userId, title: 'Test 1', isRead: false },
        { id: 'notif-2', userId, title: 'Test 2', isRead: true },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValueOnce(10); // total
      mockPrisma.notification.count.mockResolvedValueOnce(5); // unread

      const result = await service.getMyNotifications(userId, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.unreadCount).toBe(5);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        select: {
          id: true,
          userId: true,
          title: true,
          body: true,
          type: true,
          entityType: true,
          entityId: true,
          isRead: true,
          createdAt: true,
        },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-123');

      expect(result.count).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-123',
        isRead: false,
      };

      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await service.markAsRead('notif-1', 'user-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException for non-existent notification', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-1', 'user-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for unauthorized user', async () => {
      // When notification belongs to different user, findFirst returns null
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-1', 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-123');

      expect(result.success).toBe(true);
      expect(result.markedCount).toBe(5);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'user-123',
      };

      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);
      mockPrisma.notification.delete.mockResolvedValue(mockNotification);

      await service.deleteNotification('notif-1', 'user-123');

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        userId: 'user-123',
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        marketingEnabled: false,
        typePreferences: null,
      };

      mockPrisma.notificationPreference.findUnique.mockResolvedValue(mockPreferences);

      const result = await service.getNotificationPreferences('user-123');

      expect(result.userId).toBe('user-123');
      expect(result.emailEnabled).toBe(true);
    });

    it('should return default preferences if not set', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
      
      const defaultPrefs = {
        userId: 'user-123',
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        marketingEnabled: true,
        typePreferences: null,
      };
      mockPrisma.notificationPreference.create.mockResolvedValue(defaultPrefs);

      const result = await service.getNotificationPreferences('user-123');

      expect(result.emailEnabled).toBe(true);
      expect(mockPrisma.notificationPreference.create).toHaveBeenCalled();
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update user preferences', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        emailEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
        marketingEnabled: true,
        typePreferences: null,
      };

      mockPrisma.notificationPreference.upsert.mockResolvedValue(updatedPreferences);

      const result = await service.updateNotificationPreferences('user-123', {
        emailEnabled: false,
      });

      expect(result.emailEnabled).toBe(false);
    });
  });

  describe('handleCourseEnrolled', () => {
    it('should queue enrollment notification', async () => {
      await service.handleCourseEnrolled('user-123', 'course-456', 'Test Course');

      expect(mockNotificationQueueService.enqueueSingleNotification).toHaveBeenCalledWith(
        'user-123',
        'Welcome to your new course!',
        expect.stringContaining('Test Course'),
        NotificationType.COURSE_ENROLLED,
        expect.any(Object),
      );
    });
  });

  describe('handleCoursePurchased', () => {
    it('should queue purchase notification', async () => {
      await service.handleCoursePurchased('user-123', 'course-456', 'Test Course');

      expect(mockNotificationQueueService.enqueueSingleNotification).toHaveBeenCalledWith(
        'user-123',
        'Course Purchase Successful',
        expect.stringContaining('Test Course'),
        NotificationType.COURSE_PURCHASED,
        expect.any(Object),
      );
    });
  });

  describe('handleAssessmentPublished', () => {
    it('should queue assessment published notification', async () => {
      await service.handleAssessmentPublished('user-123', 'assess-789', 'Test Assessment');

      expect(mockNotificationQueueService.enqueueSingleNotification).toHaveBeenCalledWith(
        'user-123',
        'New Assessment Available',
        expect.stringContaining('Test Assessment'),
        NotificationType.ASSESSMENT_PUBLISHED,
        expect.any(Object),
      );
    });
  });

  describe('handleAssessmentGraded', () => {
    it('should queue graded notification with score', async () => {
      await service.handleAssessmentGraded('user-123', 'assess-789', 'Test Assessment', 85);

      expect(mockNotificationQueueService.enqueueSingleNotification).toHaveBeenCalledWith(
        'user-123',
        'Assessment Graded',
        expect.stringContaining('85'),
        NotificationType.ASSESSMENT_GRADED,
        expect.any(Object),
      );
    });
  });
});
