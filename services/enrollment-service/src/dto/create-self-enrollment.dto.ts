import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSelfEnrollmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Course ID is required' })
  @IsUUID()
  courseId!: string;
}
