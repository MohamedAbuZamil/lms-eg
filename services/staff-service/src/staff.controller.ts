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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles, Role } from './auth/roles.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async createStaff(
    @Body() createStaffDto: CreateStaffDto,
    @CurrentUser('sub') teacherId: string,
  ) {
    return this.staffService.createStaff(createStaffDto, teacherId);
  }

  @Get('teachers/me/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  async getTeacherStaff(@CurrentUser('sub') teacherId: string) {
    return this.staffService.getTeacherStaff(teacherId);
  }

  @Get('staff/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  async getStaffById(
    @Param('id') id: string,
    @CurrentUser('sub') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.staffService.getStaffById(id, currentUserId, currentUserRole);
  }

  @Patch('staff/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  async updateStaff(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser('sub') teacherId: string,
  ) {
    return this.staffService.updateStaff(id, updateStaffDto, teacherId);
  }

  @Delete('staff/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStaff(@Param('id') id: string, @CurrentUser('sub') teacherId: string) {
    return this.staffService.deleteStaff(id, teacherId);
  }

  @Get('assistants/me/teachers')
  @UseGuards(JwtAuthGuard)
  async getAssistantTeachers(@CurrentUser('sub') assistantUserId: string) {
    return this.staffService.getAssistantTeachers(assistantUserId);
  }

  @Get('admin/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllStaff() {
    return this.staffService.getAllStaff();
  }
}
