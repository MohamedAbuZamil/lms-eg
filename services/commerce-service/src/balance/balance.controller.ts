import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BalanceService } from './balance.service';
import { RolesGuard, Role, Roles, CurrentUser } from '../auth/guards/roles.guard';

@ApiTags('Student Balance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('students')
export class BalanceController {
  constructor(private balanceService: BalanceService) {}

  @Get('me/teacher-balances')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get all teacher balances for current student' })
  async getMyTeacherBalances(@CurrentUser() user: { sub: string }) {
    return this.balanceService.getStudentTeacherBalances(user.sub);
  }

  @Get('me/teacher-balances/:teacherId')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get balance with specific teacher' })
  async getMyTeacherBalance(
    @CurrentUser() user: { sub: string },
    @Param('teacherId') teacherId: string,
  ) {
    return this.balanceService.getStudentTeacherBalance(user.sub, teacherId);
  }

  @Get('me/transactions')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get transaction history' })
  async getMyTransactions(
    @CurrentUser() user: { sub: string },
    @Param('teacherId') teacherId?: string,
  ) {
    return this.balanceService.getStudentTransactions(user.sub, teacherId);
  }
}
