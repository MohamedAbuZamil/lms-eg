-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "teacher_staff" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assistantUserId" TEXT NOT NULL,
    "canManageCourses" BOOLEAN NOT NULL DEFAULT false,
    "canManageEnrollments" BOOLEAN NOT NULL DEFAULT false,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_staff_teacherId_assistantUserId_key" ON "teacher_staff"("teacherId", "assistantUserId");
