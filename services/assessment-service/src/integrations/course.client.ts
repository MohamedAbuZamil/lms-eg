import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface Course {
  id: string;
  title: string;
  gradeId: string | null;
  teacherId: string;
}

export interface Grade {
  id: string;
  name: string;
}

@Injectable()
export class CourseClient {
  private readonly logger = new Logger(CourseClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';
  }

  async getCourse(courseId: string): Promise<Course | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/courses/${courseId}`)
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch course ${courseId}`);
      return null;
    }
  }

  async validateCourseOwnership(courseId: string, userId: string): Promise<boolean> {
    try {
      const course = await this.getCourse(courseId);
      if (!course) return false;
      return course.teacherId === userId;
    } catch (error) {
      this.logger.error(`Failed to validate course ownership: ${error.message}`);
      return false;
    }
  }

  async getGrade(gradeId: string): Promise<Grade | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/grades/${gradeId}`)
      );
      return response.data;
    } catch (error) {
      this.handleError(error, `Failed to fetch grade ${gradeId}`);
      return null;
    }
  }

  private handleError(error: AxiosError, message: string): void {
    if (error.response) {
      this.logger.error(
        `${message}: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
      throw new HttpException(
        error.response.data || message,
        error.response.status || 500
      );
    }
    this.logger.error(`${message}: ${error.message}`);
  }
}
