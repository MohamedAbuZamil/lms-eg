import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { RechargeCodeService } from './recharge-code.service';
import { CreateRechargeCodeBatchDto, RedeemCodeDto } from './dto/recharge-code.dto';
import { RolesGuard, Role, Roles, CurrentUser } from '../auth/guards/roles.guard';

@ApiTags('Recharge Codes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class RechargeCodeController {
  constructor(private rechargeCodeService: RechargeCodeService) {}

  @Post('recharge-code-batches')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a batch of recharge codes' })
  async createBatch(
    @Body() dto: CreateRechargeCodeBatchDto,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    const teacherId = user.role === Role.ADMIN && dto.teacherId
      ? dto.teacherId
      : user.sub;

    return this.rechargeCodeService.createBatch(teacherId, dto, user.sub);
  }

  @Get('recharge-code-batches')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Get all batches for a teacher' })
  async getTeacherBatches(
    @CurrentUser() user: { sub: string; role: string },
    @Query('teacherId') teacherId?: string,
  ) {
    const targetTeacherId = user.role === Role.ADMIN && teacherId
      ? teacherId
      : user.sub;

    return this.rechargeCodeService.getTeacherBatches(targetTeacherId);
  }

  @Get('recharge-code-batches/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Get batch details with codes' })
  async getBatchDetails(
    @Param('id') batchId: string,
    @CurrentUser() user: { sub: string; role: string },
  ) {
    const teacherId = user.sub;
    return this.rechargeCodeService.getBatchDetails(batchId, teacherId);
  }

  @Get('recharge-code-batches/:id/export')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Export batch codes to Excel' })
  @ApiQuery({ name: 'filter', enum: ['used', 'unused'], required: false })
  async exportBatch(
    @Param('id') batchId: string,
    @Query('filter') filter: 'used' | 'unused',
    @CurrentUser() user: { sub: string },
    @Res() res: Response,
  ) {
    const data = await this.rechargeCodeService.exportBatchToExcel(
      batchId,
      user.sub,
      filter,
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Recharge Codes');

    worksheet.columns = [
      { header: 'Code', key: 'code', width: 20 },
      { header: 'Amount (EGP)', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Redeemed By Student ID', key: 'redeemedByStudentId', width: 40 },
      { header: 'Redeemed At', key: 'redeemedAt', width: 20 },
    ];

    data.codes.forEach((code) => {
      worksheet.addRow({
        code: code.code,
        amount: code.amount,
        status: code.status,
        redeemedByStudentId: code.redeemedByStudentId || '-',
        redeemedAt: code.redeemedAt
          ? new Date(code.redeemedAt).toLocaleString()
          : '-',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=recharge-codes-${batchId}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Post('recharge-codes/redeem')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Redeem a recharge code' })
  async redeemCode(
    @Body() dto: RedeemCodeDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.rechargeCodeService.redeemCode(user.sub, dto);
  }
}
