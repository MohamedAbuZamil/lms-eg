import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class StaffClient {
  private readonly logger = new Logger(StaffClient.name);

  constructor(private readonly httpService: HttpService) {}

  async verifyProgressViewPermission(
    assistantId: string,
    courseId: string,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${process.env.STAFF_SERVICE_URL}/staff/verify-progress-permission`,
          {
            assistantId,
            courseId,
          },
        ),
      );
      return response.data.hasPermission === true;
    } catch (error) {
      this.logger.error(
        `Failed to verify progress permission for assistant ${assistantId} in course ${courseId}:`,
        error.response?.data || error.message,
      );
      return false;
    }
  }
}
