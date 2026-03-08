import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RechargeCodeController } from './recharge-code.controller';
import { RechargeCodeService } from './recharge-code.service';

@Module({
  imports: [PrismaModule],
  controllers: [RechargeCodeController],
  providers: [RechargeCodeService],
  exports: [RechargeCodeService],
})
export class RechargeCodeModule {}
