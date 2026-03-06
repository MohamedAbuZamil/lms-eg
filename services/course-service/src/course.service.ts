import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { GradeService } from "./grade.service";

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gradeService: GradeService,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto, teacherId: string) {
    // Validate that grade exists
    const gradeExists = await this.gradeService.validateGradeExists(createCourseDto.gradeId);
    if (!gradeExists) {
      throw new BadRequestException('Grade does not exist');
    }

    try {
      const course = await this.prisma.course.create({
        data: {
          ...createCourseDto,
          teacherId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          teacherId: true,
          gradeId: true,
          createdAt: true,
          grade: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return course;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Course with this title already exists for this teacher');
      }
      throw error;
    }
  }

  async getAllCourses() {
    const courses = await this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        teacherId: true,
        gradeId: true,
        createdAt: true,
        grade: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return courses;
  }

  async getCourseById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        teacherId: true,
        gradeId: true,
        createdAt: true,
        grade: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return course;
  }

  async updateCourse(id: string, updateCourseDto: UpdateCourseDto, teacherId: string) {
    // First check if course exists and verify ownership
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!existingCourse) {
      throw new NotFoundException("Course not found");
    }

    if (existingCourse.teacherId !== teacherId) {
      throw new ForbiddenException("You can only update your own courses");
    }

    // Validate gradeId if provided
    if (updateCourseDto.gradeId) {
      const gradeExists = await this.gradeService.validateGradeExists(updateCourseDto.gradeId);
      if (!gradeExists) {
        throw new BadRequestException('Grade does not exist');
      }
    }

    try {
      const updatedCourse = await this.prisma.course.update({
        where: { id },
        data: updateCourseDto,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          teacherId: true,
          gradeId: true,
          createdAt: true,
          grade: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updatedCourse;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Course with this title already exists for this teacher');
      }
      throw error;
    }
  }

  async deleteCourse(id: string, teacherId: string) {
    // First check if course exists and verify ownership
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!existingCourse) {
      throw new NotFoundException("Course not found");
    }

    if (existingCourse.teacherId !== teacherId) {
      throw new ForbiddenException("You can only delete your own courses");
    }

    await this.prisma.course.delete({
      where: { id },
    });
  }

  async getTeacherCourses(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        teacherId: true,
        gradeId: true,
        createdAt: true,
        grade: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return courses;
  }
}
