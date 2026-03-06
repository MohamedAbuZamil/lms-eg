import { IsOptional, IsString } from 'class-validator';

export class BlockEnrollmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
