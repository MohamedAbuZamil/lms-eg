import { IsArray, ValidateNested, IsUUID, IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsUUID()
  questionId: string;

  @IsUUID()
  @IsOptional()
  selectedOptionId?: string; // For MULTIPLE_CHOICE

  @IsBoolean()
  @IsOptional()
  booleanAnswer?: boolean; // For TRUE_FALSE

  @IsString()
  @IsOptional()
  essayText?: string; // For ESSAY

  @IsString()
  @IsOptional()
  essayImageUrl?: string; // For ESSAY image upload
}

export class SubmitAnswerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
