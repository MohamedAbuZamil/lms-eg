import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, PaymentMethod, PurchaseStatus } from '@prisma/client';
import { CourseService } from '../integration/course.service';
import { EnrollmentService } from '../integration/enrollment.service';
import { StaffService } from '../integration/staff.service';

@Injectable()
export class PurchaseService {
  constructor(
    private prisma: PrismaService,
    private courseService: CourseService,
    private enrollmentService: EnrollmentService,
    private staffService: StaffService,
  ) {}

  async purchaseFromBalance(
    studentId: string,
    courseId: string,
    authToken: string,
  ) {
    // 1. Get course info
    const course = await this.courseService.getCourse(courseId, authToken);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.isPublished) {
      throw new BadRequestException('Course is not available for purchase');
    }

    const teacherId = course.teacherId;
    const price = course.price || 0;

    // 2. Check if already enrolled
    const isEnrolled = await this.enrollmentService.checkEnrollment(
      studentId,
      courseId,
      authToken,
    );
    if (isEnrolled) {
      throw new BadRequestException('Already enrolled in this course');
    }

    // 3. Check student balance for this teacher
    const balance = await this.prisma.studentTeacherBalance.findUnique({
      where: {
        studentId_teacherId: {
          studentId,
          teacherId,
        },
      },
    });

    if (!balance || balance.balance < price) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${price} EGP, Available: ${balance?.balance || 0} EGP`,
      );
    }

    // 4. Deduct balance
    await this.prisma.studentTeacherBalance.update({
      where: { id: balance.id },
      data: { balance: { decrement: price } },
    });

    // 5. Create purchase record
    const purchase = await this.prisma.coursePurchase.create({
      data: {
        studentId,
        courseId,
        teacherId,
        amountCharged: price,
        paymentMethod: PaymentMethod.TEACHER_BALANCE,
        status: PurchaseStatus.COMPLETED,
      },
    });

    // 6. Create transaction record
    await this.prisma.balanceTransaction.create({
      data: {
        studentId,
        teacherId,
        type: TransactionType.COURSE_PURCHASE,
        amount: -price,
        referenceType: 'COURSE_PURCHASE',
        referenceId: purchase.id,
      },
    });

    // 7. Enroll student
    await this.enrollmentService.enrollStudent(studentId, courseId, authToken);

    return {
      success: true,
      purchaseId: purchase.id,
      courseId,
      teacherId,
      amountCharged: price,
      remainingBalance: balance.balance - price,
    };
  }

  async createManualPayment(
    dto: {
      studentId: string;
      courseId: string;
      amountPaid: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    },
    recordedByUserId: string,
    recordedByRole: string,
    authToken: string,
  ) {
    // 1. Get course info
    const course = await this.courseService.getCourse(dto.courseId, authToken);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const teacherId = course.teacherId;
    let assistantId: string | null = null;

    // 2. Verify permissions
    if (recordedByRole === 'TEACHER') {
      if (teacherId !== recordedByUserId) {
        throw new ForbiddenException('Can only record payments for your own courses');
      }
    } else if (recordedByRole === 'ASSISTANT') {
      const hasPermission = await this.staffService.verifyAssistantPermission(
        recordedByUserId,
        teacherId,
        authToken,
      );
      if (!hasPermission) {
        throw new ForbiddenException('No permission to record payments for this teacher');
      }
      assistantId = recordedByUserId;
    } else if (recordedByRole !== 'ADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }

    // 3. Check if already enrolled
    const isEnrolled = await this.enrollmentService.checkEnrollment(
      dto.studentId,
      dto.courseId,
      authToken,
    );
    if (isEnrolled) {
      throw new BadRequestException('Student already enrolled in this course');
    }

    // 4. Create manual payment record
    const payment = await this.prisma.manualEnrollmentPayment.create({
      data: {
        studentId: dto.studentId,
        courseId: dto.courseId,
        teacherId,
        assistantId,
        amountPaid: dto.amountPaid,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        recordedByUserId,
      },
    });

    // 5. Enroll student
    await this.enrollmentService.enrollStudent(
      dto.studentId,
      dto.courseId,
      authToken,
    );

    return {
      success: true,
      paymentId: payment.id,
      courseId: dto.courseId,
      teacherId,
      studentId: dto.studentId,
      amountPaid: dto.amountPaid,
    };
  }

  async getStudentPurchases(studentId: string) {
    return this.prisma.coursePurchase.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeacherSales(teacherId: string) {
    return this.prisma.coursePurchase.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
