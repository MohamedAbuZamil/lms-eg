import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum QuestionBankScope {
  GRADE = 'GRADE',
  GLOBAL = 'GLOBAL',
}

export class CreateQuestionBankDto {
  @IsString()
  name: string;

  @IsEnum(QuestionBankScope)
  scopeType: QuestionBankScope;

  @IsUUID()
  @IsOptional()
  gradeId?: string; // Required when scopeType is GRADE
}
