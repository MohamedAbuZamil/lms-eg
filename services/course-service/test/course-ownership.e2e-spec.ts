import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import supertest from 'supertest';

describe('Course Ownership E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const teacherToken = 'teacher.jwt.token';
  const otherTeacherToken = 'other.teacher.jwt.token';
  const studentToken = 'student.jwt.token';

  const teacherUser = {
    sub: 'teacher-123',
    email: 'teacher@example.com',
    role: 'TEACHER',
  };

  const otherTeacherUser = {
    sub: 'other-teacher-456',
    email: 'other-teacher@example.com',
    role: 'TEACHER',
  };

  const studentUser = {
    sub: 'student-789',
    email: 'student@example.com',
    role: 'STUDENT',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        JwtModule.register({
          secret: 'test-secret',
        }),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers.authorization;
          
          if (authHeader === `Bearer ${teacherToken}`) {
            req.user = teacherUser;
            return true;
          } else if (authHeader === `Bearer ${otherTeacherToken}`) {
            req.user = otherTeacherUser;
            return true;
          } else if (authHeader === `Bearer ${studentToken}`) {
            req.user = studentUser;
            return true;
          }
          return false;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          return req.user.role === 'TEACHER';
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    // Clean up database
    await prisma.course.deleteMany();
    await app.close();
  });

  describe('PATCH /courses/:id', () => {
    let teacherCourse: any;
    let otherTeacherCourse: any;

    beforeEach(async () => {
      // Create test courses
      teacherCourse = await prisma.course.create({
        data: {
          title: 'Teacher Course',
          description: 'Original description',
          price: 99,
          teacherId: teacherUser.sub,
        },
      });

      otherTeacherCourse = await prisma.course.create({
        data: {
          title: 'Other Teacher Course',
          description: 'Other description',
          price: 149,
          teacherId: otherTeacherUser.sub,
        },
      });
    });

    it('should allow teacher to update own course', () => {
      return supertest(app.getHttpServer())
        .patch(`/courses/${teacherCourse.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
          price: 199,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Title');
          expect(res.body.description).toBe('Updated description');
          expect(res.body.price).toBe(199);
        });
    });

    it('should allow partial update of course', () => {
      return supertest(app.getHttpServer())
        .patch(`/courses/${teacherCourse.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Only Title Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Only Title Updated');
          expect(res.body.description).toBe('Original description'); // unchanged
          expect(res.body.price).toBe(99); // unchanged
        });
    });

    it('should reject update when teacher tries to update another teacher\'s course', () => {
      return supertest(app.getHttpServer())
        .patch(`/courses/${otherTeacherCourse.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Hijacked Title',
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe('You can only update your own courses');
        });
    });

    it('should reject update for non-existent course', () => {
      return supertest(app.getHttpServer())
        .patch('/courses/non-existent-id')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);
    });

    it('should reject update without authentication', () => {
      return supertest(app.getHttpServer())
        .patch(`/courses/${teacherCourse.id}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });

    it('should reject update for student role', () => {
      return supertest(app.getHttpServer())
        .patch(`/courses/${teacherCourse.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(403);
    });

    it('should return 409 for duplicate title', async () => {
      // Create another course for the same teacher
      await prisma.course.create({
        data: {
          title: 'Duplicate Title',
          description: 'Another course',
          price: 79,
          teacherId: teacherUser.sub,
        },
      });

      return supertest(app.getHttpServer())
        .patch(`/courses/${teacherCourse.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Duplicate Title',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('Course with this title already exists for this teacher');
        });
    });

    it('should validate update data', () => {
      return supertest(app.getHttpServer())
        .patch(`/courses/${teacherCourse.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: '', // empty title
          price: -10, // negative price
        })
        .expect(400);
    });
  });

  describe('DELETE /courses/:id', () => {
    let teacherCourse: any;
    let otherTeacherCourse: any;

    beforeEach(async () => {
      // Create test courses
      teacherCourse = await prisma.course.create({
        data: {
          title: 'Teacher Course to Delete',
          description: 'Will be deleted',
          price: 99,
          teacherId: teacherUser.sub,
        },
      });

      otherTeacherCourse = await prisma.course.create({
        data: {
          title: 'Other Teacher Course',
          description: 'Should not be deleted',
          price: 149,
          teacherId: otherTeacherUser.sub,
        },
      });
    });

    it('should allow teacher to delete own course', () => {
      return supertest(app.getHttpServer())
        .delete(`/courses/${teacherCourse.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(204);
    });

    it('should reject delete when teacher tries to delete another teacher\'s course', () => {
      return supertest(app.getHttpServer())
        .delete(`/courses/${otherTeacherCourse.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe('You can only delete your own courses');
        });
    });

    it('should reject delete for non-existent course', () => {
      return supertest(app.getHttpServer())
        .delete('/courses/non-existent-id')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });

    it('should reject delete without authentication', () => {
      return supertest(app.getHttpServer())
        .delete(`/courses/${teacherCourse.id}`)
        .expect(401);
    });

    it('should reject delete for student role', () => {
      return supertest(app.getHttpServer())
        .delete(`/courses/${teacherCourse.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('GET /teachers/me/courses', () => {
    beforeEach(async () => {
      // Create courses for different teachers
      await prisma.course.createMany({
        data: [
          {
            title: 'Teacher Course 1',
            description: 'First course',
            price: 99,
            teacherId: teacherUser.sub,
            createdAt: new Date('2023-01-01'),
          },
          {
            title: 'Teacher Course 2',
            description: 'Second course',
            price: 149,
            teacherId: teacherUser.sub,
            createdAt: new Date('2023-01-02'),
          },
          {
            title: 'Other Teacher Course',
            description: 'Other course',
            price: 79,
            teacherId: otherTeacherUser.sub,
            createdAt: new Date('2023-01-03'),
          },
        ],
      });
    });

    it('should return only teacher\'s own courses', () => {
      return supertest(app.getHttpServer())
        .get('/teachers/me/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].title).toBe('Teacher Course 2'); // newest first
          expect(res.body[1].title).toBe('Teacher Course 1');
          expect(res.body.every(course => course.teacherId === teacherUser.sub)).toBe(true);
        });
    });

    it('should return empty array for teacher with no courses', () => {
      return supertest(app.getHttpServer())
        .get('/teachers/me/courses')
        .set('Authorization', `Bearer ${otherTeacherToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(0);
        });
    });

    it('should reject supertest without authentication', () => {
      return supertest(app.getHttpServer())
        .get('/teachers/me/courses')
        .expect(401);
    });

    it('should reject supertest for student role', () => {
      return supertest(app.getHttpServer())
        .get('/teachers/me/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
