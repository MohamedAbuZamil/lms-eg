import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

export interface CourseResponse {
  id: string;
  title: string;
  description: string | null;
  price: number;
  teacherId: string;
  gradeId: string;
  createdAt: string;
  grade: {
    id: string;
    name: string;
  };
}

@Injectable()
export class CourseClientService {
  constructor(private readonly httpService: HttpService) {}

  async getCourseById(courseId: string): Promise<CourseResponse> {
    try {
      const response: AxiosResponse<CourseResponse> = await firstValueFrom(
        this.httpService.get<CourseResponse>(`${process.env.COURSE_SERVICE_URL}/courses/${courseId}`)
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Course not found');
      }
      throw error;
    }
  }
}
