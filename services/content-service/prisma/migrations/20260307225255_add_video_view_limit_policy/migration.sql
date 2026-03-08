-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "allowUnlimitedViews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "countOnlyAfterPlaybackStart" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxViews" INTEGER,
ADD COLUMN     "viewCooldownHours" INTEGER DEFAULT 6,
ADD COLUMN     "viewLimitEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LessonViewUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "viewsConsumed" INTEGER NOT NULL DEFAULT 0,
    "lastCountedViewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonViewUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonViewOverride" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "extraViewsGranted" INTEGER NOT NULL DEFAULT 0,
    "grantedByUserId" TEXT NOT NULL,
    "grantedByRole" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonViewOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonViewUsage_userId_lessonId_key" ON "LessonViewUsage"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonViewOverride_lessonId_studentId_key" ON "LessonViewOverride"("lessonId", "studentId");

-- AddForeignKey
ALTER TABLE "LessonViewUsage" ADD CONSTRAINT "LessonViewUsage_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonViewOverride" ADD CONSTRAINT "LessonViewOverride_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
