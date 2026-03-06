import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createStaff(createStaffDto: CreateStaffDto, teacherId: string) {
    // Prevent teacher from assigning themselves
    if (createStaffDto.assistantUserId === teacherId) {
      throw new BadRequestException('Teacher cannot assign themselves as an assistant');
    }

    try {
      const staff = await this.prisma.teacherStaff.create({
        data: {
          teacherId,
          ...createStaffDto,
        },
      });

      return staff;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Assistant is already assigned to this teacher');
      }
      throw error;
    }
  }

  async getTeacherStaff(teacherId: string) {
    const staff = await this.prisma.teacherStaff.findMany({
      where: {
        teacherId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return staff;
  }

  async getStaffById(id: string, currentUserId: string, currentUserRole: string) {
    const staff = await this.prisma.teacherStaff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff record not found');
    }

    // Check permissions: TEACHER can only access their own staff, ADMIN can access all
    if (currentUserRole === 'TEACHER' && staff.teacherId !== currentUserId) {
      throw new ForbiddenException('You can only access your own staff records');
    }

    return staff;
  }

  async updateStaff(id: string, updateStaffDto: UpdateStaffDto, teacherId: string) {
    // First check if staff exists and belongs to the teacher
    const existingStaff = await this.prisma.teacherStaff.findUnique({
      where: { id },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff record not found');
    }

    if (existingStaff.teacherId !== teacherId) {
      throw new ForbiddenException('You can only update your own staff records');
    }

    const updatedStaff = await this.prisma.teacherStaff.update({
      where: { id },
      data: updateStaffDto,
    });

    return updatedStaff;
  }

  async deleteStaff(id: string, teacherId: string) {
    // First check if staff exists and belongs to the teacher
    const existingStaff = await this.prisma.teacherStaff.findUnique({
      where: { id },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!existingStaff) {
      throw new NotFoundException('Staff record not found');
    }

    if (existingStaff.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own staff records');
    }

    await this.prisma.teacherStaff.delete({
      where: { id },
    });
  }

  async getAssistantTeachers(assistantUserId: string) {
    const staff = await this.prisma.teacherStaff.findMany({
      where: {
        assistantUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return staff;
  }

  async getAllStaff() {
    const staff = await this.prisma.teacherStaff.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return staff;
  }
}
