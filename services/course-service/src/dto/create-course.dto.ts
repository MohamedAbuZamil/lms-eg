import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
} from "class-validator";

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
