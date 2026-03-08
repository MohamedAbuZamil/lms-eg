-- CreateEnum
CREATE TYPE "RechargeCodeStatus" AS ENUM ('UNUSED', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECHARGE_CODE', 'COURSE_PURCHASE', 'MANUAL_ADJUSTMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TEACHER_RECHARGE_CODE', 'TEACHER_BALANCE', 'MANUAL_CASH', 'MANUAL_TRANSFER', 'FAWRY', 'PAYMOB', 'STRIPE');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "TeacherWallet" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTeacherBalance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTeacherBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeCodeBatch" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unitAmount" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RechargeCodeBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeCode" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "RechargeCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "redeemedByStudentId" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RechargeCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePurchase" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "amountCharged" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoursePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualEnrollmentPayment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assistantId" TEXT,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualEnrollmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherWallet_teacherId_key" ON "TeacherWallet"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherWallet_teacherId_idx" ON "TeacherWallet"("teacherId");

-- CreateIndex
CREATE INDEX "StudentTeacherBalance_studentId_idx" ON "StudentTeacherBalance"("studentId");

-- CreateIndex
CREATE INDEX "StudentTeacherBalance_teacherId_idx" ON "StudentTeacherBalance"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTeacherBalance_studentId_teacherId_key" ON "StudentTeacherBalance"("studentId", "teacherId");

-- CreateIndex
CREATE INDEX "RechargeCodeBatch_teacherId_idx" ON "RechargeCodeBatch"("teacherId");

-- CreateIndex
CREATE INDEX "RechargeCodeBatch_createdAt_idx" ON "RechargeCodeBatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeCode_code_key" ON "RechargeCode"("code");

-- CreateIndex
CREATE INDEX "RechargeCode_code_idx" ON "RechargeCode"("code");

-- CreateIndex
CREATE INDEX "RechargeCode_batchId_idx" ON "RechargeCode"("batchId");

-- CreateIndex
CREATE INDEX "RechargeCode_teacherId_idx" ON "RechargeCode"("teacherId");

-- CreateIndex
CREATE INDEX "RechargeCode_status_idx" ON "RechargeCode"("status");

-- CreateIndex
CREATE INDEX "RechargeCode_redeemedByStudentId_idx" ON "RechargeCode"("redeemedByStudentId");

-- CreateIndex
CREATE INDEX "BalanceTransaction_studentId_idx" ON "BalanceTransaction"("studentId");

-- CreateIndex
CREATE INDEX "BalanceTransaction_teacherId_idx" ON "BalanceTransaction"("teacherId");

-- CreateIndex
CREATE INDEX "BalanceTransaction_type_idx" ON "BalanceTransaction"("type");

-- CreateIndex
CREATE INDEX "BalanceTransaction_createdAt_idx" ON "BalanceTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CoursePurchase_studentId_idx" ON "CoursePurchase"("studentId");

-- CreateIndex
CREATE INDEX "CoursePurchase_courseId_idx" ON "CoursePurchase"("courseId");

-- CreateIndex
CREATE INDEX "CoursePurchase_teacherId_idx" ON "CoursePurchase"("teacherId");

-- CreateIndex
CREATE INDEX "CoursePurchase_status_idx" ON "CoursePurchase"("status");

-- CreateIndex
CREATE INDEX "CoursePurchase_createdAt_idx" ON "CoursePurchase"("createdAt");

-- CreateIndex
CREATE INDEX "ManualEnrollmentPayment_studentId_idx" ON "ManualEnrollmentPayment"("studentId");

-- CreateIndex
CREATE INDEX "ManualEnrollmentPayment_courseId_idx" ON "ManualEnrollmentPayment"("courseId");

-- CreateIndex
CREATE INDEX "ManualEnrollmentPayment_teacherId_idx" ON "ManualEnrollmentPayment"("teacherId");

-- CreateIndex
CREATE INDEX "ManualEnrollmentPayment_createdAt_idx" ON "ManualEnrollmentPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "StudentTeacherBalance" ADD CONSTRAINT "StudentTeacherBalance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherWallet"("teacherId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeCodeBatch" ADD CONSTRAINT "RechargeCodeBatch_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherWallet"("teacherId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeCode" ADD CONSTRAINT "RechargeCode_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "RechargeCodeBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeCode" ADD CONSTRAINT "RechargeCode_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherWallet"("teacherId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherWallet"("teacherId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_studentId_teacherId_fkey" FOREIGN KEY ("studentId", "teacherId") REFERENCES "StudentTeacherBalance"("studentId", "teacherId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherWallet"("teacherId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualEnrollmentPayment" ADD CONSTRAINT "ManualEnrollmentPayment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherWallet"("teacherId") ON DELETE RESTRICT ON UPDATE CASCADE;
