import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface LessonInfo {
  id: string;
  type: string; // VIDEO, TEXT, PDF, FILE
  title: string;
  order: number;
  isPreview: boolean;
  sectionId: string;
  section: {
    courseId: string;
  };
}

export interface CourseStructure {
  courseId: string;
  totalLessons: number;
  nonPreviewLessons: number;
  lessons: LessonInfo[];
}

@Injectable()
export class ContentClient {
  private readonly logger = new Logger(ContentClient.name);

  constructor(private readonly httpService: HttpService) {}

  async getLesson(lessonId: string): Promise<LessonInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<LessonInfo>(
          `${process.env.CONTENT_SERVICE_URL}/lessons/${lessonId}`,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch lesson ${lessonId}:`, error.response?.data || error.message);
      throw new Error(`Lesson not found: ${lessonId}`);
    }
  }

  async getCourseStructure(courseId: string): Promise<CourseStructure> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ sections: { lessons: LessonInfo[] }[] }>(
          `${process.env.CONTENT_SERVICE_URL}/courses/${courseId}/content`,
        ),
      );

      const sections = response.data.sections;
      const allLessons = sections.flatMap(section => section.lessons);
      const nonPreviewLessons = allLessons.filter(lesson => !lesson.isPreview);

      return {
        courseId,
        totalLessons: allLessons.length,
        nonPreviewLessons: nonPreviewLessons.length,
        lessons: allLessons,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch course structure for ${courseId}:`, error.response?.data || error.message);
      throw new Error(`Course structure not found: ${courseId}`);
    }
  }

  async validateLessonInCourse(lessonId: string, courseId: string): Promise<boolean> {
    try {
      const lesson = await this.getLesson(lessonId);
      return lesson.section.courseId === courseId;
    } catch {
      return false;
    }
  }
}
