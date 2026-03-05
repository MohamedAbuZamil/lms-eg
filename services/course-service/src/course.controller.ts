import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CourseService } from "./course.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RolesGuard } from "./auth/roles.guard";
import { Roles, Role } from "./auth/roles.decorator";
import { CurrentUser } from "./auth/decorators/current-user.decorator";

@Controller()
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get("health")
  health() {
    return { status: "ok" };
  }

  @Post("courses")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser("sub") teacherId: string,
  ) {
    return this.courseService.createCourse(createCourseDto, teacherId);
  }

  @Get("courses")
  async getAllCourses() {
    return this.courseService.getAllCourses();
  }

  @Get("courses/:id")
  async getCourseById(@Param("id") id: string) {
    return this.courseService.getCourseById(id);
  }
}
