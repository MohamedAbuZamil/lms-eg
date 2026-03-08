import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EnrollmentService {
  private readonly baseUrl: string;

  constructor(private httpService: HttpService) {
    this.baseUrl = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003';
  }

  async enrollStudent(
    studentId: string,
    courseId: string,
    token: string,
  ): Promise<{ success: boolean; enrollmentId?: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ id: string }>(
          `${this.baseUrl}/enrollments`,
          { studentId, courseId },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return { success: true, enrollmentId: response.data.id };
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Already enrolled
        return { success: true };
      }
      throw new HttpException(
        'Failed to enroll student',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkEnrollment(
    studentId: string,
    courseId: string,
    token: string,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ enrolled: boolean }>(
          `${this.baseUrl}/enrollments/check?studentId=${studentId}&courseId=${courseId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return response.data.enrolled;
    } catch {
      return false;
    }
  }
}
