import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from '../src/course.service';
import { PrismaService } from '../src/prisma.service';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { UpdateCourseDto } from '../src/dto/update-course.dto';

describe('CourseService - Ownership Methods', () => {
  let service: CourseService;
  let prisma: PrismaService;

  const mockPrisma = {
    course: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCourse', () => {
    const teacherId = 'teacher-123';
    const courseId = 'course-123';
    const updateDto: UpdateCourseDto = {
      title: 'Updated Title',
      description: 'Updated description',
      price: 199,
    };

    it('should update course successfully for owner', async () => {
      const existingCourse = { id: courseId, teacherId };
      const updatedCourse = {
        id: courseId,
        title: 'Updated Title',
        description: 'Updated description',
        price: 199,
        teacherId,
        createdAt: new Date(),
      };

      mockPrisma.course.findUnique
        .mockResolvedValueOnce(existingCourse)
        .mockResolvedValueOnce(updatedCourse);
      mockPrisma.course.update.mockResolvedValue(updatedCourse);

      const result = await service.updateCourse(courseId, updateDto, teacherId);

      expect(result).toEqual(updatedCourse);
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId },
        select: { id: true, teacherId: true },
      });
      expect(mockPrisma.course.update).toHaveBeenCalledWith({
        where: { id: courseId },
        data: updateDto,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          teacherId: true,
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.updateCourse(courseId, updateDto, teacherId))
        .rejects.toThrow(NotFoundException);

      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId },
        select: { id: true, teacherId: true },
      });
      expect(mockPrisma.course.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not course owner', async () => {
      const otherTeacherId = 'other-teacher-456';
      const existingCourse = { id: courseId, teacherId: otherTeacherId };

      mockPrisma.course.findUnique.mockResolvedValue(existingCourse);

      await expect(service.updateCourse(courseId, updateDto, teacherId))
        .rejects.toThrow(ForbiddenException);

      expect(mockPrisma.course.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate title', async () => {
      const existingCourse = { id: courseId, teacherId };
      const duplicateError = { code: 'P2002' };

      mockPrisma.course.findUnique.mockResolvedValue(existingCourse);
      mockPrisma.course.update.mockRejectedValue(duplicateError);

      await expect(service.updateCourse(courseId, updateDto, teacherId))
        .rejects.toThrow(ConflictException);

      expect(mockPrisma.course.update).toHaveBeenCalled();
    });
  });

  describe('deleteCourse', () => {
    const teacherId = 'teacher-123';
    const courseId = 'course-123';

    it('should delete course successfully for owner', async () => {
      const existingCourse = { id: courseId, teacherId };

      mockPrisma.course.findUnique.mockResolvedValue(existingCourse);
      mockPrisma.course.delete.mockResolvedValue(undefined);

      await service.deleteCourse(courseId, teacherId);

      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: courseId },
        select: { id: true, teacherId: true },
      });
      expect(mockPrisma.course.delete).toHaveBeenCalledWith({
        where: { id: courseId },
      });
    });

    it('should throw NotFoundException if course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(service.deleteCourse(courseId, teacherId))
        .rejects.toThrow(NotFoundException);

      expect(mockPrisma.course.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not course owner', async () => {
      const otherTeacherId = 'other-teacher-456';
      const existingCourse = { id: courseId, teacherId: otherTeacherId };

      mockPrisma.course.findUnique.mockResolvedValue(existingCourse);

      await expect(service.deleteCourse(courseId, teacherId))
        .rejects.toThrow(ForbiddenException);

      expect(mockPrisma.course.delete).not.toHaveBeenCalled();
    });
  });

  describe('getTeacherCourses', () => {
    const teacherId = 'teacher-123';
    const courses = [
      {
        id: 'course-1',
        title: 'Course 1',
        description: 'Description 1',
        price: 99,
        teacherId,
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'course-2',
        title: 'Course 2',
        description: 'Description 2',
        price: 149,
        teacherId,
        createdAt: new Date('2023-01-02'),
      },
    ];

    it('should return teacher courses ordered by createdAt desc', async () => {
      mockPrisma.course.findMany.mockResolvedValue(courses);

      const result = await service.getTeacherCourses(teacherId);

      expect(result).toEqual(courses);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { teacherId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          teacherId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty array if teacher has no courses', async () => {
      mockPrisma.course.findMany.mockResolvedValue([]);

      const result = await service.getTeacherCourses(teacherId);

      expect(result).toEqual([]);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { teacherId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          teacherId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });
});
