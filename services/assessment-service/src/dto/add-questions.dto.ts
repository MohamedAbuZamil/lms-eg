import { IsArray, IsUUID, IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class AddQuestionsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  questionIds: string[];

  @IsOptional()
  @IsObject()
  @Type(() => Map)
  pointsOverrides?: Record<string, number>; // questionId -> pointsOverride
}
