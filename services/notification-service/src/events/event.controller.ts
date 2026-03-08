import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationService } from '../notification/notification.service';
import { EventNotificationDto } from '../dto/notification.dto';
import { NotificationType } from '@prisma/client';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('course-enrolled')
  @ApiOperation({ summary: 'Handle course enrolled event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleCourseEnrolled(
    @Body() data: { studentId: string; courseId: string; courseTitle: string },
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    this.validateApiKey(apiKey);
    
    await this.notificationService.handleCourseEnrolled(
      data.studentId,
      data.courseId,
      data.courseTitle,
    );

    return { success: true };
  }

  @Post('course-purchased')
  @ApiOperation({ summary: 'Handle course purchased event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleCoursePurchased(
    @Body() data: { studentId: string; courseId: string; courseTitle: string },
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    this.validateApiKey(apiKey);

    await this.notificationService.handleCoursePurchased(
      data.studentId,
      data.courseId,
      data.courseTitle,
    );

    return { success: true };
  }

  @Post('assessment-published')
  @ApiOperation({ summary: 'Handle assessment published event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleAssessmentPublished(
    @Body() data: { studentId: string; assessmentId: string; assessmentTitle: string },
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    this.validateApiKey(apiKey);

    await this.notificationService.handleAssessmentPublished(
      data.studentId,
      data.assessmentId,
      data.assessmentTitle,
    );

    return { success: true };
  }

  @Post('assessment-graded')
  @ApiOperation({ summary: 'Handle assessment graded event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleAssessmentGraded(
    @Body() data: { studentId: string; assessmentId: string; assessmentTitle: string; score: number },
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    this.validateApiKey(apiKey);

    await this.notificationService.handleAssessmentGraded(
      data.studentId,
      data.assessmentId,
      data.assessmentTitle,
      data.score,
    );

    return { success: true };
  }

  @Post('assignment-feedback')
  @ApiOperation({ summary: 'Handle assignment feedback event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleAssignmentFeedback(
    @Body() data: { studentId: string; assignmentId: string; assignmentTitle: string },
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    this.validateApiKey(apiKey);

    await this.notificationService.handleAssignmentFeedback(
      data.studentId,
      data.assignmentId,
      data.assignmentTitle,
    );

    return { success: true };
  }

  @Post('payment-recorded')
  @ApiOperation({ summary: 'Handle payment recorded event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handlePaymentRecorded(
    @Body() data: { studentId: string; paymentId: string; amount: number },
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    this.validateApiKey(apiKey);

    await this.notificationService.handlePaymentRecorded(
      data.studentId,
      data.paymentId,
      data.amount,
    );

    return { success: true };
  }

  @Post('lesson-unlocked')
  @ApiOperation({ summary: 'Handle lesson unlocked event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleLessonUnlocked(
    @Body() data: { studentId: string; courseId: string; lessonId: string; lessonTitle: string },
    @Headers('x-api-key') apiKey: string,
  ): Promise<{ success: boolean }> {
    this.validateApiKey(apiKey);

    await this.notificationService.handleLessonUnlocked(
      data.studentId,
      data.courseId,
      data.lessonId,
      data.lessonTitle,
    );

    return { success: true };
  }

  private validateApiKey(apiKey: string): void {
    // Simple API key validation - in production, use proper secret management
    const validApiKey = process.env.INTERNAL_API_KEY || 'internal-api-key';
    if (apiKey !== validApiKey) {
      throw new Error('Invalid API key');
    }
  }
}
