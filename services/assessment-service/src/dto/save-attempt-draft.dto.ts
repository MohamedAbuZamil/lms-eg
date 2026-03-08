import { IsArray, ValidateNested, IsUUID, IsBoolean, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class DraftAnswerDto {
  @IsUUID()
  questionId: string;

  @IsUUID()
  @IsOptional()
  selectedOptionId?: string; // for MCQ

  @IsBoolean()
  @IsOptional()
  booleanAnswer?: boolean; // for TRUE_FALSE

  @IsString()
  @IsOptional()
  essayText?: string; // for ESSAY

  @IsString()
  @IsOptional()
  essayImageUrl?: string; // for ESSAY image upload
}

export class SaveAttemptDraftDto {
  @IsUUID()
  attemptId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DraftAnswerDto)
  answers: DraftAnswerDto[];
}

export class AttemptResponseDto {
  attemptId: string;
  assessmentId: string;
  status: string;
  startedAt: Date;
  expiresAt?: Date;
  lastSavedAt?: Date;
  remainingSeconds: number;
  editable: boolean;
  answers: any[];
}
