import { Test, TestingModule } from '@nestjs/testing';
import { RechargeCodeService } from './recharge-code.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RechargeCodeStatus, TransactionType } from '@prisma/client';

describe('RechargeCodeService', () => {
  let service: RechargeCodeService;
  let prisma: PrismaService;

  const mockPrisma = {
    teacherWallet: {
      upsert: jest.fn(),
    },
    rechargeCodeBatch: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    rechargeCode: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    studentTeacherBalance: {
      upsert: jest.fn(),
    },
    balanceTransaction: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RechargeCodeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RechargeCodeService>(RechargeCodeService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createBatch', () => {
    const teacherId = 'teacher-123';
    const dto = {
      title: 'Test Batch',
      unitAmount: 50,
      quantity: 10,
    };
    const userId = 'user-123';

    it('should create a batch of recharge codes', async () => {
      mockPrisma.teacherWallet.upsert.mockResolvedValue({ id: 'wallet-1', teacherId });
      mockPrisma.rechargeCodeBatch.create.mockResolvedValue({
        id: 'batch-1',
        teacherId,
        title: dto.title,
        unitAmount: dto.unitAmount,
        quantity: dto.quantity,
        createdByUserId: userId,
      });
      mockPrisma.rechargeCode.createMany.mockResolvedValue({ count: 10 });

      const result = await service.createBatch(teacherId, dto, userId);

      expect(result).toHaveProperty('batchId');
      expect(result.quantity).toBe(10);
      expect(result.generatedCodes).toBe(10);
      expect(mockPrisma.rechargeCode.createMany).toHaveBeenCalled();
    });

    it('should create batch with large quantity', async () => {
      const largeDto = { ...dto, quantity: 1001 };
      mockPrisma.teacherWallet.upsert.mockResolvedValue({ id: 'wallet-1', teacherId });
      mockPrisma.rechargeCodeBatch.create.mockResolvedValue({
        id: 'batch-2',
        teacherId,
        title: largeDto.title,
        unitAmount: largeDto.unitAmount,
        quantity: largeDto.quantity,
        createdByUserId: userId,
      });
      mockPrisma.rechargeCode.createMany.mockResolvedValue({ count: 1001 });

      const result = await service.createBatch(teacherId, largeDto, userId);

      expect(result.quantity).toBe(1001);
      expect(result.generatedCodes).toBe(1001);
    });
  });

  describe('redeemCode', () => {
    const code = 'ABCD1234EFGH5678';
    const studentId = 'student-123';

    it('should redeem a valid code successfully', async () => {
      const mockCode = {
        id: 'code-1',
        code,
        amount: 50,
        status: RechargeCodeStatus.UNUSED,
        teacherId: 'teacher-123',
        batchId: 'batch-1',
      };

      mockPrisma.rechargeCode.findUnique.mockResolvedValue(mockCode);
      mockPrisma.studentTeacherBalance.upsert.mockResolvedValue({
        id: 'balance-1',
        balance: 50,
      });
      mockPrisma.rechargeCode.update.mockResolvedValue({
        ...mockCode,
        status: RechargeCodeStatus.REDEEMED,
        redeemedByStudentId: studentId,
        redeemedAt: new Date(),
      });
      mockPrisma.balanceTransaction.create.mockResolvedValue({
        id: 'transaction-1',
        type: TransactionType.RECHARGE_CODE,
        amount: 50,
      });

      const result = await service.redeemCode(studentId, { code });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(50);
      expect(result.newBalance).toBe(50);
    });

    it('should return error for invalid code', async () => {
      mockPrisma.rechargeCode.findUnique.mockResolvedValue(null);

      const result = await service.redeemCode(studentId, { code: 'INVALIDCODE' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should return error for already redeemed code', async () => {
      const mockCode = {
        id: 'code-1',
        code,
        amount: 50,
        status: RechargeCodeStatus.REDEEMED,
        teacherId: 'teacher-123',
        redeemedByStudentId: 'other-student',
      };

      mockPrisma.rechargeCode.findUnique.mockResolvedValue(mockCode);

      const result = await service.redeemCode(studentId, { code });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already');
    });

    it('should return error for expired code', async () => {
      const mockCode = {
        id: 'code-1',
        code,
        amount: 50,
        status: RechargeCodeStatus.EXPIRED,
        teacherId: 'teacher-123',
      };

      mockPrisma.rechargeCode.findUnique.mockResolvedValue(mockCode);

      const result = await service.redeemCode(studentId, { code });

      expect(result.success).toBe(false);
    });

    it('should return error for already used code by same student', async () => {
      const mockCode = {
        id: 'code-1',
        code,
        amount: 50,
        status: RechargeCodeStatus.REDEEMED,
        teacherId: 'teacher-123',
        redeemedByStudentId: studentId,
      };

      mockPrisma.rechargeCode.findUnique.mockResolvedValue(mockCode);

      const result = await service.redeemCode(studentId, { code });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already');
    });
  });

  describe('getTeacherBatches', () => {
    it('should return all batches for a teacher', async () => {
      const teacherId = 'teacher-123';
      const mockBatches = [
        { id: 'batch-1', title: 'Batch 1', quantity: 10 },
        { id: 'batch-2', title: 'Batch 2', quantity: 20 },
      ];

      mockPrisma.rechargeCodeBatch.findMany.mockResolvedValue(mockBatches);

      const result = await service.getTeacherBatches(teacherId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.rechargeCodeBatch.findMany).toHaveBeenCalledWith({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              codes: true,
            },
          },
          codes: {
            select: {
              status: true,
            },
          },
        },
      });
    });
  });

  describe('exportCodesToExcel', () => {
    it('should return codes with optional filters', async () => {
      const batchId = 'batch-123';
      const teacherId = 'teacher-123';
      const mockCodes = [
        {
          code: 'ABCD1234EFGH5678',
          amount: 50,
          status: RechargeCodeStatus.UNUSED,
          redeemedByStudentId: null,
          redeemedAt: null,
        },
        {
          code: 'IJKL9012MNOP3456',
          amount: 50,
          status: RechargeCodeStatus.REDEEMED,
          redeemedByStudentId: 'student-1',
          redeemedAt: new Date(),
        },
      ];

      mockPrisma.rechargeCodeBatch.findFirst.mockResolvedValue({
        id: batchId,
        teacherId,
        title: 'Export Test Batch',
        unitAmount: 50,
        codes: mockCodes,
      });

      const result = await service.exportBatchToExcel(batchId, teacherId, undefined);

      expect(result.codes).toHaveLength(2);
    });

    it('should throw NotFoundException for non-existent batch', async () => {
      mockPrisma.rechargeCodeBatch.findFirst.mockResolvedValue(null);

      await expect(service.exportBatchToExcel('invalid-batch', 'teacher-123', undefined))
        .rejects.toThrow(NotFoundException);
    });

    it('should filter by status', async () => {
      const batchId = 'batch-123';
      const teacherId = 'teacher-123';
      
      mockPrisma.rechargeCodeBatch.findFirst.mockResolvedValue({
        id: batchId,
        teacherId,
        title: 'Filtered Batch',
        unitAmount: 50,
        codes: [],
      });

      await service.exportBatchToExcel(batchId, teacherId, 'unused');

      expect(mockPrisma.rechargeCodeBatch.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: batchId, teacherId },
          include: {
            codes: {
              where: { status: RechargeCodeStatus.UNUSED },
              orderBy: { createdAt: 'asc' },
            },
          },
        }),
      );
    });
  });

  describe('generateSecureCode', () => {
    it('should generate unique codes', async () => {
      // Access private method through any
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        const code = await (service as any).generateSecureCode();
        expect(code).toHaveLength(16);
        expect(codes.has(code)).toBe(false);
        codes.add(code);
      }
    });
  });
});
