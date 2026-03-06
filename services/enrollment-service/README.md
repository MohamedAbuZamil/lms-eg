# Enrollment Service

Course enrollment management service for the LMS system. Handles student enrollments, teacher enrollment management, and enrollment status tracking.

## 🏗️ Architecture Overview

The enrollment-service is a microservice responsible for managing course enrollments within the LMS ecosystem.

### Service Responsibilities
- **Student Self-Enrollment**: Students can enroll themselves in courses
- **Teacher Enrollment Management**: Teachers can enroll students in their courses
- **Assistant Enrollment**: Authorized assistants can enroll students on behalf of teachers
- **Enrollment Status Tracking**: ACTIVE, BLOCKED, REMOVED status management
- **Actor Tracking**: Records who performed each enrollment action

### Service Dependencies
- **identity-service**: JWT validation and user authentication
- **course-service**: Course verification and course details retrieval
- **staff-service**: Assistant permission verification

---

## 📋 Domain Model

### Enrollment Entity
```typescript
{
  id: string                    // UUID
  studentId: string            // Student user ID
  courseId: string             // Course ID
  status: EnrollmentStatus     // ACTIVE | BLOCKED | REMOVED
  enrolledByUserId: string     // Who created the enrollment
  blockedByUserId?: string     // Who blocked the enrollment
  removedByUserId?: string     // Who removed the enrollment
  createdAt: DateTime
  updatedAt: DateTime
  blockedAt?: DateTime
  removedAt?: DateTime
}
```

### EnrollmentStatus Enum
- `ACTIVE`: Student is currently enrolled and can access the course
- `BLOCKED`: Enrollment is blocked, student cannot access the course
- `REMOVED`: Enrollment was removed, student is no longer enrolled

### Database Constraints
- **Unique constraint**: (studentId, courseId)
- **Meaning**: A student cannot have multiple enrollment records for the same course
- **Status Transitions**: Use status changes instead of creating duplicate records

### Actor Tracking
- `enrolledByUserId`: Who created the enrollment (student self-enrolled, teacher, or assistant)
- `blockedByUserId`: Who blocked the enrollment (teacher or authorized assistant)
- `removedByUserId`: Who removed the enrollment (teacher or authorized assistant)

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn
- identity-service running on port 3001
- course-service running on port 3002
- staff-service running on port 3004

### Installation
```bash
npm install
```

### Environment Variables
```bash
cp env.example .env
```

Configure your `.env` file:
```env
DATABASE_URL="postgresql://lms:lms@localhost:5436/enrollment_db?schema=public"
JWT_SECRET="dev_secret_change_me"
COURSE_SERVICE_URL="http://localhost:3002"
STAFF_SERVICE_URL="http://localhost:3004"
PORT=3003
```

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### Running
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Service starts on `http://localhost:3003`

---

## 📚 API Documentation

### Health Check

#### GET /health
Public endpoint to check service health.

```bash
curl -X GET http://localhost:3003/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### Student Self-Enrollment

#### POST /enrollments/self
Student enrolls themselves in a course (STUDENT only).

```bash
curl -X POST http://localhost:3003/enrollments/self \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-token>" \
  -d '{
    "courseId": "course-uuid"
  }'
```

**Response:**
```json
{
  "id": "enrollment-uuid",
  "studentId": "student-uuid",
  "courseId": "course-uuid",
  "status": "ACTIVE",
  "enrolledByUserId": "student-uuid",
  "createdAt": "2026-03-06T08:00:00.000Z",
  "updatedAt": "2026-03-06T08:00:00.000Z"
}
```

**Errors:**
- `401`: No/invalid JWT token
- `403`: User is not a STUDENT
- `404`: Course not found
- `409`: Already enrolled in this course
- `400`: Validation errors

---

### Teacher/Assistant Enrollment

#### POST /enrollments
Teacher or authorized assistant enrolls a student in a course.

```bash
curl -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-or-assistant-token>" \
  -d '{
    "studentId": "student-uuid",
    "courseId": "course-uuid"
  }'
```

**Response:**
```json
{
  "id": "enrollment-uuid",
  "studentId": "student-uuid",
  "courseId": "course-uuid",
  "status": "ACTIVE",
  "enrolledByUserId": "teacher-uuid",
  "createdAt": "2026-03-06T08:00:00.000Z",
  "updatedAt": "2026-03-06T08:00:00.000Z"
}
```

**Errors:**
- `401`: No/invalid JWT token
- `403`: Not authorized (not course owner or unauthorized assistant)
- `404`: Course not found
- `409`: Already enrolled in this course
- `400`: Validation errors

---

### Student Enrollments

#### GET /students/me/enrollments
Get current student's enrollments (STUDENT only).

```bash
curl -X GET http://localhost:3003/students/me/enrollments \
  -H "Authorization: Bearer <student-token>"
```

**Response:**
```json
[
  {
    "id": "enrollment-uuid",
    "studentId": "student-uuid",
    "courseId": "course-uuid",
    "status": "ACTIVE",
    "enrolledByUserId": "student-uuid",
    "createdAt": "2026-03-06T08:00:00.000Z",
    "updatedAt": "2026-03-06T08:00:00.000Z"
  }
]
```

---

### Student Courses

#### GET /students/me/courses
Get course details for current student's ACTIVE enrollments (STUDENT only).

```bash
curl -X GET http://localhost:3003/students/me/courses \
  -H "Authorization: Bearer <student-token>"
```

**Response:**
```json
[
  {
    "courseId": "course-uuid",
    "title": "Mathematics 101",
    "description": "Basic math course",
    "price": 100,
    "teacherId": "teacher-uuid",
    "grade": {
      "id": "grade-uuid",
      "name": "first_secondary"
    }
  }
]
```

---

### Block Enrollment

#### PATCH /enrollments/:id/block
Block a student's enrollment (TEACHER owner or authorized assistant only).

```bash
curl -X PATCH http://localhost:3003/enrollments/enrollment-uuid/block \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-or-assistant-token>" \
  -d '{
    "reason": "Payment overdue"
  }'
```

**Response:**
```json
{
  "id": "enrollment-uuid",
  "studentId": "student-uuid",
  "courseId": "course-uuid",
  "status": "BLOCKED",
  "enrolledByUserId": "student-uuid",
  "blockedByUserId": "teacher-uuid",
  "blockedAt": "2026-03-06T09:00:00.000Z",
  "createdAt": "2026-03-06T08:00:00.000Z",
  "updatedAt": "2026-03-06T09:00:00.000Z"
}
```

**Errors:**
- `401`: No/invalid JWT token
- `403`: Not authorized (not course owner or unauthorized assistant)
- `404`: Enrollment not found
- `404`: Course not found

---

### Remove Enrollment

#### DELETE /enrollments/:id
Remove a student's enrollment (TEACHER owner or authorized assistant only).

```bash
curl -X DELETE http://localhost:3003/enrollments/enrollment-uuid \
  -H "Authorization: Bearer <teacher-or-assistant-token>"
```

**Response:** `204 No Content`

**Errors:**
- `401`: No/invalid JWT token
- `403`: Not authorized (not course owner or unauthorized assistant)
- `404`: Enrollment not found

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "STUDENT | TEACHER | ADMIN"
}
```

### Role Permissions
- **STUDENT**: Can self-enroll, view own enrollments and courses
- **TEACHER**: Can enroll students in own courses, block/remove enrollments
- **ADMIN**: Can perform all teacher operations

### Authorization Rules
1. **Student Self-Enrollment**: Only for themselves
2. **Teacher Enrollment**: Only in their own courses
3. **Assistant Enrollment**: Only if authorized by course owner with `canManageEnrollments = true`
4. **Block/Remove**: Only course owner or authorized assistant

### Cross-Service Validation
- **Course Verification**: Calls course-service to verify course exists
- **Teacher Ownership**: Verifies course.teacherId matches actor
- **Assistant Permission**: Calls staff-service to verify assistant permissions

---

## 🧪 Testing Examples

### Complete Enrollment Flow

#### 1. Setup Users and Authentication
```bash
# Register student
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "mobile": "01234567890",
    "password": "password123",
    "role": "STUDENT"
  }'

# Register teacher
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "mobile": "01234567891",
    "password": "password123",
    "role": "TEACHER"
  }'

# Get tokens
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@test.com", "password": "password123"}' | jq -r '.accessToken')

TEACHER_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@test.com", "password": "password123"}' | jq -r '.accessToken')
```

#### 2. Student Self-Enrollment
```bash
# Get available courses first
COURSES=$(curl -s -X GET http://localhost:3002/courses \
  -H "Authorization: Bearer $STUDENT_TOKEN")

COURSE_ID=$(echo $COURSES | jq -r '.[0].id')

# Student self-enrolls
curl -X POST http://localhost:3003/enrollments/self \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "courseId": "'$COURSE_ID'"
  }'
# Expected: Enrollment record with status ACTIVE
```

#### 3. View Student Enrollments
```bash
curl -X GET http://localhost:3003/students/me/enrollments \
  -H "Authorization: Bearer $STUDENT_TOKEN"
# Expected: Array of student's enrollments
```

#### 4. View Student Courses
```bash
curl -X GET http://localhost:3003/students/me/courses \
  -H "Authorization: Bearer $STUDENT_TOKEN"
# Expected: Array of course details with grade information
```

#### 5. Teacher Enrolls Student
```bash
# Teacher enrolls another student
curl -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "studentId": "student-uuid",
    "courseId": "'$COURSE_ID'"
  }'
# Expected: Enrollment record with enrolledByUserId = teacher
```

#### 6. Block Enrollment
```bash
ENROLLMENT_ID="enrollment-uuid-here"

curl -X PATCH http://localhost:3003/enrollments/$ENROLLMENT_ID/block \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "reason": "Non-payment"
  }'
# Expected: Enrollment with status BLOCKED
```

#### 7. Remove Enrollment
```bash
curl -X DELETE http://localhost:3003/enrollments/$ENROLLMENT_ID \
  -H "Authorization: Bearer $TEACHER_TOKEN"
# Expected: 204 No Content
```

### Error Testing

#### Student Tries to Enroll Others (403)
```bash
curl -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "studentId": "other-student-uuid",
    "courseId": "'$COURSE_ID'"
  }'
# Expected: 403 Forbidden
```

#### Teacher Tries to Enroll in Other's Course (403)
```bash
curl -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "studentId": "student-uuid",
    "courseId": "other-teacher-course-uuid"
  }'
# Expected: 403 Forbidden
```

#### Duplicate Enrollment (409)
```bash
# Try to enroll same student in same course again
curl -X POST http://localhost:3003/enrollments/self \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "courseId": "'$COURSE_ID'"
  }'
# Expected: 409 Conflict
```

#### Course Not Found (404)
```bash
curl -X POST http://localhost:3003/enrollments/self \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "courseId": "non-existent-course-uuid"
  }'
# Expected: 404 Not Found
```

#### Unauthorized Assistant (403)
```bash
# Assistant without canManageEnrollments tries to enroll
curl -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $UNAUTHORIZED_ASSISTANT_TOKEN" \
  -d '{
    "studentId": "student-uuid",
    "courseId": "'$COURSE_ID'"
  }'
# Expected: 403 Forbidden
```

---

## 📊 Error Handling

### HTTP Status Codes
- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **204 No Content**: Resource deleted successfully
- **400 Bad Request**: Validation errors or business rule violations
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource

### Error Response Format
```json
{
  "message": "Error description",
  "error": "ErrorType",
  "statusCode": 400
}
```

---

## 📝 Scripts

- `npm run build`: Build the application
- `npm run start`: Start the application
- `npm run start:dev`: Start in development mode
- `npm run start:prod`: Start in production mode
- `npm run lint`: Run ESLint
- `npm run test`: Run tests
- `npm run db:generate`: Generate Prisma client
- `npm run db:migrate`: Run database migrations

---

## 🔧 Development

### Project Structure
```
src/
├── auth/              # Authentication guards & decorators
├── dto/               # Data transfer objects
├── enrollment.controller.ts
├── enrollment.service.ts
├── course-client.service.ts
├── staff-client.service.ts
├── prisma.service.ts
└── app.module.ts
```

### Cross-Service Integration
- **Course Service**: Verifies course existence and retrieves course details
- **Staff Service**: Verifies assistant permissions for enrollment management
- **Identity Service**: Provides JWT authentication and user information

### Adding New Features
1. Update Prisma schema
2. Run migration: `npm run db:migrate`
3. Create/update DTOs
4. Implement service methods
5. Add controller endpoints
6. Add tests

---

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5436/enrollment_db"
JWT_SECRET="production-jwt-secret"
COURSE_SERVICE_URL="http://course-service:3002"
STAFF_SERVICE_URL="http://staff-service:3004"
PORT=3003
```

### Health Check
```bash
curl -X GET http://localhost:3003/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and questions, please create an issue in the repository.
