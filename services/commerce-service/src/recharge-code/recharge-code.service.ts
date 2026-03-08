import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RechargeCodeStatus, TransactionType } from '@prisma/client';
import { CreateRechargeCodeBatchDto, RedeemCodeDto, RedeemCodeResponseDto } from './dto/recharge-code.dto';
import * as crypto from 'crypto';

@Injectable()
export class RechargeCodeService {
  constructor(private prisma: PrismaService) {}

  private generateSecureCode(): string {
    // Generate a secure 16-character alphanumeric code
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  async createBatch(
    teacherId: string,
    dto: CreateRechargeCodeBatchDto,
    createdByUserId: string,
  ) {
    // Ensure teacher wallet exists
    await this.prisma.teacherWallet.upsert({
      where: { teacherId },
      create: { teacherId },
      update: {},
    });

    const batch = await this.prisma.rechargeCodeBatch.create({
      data: {
        teacherId,
        title: dto.title,
        unitAmount: dto.unitAmount,
        quantity: dto.quantity,
        createdByUserId,
      },
    });

    // Generate unique codes
    const codes: string[] = [];
    for (let i = 0; i < dto.quantity; i++) {
      let code: string;
      let attempts = 0;
      do {
        code = this.generateSecureCode();
        attempts++;
        if (attempts > 100) {
          throw new BadRequestException('Failed to generate unique codes');
        }
      } while (codes.includes(code));
      codes.push(code);
    }

    // Create recharge codes
    await this.prisma.rechargeCode.createMany({
      data: codes.map((code) => ({
        batchId: batch.id,
        teacherId,
        code,
        amount: dto.unitAmount,
        status: RechargeCodeStatus.UNUSED,
      })),
    });

    return {
      batchId: batch.id,
      title: dto.title,
      unitAmount: dto.unitAmount,
      quantity: dto.quantity,
      generatedCodes: codes.length,
    };
  }

  async getTeacherBatches(teacherId: string) {
    return this.prisma.rechargeCodeBatch.findMany({
      where: { teacherId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatchDetails(batchId: string, teacherId: string) {
    const batch = await this.prisma.rechargeCodeBatch.findFirst({
      where: { id: batchId, teacherId },
      include: {
        codes: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }

  async redeemCode(
    studentId: string,
    dto: RedeemCodeDto,
  ): Promise<RedeemCodeResponseDto> {
    const code = await this.prisma.rechargeCode.findUnique({
      where: { code: dto.code },
    });

    if (!code) {
      return { success: false, message: 'Invalid code' };
    }

    if (code.status !== RechargeCodeStatus.UNUSED) {
      return {
        success: false,
        message: `Code has already been ${code.status.toLowerCase()}`,
      };
    }

    // Mark code as redeemed
    await this.prisma.rechargeCode.update({
      where: { id: code.id },
      data: {
        status: RechargeCodeStatus.REDEEMED,
        redeemedByStudentId: studentId,
        redeemedAt: new Date(),
      },
    });

    // Add balance to student for this teacher
    const balance = await this.prisma.studentTeacherBalance.upsert({
      where: {
        studentId_teacherId: {
          studentId,
          teacherId: code.teacherId,
        },
      },
      create: {
        studentId,
        teacherId: code.teacherId,
        balance: code.amount,
      },
      update: {
        balance: {
          increment: code.amount,
        },
      },
    });

    // Create transaction record
    await this.prisma.balanceTransaction.create({
      data: {
        studentId,
        teacherId: code.teacherId,
        type: TransactionType.RECHARGE_CODE,
        amount: code.amount,
        referenceType: 'RECHARGE_CODE',
        referenceId: code.id,
      },
    });

    return {
      success: true,
      message: 'Code redeemed successfully',
      amount: code.amount,
      teacherId: code.teacherId,
      newBalance: balance.balance,
    };
  }

  async exportBatchToExcel(
    batchId: string,
    teacherId: string,
    filter?: 'used' | 'unused',
  ) {
    const batch = await this.prisma.rechargeCodeBatch.findFirst({
      where: { id: batchId, teacherId },
      include: {
        codes: {
          where: filter
            ? {
                status:
                  filter === 'used'
                    ? RechargeCodeStatus.REDEEMED
                    : RechargeCodeStatus.UNUSED,
              }
            : undefined,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return {
      batchTitle: batch.title,
      teacherId: batch.teacherId,
      unitAmount: batch.unitAmount,
      codes: batch.codes.map((code) => ({
        code: code.code,
        amount: code.amount,
        status: code.status,
        redeemedByStudentId: code.redeemedByStudentId,
        redeemedByStudentName: null, // Would need identity service lookup
        redeemedAt: code.redeemedAt,
      })),
    };
  }
}
