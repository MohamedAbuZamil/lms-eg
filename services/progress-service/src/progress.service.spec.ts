import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from './prisma.service';
import { ContentClient } from './integrations/content.client';
import { EnrollmentClient } from './integrations/enrollment.client';
import { CourseClient } from './integrations/course.client';
import { StaffClient } from './integrations/staff.client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LessonStatus, CourseStatus, ActivityType } from '@prisma/client';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';
import { CurrentUser } from './auth/decorators/current-user.decorator';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: PrismaService;
  let contentClient: ContentClient;
  let enrollmentClient: EnrollmentClient;
  let courseClient: CourseClient;
  let staffClient: StaffClient;

  const mockPrisma = {
    lessonProgress: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    courseProgress: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    learningActivity: {
      create: jest.fn(),
    },
  };

  const mockContentClient = {
    getLesson: jest.fn(),
    getCourseStructure: jest.fn(),
    validateLessonInCourse: jest.fn(),
  };

  const mockEnrollmentClient = {
    hasActiveEnrollment: jest.fn(),
    getActiveEnrollmentCount: jest.fn(),
  };

  const mockCourseClient = {
    getCourse: jest.fn(),
    validateTeacherOwnership: jest.fn(),
  };

  const mockStaffClient = {
    verifyProgressViewPermission: jest.fn(),
  };

  const studentUser: CurrentUser = {
    sub: 'student-uuid',
    email: 'student@test.com',
    role: 'STUDENT',
  };

  const teacherUser: CurrentUser = {
    sub: 'teacher-uuid',
    email: 'teacher@test.com',
    role: 'TEACHER',
  };

  const adminUser: CurrentUser = {
    sub: 'admin-uuid',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  const mockLesson = {
    id: 'lesson-uuid',
    type: 'VIDEO',
    title: 'Test Lesson',
    order: 1,
    isPreview: false,
    sectionId: 'section-uuid',
    section: {
      courseId: 'course-uuid',
    },
  };

  const mockCourseStructure = {
    courseId: 'course-uuid',
    totalLessons: 10,
    nonPreviewLessons: 8,
    lessons: [mockLesson],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ContentClient,
          useValue: mockContentClient,
        },
        {
          provide: EnrollmentClient,
          useValue: mockEnrollmentClient,
        },
        {
          provide: CourseClient,
          useValue: mockCourseClient,
        },
        {
          provide: StaffClient,
          useValue: mockStaffClient,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get<PrismaService>(PrismaService);
    contentClient = module.get<ContentClient>(ContentClient);
    enrollmentClient = module.get<EnrollmentClient>(EnrollmentClient);
    courseClient = module.get<CourseClient>(CourseClient);
    staffClient = module.get<StaffClient>(StaffClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openLesson', () => {
    it('should create lesson progress for new user', async () => {
      mockContentClient.getLesson.mockResolvedValue(mockLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockContentClient.getCourseStructure.mockResolvedValue(mockCourseStructure as any);
      mockPrisma.lessonProgress.upsert.mockResolvedValue({
        id: 'progress-uuid',
        userId: studentUser.sub,
        lessonId: mockLesson.id,
        status: LessonStatus.IN_PROGRESS,
        progressPercent: 0,
        lastAccessedAt: new Date(),
      } as any);
      mockPrisma.courseProgress.upsert.mockResolvedValue({} as any);
      mockPrisma.learningActivity.create.mockResolvedValue({} as any);

      const result = await service.openLesson(mockLesson.id, studentUser);

      expect(result).toEqual({
        lessonId: mockLesson.id,
        status: LessonStatus.IN_PROGRESS,
        progressPercent: 0,
        lastPositionSeconds: 0,
      });
      expect(mockPrisma.lessonProgress.upsert).toHaveBeenCalled();
    });

    it('should allow access to preview lesson without enrollment', async () => {
      const previewLesson = { ...mockLesson, isPreview: true };
      mockContentClient.getLesson.mockResolvedValue(previewLesson as any);
      mockContentClient.getCourseStructure.mockResolvedValue(mockCourseStructure as any);
      mockPrisma.lessonProgress.upsert.mockResolvedValue({
        id: 'progress-uuid',
        userId: studentUser.sub,
        lessonId: previewLesson.id,
        status: LessonStatus.IN_PROGRESS,
        progressPercent: 0,
        lastAccessedAt: new Date(),
      } as any);
      mockPrisma.courseProgress.upsert.mockResolvedValue({} as any);
      mockPrisma.learningActivity.create.mockResolvedValue({} as any);

      const result = await service.openLesson(previewLesson.id, studentUser);

      expect(result.lessonId).toBe(previewLesson.id);
      expect(mockEnrollmentClient.hasActiveEnrollment).not.toHaveBeenCalled();
    });

    it('should deny access to non-preview lesson without enrollment', async () => {
      mockContentClient.getLesson.mockResolvedValue(mockLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(false);

      await expect(service.openLesson(mockLesson.id, studentUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateVideoProgress', () => {
    it('should update video progress for video lesson', async () => {
      const updateDto: UpdateVideoProgressDto = {
        lastPositionSeconds: 125,
        progressPercent: 42,
      };

      mockContentClient.getLesson.mockResolvedValue(mockLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockContentClient.getCourseStructure.mockResolvedValue(mockCourseStructure as any);
      mockPrisma.lessonProgress.upsert.mockResolvedValue({
        id: 'progress-uuid',
        userId: studentUser.sub,
        lessonId: mockLesson.id,
        status: LessonStatus.IN_PROGRESS,
        progressPercent: 42,
        lastPositionSeconds: 125,
        lastAccessedAt: new Date(),
      } as any);
      mockPrisma.courseProgress.upsert.mockResolvedValue({} as any);
      mockPrisma.learningActivity.create.mockResolvedValue({} as any);

      const result = await service.updateVideoProgress(mockLesson.id, updateDto, studentUser);

      expect(result).toEqual({
        lessonId: mockLesson.id,
        status: LessonStatus.IN_PROGRESS,
        progressPercent: 42,
        lastPositionSeconds: 125,
      });
    });

    it('should reject progress update for non-video lesson', async () => {
      const textLesson = { ...mockLesson, type: 'TEXT' };
      const updateDto: UpdateVideoProgressDto = {
        lastPositionSeconds: 125,
        progressPercent: 42,
      };

      mockContentClient.getLesson.mockResolvedValue(textLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);

      await expect(service.updateVideoProgress(textLesson.id, updateDto, studentUser))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('completeLesson', () => {
    it('should mark lesson as completed', async () => {
      mockContentClient.getLesson.mockResolvedValue(mockLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPrisma.lessonProgress.upsert.mockResolvedValue({
        id: 'progress-uuid',
        userId: studentUser.sub,
        lessonId: mockLesson.id,
        status: LessonStatus.COMPLETED,
        progressPercent: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      } as any);
      mockContentClient.getCourseStructure.mockResolvedValue(mockCourseStructure as any);
      mockPrisma.courseProgress.upsert.mockResolvedValue({
        status: CourseStatus.IN_PROGRESS,
        progressPercent: 12,
      } as any);
      mockPrisma.learningActivity.create.mockResolvedValue({} as any);

      const result = await service.completeLesson(mockLesson.id, studentUser);

      expect(result).toEqual({
        lessonId: mockLesson.id,
        status: LessonStatus.COMPLETED,
        progressPercent: 100,
        completedAt: expect.any(Date),
      });
    });
  });

  describe('getMyCourseProgress', () => {
    it('should return course progress for enrolled student', async () => {
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPrisma.courseProgress.findUnique.mockResolvedValue({
        id: 'course-progress-uuid',
        userId: studentUser.sub,
        courseId: 'course-uuid',
        status: CourseStatus.IN_PROGRESS,
        progressPercent: 60,
        completedLessons: 6,
        totalLessons: 10,
        lastActivityAt: new Date(),
      } as any);

      const result = await service.getMyCourseProgress('course-uuid', studentUser);

      expect(result).toEqual({
        courseId: 'course-uuid',
        status: CourseStatus.IN_PROGRESS,
        progressPercent: 60,
        completedLessons: 6,
        totalLessons: 10,
        lastActivityAt: expect.any(Date),
      });
    });

    it('should return not started status for new student', async () => {
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPrisma.courseProgress.findUnique.mockResolvedValue(null);

      const result = await service.getMyCourseProgress('course-uuid', studentUser);

      expect(result).toEqual({
        courseId: 'course-uuid',
        status: CourseStatus.NOT_STARTED,
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 0,
        lastActivityAt: null,
      });
    });
  });

  describe('getCourseSummary', () => {
    it('should return course summary for teacher', async () => {
      mockCourseClient.validateTeacherOwnership.mockResolvedValue(true);
      mockContentClient.getCourseStructure.mockResolvedValue(mockCourseStructure as any);
      mockEnrollmentClient.getActiveEnrollmentCount.mockResolvedValue(120);
      mockPrisma.courseProgress.findMany.mockResolvedValue([
        { progressPercent: 60 },
        { progressPercent: 80 },
        { progressPercent: 40 },
      ] as any);
      mockPrisma.courseProgress.count.mockResolvedValue(15);

      const result = await service.getCourseSummary('course-uuid', teacherUser);

      expect(result).toEqual({
        courseId: 'course-uuid',
        studentsCount: 120,
        activeStudentsCount: 3,
        completedStudentsCount: 15,
        averageProgressPercent: 60,
        totalLessons: 10,
      });
    });

    it('should deny access for teacher who does not own course', async () => {
      mockCourseClient.validateTeacherOwnership.mockResolvedValue(false);

      await expect(service.getCourseSummary('course-uuid', teacherUser))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('recalculateCourseProgress', () => {
    it('should calculate course progress correctly', async () => {
      mockContentClient.getCourseStructure.mockResolvedValue(mockCourseStructure as any);
      mockPrisma.lessonProgress.count.mockResolvedValue(4); // 4 out of 8 non-preview lessons completed
      mockPrisma.courseProgress.upsert.mockResolvedValue({
        status: CourseStatus.IN_PROGRESS,
        progressPercent: 50,
      } as any);

      const result = await service['recalculateCourseProgress'](studentUser.sub, 'course-uuid');

      expect(result.progressPercent).toBe(50);
      expect(result.status).toBe(CourseStatus.IN_PROGRESS);
    });

    it('should mark course as completed when all lessons are done', async () => {
      mockContentClient.getCourseStructure.mockResolvedValue(mockCourseStructure as any);
      mockPrisma.lessonProgress.count.mockResolvedValue(8); // All 8 non-preview lessons completed
      mockPrisma.courseProgress.upsert.mockResolvedValue({
        status: CourseStatus.COMPLETED,
        progressPercent: 100,
        completedAt: new Date(),
      } as any);
      mockPrisma.learningActivity.create.mockResolvedValue({} as any);

      const result = await service['recalculateCourseProgress'](studentUser.sub, 'course-uuid');

      expect(result.progressPercent).toBe(100);
      expect(result.status).toBe(CourseStatus.COMPLETED);
    });
  });
});
