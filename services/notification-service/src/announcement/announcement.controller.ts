import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { 
  CreateSystemAnnouncementDto,
  CreateCourseAnnouncementDto,
  SystemAnnouncementResponseDto,
} from '../dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create system announcement (Admin/Teacher only)' })
  @ApiResponse({ status: 201, type: SystemAnnouncementResponseDto })
  async createSystemAnnouncement(
    @Body() dto: CreateSystemAnnouncementDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: string,
  ): Promise<SystemAnnouncementResponseDto> {
    return this.announcementService.createSystemAnnouncement(dto, userId, userRole);
  }

  @Get()
  @ApiOperation({ summary: 'Get all announcements' })
  @ApiResponse({ status: 200, type: [SystemAnnouncementResponseDto] })
  async getAnnouncements(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ items: SystemAnnouncementResponseDto[]; total: number }> {
    return this.announcementService.getAnnouncements(page, limit);
  }

  @Post('courses/:courseId')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Send announcement to course students' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Announcement queued for processing' })
  async createCourseAnnouncement(
    @Param('courseId') courseId: string,
    @Body() dto: CreateCourseAnnouncementDto,
    @CurrentUser('sub') teacherId: string,
    @CurrentUser('role') userRole: string,
  ): Promise<{ success: boolean; jobId: string; message: string }> {
    const jobId = await this.announcementService.createCourseAnnouncement(
      courseId,
      dto,
      teacherId,
      userRole,
    );

    return {
      success: true,
      jobId,
      message: 'Announcement is being processed and sent to all enrolled students',
    };
  }

  @Get(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get announcement processing status' })
  @ApiParam({ name: 'id', description: 'Announcement ID or Job ID' })
  async getAnnouncementStatus(
    @Param('id') id: string,
  ): Promise<{
    status: string;
    totalCount: number;
    processedCount: number;
    failedCount: number;
    progress: number;
  }> {
    return this.announcementService.getJobStatus(id);
  }
}
