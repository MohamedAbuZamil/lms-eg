import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;
}
