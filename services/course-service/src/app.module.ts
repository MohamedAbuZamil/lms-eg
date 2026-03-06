import { Module } from "@nestjs/common";
import { CourseController, TeacherController } from "./course.controller";
import { GradeController } from "./grade.controller";
import { CourseService } from "./course.service";
import { GradeService } from "./grade.service";
import { PrismaService } from "./prisma.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [CourseController, TeacherController, GradeController],
  providers: [CourseService, GradeService, PrismaService],
})
export class AppModule {}
