import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { CourseService } from './course.service';
import { EnrollmentService } from './enrollment.service';
import { StaffService } from './staff.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosResponse } from 'axios';

describe('Integration Services', () => {
  describe('CourseService', () => {
    let service: CourseService;
    let httpService: HttpService;

    const mockHttpService = {
      get: jest.fn(),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CourseService,
          { provide: HttpService, useValue: mockHttpService },
        ],
      }).compile();

      service = module.get<CourseService>(CourseService);
      httpService = module.get<HttpService>(HttpService);

      jest.clearAllMocks();
    });

    it('should get course successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 'course-123',
          title: 'Test Course',
          teacherId: 'teacher-123',
          price: 100,
          isPublished: true,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCourse('course-123', 'token');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/courses/course-123'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
        }),
      );
    });

    it('should return null for 404', async () => {
      const error = {
        response: { status: 404 },
      };
      mockHttpService.get.mockReturnValue(throwError(() => error));

      const result = await service.getCourse('invalid-course', 'token');

      expect(result).toBeNull();
    });

    it('should throw HttpException on other errors', async () => {
      const error = {
        response: { status: 500 },
      };
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getCourse('course-123', 'token'))
        .rejects.toThrow(HttpException);
    });

    it('should verify teacher owns course', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 'course-123',
          teacherId: 'teacher-123',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.verifyTeacherOwnsCourse('course-123', 'teacher-123', 'token');

      expect(result).toBe(true);
    });

    it('should return false when teacher does not own course', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 'course-123',
          teacherId: 'different-teacher',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.verifyTeacherOwnsCourse('course-123', 'teacher-123', 'token');

      expect(result).toBe(false);
    });
  });

  describe('EnrollmentService', () => {
    let service: EnrollmentService;
    let httpService: HttpService;

    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EnrollmentService,
          { provide: HttpService, useValue: mockHttpService },
        ],
      }).compile();

      service = module.get<EnrollmentService>(EnrollmentService);
      httpService = module.get<HttpService>(HttpService);

      jest.clearAllMocks();
    });

    it('should enroll student successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: 'enrollment-123', studentId: 'student-123', courseId: 'course-123' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.enrollStudent('student-123', 'course-123', 'token');

      expect(result.success).toBe(true);
      expect(result.enrollmentId).toBe('enrollment-123');
    });

    it('should handle already enrolled (409)', async () => {
      const error = {
        response: { status: 409 },
      };
      mockHttpService.post.mockReturnValue(throwError(() => error));

      const result = await service.enrollStudent('student-123', 'course-123', 'token');

      expect(result.success).toBe(true);
      expect(result.enrollmentId).toBeUndefined();
    });

    it('should throw on enrollment error', async () => {
      const error = {
        response: { status: 500 },
      };
      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.enrollStudent('student-123', 'course-123', 'token'))
        .rejects.toThrow(HttpException);
    });

    it('should check enrollment status', async () => {
      const mockResponse: AxiosResponse = {
        data: { enrolled: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.checkEnrollment('student-123', 'course-123', 'token');

      expect(result).toBe(true);
    });

    it('should return false on check enrollment error', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      const result = await service.checkEnrollment('student-123', 'course-123', 'token');

      expect(result).toBe(false);
    });
  });

  describe('StaffService', () => {
    let service: StaffService;
    let httpService: HttpService;

    const mockHttpService = {
      get: jest.fn(),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StaffService,
          { provide: HttpService, useValue: mockHttpService },
        ],
      }).compile();

      service = module.get<StaffService>(StaffService);
      httpService = module.get<HttpService>(HttpService);

      jest.clearAllMocks();
    });

    it('should verify assistant has permission', async () => {
      const mockResponse: AxiosResponse = {
        data: { hasPermission: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.verifyAssistantPermission('assistant-123', 'teacher-123', 'token');

      expect(result).toBe(true);
    });

    it('should return false when assistant has no permission', async () => {
      const mockResponse: AxiosResponse = {
        data: { hasPermission: false },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.verifyAssistantPermission('assistant-123', 'teacher-123', 'token');

      expect(result).toBe(false);
    });

    it('should return false on verification error', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      const result = await service.verifyAssistantPermission('assistant-123', 'teacher-123', 'token');

      expect(result).toBe(false);
    });

    it('should get assistant info', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: 'assistant-123', name: 'John Doe', email: 'john@example.com' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getAssistantInfo('assistant-123', 'token');

      expect(result).toEqual(mockResponse.data);
    });

    it('should return null on get assistant info error', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network error')));

      const result = await service.getAssistantInfo('assistant-123', 'token');

      expect(result).toBeNull();
    });
  });
});
