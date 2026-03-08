import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EnrollmentClient {
  private readonly logger = new Logger(EnrollmentClient.name);

  constructor(private readonly httpService: HttpService) {}

  async hasActiveEnrollment(studentId: string, courseId: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${process.env.ENROLLMENT_SERVICE_URL}/enrollments/check`,
          {
            params: {
              studentId,
              courseId,
            },
          },
        ),
      );
      return response.data.hasActiveEnrollment === true;
    } catch (error) {
      this.logger.error(
        `Failed to check enrollment for student ${studentId} in course ${courseId}:`,
        error.response?.data || error.message,
      );
      return false;
    }
  }

  async getActiveEnrollmentCount(courseId: string): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${process.env.ENROLLMENT_SERVICE_URL}/enrollments/course/${courseId}/active-count`,
        ),
      );
      return response.data.count || 0;
    } catch (error) {
      this.logger.error(
        `Failed to get active enrollment count for course ${courseId}:`,
        error.response?.data || error.message,
      );
      return 0;
    }
  }
}
