import { IsOptional, IsString, IsInt, Min, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty if provided' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Price must be an integer' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price?: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  gradeId?: string;
}
