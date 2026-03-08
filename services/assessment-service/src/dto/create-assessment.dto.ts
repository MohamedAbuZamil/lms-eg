import { IsString, IsEnum, IsOptional, IsUUID, IsInt, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export enum AssessmentType {
  QUIZ = 'QUIZ',
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
}

export enum AnswerReviewMode {
  IMMEDIATELY_AFTER_SUBMISSION = 'IMMEDIATELY_AFTER_SUBMISSION',
  AFTER_ASSESSMENT_END = 'AFTER_ASSESSMENT_END',
  AT_CUSTOM_TIME = 'AT_CUSTOM_TIME',
  NEVER = 'NEVER',
}

export class CreateAssessmentDto {
  @IsUUID()
  courseId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AssessmentType)
  type: AssessmentType;

  @IsUUID()
  @IsOptional()
  gradeId?: string;

  @IsDateString()
  availableFrom: string;

  @IsDateString()
  availableTo: string;

  @IsInt()
  @IsOptional()
  durationMinutes?: number; // null for no time limit

  @IsEnum(AnswerReviewMode)
  answerReviewMode: AnswerReviewMode;

  @IsDateString()
  @IsOptional()
  answerReviewAt?: string; // Required when mode = AT_CUSTOM_TIME

  @IsNumber()
  @IsOptional()
  passPercentage?: number = 70.0;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean = false;

  @IsInt()
  @IsOptional()
  maxAttempts?: number; // null for unlimited attempts

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean = false;

  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean = false;

  @IsBoolean()
  @IsOptional()
  randomizeQuestions?: boolean = false;

  @IsInt()
  @IsOptional()
  randomQuestionCount?: number; // Number of questions to randomly select
}
