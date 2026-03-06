import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GradeService } from './grade.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles, Role } from './auth/roles.decorator';

@Controller('grades')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createGrade(@Body() createGradeDto: CreateGradeDto) {
    return this.gradeService.createGrade(createGradeDto);
  }

  @Get()
  async getAllGrades() {
    return this.gradeService.getAllGrades();
  }

  @Get(':id')
  async getGradeById(@Param('id') id: string) {
    return this.gradeService.getGradeById(id);
  }
}
