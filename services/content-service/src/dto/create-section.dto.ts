import { IsString, IsInt, Min } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  order: number;
}
