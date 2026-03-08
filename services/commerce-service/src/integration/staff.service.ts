import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class StaffService {
  private readonly baseUrl: string;

  constructor(private httpService: HttpService) {
    this.baseUrl = process.env.STAFF_SERVICE_URL || 'http://localhost:3004';
  }

  async verifyAssistantPermission(
    assistantId: string,
    teacherId: string,
    token: string,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ hasPermission: boolean }>(
          `${this.baseUrl}/assistants/${assistantId}/permissions?teacherId=${teacherId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      return response.data.hasPermission === true;
    } catch {
      return false;
    }
  }

  async getAssistantInfo(
    assistantId: string,
    token: string,
  ): Promise<{ id: string; name: string; email: string } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ id: string; name: string; email: string }>(`${this.baseUrl}/assistants/${assistantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch {
      return null;
    }
  }
}
