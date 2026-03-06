import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateSelfEnrollmentDto } from './dto/create-self-enrollment.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { BlockEnrollmentDto } from './dto/block-enrollment.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles, Role } from './auth/roles.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('enrollments/self')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async createSelfEnrollment(
    @Body() createSelfEnrollmentDto: CreateSelfEnrollmentDto,
    @CurrentUser('sub') studentId: string,
  ) {
    return this.enrollmentService.createSelfEnrollment(createSelfEnrollmentDto, studentId);
  }

  @Post('enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createEnrollment(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.enrollmentService.createEnrollment(createEnrollmentDto, actorId, actorRole);
  }

  @Get('students/me/enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getStudentEnrollments(@CurrentUser('sub') studentId: string) {
    return this.enrollmentService.getStudentEnrollments(studentId);
  }

  @Get('students/me/courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getStudentCourses(@CurrentUser('sub') studentId: string) {
    return this.enrollmentService.getStudentCourses(studentId);
  }

  @Patch('enrollments/:id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async blockEnrollment(
    @Param('id') id: string,
    @Body() blockEnrollmentDto: BlockEnrollmentDto,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.enrollmentService.blockEnrollment(id, blockEnrollmentDto, actorId, actorRole);
  }

  @Delete('enrollments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEnrollment(
    @Param('id') id: string,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.enrollmentService.removeEnrollment(id, actorId, actorRole);
  }
}
