import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CourseClientService } from './course-client.service';
import { StaffClientService } from './staff-client.service';
import { EnrollmentClientService } from './enrollment-client.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PlaybackResponseDto, PlaybackType } from './dto/playback-response.dto';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { LessonType, VideoProvider, PlaybackProtection } from '@prisma/client';
import { PlaybackTokenService } from './playback-token.service';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly courseClient: CourseClientService,
    private readonly staffClient: StaffClientService,
    private readonly enrollmentClient: EnrollmentClientService,
    private readonly playbackTokenService: PlaybackTokenService,
  ) {}

  async verifyContentManagementAccess(
    courseId: string,
    user: CurrentUser,
  ): Promise<void> {
    // Get course to verify it exists and get teacherId
    const course = await this.courseClient.getCourseById(courseId);

    // If user is TEACHER, they must be the course owner
    if (user.role === 'TEACHER') {
      if (course.teacherId !== user.sub) {
        throw new ForbiddenException('Only course owner can manage content');
      }
      return;
    }

    // If user is ADMIN, they can manage any content
    if (user.role === 'ADMIN') {
      return;
    }

    // If user is not TEACHER or ADMIN, check if they are authorized assistant
    const hasPermission = await this.staffClient.verifyContentManagementPermission(
      user.sub,
      course.teacherId,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to manage content');
    }
  }

  async verifyContentAccess(
    courseId: string,
    user?: CurrentUser,
  ): Promise<void> {
    // If no user, only allow preview content (handled in controller)
    if (!user) {
      return;
    }

    // TEACHER and ADMIN can access any content
    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      return;
    }

    // STUDENT must have ACTIVE enrollment
    if (user.role === 'STUDENT') {
      const hasActiveEnrollment = await this.enrollmentClient.hasActiveEnrollment(
        user.sub,
        courseId,
      );

      if (!hasActiveEnrollment) {
        throw new ForbiddenException('Active enrollment required to access content');
      }
      return;
    }

    throw new ForbiddenException('Invalid user role');
  }

  // Section Management
  async createSection(courseId: string, createSectionDto: CreateSectionDto, user: CurrentUser) {
    await this.verifyContentManagementAccess(courseId, user);

    try {
      return await this.prisma.section.create({
        data: {
          courseId,
          ...createSectionDto,
        },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Section order must be unique within course');
      }
      throw error;
    }
  }

  async updateSection(sectionId: string, updateSectionDto: UpdateSectionDto, user: CurrentUser) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyContentManagementAccess(section.courseId, user);

    try {
      return await this.prisma.section.update({
        where: { id: sectionId },
        data: updateSectionDto,
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Section order must be unique within course');
      }
      throw error;
    }
  }

  async deleteSection(sectionId: string, user: CurrentUser) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyContentManagementAccess(section.courseId, user);

    await this.prisma.section.delete({
      where: { id: sectionId },
    });
  }

  // Lesson Management
  async createLesson(sectionId: string, createLessonDto: CreateLessonDto, user: CurrentUser) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.verifyContentManagementAccess(section.courseId, user);

    // Validate lesson type and content/url consistency
    this.validateLessonContent(createLessonDto.type, createLessonDto.content, createLessonDto.url);
    
    // Validate video-specific fields for VIDEO lessons
    if (createLessonDto.type === LessonType.VIDEO) {
      this.validateVideoLessonFields(createLessonDto);
    }

    try {
      return await this.prisma.lesson.create({
        data: {
          sectionId,
          ...createLessonDto,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Lesson order must be unique within section');
      }
      throw error;
    }
  }

  async updateLesson(lessonId: string, updateLessonDto: UpdateLessonDto, user: CurrentUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.verifyContentManagementAccess(lesson.section.courseId, user);

    // Validate lesson type and content/url consistency if type is being updated
    if (updateLessonDto.type) {
      this.validateLessonContent(
        updateLessonDto.type,
        updateLessonDto.content ?? lesson.content,
        updateLessonDto.url ?? lesson.url,
      );
    }
    
    // Validate video-specific fields if type is VIDEO or updating video fields
    if (updateLessonDto.type === LessonType.VIDEO || 
        updateLessonDto.videoProvider || 
        updateLessonDto.providerVideoId || 
        updateLessonDto.providerVideoUrl) {
      this.validateVideoLessonFields({
        ...lesson,
        ...updateLessonDto,
      } as CreateLessonDto);
    }

    try {
      return await this.prisma.lesson.update({
        where: { id: lessonId },
        data: updateLessonDto,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Lesson order must be unique within section');
      }
      throw error;
    }
  }

  async deleteLesson(lessonId: string, user: CurrentUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.verifyContentManagementAccess(lesson.section.courseId, user);

    await this.prisma.lesson.delete({
      where: { id: lessonId },
    });
  }

  // Content Access
  async getCourseContent(courseId: string, user?: CurrentUser) {
    // Verify course exists
    await this.courseClient.getCourseById(courseId);

    const sections = await this.prisma.section.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Filter content based on access permissions and sanitize responses
    const filteredSections = sections.map(section => ({
      ...section,
      lessons: section.lessons.map(lesson => this.sanitizeLessonResponse(lesson)),
    }));

    return {
      courseId,
      sections: filteredSections,
    };
  }

  async getLessonById(lessonId: string, user?: CurrentUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Always allow preview lessons
    if (lesson.isPreview) {
      return this.sanitizeLessonResponse(lesson);
    }

    // If no user, deny access to non-preview lessons
    if (!user) {
      throw new ForbiddenException('Authentication required for non-preview content');
    }

    // TEACHER and ADMIN can access any lesson
    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      return this.sanitizeLessonResponse(lesson);
    }

    // For STUDENT, verify active enrollment
    if (user.role === 'STUDENT') {
      const hasActiveEnrollment = await this.enrollmentClient.hasActiveEnrollment(
        user.sub,
        lesson.section.courseId,
      );

      if (!hasActiveEnrollment) {
        throw new ForbiddenException('Active enrollment required to access lesson');
      }

      return this.sanitizeLessonResponse(lesson);
    }

    throw new ForbiddenException('Invalid user role');
  }

  private validateLessonContent(type: LessonType, content?: string, url?: string) {
    switch (type) {
      case 'TEXT':
        if (!content && !url) {
          throw new BadRequestException('TEXT lessons must have content or url');
        }
        break;
      case 'VIDEO':
      case 'PDF':
      case 'FILE':
        if (!url && !content) {
          throw new BadRequestException(`${type} lessons must have url or content`);
        }
        break;
    }
  }

  private validateVideoLessonFields(lessonDto: CreateLessonDto) {
    if (lessonDto.type === LessonType.VIDEO) {
      if (!lessonDto.videoProvider) {
        throw new BadRequestException('VIDEO lessons must specify videoProvider');
      }
      
      if (!lessonDto.providerVideoId && !lessonDto.providerVideoUrl) {
        throw new BadRequestException('VIDEO lessons must specify either providerVideoId or providerVideoUrl');
      }

      // Validate view limit policy
      this.validateViewLimitPolicy(lessonDto);
    }
  }

  private validateViewLimitPolicy(lessonDto: CreateLessonDto) {
    if (lessonDto.viewLimitEnabled) {
      // If unlimited views allowed, maxViews must be null
      if (lessonDto.allowUnlimitedViews && lessonDto.maxViews) {
        throw new BadRequestException('maxViews must be null when allowUnlimitedViews is true');
      }

      // If view limit enabled and not unlimited, maxViews is required
      if (!lessonDto.allowUnlimitedViews && !lessonDto.maxViews) {
        throw new BadRequestException('maxViews is required when viewLimitEnabled is true and allowUnlimitedViews is false');
      }

      // Cooldown must be at least 1 hour
      if (lessonDto.viewCooldownHours && lessonDto.viewCooldownHours < 1) {
        throw new BadRequestException('viewCooldownHours must be at least 1 hour');
      }
    }
  }

  private sanitizeLessonResponse(lesson: any) {
    // Remove sensitive video URLs from standard responses
    const { providerVideoUrl, ...sanitizedLesson } = lesson;
    
    // Add a flag to indicate if playback is available
    return {
      ...sanitizedLesson,
      hasPlayback: lesson.type === LessonType.VIDEO && !!lesson.videoProvider,
    };
  }

  // View Limit Policy Methods
  private async checkViewLimitPolicy(
    lesson: any, 
    user?: CurrentUser
  ): Promise<{
    canPlay: boolean;
    viewsConsumed: number;
    viewsRemaining: number;
    status: 'UNLIMITED' | 'AVAILABLE' | 'EXCEEDED' | 'COOLDOWN';
    shouldIncrementView: boolean;
  }> {
    // If view limit is not enabled, allow unlimited access
    if (!lesson.viewLimitEnabled || lesson.allowUnlimitedViews) {
      return {
        canPlay: true,
        viewsConsumed: 0,
        viewsRemaining: -1,
        status: 'UNLIMITED',
        shouldIncrementView: false,
      };
    }

    // If no user, deny access for non-preview content
    if (!user) {
      return {
        canPlay: false,
        viewsConsumed: 0,
        viewsRemaining: 0,
        status: 'EXCEEDED',
        shouldIncrementView: false,
      };
    }

    // Get user's view usage for this lesson
    const viewUsage = await this.prisma.lessonViewUsage.findUnique({
      where: {
        userId_lessonId: {
          userId: user.sub,
          lessonId: lesson.id,
        },
      },
    });

    // Get any extra views granted to this user
    const viewOverride = await this.prisma.lessonViewOverride.findUnique({
      where: {
        lessonId_studentId: {
          lessonId: lesson.id,
          studentId: user.sub,
        },
      },
    });

    const viewsConsumed = viewUsage?.viewsConsumed || 0;
    const extraViews = viewOverride?.extraViewsGranted || 0;
    const effectiveMaxViews = (lesson.maxViews || 0) + extraViews;
    const viewsRemaining = Math.max(0, effectiveMaxViews - viewsConsumed);

    // Check if user is within cooldown window
    const cooldownHours = lesson.viewCooldownHours || 6;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const now = new Date();
    const lastCountedViewAt = viewUsage?.lastCountedViewAt || new Date(0);
    const isInCooldown = now.getTime() - lastCountedViewAt.getTime() < cooldownMs;

    // Determine if user can play
    let canPlay = true;
    let status: 'UNLIMITED' | 'AVAILABLE' | 'EXCEEDED' | 'COOLDOWN' = 'AVAILABLE';
    let shouldIncrementView = false;

    if (viewsRemaining <= 0) {
      // No views remaining - deny access regardless of cooldown
      canPlay = false;
      status = 'EXCEEDED';
      shouldIncrementView = false;
    } else if (isInCooldown) {
      // Within cooldown - allow play without incrementing
      status = 'COOLDOWN';
      shouldIncrementView = false;
    } else {
      // Can play and should increment view
      status = 'AVAILABLE';
      shouldIncrementView = true;
    }

    return {
      canPlay,
      viewsConsumed,
      viewsRemaining,
      status,
      shouldIncrementView,
    };
  }

  private async incrementViewUsage(lessonId: string, userId: string): Promise<void> {
    await this.prisma.lessonViewUsage.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        viewsConsumed: {
          increment: 1,
        },
        lastCountedViewAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        viewsConsumed: 1,
        lastCountedViewAt: new Date(),
      },
    });

    this.logger.log(`View usage incremented for user ${userId} on lesson ${lessonId}`);
  }

  // Secure Playback Methods
  async generatePlaybackToken(lessonId: string, user?: CurrentUser): Promise<PlaybackResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.type !== LessonType.VIDEO) {
      throw new BadRequestException('Playback is only available for VIDEO lessons');
    }

    // Check access permissions
    const isPreview = lesson.isPreview;
    
    if (!isPreview) {
      if (!user) {
        throw new ForbiddenException('Authentication required for non-preview content');
      }

      // TEACHER and ADMIN can access any lesson
      if (user.role === 'TEACHER' || user.role === 'ADMIN') {
        // Access granted
      }
      // For STUDENT, verify active enrollment
      else if (user.role === 'STUDENT') {
        const hasActiveEnrollment = await this.enrollmentClient.hasActiveEnrollment(
          user.sub,
          lesson.section.courseId,
        );

        if (!hasActiveEnrollment) {
          throw new ForbiddenException('Active enrollment required to access lesson');
        }
      }
      // For assistants, verify permissions
      else {
        const hasPermission = await this.staffClient.verifyContentManagementPermission(
          user.sub,
          lesson.section.courseId,
        );

        if (!hasPermission) {
          throw new ForbiddenException('Insufficient permissions to access lesson');
        }
      }
    }

    // Check view limit policy
    const viewPolicy = await this.checkViewLimitPolicy(lesson, user);
    
    if (!viewPolicy.canPlay) {
      if (viewPolicy.status === 'EXCEEDED') {
        throw new ForbiddenException('VIEW_LIMIT_EXCEEDED');
      }
      throw new ForbiddenException('Access denied');
    }

    // Increment view usage if needed
    if (viewPolicy.shouldIncrementView && user) {
      await this.incrementViewUsage(lessonId, user.sub);
    }

    // Generate playback token
    const tokenData = this.playbackTokenService.generatePlaybackToken(
      lessonId,
      lesson.videoProvider!,
      user?.sub,
      isPreview,
    );

    const expiresAt = tokenData.expiresAt;

    // Get provider embed info
    const embedInfo = this.playbackTokenService.getProviderEmbedInfo(
      lesson.videoProvider!,
      lesson.providerVideoId,
      lesson.providerVideoUrl,
    );

    // Determine playback type based on protection level
    let playbackType: PlaybackType;
    let embedUrl: string | undefined;
    let resolvedPlayback: any;

    switch (lesson.playbackProtection) {
      case PlaybackProtection.TOKENIZED:
        playbackType = PlaybackType.EMBED;
        embedUrl = this.playbackTokenService.generateEmbedUrl(tokenData.token);
        break;
      
      case PlaybackProtection.SIGNED:
        playbackType = PlaybackType.SIGNED;
        resolvedPlayback = {
          type: PlaybackType.SIGNED,
          providerVideoId: lesson.providerVideoId,
          directUrl: lesson.providerVideoUrl,
        };
        break;
      
      case PlaybackProtection.EMBED_ONLY:
        playbackType = PlaybackType.EMBED;
        resolvedPlayback = {
          type: PlaybackType.EMBED,
          providerVideoId: lesson.providerVideoId,
          embedUrl: embedInfo.embedUrl,
        };
        break;
      
      default: // BASIC
        playbackType = embedInfo.type === 'EMBED' ? PlaybackType.EMBED : PlaybackType.DIRECT;
        resolvedPlayback = embedInfo;
        break;
    }

    return {
      lessonId,
      provider: lesson.videoProvider!,
      playbackType,
      playbackToken: lesson.playbackProtection === PlaybackProtection.TOKENIZED ? tokenData.token : undefined,
      expiresAt: expiresAt.toISOString(),
      embedUrl,
      resolvedPlayback,
      // View limit information
      viewsConsumed: viewPolicy.viewsConsumed,
      viewsRemaining: viewPolicy.viewsRemaining,
      viewLimitStatus: viewPolicy.status,
    };
  }

  async resolvePlaybackToken(token: string): Promise<any> {
    const payload = this.playbackTokenService.validatePlaybackToken(token);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: payload.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Get provider embed info
    const embedInfo = this.playbackTokenService.getProviderEmbedInfo(
      payload.provider,
      lesson.providerVideoId,
      lesson.providerVideoUrl,
    );

    // Log playback access
    this.logger.log(`Playback accessed: lesson=${payload.lessonId}, user=${payload.userId || 'anonymous'}, preview=${payload.isPreview}`);

    return {
      lessonId: payload.lessonId,
      provider: payload.provider,
      isPreview: payload.isPreview,
      expiresAt: new Date(payload.expiresAt * 1000).toISOString(),
      playback: embedInfo,
    };
  }
}
