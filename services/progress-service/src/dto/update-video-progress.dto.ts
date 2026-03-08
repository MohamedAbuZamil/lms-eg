import { IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateVideoProgressDto {
  @IsInt()
  @Min(0)
  lastPositionSeconds: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressPercent?: number;
}
