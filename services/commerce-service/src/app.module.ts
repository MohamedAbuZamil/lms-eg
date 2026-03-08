import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RechargeCodeModule } from './recharge-code/recharge-code.module';
import { BalanceModule } from './balance/balance.module';
import { PurchaseModule } from './purchase/purchase.module';
import { IntegrationModule } from './integration/integration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
    AuthModule,
    IntegrationModule,
    RechargeCodeModule,
    BalanceModule,
    PurchaseModule,
  ],
})
export class AppModule {}
