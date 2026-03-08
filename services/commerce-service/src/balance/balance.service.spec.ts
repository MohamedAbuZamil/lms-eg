import { Test, TestingModule } from '@nestjs/testing';
import { BalanceService } from './balance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BalanceService', () => {
  let service: BalanceService;
  let prisma: PrismaService;

  const mockPrisma = {
    studentTeacherBalance: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    balanceTransaction: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getStudentTeacherBalances', () => {
    it('should return all balances for a student', async () => {
      const studentId = 'student-123';
      const mockBalances = [
        {
          id: 'balance-1',
          studentId,
          teacherId: 'teacher-1',
          balance: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'balance-2',
          studentId,
          teacherId: 'teacher-2',
          balance: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.studentTeacherBalance.findMany.mockResolvedValue(mockBalances);

      const result = await service.getStudentTeacherBalances(studentId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('teacherId');
      expect(result[0]).toHaveProperty('balance');
      expect(mockPrisma.studentTeacherBalance.findMany).toHaveBeenCalledWith({
        where: { studentId },
        select: {
          teacherId: true,
          balance: true,
          updatedAt: true,
        },
      });
    });

    it('should return empty array if no balances', async () => {
      const studentId = 'student-123';
      mockPrisma.studentTeacherBalance.findMany.mockResolvedValue([]);

      const result = await service.getStudentTeacherBalances(studentId);

      expect(result).toEqual([]);
    });
  });

  describe('getStudentTeacherBalance', () => {
    it('should return specific balance for student and teacher', async () => {
      const studentId = 'student-123';
      const teacherId = 'teacher-123';
      const mockBalance = {
        id: 'balance-1',
        studentId,
        teacherId,
        balance: 100,
        updatedAt: new Date(),
      };

      mockPrisma.studentTeacherBalance.findUnique.mockResolvedValue(mockBalance);

      const result = await service.getStudentTeacherBalance(studentId, teacherId);

      expect(result).toEqual({
        teacherId,
        balance: 100,
        lastUpdated: mockBalance.updatedAt,
      });
    });

    it('should return zero balance if not found', async () => {
      const studentId = 'student-123';
      const teacherId = 'teacher-123';

      mockPrisma.studentTeacherBalance.findUnique.mockResolvedValue(null);

      const result = await service.getStudentTeacherBalance(studentId, teacherId);

      expect(result).toEqual({
        teacherId,
        balance: 0,
        lastUpdated: null,
      });
    });
  });

  describe('getStudentTransactions', () => {
    it('should return all transactions for a student', async () => {
      const studentId = 'student-123';
      const mockTransactions = [
        {
          id: 'trans-1',
          studentId,
          teacherId: 'teacher-1',
          type: 'RECHARGE_CODE',
          amount: 50,
          createdAt: new Date(),
        },
        {
          id: 'trans-2',
          studentId,
          teacherId: 'teacher-1',
          type: 'COURSE_PURCHASE',
          amount: -30,
          createdAt: new Date(),
        },
      ];

      mockPrisma.balanceTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getStudentTransactions(studentId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.balanceTransaction.findMany).toHaveBeenCalledWith({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should filter transactions by teacher', async () => {
      const studentId = 'student-123';
      const teacherId = 'teacher-1';
      const mockTransactions = [
        {
          id: 'trans-1',
          studentId,
          teacherId,
          type: 'RECHARGE_CODE',
          amount: 50,
          createdAt: new Date(),
        },
      ];

      mockPrisma.balanceTransaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getStudentTransactions(studentId, teacherId);

      expect(result).toHaveLength(1);
      expect(mockPrisma.balanceTransaction.findMany).toHaveBeenCalledWith({
        where: { studentId, teacherId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
