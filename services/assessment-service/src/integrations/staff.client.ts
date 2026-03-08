import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface StaffPermission {
  hasPermission: boolean;
  role: string;
  permissions: string[];
}

@Injectable()
export class StaffClient {
  private readonly logger = new Logger(StaffClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3004';
  }

  async validateAssistantPermission(
    assistantId: string, 
    courseId: string, 
    permission: string
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/staff/permissions/check`, {
          params: { 
            assistantId, 
            courseId, 
            permission 
          }
        })
      );
      return response.data?.hasPermission === true;
    } catch (error) {
      this.handleError(error, `Failed to validate assistant permission`);
      return false;
    }
  }

  async getStaffPermissions(staffId: string, courseId: string): Promise<StaffPermission | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/staff/${staffId}/courses/${courseId}/permissions`)
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch staff permissions`);
      return null;
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
