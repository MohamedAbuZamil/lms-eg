import { Module } from "@nestjs/common";
import { CourseController } from "./course.controller";
import { CourseService } from "./course.service";
import { PrismaService } from "./prisma.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [CourseController],
  providers: [CourseService, PrismaService],
})
export class AppModule {}
