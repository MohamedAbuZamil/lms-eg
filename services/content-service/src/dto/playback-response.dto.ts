import { IsString, IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator';

export enum PlaybackType {
  EMBED = 'EMBED',
  DIRECT = 'DIRECT',
  SIGNED = 'SIGNED',
}

export class PlaybackResponseDto {
  @IsString()
  lessonId: string;

  @IsString()
  provider: string;

  @IsEnum(PlaybackType)
  playbackType: PlaybackType;

  @IsString()
  @IsOptional()
  playbackToken?: string;

  @IsDateString()
  expiresAt: string;

  @IsString()
  @IsOptional()
  embedUrl?: string;

  @IsOptional()
  resolvedPlayback?: {
    type: PlaybackType;
    providerVideoId?: string;
    embedUrl?: string;
    directUrl?: string;
  };

  // View Limit Policy Information
  @IsOptional()
  @IsInt()
  viewsConsumed?: number;

  @IsOptional()
  @IsInt()
  viewsRemaining?: number;

  @IsOptional()
  @IsString()
  viewLimitStatus?: 'UNLIMITED' | 'AVAILABLE' | 'EXCEEDED' | 'COOLDOWN';
}
