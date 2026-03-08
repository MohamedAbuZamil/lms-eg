import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private prisma: PrismaService) {}

  async getStudentTeacherBalances(studentId: string) {
    const balances = await this.prisma.studentTeacherBalance.findMany({
      where: { studentId },
      select: {
        teacherId: true,
        balance: true,
        updatedAt: true,
      },
    });

    return balances.map((b) => ({
      teacherId: b.teacherId,
      balance: b.balance,
      lastUpdated: b.updatedAt,
    }));
  }

  async getStudentTeacherBalance(studentId: string, teacherId: string) {
    const balance = await this.prisma.studentTeacherBalance.findUnique({
      where: {
        studentId_teacherId: {
          studentId,
          teacherId,
        },
      },
    });

    if (!balance) {
      return {
        teacherId,
        balance: 0,
        lastUpdated: null,
      };
    }

    return {
      teacherId: balance.teacherId,
      balance: balance.balance,
      lastUpdated: balance.updatedAt,
    };
  }

  async getStudentTransactions(studentId: string, teacherId?: string) {
    return this.prisma.balanceTransaction.findMany({
      where: {
        studentId,
        ...(teacherId && { teacherId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
