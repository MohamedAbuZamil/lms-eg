import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Student ID is required' })
  @IsUUID()
  studentId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Course ID is required' })
  @IsUUID()
  courseId!: string;
}
