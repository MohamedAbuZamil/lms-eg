import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface Lesson {
  id: string;
  title: string;
  courseId: string;
  sectionId: string;
  type: string;
  isPreview: boolean;
}

export interface CourseContent {
  courseId: string;
  title: string;
  sections: {
    id: string;
    title: string;
    lessons: Lesson[];
  }[];
}

@Injectable()
export class ContentClient {
  private readonly logger = new Logger(ContentClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.CONTENT_SERVICE_URL || 'http://localhost:3005';
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/lessons/${lessonId}`)
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch lesson ${lessonId}`);
      return null;
    }
  }

  async getCourseContent(courseId: string): Promise<CourseContent | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/courses/${courseId}/content`)
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch course content ${courseId}`);
      return null;
    }
  }

  async validateLessonExists(lessonId: string): Promise<boolean> {
    try {
      const lesson = await this.getLesson(lessonId);
      return lesson !== null;
    } catch (error) {
      this.logger.error(`Failed to validate lesson existence: ${error.message}`);
      return false;
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
