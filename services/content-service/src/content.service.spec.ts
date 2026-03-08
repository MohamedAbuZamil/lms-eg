import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from './prisma.service';
import { CourseClientService } from './course-client.service';
import { StaffClientService } from './staff-client.service';
import { EnrollmentClientService } from './enrollment-client.service';
import { PlaybackTokenService } from './playback-token.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { LessonType, VideoProvider, PlaybackProtection } from '@prisma/client';

describe('ContentService', () => {
  let service: ContentService;
  let prisma: PrismaService;
  let courseClient: CourseClientService;
  let staffClient: StaffClientService;
  let enrollmentClient: EnrollmentClientService;
  let playbackTokenService: PlaybackTokenService;

  const mockPrisma = {
    section: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    lesson: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    lessonViewUsage: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    lessonViewOverride: {
      findUnique: jest.fn(),
    },
  };

  const mockCourseClient = {
    getCourseById: jest.fn(),
  };

  const mockStaffClient = {
    verifyContentManagementPermission: jest.fn(),
  };

  const mockEnrollmentClient = {
    hasActiveEnrollment: jest.fn(),
  };

  const mockPlaybackTokenService = {
    generatePlaybackToken: jest.fn(),
    validatePlaybackToken: jest.fn(),
    getProviderEmbedInfo: jest.fn(),
    generateEmbedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CourseClientService,
          useValue: mockCourseClient,
        },
        {
          provide: StaffClientService,
          useValue: mockStaffClient,
        },
        {
          provide: EnrollmentClientService,
          useValue: mockEnrollmentClient,
        },
        {
          provide: PlaybackTokenService,
          useValue: mockPlaybackTokenService,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    prisma = module.get<PrismaService>(PrismaService);
    courseClient = module.get<CourseClientService>(CourseClientService);
    staffClient = module.get<StaffClientService>(StaffClientService);
    enrollmentClient = module.get<EnrollmentClientService>(EnrollmentClientService);
    playbackTokenService = module.get<PlaybackTokenService>(PlaybackTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSection', () => {
    const teacherUser: CurrentUser = {
      sub: 'teacher-uuid',
      email: 'teacher@test.com',
      role: 'TEACHER',
    };

    const courseId = 'course-uuid';
    const createSectionDto: CreateSectionDto = {
      title: 'Chapter 1',
      order: 1,
    };

    it('should create section when teacher is course owner', async () => {
      const course = { id: courseId, teacherId: 'teacher-uuid' };
      const section = { id: 'section-uuid', courseId, ...createSectionDto };

      mockCourseClient.getCourseById.mockResolvedValue(course as any);
      mockPrisma.section.create.mockResolvedValue(section as any);

      const result = await service.createSection(courseId, createSectionDto, teacherUser);

      expect(result).toEqual(section);
      expect(mockCourseClient.getCourseById).toHaveBeenCalledWith(courseId);
      expect(mockPrisma.section.create).toHaveBeenCalledWith({
        data: { courseId, ...createSectionDto },
        include: { lessons: { orderBy: { order: 'asc' } } },
      });
    });

    it('should throw ForbiddenException when teacher is not course owner', async () => {
      const course = { id: courseId, teacherId: 'other-teacher-uuid' };

      mockCourseClient.getCourseById.mockResolvedValue(course as any);

      await expect(
        service.createSection(courseId, createSectionDto, teacherUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException on duplicate order', async () => {
      const course = { id: courseId, teacherId: 'teacher-uuid' };
      const error = { code: 'P2002' };

      mockCourseClient.getCourseById.mockResolvedValue(course as any);
      mockPrisma.section.create.mockRejectedValue(error);

      await expect(
        service.createSection(courseId, createSectionDto, teacherUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createLesson', () => {
    const teacherUser: CurrentUser = {
      sub: 'teacher-uuid',
      email: 'teacher@test.com',
      role: 'TEACHER',
    };

    const sectionId = 'section-uuid';
    const courseId = 'course-uuid';
    const createLessonDto: CreateLessonDto = {
      title: 'Lesson 1',
      type: LessonType.TEXT,
      order: 1,
      content: 'Test content',
    };

    it('should create lesson when teacher is course owner', async () => {
      const section = { id: 'section-uuid', courseId: 'course-uuid' };

      mockPrisma.section.findUnique.mockResolvedValue(section as any);
      mockCourseClient.getCourseById.mockResolvedValue({ id: 'course-uuid', teacherId: 'teacher-uuid' });
      mockPrisma.lesson.create.mockResolvedValue({ id: 'lesson-uuid', ...createLessonDto });

      const result = await service.createLesson('section-uuid', createLessonDto, teacherUser);

      expect(result).toEqual({ id: 'lesson-uuid', ...createLessonDto });
    });

    it('should throw NotFoundException when section not found', async () => {
      mockPrisma.section.findUnique.mockResolvedValue(null);

      await expect(
        service.createLesson(sectionId, createLessonDto, teacherUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCourseContent', () => {
    const courseId = 'course-uuid';
    const studentUser: CurrentUser = {
      sub: 'student-uuid',
      email: 'student@test.com',
      role: 'STUDENT',
    };

    it('should return course content with preview lessons for public access', async () => {
      const course = { id: courseId, teacherId: 'teacher-uuid' };
      const sections = [
        {
          id: 'section-uuid',
          courseId,
          title: 'Chapter 1',
          order: 1,
          lessons: [
            { id: 'preview-lesson', isPreview: true },
            { id: 'premium-lesson', isPreview: false },
          ],
        },
      ];

      mockCourseClient.getCourseById.mockResolvedValue(course as any);
      mockPrisma.section.findMany.mockResolvedValue(sections as any);

      const result = await service.getCourseContent(courseId);

      expect(result.courseId).toBe(courseId);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].lessons).toHaveLength(2); // All lessons returned, filtering done in controller
    });

    it('should return all content for enrolled student', async () => {
      const course = { id: courseId, teacherId: 'teacher-uuid' };
      const sections = [
        {
          id: 'section-uuid',
          courseId,
          title: 'Chapter 1',
          order: 1,
          lessons: [
            { id: 'preview-lesson', isPreview: true },
            { id: 'premium-lesson', isPreview: false },
          ],
        },
      ];

      mockCourseClient.getCourseById.mockResolvedValue(course as any);
      mockPrisma.section.findMany.mockResolvedValue(sections as any);

      const result = await service.getCourseContent(courseId, studentUser);

      expect(result.courseId).toBe(courseId);
      expect(result.sections[0].lessons).toHaveLength(2);
    });
  });

  describe('getLessonById', () => {
    const lessonId = 'lesson-uuid';
    const studentUser: CurrentUser = {
      sub: 'student-uuid',
      email: 'student@test.com',
      role: 'STUDENT',
    };

    it('should return preview lesson for public access', async () => {
      const lesson = {
        id: lessonId,
        title: 'Preview Lesson',
        isPreview: true,
        section: { courseId: 'course-uuid' },
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(lesson as any);

      const result = await service.getLessonById(lessonId);

      expect(result).toEqual(expect.objectContaining({
        id: lessonId,
        title: 'Preview Lesson',
        isPreview: true,
        hasPlayback: false, // Sanitized response
      }));
    });

    it('should throw ForbiddenException for non-preview lesson without user', async () => {
      const lesson = {
        id: lessonId,
        title: 'Premium Lesson',
        isPreview: false,
        section: { courseId: 'course-uuid' },
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(lesson as any);

      await expect(service.getLessonById(lessonId)).rejects.toThrow(ForbiddenException);
    });

    it('should return lesson for enrolled student', async () => {
      const lesson = {
        id: lessonId,
        title: 'Premium Lesson',
        isPreview: false,
        section: { courseId: 'course-uuid' },
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(lesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);

      const result = await service.getLessonById(lessonId, studentUser);

      expect(result).toEqual(expect.objectContaining({
        id: lessonId,
        title: 'Premium Lesson',
        isPreview: false,
        hasPlayback: false, // Sanitized response
      }));
      expect(mockEnrollmentClient.hasActiveEnrollment).toHaveBeenCalledWith(
        studentUser.sub,
        'course-uuid',
      );
    });
  });

  describe('Video Lesson Security', () => {
    const lessonId = 'video-lesson-uuid';
    const teacherUser: CurrentUser = {
      sub: 'teacher-uuid',
      email: 'teacher@test.com',
      role: 'TEACHER',
    };
    const studentUser: CurrentUser = {
      sub: 'student-uuid',
      email: 'student@test.com',
      role: 'STUDENT',
    };

    const videoLesson = {
      id: lessonId,
      title: 'Video Lesson',
      type: LessonType.VIDEO,
      videoProvider: VideoProvider.YOUTUBE,
      providerVideoId: 'youtube123',
      providerVideoUrl: 'https://youtube.com/watch?v=youtube123',
      playbackProtection: PlaybackProtection.BASIC,
      isPreview: false,
      section: { courseId: 'course-uuid' },
    };

    it('should sanitize video lesson responses', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(videoLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);

      const result = await service.getLessonById(lessonId, studentUser);

      expect(result).toEqual(expect.objectContaining({
        id: lessonId,
        title: 'Video Lesson',
        videoProvider: VideoProvider.YOUTUBE,
        providerVideoId: 'youtube123',
        hasPlayback: true,
      }));
      expect(result.providerVideoUrl).toBeUndefined(); // Should be removed
    });

    it('should generate playback token for enrolled student', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(videoLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'playback-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId, studentUser);

      expect(result).toEqual(expect.objectContaining({
        lessonId,
        provider: VideoProvider.YOUTUBE,
        playbackType: 'EMBED',
        expiresAt: expect.any(String),
        resolvedPlayback: expect.objectContaining({
          type: 'EMBED',
          providerVideoId: 'youtube123',
          embedUrl: 'https://youtube.com/embed/youtube123',
        }),
      }));
    });

    it('should allow public playback for preview lessons', async () => {
      const previewLesson = {
        ...videoLesson,
        isPreview: true,
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(previewLesson as any);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'preview-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId);

      expect(result).toEqual(expect.objectContaining({
        lessonId,
        provider: VideoProvider.YOUTUBE,
        playbackType: 'EMBED',
      }));
      expect(mockPlaybackTokenService.generatePlaybackToken).toHaveBeenCalledWith(
        lessonId,
        VideoProvider.YOUTUBE,
        undefined,
        true, // isPreview
      );
    });

    it('should deny playback for non-enrolled students', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(videoLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(false);

      await expect(service.generatePlaybackToken(lessonId, studentUser)).rejects.toThrow(ForbiddenException);
    });

    it('should deny playback for non-video lessons', async () => {
      const textLesson = {
        ...videoLesson,
        type: LessonType.TEXT,
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(textLesson as any);

      await expect(service.generatePlaybackToken(lessonId, studentUser)).rejects.toThrow('Playback is only available for VIDEO lessons');
    });

    it('should validate video lesson creation', async () => {
      const section = { id: 'section-uuid', courseId: 'course-uuid' };
      const invalidVideoLesson: CreateLessonDto = {
        title: 'Invalid Video Lesson',
        type: LessonType.VIDEO,
        order: 1,
        videoProvider: undefined, // Missing required field
        content: 'Some content', // Add content to pass basic validation
      };

      mockPrisma.section.findUnique.mockResolvedValue(section as any);
      mockCourseClient.getCourseById.mockResolvedValue({ id: 'course-uuid', teacherId: 'teacher-uuid' });

      await expect(service.createLesson('section-uuid', invalidVideoLesson, teacherUser)).rejects.toThrow('VIDEO lessons must specify videoProvider');
    });

    it('should validate view limit policy rules', async () => {
      const section = { id: 'section-uuid', courseId: 'course-uuid' };
      const invalidVideoLesson: CreateLessonDto = {
        title: 'Invalid View Policy Lesson',
        type: LessonType.VIDEO,
        order: 1,
        videoProvider: VideoProvider.YOUTUBE,
        providerVideoId: 'test123',
        content: 'Some content',
        viewLimitEnabled: true,
        allowUnlimitedViews: true,
        maxViews: 5, // Should not be allowed when unlimited views is true
      };

      mockPrisma.section.findUnique.mockResolvedValue(section as any);
      mockCourseClient.getCourseById.mockResolvedValue({ id: 'course-uuid', teacherId: 'teacher-uuid' });

      await expect(service.createLesson('section-uuid', invalidVideoLesson, teacherUser)).rejects.toThrow('maxViews must be null when allowUnlimitedViews is true');
    });
  });

  describe('View Limit Policy', () => {
    const lessonId = 'video-lesson-uuid';
    const studentUser: CurrentUser = {
      sub: 'student-uuid',
      email: 'student@test.com',
      role: 'STUDENT',
    };

    const videoLessonWithLimit = {
      id: lessonId,
      title: 'Video Lesson with Limit',
      type: LessonType.VIDEO,
      videoProvider: VideoProvider.YOUTUBE,
      providerVideoId: 'youtube123',
      providerVideoUrl: 'https://youtube.com/watch?v=youtube123',
      playbackProtection: PlaybackProtection.BASIC,
      isPreview: false,
      viewLimitEnabled: true,
      maxViews: 3,
      viewCooldownHours: 6,
      countOnlyAfterPlaybackStart: true,
      allowUnlimitedViews: false,
      section: { courseId: 'course-uuid' },
    };

    it('should allow unlimited views when view limit is disabled', async () => {
      const unlimitedLesson = {
        ...videoLessonWithLimit,
        viewLimitEnabled: false,
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(unlimitedLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'playback-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId, studentUser);

      expect(result.viewLimitStatus).toBe('UNLIMITED');
      expect(result.viewsRemaining).toBe(-1);
      expect(result.viewsConsumed).toBe(0);
    });

    it('should allow first view for new user', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(videoLessonWithLimit as any);
      mockPrisma.lessonViewUsage.findUnique.mockResolvedValue(null);
      mockPrisma.lessonViewOverride.findUnique.mockResolvedValue(null);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'playback-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId, studentUser);

      expect(result.viewLimitStatus).toBe('AVAILABLE');
      expect(result.viewsConsumed).toBe(0);
      expect(result.viewsRemaining).toBe(3);
      expect(mockPrisma.lessonViewUsage.upsert).toHaveBeenCalled();
    });

    it('should allow replay within cooldown without consuming view', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const existingUsage = {
        userId: studentUser.sub,
        lessonId,
        viewsConsumed: 1,
        lastCountedViewAt: oneHourAgo,
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(videoLessonWithLimit as any);
      mockPrisma.lessonViewUsage.findUnique.mockResolvedValue(existingUsage as any);
      mockPrisma.lessonViewOverride.findUnique.mockResolvedValue(null);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'playback-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId, studentUser);

      expect(result.viewLimitStatus).toBe('COOLDOWN');
      expect(result.viewsConsumed).toBe(1);
      expect(result.viewsRemaining).toBe(2);
      expect(mockPrisma.lessonViewUsage.upsert).not.toHaveBeenCalled();
    });

    it('should consume new view after cooldown expires', async () => {
      const now = new Date();
      const sevenHoursAgo = new Date(now.getTime() - 7 * 60 * 60 * 1000);

      const existingUsage = {
        userId: studentUser.sub,
        lessonId,
        viewsConsumed: 1,
        lastCountedViewAt: sevenHoursAgo,
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(videoLessonWithLimit as any);
      mockPrisma.lessonViewUsage.findUnique.mockResolvedValue(existingUsage as any);
      mockPrisma.lessonViewOverride.findUnique.mockResolvedValue(null);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'playback-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId, studentUser);

      expect(result.viewLimitStatus).toBe('AVAILABLE');
      expect(result.viewsConsumed).toBe(1);
      expect(result.viewsRemaining).toBe(2);
      expect(mockPrisma.lessonViewUsage.upsert).toHaveBeenCalled();
    });

    it('should deny playback when view limit exceeded', async () => {
      const existingUsage = {
        userId: studentUser.sub,
        lessonId,
        viewsConsumed: 3,
        lastCountedViewAt: new Date(),
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(videoLessonWithLimit as any);
      mockPrisma.lessonViewUsage.findUnique.mockResolvedValue(existingUsage as any);
      mockPrisma.lessonViewOverride.findUnique.mockResolvedValue(null);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);

      await expect(service.generatePlaybackToken(lessonId, studentUser)).rejects.toThrow('VIEW_LIMIT_EXCEEDED');
    });

    it('should apply extra views from override', async () => {
      const now = new Date();
      const sevenHoursAgo = new Date(now.getTime() - 7 * 60 * 60 * 1000);

      const existingUsage = {
        userId: studentUser.sub,
        lessonId,
        viewsConsumed: 3,
        lastCountedViewAt: sevenHoursAgo, // Outside cooldown
      };

      const viewOverride = {
        lessonId,
        studentId: studentUser.sub,
        extraViewsGranted: 2,
        grantedByUserId: 'teacher-uuid',
        grantedByRole: 'TEACHER',
        reason: 'Extra credit',
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(videoLessonWithLimit as any);
      mockPrisma.lessonViewUsage.findUnique.mockResolvedValue(existingUsage as any);
      mockPrisma.lessonViewOverride.findUnique.mockResolvedValue(viewOverride as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'playback-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId, studentUser);

      expect(result.viewLimitStatus).toBe('AVAILABLE');
      expect(result.viewsConsumed).toBe(3);
      expect(result.viewsRemaining).toBe(2); // 3 + 2 - 3 = 2 remaining
    });

    it('should allow unlimited views when allowUnlimitedViews is true', async () => {
      const unlimitedLesson = {
        ...videoLessonWithLimit,
        allowUnlimitedViews: true,
        maxViews: null,
      };

      mockPrisma.lesson.findUnique.mockResolvedValue(unlimitedLesson as any);
      mockEnrollmentClient.hasActiveEnrollment.mockResolvedValue(true);
      mockPlaybackTokenService.generatePlaybackToken.mockReturnValue({
        token: 'playback-token-123',
        expiresAt: new Date(Date.now() + 120000),
      });
      mockPlaybackTokenService.getProviderEmbedInfo.mockReturnValue({
        type: 'EMBED',
        providerVideoId: 'youtube123',
        embedUrl: 'https://youtube.com/embed/youtube123',
      });

      const result = await service.generatePlaybackToken(lessonId, studentUser);

      expect(result.viewLimitStatus).toBe('UNLIMITED');
      expect(result.viewsRemaining).toBe(-1);
    });
  });
});
