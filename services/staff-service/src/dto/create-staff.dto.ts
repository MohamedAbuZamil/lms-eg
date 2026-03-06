import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'Assistant user ID is required' })
  @IsUUID()
  assistantUserId!: string;

  @IsOptional()
  @IsBoolean()
  canManageCourses?: boolean = false;

  @IsOptional()
  @IsBoolean()
  canManageEnrollments?: boolean = false;
}
