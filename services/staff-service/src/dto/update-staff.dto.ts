import { IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

export class UpdateStaffDto {
  @IsOptional()
  @IsBoolean()
  canManageCourses?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageEnrollments?: boolean;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;
}
