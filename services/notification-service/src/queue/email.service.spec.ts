import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        EMAIL_ENABLED: 'true',
        EMAIL_PROVIDER: 'smtp',
        EMAIL_FROM: 'test@example.com',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@gmail.com',
        SMTP_PASS: 'password',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('verifyConnection', () => {
    it('should return false when email is disabled', async () => {
      const disabledConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'EMAIL_ENABLED') return 'false';
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();
      const disabledService = module.get<EmailService>(EmailService);

      const result = await disabledService.verifyConnection();
      expect(result).toBe(false);
    });
  });

  describe('sendBulkEmails', () => {
    it('should handle empty array without throwing', async () => {
      await expect(service.sendBulkEmails([])).resolves.not.toThrow();
    });
  });
});
