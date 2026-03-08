import { IsString, IsNumber, IsPositive, IsInt, IsOptional, Min, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRechargeCodeBatchDto {
  @ApiProperty({ description: 'Title for this batch of codes' })
  @IsString()
  @Length(1, 100)
  title: string;

  @ApiProperty({ description: 'Amount per code in EGP' })
  @IsNumber()
  @IsPositive()
  unitAmount: number;

  @ApiProperty({ description: 'Number of codes to generate' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Teacher ID (admin only)', required: false })
  @IsOptional()
  @IsString()
  teacherId?: string;
}

export class RedeemCodeDto {
  @ApiProperty({ description: 'The recharge code to redeem' })
  @IsString()
  @Length(8, 32)
  code: string;
}

export class RedeemCodeResponseDto {
  success: boolean;
  message: string;
  amount?: number;
  teacherId?: string;
  newBalance?: number;
}
