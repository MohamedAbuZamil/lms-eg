import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { UpdateVideoProgressDto } from './dto/update-video-progress.dto';
import { CourseProgressFilterDto } from './dto/pagination.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // Health Check
  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'progress-service' };
  }

  // Student Progress Endpoints
  @Post('lessons/:lessonId/open')
  @HttpCode(HttpStatus.OK)
  async openLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.openLesson(lessonId, user);
  }

  @Patch('lessons/:lessonId/video')
  @HttpCode(HttpStatus.OK)
  async updateVideoProgress(
    @Param('lessonId') lessonId: string,
    @Body() updateVideoProgressDto: UpdateVideoProgressDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.updateVideoProgress(lessonId, updateVideoProgressDto, user);
  }

  @Post('lessons/:lessonId/complete')
  @HttpCode(HttpStatus.OK)
  async completeLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.completeLesson(lessonId, user);
  }

  @Get('lessons/:lessonId/me')
  async getMyLessonProgress(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.getMyLessonProgress(lessonId, user);
  }

  @Get('courses/:courseId/me')
  async getMyCourseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.getMyCourseProgress(courseId, user);
  }

  @Get('courses/:courseId/me/lessons')
  async listMyCourseLessonProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.listMyCourseLessonProgress(courseId, user);
  }

  // Teacher/Admin Progress Endpoints
  @Get('courses/:courseId/summary')
  async getCourseSummary(
    @Param('courseId') courseId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.getCourseSummary(courseId, user);
  }

  @Get('courses/:courseId/students/:studentId')
  async getStudentCourseProgress(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.getStudentCourseProgress(courseId, studentId, user);
  }

  @Get('courses/:courseId/students')
  async listCourseStudentsProgress(
    @Param('courseId') courseId: string,
    @Query() filter: CourseProgressFilterDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.listCourseStudentsProgress(courseId, filter, user);
  }

  // Admin Only Endpoint
  @Post('admin/reset')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async resetProgress(
    @Body() resetProgressDto: ResetProgressDto,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.progressService.resetProgress(resetProgressDto, user);
  }
}
