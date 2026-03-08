# Commerce Service - Comprehensive API Documentation

## Overview
The Commerce Service handles payments, recharge codes, student balances, and course purchases in the LMS ecosystem.

## Table of Contents
1. [Authentication](#authentication)
2. [Recharge Code System](#recharge-code-system)
3. [Student Balance](#student-balance)
4. [Course Purchases](#course-purchases)
5. [Manual Payments](#manual-payments)
6. [Error Responses](#error-responses)
7. [Business Rules](#business-rules)

---

## Authentication

All endpoints require JWT Bearer token authentication:

```http
Authorization: Bearer <jwt_token>
```

### Token Format
```json
{
  "sub": "user-uuid",
  "role": "STUDENT|TEACHER|ADMIN|ASSISTANT",
  "iat": 1710200000,
  "exp": 1710203600
}
```

---

## Recharge Code System

### Create Recharge Code Batch
Creates a batch of unique recharge codes for students to redeem.

**Endpoint:** `POST /recharge-code-batches`

**Roles:** TEACHER, ADMIN

**Request Body:**
```json
{
  "title": "Spring 2024 Promotion",
  "unitAmount": 50,
  "quantity": 100,
  "teacherId": "teacher-uuid"  // Optional, admin only
}
```

**Validation Rules:**
- `title`: Required, 1-100 characters
- `unitAmount`: Required, positive number (EGP)
- `quantity`: Required, integer, min 1
- `teacherId`: Optional, admin can specify target teacher

**Success Response (201):**
```json
{
  "batchId": "batch-uuid",
  "title": "Spring 2024 Promotion",
  "unitAmount": 50,
  "quantity": 100,
  "generatedCodes": 100
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions

---

### List Recharge Code Batches
Get all batches created by the authenticated teacher.

**Endpoint:** `GET /recharge-code-batches`

**Roles:** TEACHER, ADMIN

**Success Response (200):**
```json
[
  {
    "id": "batch-uuid",
    "title": "Spring 2024 Promotion",
    "unitAmount": 50,
    "quantity": 100,
    "createdAt": "2024-03-08T10:00:00.000Z",
    "_count": {
      "codes": 100
    },
    "codes": [
      { "status": "UNUSED" },
      { "status": "REDEEMED" }
    ]
  }
]
```

---

### Get Batch Details
Get detailed information about a specific batch including all codes.

**Endpoint:** `GET /recharge-code-batches/:id`

**Roles:** TEACHER, ADMIN

**Success Response (200):**
```json
{
  "id": "batch-uuid",
  "title": "Spring 2024 Promotion",
  "teacherId": "teacher-uuid",
  "unitAmount": 50,
  "quantity": 100,
  "createdAt": "2024-03-08T10:00:00.000Z",
  "codes": [
    {
      "id": "code-uuid",
      "code": "A1B2C3D4E5F67890",
      "amount": 50,
      "status": "UNUSED",
      "createdAt": "2024-03-08T10:00:00.000Z"
    },
    {
      "id": "code-uuid-2",
      "code": "B2C3D4E5F6G78901",
      "amount": 50,
      "status": "REDEEMED",
      "redeemedByStudentId": "student-uuid",
      "redeemedAt": "2024-03-08T12:30:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Batch doesn't exist or doesn't belong to teacher

---

### Export Codes to Excel
Download batch codes as Excel file for distribution.

**Endpoint:** `GET /recharge-code-batches/:id/export`

**Roles:** TEACHER, ADMIN

**Query Parameters:**
- `status` (optional): `used` | `unused` - Filter by redemption status

**Success Response (200):**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="batch-title-codes.xlsx"`

**Excel Columns:**
- Code
- Amount (EGP)
- Status
- Redeemed By (Student ID)
- Redeemed At

---

### Redeem Recharge Code
Student redeems a code to add balance with a specific teacher.

**Endpoint:** `POST /recharge-codes/redeem`

**Roles:** STUDENT

**Request Body:**
```json
{
  "code": "A1B2C3D4E5F67890"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Code redeemed successfully",
  "amount": 50,
  "teacherId": "teacher-uuid",
  "newBalance": 150
}
```

**Error Responses:**
```json
// Invalid code (404)
{
  "success": false,
  "message": "Invalid code"
}

// Already redeemed (400)
{
  "success": false,
  "message": "Code has already been redeemed"
}

// Expired code (400)
{
  "success": false,
  "message": "Code has already been expired"
}
```

---

## Student Balance

### Get All Teacher Balances
Get all balances the student has with different teachers.

**Endpoint:** `GET /students/me/teacher-balances`

**Roles:** STUDENT

**Success Response (200):**
```json
[
  {
    "teacherId": "teacher-1-uuid",
    "balance": 200,
    "lastUpdated": "2024-03-08T12:30:00.000Z"
  },
  {
    "teacherId": "teacher-2-uuid",
    "balance": 50,
    "lastUpdated": "2024-03-08T10:00:00.000Z"
  }
]
```

---

### Get Specific Teacher Balance
Get balance with a specific teacher.

**Endpoint:** `GET /students/me/teacher-balances/:teacherId`

**Roles:** STUDENT

**Success Response (200):**
```json
{
  "teacherId": "teacher-uuid",
  "balance": 200,
  "lastUpdated": "2024-03-08T12:30:00.000Z"
}
```

**No Balance Exists (200):**
```json
{
  "teacherId": "teacher-uuid",
  "balance": 0,
  "lastUpdated": null
}
```

---

### Get Transaction History
Get all balance transactions for the student.

**Endpoint:** `GET /students/me/transactions`

**Roles:** STUDENT

**Query Parameters:**
- `teacherId` (optional): Filter by specific teacher

**Success Response (200):**
```json
[
  {
    "id": "transaction-uuid",
    "studentId": "student-uuid",
    "teacherId": "teacher-uuid",
    "type": "RECHARGE_CODE",
    "amount": 50,
    "referenceType": "RECHARGE_CODE",
    "referenceId": "code-uuid",
    "createdAt": "2024-03-08T12:30:00.000Z"
  },
  {
    "id": "transaction-uuid-2",
    "studentId": "student-uuid",
    "teacherId": "teacher-uuid",
    "type": "COURSE_PURCHASE",
    "amount": -100,
    "referenceType": "COURSE_PURCHASE",
    "referenceId": "purchase-uuid",
    "createdAt": "2024-03-08T11:00:00.000Z"
  }
]
```

**Transaction Types:**
- `RECHARGE_CODE`: Code redemption (positive amount)
- `COURSE_PURCHASE`: Course purchase (negative amount)
- `MANUAL_ADJUSTMENT`: Admin manual adjustment
- `REFUND`: Refund issued

---

## Course Purchases

### Purchase Course from Balance
Purchase a course using teacher-specific balance.

**Endpoint:** `POST /courses/:courseId/purchase-from-balance`

**Roles:** STUDENT

**Success Response (201):**
```json
{
  "success": true,
  "purchaseId": "purchase-uuid",
  "courseId": "course-uuid",
  "teacherId": "teacher-uuid",
  "amountCharged": 100,
  "remainingBalance": 50
}
```

**Error Responses:**
```json
// Insufficient balance (400)
{
  "statusCode": 400,
  "message": "Insufficient balance. Required: 100 EGP, Available: 50 EGP",
  "error": "Bad Request"
}

// Already enrolled (400)
{
  "statusCode": 400,
  "message": "Already enrolled in this course",
  "error": "Bad Request"
}

// Course not found (404)
{
  "statusCode": 404,
  "message": "Course not found",
  "error": "Not Found"
}

// Course not published (400)
{
  "statusCode": 400,
  "message": "Course is not available for purchase",
  "error": "Bad Request"
}
```

**Business Logic:**
1. Validates course exists and is published
2. Checks student is not already enrolled
3. Verifies sufficient balance with course teacher
4. Deducts balance
5. Creates purchase record
6. Creates transaction ledger entry
7. Enrolls student via Enrollment Service

---

### Get My Purchases
Get purchase history for the authenticated student.

**Endpoint:** `GET /students/me/purchases`

**Roles:** STUDENT

**Success Response (200):**
```json
[
  {
    "id": "purchase-uuid",
    "studentId": "student-uuid",
    "courseId": "course-uuid",
    "teacherId": "teacher-uuid",
    "amountCharged": 100,
    "paymentMethod": "TEACHER_BALANCE",
    "status": "COMPLETED",
    "createdAt": "2024-03-08T12:30:00.000Z"
  }
]
```

**Payment Methods:**
- `TEACHER_BALANCE`: Paid using teacher balance
- `MANUAL_CASH`: Recorded manual cash payment
- `MANUAL_TRANSFER`: Recorded bank transfer
- `FAWRY`: Fawry payment (future)
- `PAYMOB`: Paymob payment (future)
- `STRIPE`: Stripe payment (future)

**Purchase Status:**
- `PENDING`: Payment pending
- `COMPLETED`: Purchase completed
- `FAILED`: Purchase failed
- `REFUNDED`: Refunded

---

## Manual Payments

### Record Manual Payment
Record a manual payment (cash/transfer) and enroll student.

**Endpoint:** `POST /manual-course-payments`

**Roles:** TEACHER, ADMIN, ASSISTANT

**Request Body:**
```json
{
  "studentId": "student-uuid",
  "courseId": "course-uuid",
  "amountPaid": 150,
  "paymentMethod": "MANUAL_CASH",
  "notes": "Paid in person at center on 2024-03-08"
}
```

**Payment Methods:**
- `MANUAL_CASH`: Cash payment
- `MANUAL_TRANSFER`: Bank transfer
- `MANUAL_OTHER`: Other payment method

**Success Response (201):**
```json
{
  "success": true,
  "paymentId": "payment-uuid",
  "courseId": "course-uuid",
  "teacherId": "teacher-uuid",
  "studentId": "student-uuid",
  "amountPaid": 150
}
```

**Error Responses:**
```json
// Already enrolled (400)
{
  "statusCode": 400,
  "message": "Student already enrolled in this course",
  "error": "Bad Request"
}

// Teacher can only record for own courses (403)
{
  "statusCode": 403,
  "message": "Can only record payments for your own courses",
  "error": "Forbidden"
}

// Assistant without permission (403)
{
  "statusCode": 403,
  "message": "No permission to record payments for this teacher",
  "error": "Forbidden"
}
```

**Permission Logic:**
- **TEACHER**: Can only record for their own courses
- **ADMIN**: Can record for any course
- **ASSISTANT**: Can record if has permission for the teacher

---

### Get My Sales
Get sales records for teacher's courses.

**Endpoint:** `GET /teachers/me/sales`

**Roles:** TEACHER, ADMIN

**Success Response (200):**
```json
[
  {
    "id": "purchase-uuid",
    "studentId": "student-uuid",
    "courseId": "course-uuid",
    "teacherId": "teacher-uuid",
    "amountCharged": 100,
    "paymentMethod": "TEACHER_BALANCE",
    "status": "COMPLETED",
    "createdAt": "2024-03-08T12:30:00.000Z"
  }
]
```

---

## Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Integration service down |

---

## Business Rules

### Balance System
- **Per-Teacher Scoping**: Student balances are scoped per teacher
  - Student A can have 200 EGP with Teacher X
  - Student A can have 50 EGP with Teacher Y
  - Balances are completely separate

### Recharge Codes
- **Unique Codes**: Each code is 16-character alphanumeric, cryptographically secure
- **One-time Use**: Codes can only be redeemed once
- **No Cross-Teacher**: Code from Teacher X only adds balance with Teacher X
- **Non-Guessable**: Uses crypto.randomBytes for generation

### Course Purchases
- **Balance Deduction**: Amount deducted immediately upon purchase
- **Transaction Ledger**: Every purchase creates a transaction record
- **Auto-Enrollment**: Student enrolled automatically after successful purchase
- **No Refunds**: Currently no refund mechanism (future enhancement)

### Manual Payments
- **Permission-Based**: Teachers/assistants can only record for authorized courses
- **Audit Trail**: All manual payments include recordedByUserId for audit
- **Immediate Enrollment**: Student enrolled immediately after recording

### Security
- **JWT Required**: All endpoints require valid JWT token
- **Role-Based Access**: Each endpoint has specific role requirements
- **Ownership Validation**: Teachers can only access their own data
- **Assistant Verification**: Assistant permissions checked via Staff Service

---

## Integration Dependencies

The Commerce Service integrates with:

1. **Identity Service**: JWT validation
2. **Course Service**: Course validation and pricing
3. **Enrollment Service**: Student enrollment
4. **Staff Service**: Assistant permission verification

All integrations use HTTP APIs with JWT Bearer authentication.

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5438/commerce_db"

# Service
PORT=3008
NODE_ENV=development
JWT_SECRET=your-jwt-secret

# Integrations
COURSE_SERVICE_URL=http://localhost:3002
ENROLLMENT_SERVICE_URL=http://localhost:3003
STAFF_SERVICE_URL=http://localhost:3004
```

---

## Example Workflows

### Student Registration Flow
```
1. Teacher creates batch: POST /recharge-code-batches
2. Teacher exports codes: GET /recharge-code-batches/:id/export
3. Student gets code (via SMS/email/other channel)
4. Student redeems code: POST /recharge-codes/redeem
5. Student checks balance: GET /students/me/teacher-balances
```

### Course Purchase Flow
```
1. Student browses courses (via Course Service)
2. Student purchases: POST /courses/:id/purchase-from-balance
3. System validates balance, deducts amount
4. System enrolls student via Enrollment Service
5. Student can access course content
```

### Manual Payment Flow
```
1. Student pays cash at center
2. Teacher/Assistant records: POST /manual-course-payments
3. System validates permissions
4. System enrolls student via Enrollment Service
5. Payment recorded for audit
```
