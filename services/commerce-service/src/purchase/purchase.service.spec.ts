import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseService } from './purchase.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from '../integration/course.service';
import { EnrollmentService } from '../integration/enrollment.service';
import { StaffService } from '../integration/staff.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentMethod, PurchaseStatus, TransactionType } from '@prisma/client';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let prisma: PrismaService;
  let courseService: CourseService;
  let enrollmentService: EnrollmentService;
  let staffService: StaffService;

  const mockPrisma = {
    studentTeacherBalance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    coursePurchase: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    balanceTransaction: {
      create: jest.fn(),
    },
    manualEnrollmentPayment: {
      create: jest.fn(),
    },
  };

  const mockCourseService = {
    getCourse: jest.fn(),
  };

  const mockEnrollmentService = {
    checkEnrollment: jest.fn(),
    enrollStudent: jest.fn(),
  };

  const mockStaffService = {
    verifyAssistantPermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CourseService, useValue: mockCourseService },
        { provide: EnrollmentService, useValue: mockEnrollmentService },
        { provide: StaffService, useValue: mockStaffService },
      ],
    }).compile();

    service = module.get<PurchaseService>(PurchaseService);
    prisma = module.get<PrismaService>(PrismaService);
    courseService = module.get<CourseService>(CourseService);
    enrollmentService = module.get<EnrollmentService>(EnrollmentService);
    staffService = module.get<StaffService>(StaffService);

    jest.clearAllMocks();
  });

  describe('purchaseFromBalance', () => {
    const studentId = 'student-123';
    const courseId = 'course-123';
    const teacherId = 'teacher-123';
    const token = 'auth-token';

    it('should purchase course successfully', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: courseId,
        title: 'Test Course',
        teacherId,
        price: 100,
        isPublished: true,
      });
      mockEnrollmentService.checkEnrollment.mockResolvedValue(false);
      mockPrisma.studentTeacherBalance.findUnique.mockResolvedValue({
        id: 'balance-1',
        studentId,
        teacherId,
        balance: 150,
      });
      mockPrisma.studentTeacherBalance.update.mockResolvedValue({
        id: 'balance-1',
        balance: 50,
      });
      mockPrisma.coursePurchase.create.mockResolvedValue({
        id: 'purchase-1',
        studentId,
        courseId,
        teacherId,
        amountCharged: 100,
        paymentMethod: PaymentMethod.TEACHER_BALANCE,
        status: PurchaseStatus.COMPLETED,
      });
      mockPrisma.balanceTransaction.create.mockResolvedValue({
        id: 'transaction-1',
        type: TransactionType.COURSE_PURCHASE,
        amount: -100,
      });
      mockEnrollmentService.enrollStudent.mockResolvedValue({ success: true });

      const result = await service.purchaseFromBalance(studentId, courseId, token);

      expect(result.success).toBe(true);
      expect(result.amountCharged).toBe(100);
      expect(result.remainingBalance).toBe(50);
      expect(mockPrisma.balanceTransaction.create).toHaveBeenCalled();
      expect(mockEnrollmentService.enrollStudent).toHaveBeenCalledWith(studentId, courseId, token);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseService.getCourse.mockResolvedValue(null);

      await expect(service.purchaseFromBalance(studentId, courseId, token))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if course not published', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: courseId,
        title: 'Test Course',
        teacherId,
        price: 100,
        isPublished: false,
      });

      await expect(service.purchaseFromBalance(studentId, courseId, token))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already enrolled', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: courseId,
        title: 'Test Course',
        teacherId,
        price: 100,
        isPublished: true,
      });
      mockEnrollmentService.checkEnrollment.mockResolvedValue(true);

      await expect(service.purchaseFromBalance(studentId, courseId, token))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: courseId,
        title: 'Test Course',
        teacherId,
        price: 100,
        isPublished: true,
      });
      mockEnrollmentService.checkEnrollment.mockResolvedValue(false);
      mockPrisma.studentTeacherBalance.findUnique.mockResolvedValue({
        id: 'balance-1',
        studentId,
        teacherId,
        balance: 50,
      });

      await expect(service.purchaseFromBalance(studentId, courseId, token))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no balance record exists', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: courseId,
        title: 'Test Course',
        teacherId,
        price: 100,
        isPublished: true,
      });
      mockEnrollmentService.checkEnrollment.mockResolvedValue(false);
      mockPrisma.studentTeacherBalance.findUnique.mockResolvedValue(null);

      await expect(service.purchaseFromBalance(studentId, courseId, token))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createManualPayment', () => {
    const dto = {
      studentId: 'student-123',
      courseId: 'course-123',
      amountPaid: 150,
      paymentMethod: PaymentMethod.MANUAL_CASH,
      notes: 'Paid in cash',
    };
    const recordedByUserId = 'teacher-123';
    const token = 'auth-token';

    it('should record manual payment as teacher', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: dto.courseId,
        title: 'Test Course',
        teacherId: recordedByUserId,
        isPublished: true,
      });
      mockEnrollmentService.checkEnrollment.mockResolvedValue(false);
      mockPrisma.manualEnrollmentPayment.create.mockResolvedValue({
        id: 'payment-1',
        ...dto,
        teacherId: recordedByUserId,
        assistantId: null,
        recordedByUserId,
      });
      mockEnrollmentService.enrollStudent.mockResolvedValue({ success: true });

      const result = await service.createManualPayment(
        dto,
        recordedByUserId,
        'TEACHER',
        token,
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.manualEnrollmentPayment.create).toHaveBeenCalled();
      expect(mockEnrollmentService.enrollStudent).toHaveBeenCalledWith(
        dto.studentId,
        dto.courseId,
        token,
      );
    });

    it('should record manual payment as admin', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: dto.courseId,
        title: 'Test Course',
        teacherId: 'other-teacher',
        isPublished: true,
      });
      mockEnrollmentService.checkEnrollment.mockResolvedValue(false);
      mockPrisma.manualEnrollmentPayment.create.mockResolvedValue({
        id: 'payment-1',
        ...dto,
        teacherId: 'other-teacher',
        assistantId: null,
        recordedByUserId,
      });
      mockEnrollmentService.enrollStudent.mockResolvedValue({ success: true });

      const result = await service.createManualPayment(
        dto,
        recordedByUserId,
        'ADMIN',
        token,
      );

      expect(result.success).toBe(true);
    });

    it('should record manual payment as assistant with permission', async () => {
      const assistantId = 'assistant-123';
      const teacherId = 'teacher-123';

      mockCourseService.getCourse.mockResolvedValue({
        id: dto.courseId,
        title: 'Test Course',
        teacherId,
        isPublished: true,
      });
      mockStaffService.verifyAssistantPermission.mockResolvedValue(true);
      mockEnrollmentService.checkEnrollment.mockResolvedValue(false);
      mockPrisma.manualEnrollmentPayment.create.mockResolvedValue({
        id: 'payment-1',
        ...dto,
        teacherId,
        assistantId,
        recordedByUserId: assistantId,
      });
      mockEnrollmentService.enrollStudent.mockResolvedValue({ success: true });

      const result = await service.createManualPayment(
        dto,
        assistantId,
        'ASSISTANT',
        token,
      );

      expect(result.success).toBe(true);
      expect(result.teacherId).toBe(teacherId);
      expect(mockStaffService.verifyAssistantPermission).toHaveBeenCalledWith(
        assistantId,
        teacherId,
        token,
      );
    });

    it('should throw ForbiddenException if teacher tries to record for other teacher course', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: dto.courseId,
        title: 'Test Course',
        teacherId: 'other-teacher',
        isPublished: true,
      });

      await expect(
        service.createManualPayment(dto, recordedByUserId, 'TEACHER', token),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if assistant has no permission', async () => {
      const assistantId = 'assistant-123';
      const teacherId = 'teacher-123';

      mockCourseService.getCourse.mockResolvedValue({
        id: dto.courseId,
        title: 'Test Course',
        teacherId,
        isPublished: true,
      });
      mockStaffService.verifyAssistantPermission.mockResolvedValue(false);

      await expect(
        service.createManualPayment(dto, assistantId, 'ASSISTANT', token),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for invalid role', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: dto.courseId,
        title: 'Test Course',
        teacherId: 'teacher-123',
        isPublished: true,
      });

      await expect(
        service.createManualPayment(dto, recordedByUserId, 'STUDENT', token),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if student already enrolled', async () => {
      mockCourseService.getCourse.mockResolvedValue({
        id: dto.courseId,
        title: 'Test Course',
        teacherId: recordedByUserId,
        isPublished: true,
      });
      mockEnrollmentService.checkEnrollment.mockResolvedValue(true);

      await expect(
        service.createManualPayment(dto, recordedByUserId, 'TEACHER', token),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStudentPurchases', () => {
    it('should return all purchases for a student', async () => {
      const studentId = 'student-123';
      const mockPurchases = [
        {
          id: 'purchase-1',
          studentId,
          courseId: 'course-1',
          teacherId: 'teacher-1',
          amountCharged: 100,
          status: PurchaseStatus.COMPLETED,
          createdAt: new Date(),
        },
        {
          id: 'purchase-2',
          studentId,
          courseId: 'course-2',
          teacherId: 'teacher-2',
          amountCharged: 50,
          status: PurchaseStatus.COMPLETED,
          createdAt: new Date(),
        },
      ];

      mockPrisma.coursePurchase.findMany.mockResolvedValue(mockPurchases);

      const result = await service.getStudentPurchases(studentId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.coursePurchase.findMany).toHaveBeenCalledWith({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getTeacherSales', () => {
    it('should return all sales for a teacher', async () => {
      const teacherId = 'teacher-123';
      const mockSales = [
        {
          id: 'purchase-1',
          studentId: 'student-1',
          courseId: 'course-1',
          teacherId,
          amountCharged: 100,
          status: PurchaseStatus.COMPLETED,
          createdAt: new Date(),
        },
      ];

      mockPrisma.coursePurchase.findMany.mockResolvedValue(mockSales);

      const result = await service.getTeacherSales(teacherId);

      expect(result).toHaveLength(1);
      expect(mockPrisma.coursePurchase.findMany).toHaveBeenCalledWith({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
