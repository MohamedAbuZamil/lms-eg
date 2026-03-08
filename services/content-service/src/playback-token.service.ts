import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VideoProvider, PlaybackProtection } from '@prisma/client';

export interface PlaybackTokenPayload {
  lessonId: string;
  userId?: string;
  isPreview: boolean;
  provider: VideoProvider;
  expiresAt: number;
  iat?: number;
}

@Injectable()
export class PlaybackTokenService {
  private readonly logger = new Logger(PlaybackTokenService.name);
  private readonly TOKEN_EXPIRY_SECONDS = 120; // 2 minutes

  constructor(private readonly jwtService: JwtService) {}

  generatePlaybackToken(
    lessonId: string,
    provider: VideoProvider,
    userId?: string,
    isPreview: boolean = false,
  ): { token: string; expiresAt: Date } {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.TOKEN_EXPIRY_SECONDS;

    const payload: PlaybackTokenPayload = {
      lessonId,
      userId,
      isPreview,
      provider,
      expiresAt,
      iat: now,
    };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: `${this.TOKEN_EXPIRY_SECONDS}s`,
    });

    const expiryDate = new Date(expiresAt * 1000);

    // Log playback generation
    this.logger.log(`Playback token generated: lesson=${lessonId}, user=${userId || 'anonymous'}, preview=${isPreview}`);

    return { token, expiresAt: expiryDate };
  }

  validatePlaybackToken(token: string): PlaybackTokenPayload {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      }) as PlaybackTokenPayload;

      // Check if token has expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.expiresAt < now) {
        throw new Error('Token has expired');
      }

      return payload;
    } catch (error) {
      this.logger.warn(`Invalid playback token: ${error.message}`);
      throw new Error('Invalid or expired playback token');
    }
  }

  generateEmbedUrl(token: string): string {
    return `/playback/resolve?token=${token}`;
  }

  getProviderEmbedInfo(provider: VideoProvider, providerVideoId?: string, providerVideoUrl?: string): {
    type: 'EMBED' | 'DIRECT';
    providerVideoId?: string;
    embedUrl?: string;
    directUrl?: string;
  } {
    switch (provider) {
      case VideoProvider.YOUTUBE:
        return {
          type: 'EMBED',
          providerVideoId: providerVideoId,
          embedUrl: providerVideoId ? `https://www.youtube.com/embed/${providerVideoId}` : undefined,
        };

      case VideoProvider.VIMEO:
        return {
          type: 'EMBED',
          providerVideoId: providerVideoId,
          embedUrl: providerVideoId ? `https://player.vimeo.com/video/${providerVideoId}` : undefined,
        };

      case VideoProvider.MUX:
        return {
          type: 'DIRECT',
          providerVideoId: providerVideoId,
          directUrl: providerVideoUrl,
        };

      case VideoProvider.BUNNY:
        return {
          type: 'DIRECT',
          providerVideoId: providerVideoId,
          directUrl: providerVideoUrl,
        };

      case VideoProvider.GOOGLE_DRIVE:
        return {
          type: 'EMBED',
          providerVideoId: providerVideoId,
          embedUrl: providerVideoUrl ? `https://drive.google.com/file/d/${providerVideoId}/preview` : undefined,
        };

      case VideoProvider.CUSTOM:
        return {
          type: 'DIRECT',
          providerVideoId: providerVideoId,
          directUrl: providerVideoUrl,
        };

      default:
        return {
          type: 'EMBED',
          providerVideoId,
        };
    }
  }
}
