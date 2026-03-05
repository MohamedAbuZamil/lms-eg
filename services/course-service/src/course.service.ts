import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(createCourseDto: CreateCourseDto, teacherId: string) {
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
        createdAt: true,
      },
    });

    return course;
  }

  async getAllCourses() {
    const courses = await this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        teacherId: true,
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
        createdAt: true,
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return course;
  }
}
