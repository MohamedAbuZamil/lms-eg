import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles, Role } from './auth/roles.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { EnrollmentClientService } from './enrollment-client.service';

@Controller()
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly enrollmentClient: EnrollmentClientService,
  ) {}

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  // Section Management
  @Post('courses/:courseId/sections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createSection(
    @Param('courseId') courseId: string,
    @Body() createSectionDto: CreateSectionDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.contentService.createSection(courseId, createSectionDto, user);
  }

  @Get('courses/:courseId/content')
  async getCourseContent(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: CurrentUser,
  ) {
    const content = await this.contentService.getCourseContent(courseId, user);

    // If user is STUDENT, filter out non-preview lessons for non-enrolled courses
    if (user?.role === 'STUDENT') {
      const hasActiveEnrollment = await this.enrollmentClient.hasActiveEnrollment(
        user.sub,
        courseId,
      );

      if (!hasActiveEnrollment) {
        // Only show preview lessons
        content.sections = content.sections.map(section => ({
          ...section,
          lessons: section.lessons.filter(lesson => lesson.isPreview),
        }));
      }
    }

    // If no user, only show preview lessons
    if (!user) {
      content.sections = content.sections.map(section => ({
        ...section,
        lessons: section.lessons.filter(lesson => lesson.isPreview),
      }));
    }

    return content;
  }

  @Patch('sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async updateSection(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.contentService.updateSection(id, updateSectionDto, user);
  }

  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    await this.contentService.deleteSection(id, user);
  }

  // Lesson Management
  @Post('sections/:sectionId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createLesson(
    @Param('sectionId') sectionId: string,
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.contentService.createLesson(sectionId, createLessonDto, user);
  }

  @Get('lessons/:id')
  async getLessonById(@Param('id') id: string, @CurrentUser() user?: CurrentUser) {
    return this.contentService.getLessonById(id, user);
  }

  @Patch('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async updateLesson(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.contentService.updateLesson(id, updateLessonDto, user);
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLesson(@Param('id') id: string, @CurrentUser() user: CurrentUser) {
    await this.contentService.deleteLesson(id, user);
  }

  // Secure Playback Endpoints
  @Get('lessons/:id/playback')
  async getPlaybackToken(@Param('id') id: string, @CurrentUser() user?: CurrentUser) {
    return this.contentService.generatePlaybackToken(id, user);
  }

  @Get('playback/resolve')
  async resolvePlaybackToken(@Query('token') token: string) {
    return this.contentService.resolvePlaybackToken(token);
  }
}
