# Commerce Service

A microservice for managing payments, recharge codes, student balances, and course purchases in the LMS ecosystem.

## Overview

The Commerce Service handles:
- **Recharge Code System**: Teachers generate codes that students redeem for balance
- **Student Balance Per Teacher**: Balance is scoped per teacher (Student A can have 200 EGP with Teacher X and 50 EGP with Teacher Y)
- **Course Purchases**: Students buy courses using their teacher-specific balance
- **Manual Payment Recording**: Teachers/assistants can manually record cash/transfer payments
- **Excel Export**: Export recharge codes for distribution

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Commerce Service                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Recharge Code │  │   Balance    │  │   Purchase   │        │
│  │   Module      │  │   Module     │  │   Module     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    Course    │  │  Enrollment  │  │    Staff     │        │
│  │   Service    │  │   Service    │  │   Service    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐     ┌──────────────┐
            │   Course     │     │  Enrollment  │
            │   Service    │     │   Service    │
            └──────────────┘     └──────────────┘
```

## Database Schema

### TeacherWallet
- `id`, `teacherId` (unique)

### StudentTeacherBalance
- `id`, `studentId`, `teacherId`, `balance`
- Unique constraint: `(studentId, teacherId)`

### RechargeCodeBatch
- `id`, `teacherId`, `title`, `unitAmount`, `quantity`, `createdByUserId`

### RechargeCode
- `id`, `batchId`, `teacherId`, `code` (unique), `amount`, `status`
- `redeemedByStudentId`, `redeemedAt`

### BalanceTransaction
- `id`, `studentId`, `teacherId`, `type`, `amount`
- `referenceType`, `referenceId`

### CoursePurchase
- `id`, `studentId`, `courseId`, `teacherId`, `amountCharged`, `paymentMethod`, `status`

### ManualEnrollmentPayment
- `id`, `studentId`, `courseId`, `teacherId`, `assistantId`
- `amountPaid`, `paymentMethod`, `notes`, `recordedByUserId`

## API Endpoints

### Health
```
GET /health
```

### Recharge Codes (Teachers/Admin)
```
POST   /recharge-code-batches              # Create batch of codes
GET    /recharge-code-batches              # List my batches
GET    /recharge-code-batches/:id          # Get batch details
GET    /recharge-code-batches/:id/export   # Export to Excel
```

### Recharge Codes (Students)
```
POST   /recharge-codes/redeem              # Redeem a code
```

### Student Balance
```
GET    /students/me/teacher-balances       # Get all balances
GET    /students/me/teacher-balances/:id   # Get specific balance
GET    /students/me/transactions           # Get transaction history
```

### Course Purchases
```
POST   /courses/:id/purchase-from-balance  # Buy with balance
GET    /students/me/purchases              # My purchases
```

### Manual Payments (Teachers/Assistants/Admin)
```
POST   /manual-course-payments             # Record manual payment
GET    /teachers/me/sales                  # My course sales
```

## Key Business Rules

1. **Balance Scoping**: Student balance is per-teacher only
2. **Code Uniqueness**: Recharge codes are cryptographically secure and unique
3. **Transaction Ledger**: Every financial action creates a BalanceTransaction record
4. **Integration**: Enrollment happens automatically after successful purchase
5. **Permissions**: 
   - Teachers manage their own codes and courses
   - Assistants can record payments with permission
   - Admins can manage everything

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5438/commerce_db"

# Service
PORT=3008
NODE_ENV=development
JWT_SECRET=your-secret

# Integrations
COURSE_SERVICE_URL=http://localhost:3002
ENROLLMENT_SERVICE_URL=http://localhost:3003
STAFF_SERVICE_URL=http://localhost:3004
```

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server
npm run start:dev
```

## Example Flows

### Teacher Creates Recharge Codes
```bash
# Teacher creates 100 codes worth 50 EGP each
POST /recharge-code-batches
{
  "title": "Spring 2024 Promotion",
  "unitAmount": 50,
  "quantity": 100
}

# Teacher exports codes to Excel
GET /recharge-code-batches/:id/export
```

### Student Redeems Code
```bash
# Student redeems code
POST /recharge-codes/redeem
{
  "code": "A1B2C3D4E5F67890"
}

# Response
{
  "success": true,
  "message": "Code redeemed successfully",
  "amount": 50,
  "teacherId": "teacher-uuid",
  "newBalance": 50
}
```

### Student Purchases Course
```bash
# Student buys course using balance
POST /courses/:courseId/purchase-from-balance

# Response
{
  "success": true,
  "purchaseId": "purchase-uuid",
  "courseId": "course-uuid",
  "teacherId": "teacher-uuid",
  "amountCharged": 100,
  "remainingBalance": 0
}
```

### Manual Payment Recording
```bash
# Teacher or assistant records cash payment
POST /manual-course-payments
{
  "studentId": "student-uuid",
  "courseId": "course-uuid",
  "amountPaid": 150,
  "paymentMethod": "MANUAL_CASH",
  "notes": "Paid in person at center"
}
```

## Future Extensions

The architecture supports adding external payment gateways:
- `FAWRY`
- `PAYMOB`
- `STRIPE`

These are defined in the enums but not yet implemented.
