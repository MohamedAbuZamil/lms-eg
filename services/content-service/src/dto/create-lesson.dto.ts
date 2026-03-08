import { IsString, IsEnum, IsInt, Min, IsOptional, IsBoolean, ValidateIf } from 'class-validator';
import { LessonType, VideoProvider, PlaybackProtection } from '@prisma/client';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsEnum(LessonType)
  type: LessonType;

  @IsInt()
  @Min(1)
  order: number;

  @IsBoolean()
  @IsOptional()
  isPreview?: boolean = false;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  url?: string;

  // Video-specific fields
  @ValidateIf((o) => o.type === LessonType.VIDEO)
  @IsEnum(VideoProvider)
  @IsOptional()
  videoProvider?: VideoProvider;

  @ValidateIf((o) => o.type === LessonType.VIDEO)
  @IsString()
  @IsOptional()
  providerVideoId?: string;

  @ValidateIf((o) => o.type === LessonType.VIDEO)
  @IsString()
  @IsOptional()
  providerVideoUrl?: string;

  @IsEnum(PlaybackProtection)
  @IsOptional()
  playbackProtection?: PlaybackProtection;

  @IsBoolean()
  @IsOptional()
  allowDownload?: boolean = false;

  // View Limit Policy fields (only for VIDEO lessons)
  @ValidateIf((o) => o.type === LessonType.VIDEO)
  @IsBoolean()
  @IsOptional()
  viewLimitEnabled?: boolean = false;

  @ValidateIf((o) => o.type === LessonType.VIDEO && o.viewLimitEnabled === true && o.allowUnlimitedViews !== true)
  @IsInt()
  @Min(1)
  @IsOptional()
  maxViews?: number;

  @ValidateIf((o) => o.type === LessonType.VIDEO && o.viewLimitEnabled === true)
  @IsInt()
  @Min(1)
  @IsOptional()
  viewCooldownHours?: number = 6;

  @ValidateIf((o) => o.type === LessonType.VIDEO)
  @IsBoolean()
  @IsOptional()
  countOnlyAfterPlaybackStart?: boolean = true;

  @ValidateIf((o) => o.type === LessonType.VIDEO)
  @IsBoolean()
  @IsOptional()
  allowUnlimitedViews?: boolean = false;
}
