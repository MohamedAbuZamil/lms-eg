import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
}

@Injectable()
export class EnrollmentClient {
  private readonly logger = new Logger(EnrollmentClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';
  }

  async hasActiveEnrollment(studentId: string, courseId: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/enrollments/check`, {
          params: { studentId, courseId, status: 'ACTIVE' }
        })
      );
      return response.data?.isEnrolled === true;
    } catch (error) {
      this.handleError(error, `Failed to check enrollment for student ${studentId} in course ${courseId}`);
      return false;
    }
  }

  async getEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/enrollments/student/${studentId}/course/${courseId}`)
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch enrollment`);
      return null;
    }
  }

  async getCourseEnrollments(courseId: string, status?: string): Promise<Enrollment[]> {
    try {
      const params: any = {};
      if (status) params.status = status;
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/courses/${courseId}/enrollments`, { params })
      );
      return response.data?.enrollments || [];
    } catch (error) {
      this.handleError(error, `Failed to fetch enrollments for course ${courseId}`);
      return [];
    }
  }

  private handleError(error: AxiosError, message: string): void {
    if (error.response) {
      this.logger.error(
        `${message}: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    } else {
      this.logger.error(`${message}: ${error.message}`);
    }
  }
}
