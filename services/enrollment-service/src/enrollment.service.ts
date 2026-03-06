import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CourseClientService } from './course-client.service';
import { StaffClientService } from './staff-client.service';
import { CreateSelfEnrollmentDto } from './dto/create-self-enrollment.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { BlockEnrollmentDto } from './dto/block-enrollment.dto';
import { Role } from './auth/roles.decorator';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courseClient: CourseClientService,
    private readonly staffClient: StaffClientService,
  ) {}

  async createSelfEnrollment(
    createSelfEnrollmentDto: CreateSelfEnrollmentDto,
    studentId: string,
  ) {
    const { courseId } = createSelfEnrollmentDto;

    // Verify course exists
    const course = await this.courseClient.getCourseById(courseId);

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId,
          courseId,
          enrolledByUserId: studentId,
          status: 'ACTIVE',
        },
      });

      return enrollment;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Already enrolled in this course');
      }
      throw error;
    }
  }

  async createEnrollment(
    createEnrollmentDto: CreateEnrollmentDto,
    actorId: string,
    actorRole: Role,
  ) {
    const { studentId, courseId } = createEnrollmentDto;

    // Verify course exists and get teacher info
    const course = await this.courseClient.getCourseById(courseId);

    // Check permissions
    if (actorRole === Role.TEACHER) {
      // Teacher must be the owner of the course
      if (course.teacherId !== actorId) {
        throw new ForbiddenException('Teacher can only enroll students in their own courses');
      }
    } else {
      // Non-teacher must be authorized assistant
      const staffRecord = await this.staffClient.getStaffByTeacherAndAssistant(
        course.teacherId,
        actorId
      );

      if (!staffRecord || !staffRecord.canManageEnrollments) {
        throw new ForbiddenException('Not authorized to enroll students in this course');
      }
    }

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId,
          courseId,
          enrolledByUserId: actorId,
          status: 'ACTIVE',
        },
      });

      return enrollment;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Already enrolled in this course');
      }
      throw error;
    }
  }

  async getStudentEnrollments(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments;
  }

  async getStudentCourses(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        status: 'ACTIVE',
      },
      select: {
        courseId: true,
      },
    });

    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    // Fetch course details from course-service
    const courses = await Promise.all(
      courseIds.map(courseId => this.courseClient.getCourseById(courseId))
    );

    return courses.map(course => ({
      courseId: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      teacherId: course.teacherId,
      grade: course.grade,
    }));
  }

  async blockEnrollment(
    id: string,
    blockEnrollmentDto: BlockEnrollmentDto,
    actorId: string,
    actorRole: Role,
  ) {
    // Get enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Get course to verify ownership
    const course = await this.courseClient.getCourseById(enrollment.courseId);

    // Check permissions
    if (actorRole === Role.TEACHER) {
      // Teacher must be the owner of the course
      if (course.teacherId !== actorId) {
        throw new ForbiddenException('Teacher can only block enrollments in their own courses');
      }
    } else {
      // Non-teacher must be authorized assistant
      const staffRecord = await this.staffClient.getStaffByTeacherAndAssistant(
        course.teacherId,
        actorId
      );

      if (!staffRecord || !staffRecord.canManageEnrollments) {
        throw new ForbiddenException('Not authorized to block enrollments in this course');
      }
    }

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id },
      data: {
        status: 'BLOCKED',
        blockedByUserId: actorId,
        blockedAt: new Date(),
      },
    });

    return updatedEnrollment;
  }

  async removeEnrollment(id: string, actorId: string, actorRole: Role) {
    // Get enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Get course to verify ownership
    const course = await this.courseClient.getCourseById(enrollment.courseId);

    // Check permissions
    if (actorRole === Role.TEACHER) {
      // Teacher must be the owner of the course
      if (course.teacherId !== actorId) {
        throw new ForbiddenException('Teacher can only remove enrollments in their own courses');
      }
    } else {
      // Non-teacher must be authorized assistant
      const staffRecord = await this.staffClient.getStaffByTeacherAndAssistant(
        course.teacherId,
        actorId
      );

      if (!staffRecord || !staffRecord.canManageEnrollments) {
        throw new ForbiddenException('Not authorized to remove enrollments in this course');
      }
    }

    await this.prisma.enrollment.update({
      where: { id },
      data: {
        status: 'REMOVED',
        removedByUserId: actorId,
        removedAt: new Date(),
      },
    });
  }

  async getEnrollmentById(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }
}
