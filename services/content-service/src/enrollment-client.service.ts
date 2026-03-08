import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface EnrollmentResponse {
  id: string;
  studentId: string;
  courseId: string;
  status: 'ACTIVE' | 'BLOCKED' | 'REMOVED';
  enrolledByUserId: string;
  blockedByUserId?: string;
  removedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  blockedAt?: string;
  removedAt?: string;
}

@Injectable()
export class EnrollmentClientService {
  constructor(private readonly httpService: HttpService) {}

  async hasActiveEnrollment(studentId: string, courseId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<EnrollmentResponse[]> = await firstValueFrom(
        this.httpService.get<EnrollmentResponse[]>(`${process.env.ENROLLMENT_SERVICE_URL}/students/me/enrollments`, {
          headers: {
            // This would need to be called with proper authentication in real implementation
            // For now, we'll make a direct call to check enrollment
          }
        })
      );

      const activeEnrollment = response.data.find(
        enrollment => enrollment.courseId === courseId && enrollment.status === 'ACTIVE'
      );

      return !!activeEnrollment;
    } catch (error: any) {
      // If we can't verify, assume no enrollment
      return false;
    }
  }
}
