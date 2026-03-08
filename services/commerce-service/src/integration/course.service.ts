import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface CourseInfo {
  id: string;
  title: string;
  teacherId: string;
  price: number;
  isPublished: boolean;
}

@Injectable()
export class CourseService {
  private readonly baseUrl: string;

  constructor(private httpService: HttpService) {
    this.baseUrl = process.env.COURSE_SERVICE_URL || 'http://localhost:3002';
  }

  async getCourse(courseId: string, token: string): Promise<CourseInfo | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<CourseInfo>(`${this.baseUrl}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new HttpException(
        'Failed to fetch course',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyTeacherOwnsCourse(
    courseId: string,
    teacherId: string,
    token: string,
  ): Promise<boolean> {
    const course = await this.getCourse(courseId, token);
    if (!course) return false;
    return course.teacherId === teacherId;
  }
}
