import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';

@Injectable()
export class GradeService {
  constructor(private readonly prisma: PrismaService) {}

  async createGrade(createGradeDto: CreateGradeDto) {
    try {
      const grade = await this.prisma.grade.create({
        data: createGradeDto,
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      return grade;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Grade with this name already exists');
      }
      throw error;
    }
  }

  async getAllGrades() {
    const grades = await this.prisma.grade.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return grades;
  }

  async getGradeById(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  async validateGradeExists(gradeId: string): Promise<boolean> {
    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
      select: { id: true },
    });

    return !!grade;
  }
}
