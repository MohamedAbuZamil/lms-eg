import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("Course E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwt = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.course.deleteMany();
  });

  describe("/health", () => {
    it("should return status ok", () => {
      return request(app.getHttpServer())
        .get("/health")
        .expect(HttpStatus.OK)
        .expect({ status: "ok" });
    });
  });

  describe("/courses", () => {
    const teacherToken = "mock_teacher_token";
    const studentToken = "mock_student_token";

    it("should create course when teacher is authenticated", async () => {
      const courseData = {
        title: "Test Course",
        description: "Test Description",
        price: 99,
      };

      jest.spyOn(jwt, "verifyAsync").mockResolvedValue({
        sub: "teacher-123",
        email: "teacher@example.com",
        role: "TEACHER",
      });

      const response = await request(app.getHttpServer())
        .post("/courses")
        .set("Authorization", `Bearer ${teacherToken}`)
        .send(courseData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        teacherId: "teacher-123",
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it("should return 401 when student tries to create course", async () => {
      const courseData = {
        title: "Test Course",
        price: 99,
      };

      jest.spyOn(jwt, "verifyAsync").mockResolvedValue({
        sub: "student-123",
        email: "student@example.com",
        role: "STUDENT",
      });

      return request(app.getHttpServer())
        .post("/courses")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(courseData)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("should return courses list", async () => {
      await prisma.course.create({
        data: {
          title: "Course 1",
          price: 100,
          teacherId: "teacher-1",
        },
      });

      await prisma.course.create({
        data: {
          title: "Course 2",
          price: 200,
          teacherId: "teacher-2",
        },
      });

      const response = await request(app.getHttpServer())
        .get("/courses")
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        title: "Course 1",
        price: 100,
        teacherId: "teacher-1",
      });
      expect(response.body[1]).toMatchObject({
        title: "Course 2",
        price: 200,
        teacherId: "teacher-2",
      });
    });
  });

  describe("/courses/:id", () => {
    it("should return course by id", async () => {
      const course = await prisma.course.create({
        data: {
          title: "Test Course",
          description: "Test Description",
          price: 150,
          teacherId: "teacher-123",
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/courses/${course.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        teacherId: course.teacherId,
      });
    });

    it("should return 404 for non-existent course", () => {
      return request(app.getHttpServer())
        .get("/courses/non-existent-id")
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
