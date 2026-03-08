import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface CourseInfo {
  id: string;
  title: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable()
export class CourseClient {
  private readonly logger = new Logger(CourseClient.name);

  constructor(private readonly httpService: HttpService) {}

  async getCourse(courseId: string): Promise<CourseInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<CourseInfo>(
          `${process.env.COURSE_SERVICE_URL}/courses/${courseId}`,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch course ${courseId}:`, error.response?.data || error.message);
      throw new Error(`Course not found: ${courseId}`);
    }
  }

  async validateTeacherOwnership(teacherId: string, courseId: string): Promise<boolean> {
    try {
      const course = await this.getCourse(courseId);
      return course.teacherId === teacherId;
    } catch {
      return false;
    }
  }
}
