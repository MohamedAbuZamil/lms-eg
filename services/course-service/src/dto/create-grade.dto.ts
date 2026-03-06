import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGradeDto {
  @IsString()
  @IsNotEmpty({ message: 'Grade name cannot be empty' })
  name: string;
}
