import { Injectable, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface StaffResponse {
  id: string;
  teacherId: string;
  assistantUserId: string;
  canManageCourses: boolean;
  canManageEnrollments: boolean;
  canManageContent: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class StaffClientService {
  constructor(private readonly httpService: HttpService) {}

  async verifyContentManagementPermission(
    assistantUserId: string,
    teacherId: string
  ): Promise<boolean> {
    try {
      const response: AxiosResponse<StaffResponse[]> = await firstValueFrom(
        this.httpService.get<StaffResponse[]>(`${process.env.STAFF_SERVICE_URL}/teachers/me/staff`, {
          headers: {
            // This would need to be called with proper authentication in real implementation
            // For now, we'll make a direct call to check staff relationship
          }
        })
      );

      const staffRecord = response.data.find(
        staff => staff.assistantUserId === assistantUserId && staff.teacherId === teacherId
      );

      return staffRecord?.canManageContent === true || staffRecord?.canManageCourses === true;
    } catch (error: any) {
      // If we can't verify, assume no permission
      return false;
    }
  }

  async getStaffByTeacherAndAssistant(
    teacherId: string,
    assistantUserId: string
  ): Promise<StaffResponse | null> {
    try {
      // This is a simplified approach - in production, you'd have proper authentication
      // For now, we'll create a method that checks staff relationship
      const response: AxiosResponse<StaffResponse[]> = await firstValueFrom(
        this.httpService.get<StaffResponse[]>(`${process.env.STAFF_SERVICE_URL}/admin/staff`)
      );

      return response.data.find(
        staff => staff.teacherId === teacherId && staff.assistantUserId === assistantUserId
      ) || null;
    } catch (error: any) {
      return null;
    }
  }
}
