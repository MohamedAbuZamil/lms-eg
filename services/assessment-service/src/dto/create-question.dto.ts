import { IsString, IsEnum, IsInt, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  ESSAY = 'ESSAY',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class QuestionOptionDto {
  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  id?: string; // For updates

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  order?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  questionId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  createdAt?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  updatedAt?: string;

  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsUUID()
  bankId: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsInt()
  defaultPoints: number;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[]; // Required for MULTIPLE_CHOICE

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  createdByUserId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  createdAt?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  updatedAt?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  id?: string;
}
