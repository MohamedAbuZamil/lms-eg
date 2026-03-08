import { Controller, Post, Get, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseService } from './purchase.service';
import { CreateManualPaymentDto, PurchaseFromBalanceDto } from './dto/purchase.dto';
import { RolesGuard, Role, Roles, CurrentUser } from '../auth/guards/roles.guard';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  @Post('courses/:courseId/purchase-from-balance')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Purchase a course using teacher balance' })
  async purchaseFromBalance(
    @Param('courseId') courseId: string,
    @Body() dto: PurchaseFromBalanceDto,
    @CurrentUser() user: { sub: string },
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader.replace('Bearer ', '');
    return this.purchaseService.purchaseFromBalance(user.sub, courseId, token);
  }

  @Post('manual-course-payments')
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  @ApiOperation({ summary: 'Record a manual payment and enroll student' })
  async createManualPayment(
    @Body() dto: CreateManualPaymentDto,
    @CurrentUser() user: { sub: string; role: string },
    @Headers('authorization') authHeader: string,
  ) {
    const token = authHeader.replace('Bearer ', '');
    return this.purchaseService.createManualPayment(
      dto,
      user.sub,
      user.role,
      token,
    );
  }

  @Get('students/me/purchases')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get my purchase history' })
  async getMyPurchases(@CurrentUser() user: { sub: string }) {
    return this.purchaseService.getStudentPurchases(user.sub);
  }

  @Get('teachers/me/sales')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Get sales for my courses' })
  async getMySales(@CurrentUser() user: { sub: string; role: string }) {
    const teacherId = user.role === Role.ADMIN ? undefined : user.sub;
    if (!teacherId) {
      // Admin can see all sales - implement if needed
      return [];
    }
    return this.purchaseService.getTeacherSales(teacherId);
  }
}
