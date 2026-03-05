import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('auth/register')
  async register(@Body() dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        mobile: dto.mobile,
        name: dto.name,
        role: dto.role ?? 'STUDENT',
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload);

    return { accessToken };
  }
}
