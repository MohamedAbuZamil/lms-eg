-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO', 'MUX', 'BUNNY', 'GOOGLE_DRIVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PlaybackProtection" AS ENUM ('BASIC', 'TOKENIZED', 'SIGNED', 'EMBED_ONLY');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "allowDownload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playbackProtection" "PlaybackProtection" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "providerVideoId" TEXT,
ADD COLUMN     "providerVideoUrl" TEXT,
ADD COLUMN     "videoProvider" "VideoProvider";
