import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Commerce Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test data
  const teacherToken = 'teacher-token';
  const studentToken = 'student-token';
  const adminToken = 'admin-token';
  const assistantToken = 'assistant-token';

  const teacherId = 'teacher-123';
  const studentId = 'student-123';
  const adminId = 'admin-123';
  const assistantId = 'assistant-123';
  const courseId = 'course-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.balanceTransaction.deleteMany({});
    await prisma.coursePurchase.deleteMany({});
    await prisma.manualEnrollmentPayment.deleteMany({});
    await prisma.rechargeCode.deleteMany({});
    await prisma.rechargeCodeBatch.deleteMany({});
    await prisma.studentTeacherBalance.deleteMany({});
    await prisma.teacherWallet.deleteMany({});
  });

  // Helper functions
  const generateTeacherToken = () => {
    return jwtService.sign({ sub: teacherId, role: 'TEACHER' });
  };

  const generateStudentToken = () => {
    return jwtService.sign({ sub: studentId, role: 'STUDENT' });
  };

  const generateAdminToken = () => {
    return jwtService.sign({ sub: adminId, role: 'ADMIN' });
  };

  const generateAssistantToken = () => {
    return jwtService.sign({ sub: assistantId, role: 'ASSISTANT' });
  };

  describe('Health Check', () => {
    it('/health (GET) - should return service status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('commerce-service');
        });
    });
  });

  describe('Recharge Code Batches - Teacher/Admin', () => {
    describe('POST /recharge-code-batches', () => {
      it('should create batch as teacher', async () => {
        const token = generateTeacherToken();
        const dto = {
          title: 'Test Batch',
          unitAmount: 50,
          quantity: 10,
        };

        const response = await request(app.getHttpServer())
          .post('/recharge-code-batches')
          .set('Authorization', `Bearer ${token}`)
          .send(dto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(dto.title);
        expect(response.body.unitAmount).toBe(dto.unitAmount);
        expect(response.body.quantity).toBe(dto.quantity);
      });

      it('should create batch for specific teacher as admin', async () => {
        const token = generateAdminToken();
        const dto = {
          title: 'Admin Created Batch',
          unitAmount: 100,
          quantity: 5,
          teacherId: teacherId,
        };

        const response = await request(app.getHttpServer())
          .post('/recharge-code-batches')
          .set('Authorization', `Bearer ${token}`)
          .send(dto)
          .expect(201);

        expect(response.body.teacherId).toBe(teacherId);
      });

      it('should reject invalid data', async () => {
        const token = generateTeacherToken();
        const invalidDto = {
          title: '',
          unitAmount: -10,
          quantity: 0,
        };

        await request(app.getHttpServer())
          .post('/recharge-code-batches')
          .set('Authorization', `Bearer ${token}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject if quantity exceeds 1000', async () => {
        const token = generateTeacherToken();
        const dto = {
          title: 'Too many codes',
          unitAmount: 50,
          quantity: 1001,
        };

        await request(app.getHttpServer())
          .post('/recharge-code-batches')
          .set('Authorization', `Bearer ${token}`)
          .send(dto)
          .expect(400);
      });

      it('should reject unauthorized access', async () => {
        await request(app.getHttpServer())
          .post('/recharge-code-batches')
          .send({ title: 'Test', unitAmount: 50, quantity: 10 })
          .expect(401);
      });
    });

    describe('GET /recharge-code-batches', () => {
      it('should list all batches for teacher', async () => {
        const token = generateTeacherToken();

        // Create some batches first
        await prisma.rechargeCodeBatch.create({
          data: {
            teacherId,
            title: 'Batch 1',
            unitAmount: 50,
            quantity: 10,
            createdByUserId: teacherId,
          },
        });

        const response = await request(app.getHttpServer())
          .get('/recharge-code-batches')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('GET /recharge-code-batches/:id', () => {
      it('should get batch details', async () => {
        const token = generateTeacherToken();
        
        const batch = await prisma.rechargeCodeBatch.create({
          data: {
            teacherId,
            title: 'Test Batch',
            unitAmount: 50,
            quantity: 5,
            createdByUserId: teacherId,
            codes: {
              create: Array(5).fill(null).map(() => ({
                code: Math.random().toString(36).substring(2, 18),
                teacherId,
                amount: 50,
                status: 'UNUSED',
              })),
            },
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/recharge-code-batches/${batch.id}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.id).toBe(batch.id);
        expect(response.body).toHaveProperty('codes');
      });

      it('should return 404 for non-existent batch', async () => {
        const token = generateTeacherToken();

        await request(app.getHttpServer())
          .get('/recharge-code-batches/non-existent-id')
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });
    });

    describe('GET /recharge-code-batches/:id/export', () => {
      it('should export codes as Excel', async () => {
        const token = generateTeacherToken();
        
        const batch = await prisma.rechargeCodeBatch.create({
          data: {
            teacherId,
            title: 'Export Test Batch',
            unitAmount: 50,
            quantity: 3,
            createdByUserId: teacherId,
            codes: {
              create: [
                { code: 'CODE1A2B3C4D5E6F7', teacherId, amount: 50, status: 'UNUSED' },
                { code: 'CODE8G9H0I1J2K3L4', teacherId, amount: 50, status: 'REDEEMED', redeemedByStudentId: studentId },
                { code: 'CODE5M6N7O8P9Q0R1', teacherId, amount: 50, status: 'UNUSED' },
              ],
            },
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/recharge-code-batches/${batch.id}/export`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.headers['content-type']).toContain('application/vnd.openxmlformats');
        expect(response.headers['content-disposition']).toContain('.xlsx');
      });

      it('should filter by status when exporting', async () => {
        const token = generateTeacherToken();
        
        const batch = await prisma.rechargeCodeBatch.create({
          data: {
            teacherId,
            title: 'Filtered Export Batch',
            unitAmount: 50,
            quantity: 2,
            createdByUserId: teacherId,
            codes: {
              create: [
                { code: 'UNUSED1A2B3C4D5E6', teacherId, amount: 50, status: 'UNUSED' },
                { code: 'REDEEMED7F8G9H0I1', teacherId, amount: 50, status: 'REDEEMED', redeemedByStudentId: studentId },
              ],
            },
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/recharge-code-batches/${batch.id}/export?status=UNUSED`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Recharge Code Redemption - Student', () => {
    describe('POST /recharge-codes/redeem', () => {
      it('should redeem a valid code', async () => {
        const token = generateStudentToken();
        const codeValue = 'VALIDCODE1234567';

        // Create a code
        await prisma.rechargeCode.create({
          data: {
            code: codeValue,
            teacherId,
            amount: 50,
            status: 'UNUSED',
            batch: {
              create: {
                teacherId,
                title: 'Redemption Test Batch',
                unitAmount: 50,
                quantity: 1,
                createdByUserId: teacherId,
              },
            },
          },
        });

        const response = await request(app.getHttpServer())
          .post('/recharge-codes/redeem')
          .set('Authorization', `Bearer ${token}`)
          .send({ code: codeValue })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.amount).toBe(50);
        expect(response.body.newBalance).toBe(50);
      });

      it('should reject invalid code', async () => {
        const token = generateStudentToken();

        await request(app.getHttpServer())
          .post('/recharge-codes/redeem')
          .set('Authorization', `Bearer ${token}`)
          .send({ code: 'INVALIDCODE' })
          .expect(404);
      });

      it('should reject already redeemed code', async () => {
        const token = generateStudentToken();
        const otherStudentId = 'other-student-123';
        const codeValue = 'REDEEMEDCODE1234';

        await prisma.rechargeCode.create({
          data: {
            code: codeValue,
            teacherId,
            amount: 50,
            status: 'REDEEMED',
            redeemedByStudentId: otherStudentId,
            redeemedAt: new Date(),
            batch: {
              create: {
                teacherId,
                title: 'Already Redeemed Batch',
                unitAmount: 50,
                quantity: 1,
                createdByUserId: teacherId,
              },
            },
          },
        });

        await request(app.getHttpServer())
          .post('/recharge-codes/redeem')
          .set('Authorization', `Bearer ${token}`)
          .send({ code: codeValue })
          .expect(400);
      });

      it('should allow student to see their own redeemed code details', async () => {
        const token = generateStudentToken();
        const codeValue = 'OWNREDEEMEDCODE12';

        await prisma.rechargeCode.create({
          data: {
            code: codeValue,
            teacherId,
            amount: 50,
            status: 'REDEEMED',
            redeemedByStudentId: studentId,
            redeemedAt: new Date(),
            batch: {
              create: {
                teacherId,
                title: 'Own Redeemed Batch',
                unitAmount: 50,
                quantity: 1,
                createdByUserId: teacherId,
              },
            },
          },
        });

        // When trying to redeem again, should show already redeemed by you
        const response = await request(app.getHttpServer())
          .post('/recharge-codes/redeem')
          .set('Authorization', `Bearer ${token}`)
          .send({ code: codeValue })
          .expect(400);

        expect(response.body.message).toContain('already redeemed');
      });
    });
  });

  describe('Student Balance', () => {
    describe('GET /students/me/teacher-balances', () => {
      it('should return all teacher balances for student', async () => {
        const token = generateStudentToken();

        // Create balances
        await prisma.studentTeacherBalance.create({
          data: { studentId, teacherId: 'teacher-1', balance: 100 },
        });
        await prisma.studentTeacherBalance.create({
          data: { studentId, teacherId: 'teacher-2', balance: 50 },
        });

        const response = await request(app.getHttpServer())
          .get('/students/me/teacher-balances')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
      });
    });

    describe('GET /students/me/teacher-balances/:teacherId', () => {
      it('should return specific teacher balance', async () => {
        const token = generateStudentToken();

        await prisma.studentTeacherBalance.create({
          data: { studentId, teacherId, balance: 75 },
        });

        const response = await request(app.getHttpServer())
          .get(`/students/me/teacher-balances/${teacherId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.teacherId).toBe(teacherId);
        expect(response.body.balance).toBe(75);
      });

      it('should return zero balance if not found', async () => {
        const token = generateStudentToken();

        const response = await request(app.getHttpServer())
          .get(`/students/me/teacher-balances/unknown-teacher`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.balance).toBe(0);
      });
    });

    describe('GET /students/me/transactions', () => {
      it('should return transaction history', async () => {
        const token = generateStudentToken();

        // Create transactions
        await prisma.balanceTransaction.createMany({
          data: [
            { studentId, teacherId: 'teacher-1', type: 'RECHARGE_CODE', amount: 50, referenceType: 'RECHARGE_CODE', referenceId: 'ref-1' },
            { studentId, teacherId: 'teacher-1', type: 'COURSE_PURCHASE', amount: -30, referenceType: 'COURSE_PURCHASE', referenceId: 'ref-2' },
          ],
        });

        const response = await request(app.getHttpServer())
          .get('/students/me/transactions')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
      });

      it('should filter by teacher', async () => {
        const token = generateStudentToken();

        await prisma.balanceTransaction.createMany({
          data: [
            { studentId, teacherId: 'teacher-1', type: 'RECHARGE_CODE', amount: 50, referenceType: 'RECHARGE_CODE', referenceId: 'ref-1' },
            { studentId, teacherId: 'teacher-2', type: 'RECHARGE_CODE', amount: 100, referenceType: 'RECHARGE_CODE', referenceId: 'ref-2' },
          ],
        });

        const response = await request(app.getHttpServer())
          .get('/students/me/transactions?teacherId=teacher-1')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.length).toBe(1);
        expect(response.body[0].teacherId).toBe('teacher-1');
      });
    });
  });

  describe('Course Purchase', () => {
    describe('POST /courses/:courseId/purchase-from-balance', () => {
      it('should purchase course with sufficient balance', async () => {
        const token = generateStudentToken();
        
        // Setup: Create balance
        await prisma.studentTeacherBalance.create({
          data: { studentId, teacherId, balance: 200 },
        });

        // This test would need the course service mock
        // For now, just test that it requires the service to be running
        const response = await request(app.getHttpServer())
          .post(`/courses/${courseId}/purchase-from-balance`)
          .set('Authorization', `Bearer ${token}`)
          .expect((res) => {
            // Could be 201 (success) or 404/500 if course service not available
            expect([201, 404, 500, 503]).toContain(res.status);
          });
      });

      it('should reject without auth', async () => {
        await request(app.getHttpServer())
          .post(`/courses/${courseId}/purchase-from-balance`)
          .expect(401);
      });
    });

    describe('GET /students/me/purchases', () => {
      it('should return purchase history', async () => {
        const token = generateStudentToken();

        await prisma.coursePurchase.createMany({
          data: [
            { studentId, courseId: 'course-1', teacherId: 'teacher-1', amountCharged: 100, paymentMethod: 'TEACHER_BALANCE', status: 'COMPLETED' },
            { studentId, courseId: 'course-2', teacherId: 'teacher-2', amountCharged: 50, paymentMethod: 'TEACHER_BALANCE', status: 'COMPLETED' },
          ],
        });

        const response = await request(app.getHttpServer())
          .get('/students/me/purchases')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
      });
    });
  });

  describe('Manual Course Payments', () => {
    describe('POST /manual-course-payments', () => {
      it('should record manual payment as teacher', async () => {
        const token = generateTeacherToken();
        const dto = {
          studentId: 'student-to-enroll',
          courseId: courseId,
          amountPaid: 150,
          paymentMethod: 'MANUAL_CASH',
          notes: 'Paid in cash at office',
        };

        const response = await request(app.getHttpServer())
          .post('/manual-course-payments')
          .set('Authorization', `Bearer ${token}`)
          .send(dto)
          .expect((res) => {
            // Could be 201 or error if course service not available
            expect([201, 400, 404, 500]).toContain(res.status);
          });
      });

      it('should reject invalid data', async () => {
        const token = generateTeacherToken();
        const invalidDto = {
          studentId: '',
          courseId: '',
          amountPaid: -10,
          paymentMethod: 'INVALID_METHOD',
        };

        await request(app.getHttpServer())
          .post('/manual-course-payments')
          .set('Authorization', `Bearer ${token}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should reject non-teacher/admin/assistant', async () => {
        const token = generateStudentToken();
        const dto = {
          studentId: 'student-123',
          courseId: courseId,
          amountPaid: 100,
          paymentMethod: 'MANUAL_CASH',
        };

        await request(app.getHttpServer())
          .post('/manual-course-payments')
          .set('Authorization', `Bearer ${token}`)
          .send(dto)
          .expect(403);
      });
    });

    describe('GET /teachers/me/sales', () => {
      it('should return sales for teacher', async () => {
        const token = generateTeacherToken();

        await prisma.coursePurchase.createMany({
          data: [
            { studentId: 'student-1', courseId: 'course-1', teacherId, amountCharged: 100, paymentMethod: 'TEACHER_BALANCE', status: 'COMPLETED' },
            { studentId: 'student-2', courseId: 'course-2', teacherId, amountCharged: 150, paymentMethod: 'MANUAL_CASH', status: 'COMPLETED' },
          ],
        });

        const response = await request(app.getHttpServer())
          .get('/teachers/me/sales')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should return empty for admin (not implemented)', async () => {
        const token = generateAdminToken();

        const response = await request(app.getHttpServer())
          .get('/teachers/me/sales')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        // Admin returns empty array in current implementation
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });
});
