import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-uuid',
    email: 'test@example.com',
    mobile: '+1234567890',
    name: 'Test User',
    role: UserRole.STUDENT,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('getCurrentUser', () => {
    it('should return user data when valid token is provided', async () => {
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockUser);

      const result = await authController.getCurrentUser('test-uuid');

      expect(result).toEqual(mockUser);
      expect(authService.getCurrentUser).toHaveBeenCalledWith('test-uuid');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(authService, 'getCurrentUser').mockRejectedValue(
        new UnauthorizedException('Unauthorized')
      );

      await expect(authController.getCurrentUser('invalid-uuid')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
