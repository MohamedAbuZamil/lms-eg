import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ContentClient, LessonInfo, CourseStructure } from './integrations/content.client';
import { EnrollmentClient } from './integrations/enrollment.client';
import { CourseClient } from './integrations/course.client';
import { StaffClient } from './integrations/staff.client';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';
import { CourseProgressFilterDto } from './dto/pagination.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { LessonStatus, CourseStatus, ActivityType } from '@prisma/client';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentClient: ContentClient,
    private readonly enrollmentClient: EnrollmentClient,
    private readonly courseClient: CourseClient,
    private readonly staffClient: StaffClient,
  ) {}

  // Student Progress Methods
  async openLesson(lessonId: string, user: CurrentUser) {
    const lesson = await this.contentClient.getLesson(lessonId);
    
    // Validate access
    await this.validateLessonAccess(lesson, user);

    // Create or update lesson progress
    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.sub,
          lessonId,
        },
      },
      update: {
        lastAccessedAt: new Date(),
        status: LessonStatus.IN_PROGRESS,
      },
      create: {
        userId: user.sub,
        courseId: lesson.section.courseId,
        lessonId,
        lessonType: lesson.type,
        status: LessonStatus.IN_PROGRESS,
        lastAccessedAt: new Date(),
      },
    });

    // Update course progress
    await this.recalculateCourseProgress(user.sub, lesson.section.courseId);

    // Log activity
    await this.logActivity(user.sub, lesson.section.courseId, lessonId, ActivityType.LESSON_OPENED);

    this.logger.log(`Lesson ${lessonId} opened by user ${user.sub}`);

    return {
      lessonId,
      status: lessonProgress.status,
      progressPercent: lessonProgress.progressPercent,
      lastPositionSeconds: lessonProgress.lastPositionSeconds || 0,
    };
  }

  async updateVideoProgress(lessonId: string, updateDto: UpdateVideoProgressDto, user: CurrentUser) {
    const lesson = await this.contentClient.getLesson(lessonId);

    // Validate lesson type
    if (lesson.type !== 'VIDEO') {
      throw new BadRequestException('Progress updates are only allowed for VIDEO lessons');
    }

    // Validate access
    await this.validateLessonAccess(lesson, user);

    // Update lesson progress
    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.sub,
          lessonId,
        },
      },
      update: {
        lastPositionSeconds: updateDto.lastPositionSeconds,
        progressPercent: updateDto.progressPercent || 0,
        status: LessonStatus.IN_PROGRESS,
        lastAccessedAt: new Date(),
      },
      create: {
        userId: user.sub,
        courseId: lesson.section.courseId,
        lessonId,
        lessonType: lesson.type,
        lastPositionSeconds: updateDto.lastPositionSeconds,
        progressPercent: updateDto.progressPercent || 0,
        status: LessonStatus.IN_PROGRESS,
        lastAccessedAt: new Date(),
      },
    });

    // Update course progress
    await this.recalculateCourseProgress(user.sub, lesson.section.courseId);

    // Log activity
    await this.logActivity(user.sub, lesson.section.courseId, lessonId, ActivityType.VIDEO_PROGRESS_UPDATED, {
      lastPositionSeconds: updateDto.lastPositionSeconds,
      progressPercent: updateDto.progressPercent || 0,
    });

    this.logger.log(`Video progress updated for lesson ${lessonId} by user ${user.sub}`);

    return {
      lessonId,
      status: lessonProgress.status,
      progressPercent: lessonProgress.progressPercent,
      lastPositionSeconds: lessonProgress.lastPositionSeconds,
    };
  }

  async completeLesson(lessonId: string, user: CurrentUser) {
    const lesson = await this.contentClient.getLesson(lessonId);

    // Validate access
    await this.validateLessonAccess(lesson, user);

    // Mark lesson as completed
    const lessonProgress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.sub,
          lessonId,
        },
      },
      update: {
        status: LessonStatus.COMPLETED,
        progressPercent: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      create: {
        userId: user.sub,
        courseId: lesson.section.courseId,
        lessonId,
        lessonType: lesson.type,
        status: LessonStatus.COMPLETED,
        progressPercent: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    // Update course progress
    await this.recalculateCourseProgress(user.sub, lesson.section.courseId);

    // Log activity
    await this.logActivity(user.sub, lesson.section.courseId, lessonId, ActivityType.LESSON_COMPLETED);

    this.logger.log(`Lesson ${lessonId} completed by user ${user.sub}`);

    return {
      lessonId,
      status: lessonProgress.status,
      progressPercent: lessonProgress.progressPercent,
      completedAt: lessonProgress.completedAt,
    };
  }

  async getMyLessonProgress(lessonId: string, user: CurrentUser) {
    const lesson = await this.contentClient.getLesson(lessonId);

    // Validate access
    await this.validateLessonAccess(lesson, user);

    const lessonProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.sub,
          lessonId,
        },
      },
    });

    if (!lessonProgress) {
      return {
        lessonId,
        status: LessonStatus.NOT_STARTED,
        progressPercent: 0,
        lastPositionSeconds: 0,
      };
    }

    return {
      lessonId,
      status: lessonProgress.status,
      progressPercent: lessonProgress.progressPercent,
      lastPositionSeconds: lessonProgress.lastPositionSeconds || 0,
      completedAt: lessonProgress.completedAt,
      lastAccessedAt: lessonProgress.lastAccessedAt,
    };
  }

  async getMyCourseProgress(courseId: string, user: CurrentUser) {
    // Validate enrollment
    const hasEnrollment = await this.enrollmentClient.hasActiveEnrollment(user.sub, courseId);
    if (!hasEnrollment && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Active enrollment required to view course progress');
    }

    const courseProgress = await this.prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: user.sub,
          courseId,
        },
      },
    });

    if (!courseProgress) {
      return {
        courseId,
        status: CourseStatus.NOT_STARTED,
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: 0,
        lastActivityAt: null,
      };
    }

    return {
      courseId,
      status: courseProgress.status,
      progressPercent: courseProgress.progressPercent,
      completedLessons: courseProgress.completedLessons,
      totalLessons: courseProgress.totalLessons,
      lastActivityAt: courseProgress.lastActivityAt,
      startedAt: courseProgress.startedAt,
      completedAt: courseProgress.completedAt,
    };
  }

  async listMyCourseLessonProgress(courseId: string, user: CurrentUser) {
    // Validate enrollment
    const hasEnrollment = await this.enrollmentClient.hasActiveEnrollment(user.sub, courseId);
    if (!hasEnrollment && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Active enrollment required to view course progress');
    }

    const courseStructure = await this.contentClient.getCourseStructure(courseId);
    const lessonProgresses = await this.prisma.lessonProgress.findMany({
      where: {
        userId: user.sub,
        courseId,
      },
    });

    const lessonsWithProgress = courseStructure.lessons.map(lesson => {
      const progress = lessonProgresses.find(p => p.lessonId === lesson.id);
      return {
        lessonId: lesson.id,
        title: lesson.title,
        type: lesson.type,
        order: lesson.order,
        isPreview: lesson.isPreview,
        status: progress?.status || LessonStatus.NOT_STARTED,
        progressPercent: progress?.progressPercent || 0,
        lastPositionSeconds: progress?.lastPositionSeconds || 0,
        completedAt: progress?.completedAt,
        lastAccessedAt: progress?.lastAccessedAt,
      };
    });

    return {
      courseId,
      lessons: lessonsWithProgress,
    };
  }

  // Teacher/Admin Progress Methods
  async getCourseSummary(courseId: string, user: CurrentUser) {
    // Validate access
    await this.validateCourseAccess(courseId, user);

    const courseStructure = await this.contentClient.getCourseStructure(courseId);
    const activeEnrollmentCount = await this.enrollmentClient.getActiveEnrollmentCount(courseId);

    const [courseProgresses, completedCount] = await Promise.all([
      this.prisma.courseProgress.findMany({
        where: { courseId },
      }),
      this.prisma.courseProgress.count({
        where: {
          courseId,
          status: CourseStatus.COMPLETED,
        },
      }),
    ]);

    const averageProgress = courseProgresses.length > 0
      ? Math.round(courseProgresses.reduce((sum, p) => sum + p.progressPercent, 0) / courseProgresses.length)
      : 0;

    return {
      courseId,
      studentsCount: activeEnrollmentCount,
      activeStudentsCount: courseProgresses.length,
      completedStudentsCount: completedCount,
      averageProgressPercent: averageProgress,
      totalLessons: courseStructure.totalLessons,
    };
  }

  async getStudentCourseProgress(courseId: string, studentId: string, user: CurrentUser) {
    // Validate access
    await this.validateCourseAccess(courseId, user);

    const courseProgress = await this.prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId,
        },
      },
    });

    const lessonProgresses = await this.prisma.lessonProgress.findMany({
      where: {
        userId: studentId,
        courseId,
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });

    return {
      courseId,
      studentId,
      courseProgress,
      lessonProgresses,
    };
  }

  async listCourseStudentsProgress(courseId: string, filter: CourseProgressFilterDto, user: CurrentUser) {
    // Validate access
    await this.validateCourseAccess(courseId, user);

    const where: any = { courseId };

    if (filter.status) {
      where.status = filter.status;
    }

    const [courseProgresses, total] = await Promise.all([
      this.prisma.courseProgress.findMany({
        where,
        orderBy: { lastActivityAt: 'desc' },
        skip: filter.offset,
        take: filter.limit,
      }),
      this.prisma.courseProgress.count({ where }),
    ]);

    return {
      courseId,
      students: courseProgresses,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async resetProgress(resetDto: ResetProgressDto, user: CurrentUser) {
    if (resetDto.scope === 'LESSON') {
      if (!resetDto.lessonId) {
        throw new BadRequestException('Lesson ID is required for lesson reset');
      }

      const deleted = await this.prisma.lessonProgress.deleteMany({
        where: {
          userId: resetDto.studentId,
          lessonId: resetDto.lessonId,
        },
      });

      // Log activity
      await this.logActivity(
        resetDto.studentId,
        resetDto.courseId || '',
        resetDto.lessonId,
        ActivityType.PROGRESS_RESET,
        { reason: resetDto.reason, scope: 'LESSON' },
      );

      this.logger.log(`Lesson progress reset for student ${resetDto.studentId}, lesson ${resetDto.lessonId}`);

      return { deletedCount: deleted.count };
    } else if (resetDto.scope === 'COURSE') {
      if (!resetDto.courseId) {
        throw new BadRequestException('Course ID is required for course reset');
      }

      const [deletedLessonProgress, deletedCourseProgress] = await Promise.all([
        this.prisma.lessonProgress.deleteMany({
          where: {
            userId: resetDto.studentId,
            courseId: resetDto.courseId,
          },
        }),
        this.prisma.courseProgress.deleteMany({
          where: {
            userId: resetDto.studentId,
            courseId: resetDto.courseId,
          },
        }),
      ]);

      // Log activity
      await this.logActivity(
        resetDto.studentId,
        resetDto.courseId,
        null,
        ActivityType.PROGRESS_RESET,
        { reason: resetDto.reason, scope: 'COURSE' },
      );

      this.logger.log(`Course progress reset for student ${resetDto.studentId}, course ${resetDto.courseId}`);

      return {
        deletedLessonProgressCount: deletedLessonProgress.count,
        deletedCourseProgressCount: deletedCourseProgress.count,
      };
    } else {
      throw new BadRequestException('Invalid reset scope');
    }
  }

  // Private Helper Methods
  private async validateLessonAccess(lesson: LessonInfo, user: CurrentUser) {
    // Students need active enrollment unless it's a preview lesson
    if (user.role === 'STUDENT') {
      if (!lesson.isPreview) {
        const hasEnrollment = await this.enrollmentClient.hasActiveEnrollment(user.sub, lesson.section.courseId);
        if (!hasEnrollment) {
          throw new ForbiddenException('Active enrollment required to access this lesson');
        }
      }
    }
    // Teachers and assistants can access lessons in their courses
    else if (user.role === 'TEACHER') {
      const ownsCourse = await this.courseClient.validateTeacherOwnership(user.sub, lesson.section.courseId);
      if (!ownsCourse) {
        throw new ForbiddenException('You can only access progress for your own courses');
      }
    }
    else if (user.role === 'ASSISTANT') {
      const hasPermission = await this.staffClient.verifyProgressViewPermission(user.sub, lesson.section.courseId);
      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view progress for this course');
      }
    }
    // Admins have full access
  }

  private async validateCourseAccess(courseId: string, user: CurrentUser) {
    if (user.role === 'TEACHER') {
      const ownsCourse = await this.courseClient.validateTeacherOwnership(user.sub, courseId);
      if (!ownsCourse) {
        throw new ForbiddenException('You can only access progress for your own courses');
      }
    } else if (user.role === 'ASSISTANT') {
      const hasPermission = await this.staffClient.verifyProgressViewPermission(user.sub, courseId);
      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view progress for this course');
      }
    }
    // Students and Admins don't need additional validation for course access
  }

  private async recalculateCourseProgress(userId: string, courseId: string) {
    const courseStructure = await this.contentClient.getCourseStructure(courseId);
    
    // Count completed lessons (excluding preview lessons for completion calculation)
    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId,
        courseId,
        status: LessonStatus.COMPLETED,
      },
    });

    const progressPercent = courseStructure.nonPreviewLessons > 0
      ? Math.round((completedLessons / courseStructure.nonPreviewLessons) * 100)
      : 0;

    const status = progressPercent === 100 ? CourseStatus.COMPLETED : 
                   progressPercent > 0 ? CourseStatus.IN_PROGRESS : CourseStatus.NOT_STARTED;

    const courseProgress = await this.prisma.courseProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        totalLessons: courseStructure.totalLessons,
        completedLessons,
        progressPercent,
        status,
        lastActivityAt: new Date(),
        completedAt: status === CourseStatus.COMPLETED ? new Date() : undefined,
        startedAt: status === CourseStatus.NOT_STARTED ? new Date() : undefined,
      },
      create: {
        userId,
        courseId,
        totalLessons: courseStructure.totalLessons,
        completedLessons,
        progressPercent,
        status,
        lastActivityAt: new Date(),
        startedAt: new Date(),
        completedAt: status === CourseStatus.COMPLETED ? new Date() : undefined,
      },
    });

    // Log course completion if applicable
    if (status === CourseStatus.COMPLETED) {
      await this.logActivity(userId, courseId, null, ActivityType.COURSE_COMPLETED);
    }

    return courseProgress;
  }

  private async logActivity(
    userId: string,
    courseId: string,
    lessonId: string | null,
    activityType: ActivityType,
    metadata?: any,
  ) {
    await this.prisma.learningActivity.create({
      data: {
        userId,
        courseId,
        lessonId,
        activityType,
        metadata,
      },
    });
  }
}
