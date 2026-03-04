import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

describe('Auth E2E', () => {
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
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } },
    });
  });

  describe('/auth/me', () => {
    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 when invalid token is provided', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return user data when valid token is provided', async () => {
      // Create a test user
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          mobile: '+1234567890',
          name: 'Test User',
          passwordHash,
        },
      });

      // Generate JWT token
      const token = await jwt.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      // Test /auth/me endpoint
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      });
    });

    it('should return 401 when user does not exist', async () => {
      // Generate token with non-existent user ID
      const token = await jwt.signAsync({
        sub: 'non-existent-uuid',
        email: 'nonexistent@example.com',
        role: 'STUDENT',
      });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Complete Auth Flow', () => {
    it('should register, login, and access /auth/me', async () => {
      // Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'flowtest@example.com',
          mobile: '+1234567890',
          password: 'password123',
          name: 'Flow Test User',
        })
        .expect(HttpStatus.CREATED);

      expect(registerResponse.body.email).toBe('flowtest@example.com');

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'flowtest@example.com',
          password: 'password123',
        })
        .expect(HttpStatus.OK);

      const { accessToken } = loginResponse.body;
      expect(accessToken).toBeDefined();

      // Access /auth/me
      const meResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(meResponse.body.email).toBe('flowtest@example.com');
      expect(meResponse.body.name).toBe('Flow Test User');
    });
  });
});
