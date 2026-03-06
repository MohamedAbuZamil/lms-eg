import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CourseService } from "./course.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RolesGuard } from "./auth/roles.guard";
import { Roles, Role } from "./auth/roles.decorator";
import { CurrentUser } from "./auth/decorators/current-user.decorator";

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get("health")
  health() {
    return { status: "ok" };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser("sub") teacherId: string,
  ) {
    return this.courseService.createCourse(createCourseDto, teacherId);
  }

  @Get()
  async getAllCourses() {
    return this.courseService.getAllCourses();
  }

  @Get(":id")
  async getCourseById(@Param("id") id: string) {
    return this.courseService.getCourseById(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  async updateCourse(
    @Param("id") id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser("sub") teacherId: string,
  ) {
    return this.courseService.updateCourse(id, updateCourseDto, teacherId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param("id") id: string, @CurrentUser("sub") teacherId: string) {
    return this.courseService.deleteCourse(id, teacherId);
  }
}

// Separate controller for teachers routes
@Controller('teachers')
export class TeacherController {
  constructor(private readonly courseService: CourseService) {}

  @Get("me/courses")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  async getMyCourses(@CurrentUser("sub") teacherId: string) {
    return this.courseService.getTeacherCourses(teacherId);
  }
}
