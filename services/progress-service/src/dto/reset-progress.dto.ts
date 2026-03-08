import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';

export enum ResetScope {
  LESSON = 'LESSON',
  COURSE = 'COURSE',
}

export class ResetProgressDto {
  @IsUUID()
  studentId: string;

  @IsEnum(ResetScope)
  scope: ResetScope;

  @IsUUID()
  @IsOptional()
  lessonId?: string; // Required when scope is LESSON

  @IsUUID()
  @IsOptional()
  courseId?: string; // Required when scope is COURSE

  @IsString()
  @IsOptional()
  reason?: string;
}
