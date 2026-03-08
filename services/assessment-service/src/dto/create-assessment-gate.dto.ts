import { IsUUID, IsNumber, IsOptional } from 'class-validator';

export class CreateAssessmentGateDto {
  @IsUUID()
  assessmentId: string;

  @IsUUID()
  targetLessonId: string;

  @IsNumber()
  @IsOptional()
  minimumPassPercentage?: number = 70.0;
}
