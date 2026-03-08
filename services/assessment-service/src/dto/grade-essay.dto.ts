import { IsArray, ValidateNested, IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class EssayGradeDto {
  @IsUUID()
  questionId: string;

  @IsNumber()
  awardedPoints: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class GradeEssayDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EssayGradeDto)
  grades: EssayGradeDto[];
}
