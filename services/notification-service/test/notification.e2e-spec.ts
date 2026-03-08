import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/notifications/me (GET) - should require authentication', () => {
    return request(app.getHttpServer())
      .get('/notifications/me')
      .expect(401);
  });

  it('/announcements (GET) - should return announcements without auth', () => {
    return request(app.getHttpServer())
      .get('/announcements')
      .expect(200);
  });
});
