import { Test, TestingModule } from "@nestjs/testing";
import { CourseController } from "./course.controller";
import { CourseService } from "./course.service";
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

describe("CourseController", () => {
  let courseController: CourseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        {
          provide: CourseService,
          useValue: {
            createCourse: jest.fn(),
            getAllCourses: jest.fn(),
            getCourseById: jest.fn(),
          },
        },
      ],
      imports: [
        JwtModule.register({
          secret: 'test-secret',
        }),
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    courseController = module.get<CourseController>(CourseController);
  });

  describe("health", () => {
    it("should return status ok", () => {
      expect(courseController.health()).toEqual({ status: "ok" });
    });
  });
});
