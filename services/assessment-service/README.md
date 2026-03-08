# Assessment Service

A dedicated microservice for managing quizzes, exams, assignments, and assessment-based content gating within the LMS ecosystem.

## 🏗️ Architecture Overview

The Assessment Service handles:
- **Question Bank Management**: Grade-scoped and global question repositories
- **Assessment Creation**: Timed quizzes, exams, and assignments with multiple question types
- **Student Attempts**: Secure attempt system with auto/manual grading
- **Content Gating**: Assessment-based lesson unlock rules
- **Reporting & Analytics**: Comprehensive assessment performance analytics
- **Answer Review Controls**: Scheduled visibility for answers and results

## 📋 Database Setup

### Prerequisites
- PostgreSQL database
- Node.js 18+
- npm or yarn

### Migration Instructions

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with test data
npx prisma db seed
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5437/assessment_db"

# Service Configuration
PORT=3007
NODE_ENV=development

# Integration Services
COURSE_SERVICE_URL=http://localhost:3002
ENROLLMENT_SERVICE_URL=http://localhost:3003
STAFF_SERVICE_URL=http://localhost:3004
CONTENT_SERVICE_URL=http://localhost:3005
IDENTITY_SERVICE_URL=http://localhost:3001

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# File Upload Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=assessment-uploads

# NATS Configuration (Future)
NATS_URL=nats://localhost:4222
NATS_ASSESSMENT_STREAM=assessment_events
```

## 🚀 Quick Start

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Health check
curl http://localhost:3007/health
```

## � API Documentation

### Base URL
```
http://localhost:3007
```

### Authentication
All endpoints require JWT Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Response Format
All responses follow standard HTTP status codes:
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🏥 Health Check

### Check Service Health
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "assessment-service"
}
```

---

## 🏦 Question Banks

### Create Question Bank
```http
POST /question-banks
Authorization: Bearer <teacher/admin_token>
```

**Request Body:**
```json
{
  "name": "Grade 10 Mathematics",
  "scopeType": "GRADE",
  "gradeId": "grade-uuid"
}
```

**Response:**
```json
{
  "id": "bank-uuid",
  "name": "Grade 10 Mathematics",
  "scopeType": "GRADE",
  "gradeId": "grade-uuid",
  "createdAt": "2026-03-08T10:00:00.000Z"
}
```

### List Question Banks
```http
GET /question-banks?gradeId=<uuid>&scopeType=<GLOBAL|GRADE>
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "bank-uuid",
    "name": "Grade 10 Mathematics",
    "scopeType": "GRADE",
    "_count": {
      "questions": 25
    }
  }
]
```

### Get Question Bank
```http
GET /question-banks/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "bank-uuid",
  "name": "Grade 10 Mathematics",
  "scopeType": "GRADE",
  "questions": [
    {
      "id": "question-uuid",
      "title": "What is 2+2?",
      "type": "MULTIPLE_CHOICE",
      "difficulty": "EASY",
      "defaultPoints": 5
    }
  ]
}
```

### Update Question Bank
```http
PATCH /question-banks/:id
Authorization: Bearer <teacher/admin_token>
```

**Request Body:**
```json
{
  "name": "Updated Bank Name"
}
```

### Delete Question Bank
```http
DELETE /question-banks/:id
Authorization: Bearer <teacher/admin_token>
```

---

## ❓ Questions

### Create Question
```http
POST /question-banks/:bankId/questions
Authorization: Bearer <teacher/admin_token>
```

**Request Body (Multiple Choice):**
```json
{
  "type": "MULTIPLE_CHOICE",
  "title": "What is 2 + 2?",
  "body": "Solve the following addition problem.",
  "difficulty": "EASY",
  "defaultPoints": 5,
  "explanation": "2 + 2 = 4",
  "options": [
    {"text": "3", "isCorrect": false},
    {"text": "4", "isCorrect": true},
    {"text": "5", "isCorrect": false}
  ]
}
```

**Request Body (True/False):**
```json
{
  "type": "TRUE_FALSE",
  "title": "Is 2+2 equal to 4?",
  "body": "Basic math fact",
  "difficulty": "EASY",
  "defaultPoints": 2
}
```

**Request Body (Essay):**
```json
{
  "type": "ESSAY",
  "title": "Explain the importance of mathematics",
  "body": "Write a detailed explanation.",
  "difficulty": "MEDIUM",
  "defaultPoints": 10
}
```

**Response:**
```json
{
  "id": "question-uuid",
  "bankId": "bank-uuid",
  "type": "MULTIPLE_CHOICE",
  "title": "What is 2 + 2?",
  "options": [
    {"id": "opt-1", "text": "3", "isCorrect": false, "order": 0},
    {"id": "opt-2", "text": "4", "isCorrect": true, "order": 1}
  ]
}
```

### List Questions by Bank
```http
GET /question-banks/:bankId/questions
Authorization: Bearer <token>
```

### Get Question
```http
GET /questions/:id
Authorization: Bearer <token>
```

### Update Question
```http
PATCH /questions/:id
Authorization: Bearer <teacher/admin_token>
```

### Delete Question
```http
DELETE /questions/:id
Authorization: Bearer <teacher/admin_token>
```

---

## 📝 Assessments

### Create Assessment
```http
POST /assessments
Authorization: Bearer <teacher/admin/assistant_token>
```

**Request Body:**
```json
{
  "courseId": "course-uuid",
  "title": "Mathematics Quiz 1",
  "description": "Basic arithmetic and algebra",
  "type": "QUIZ",
  "gradeId": "grade-uuid",
  "availableFrom": "2026-03-10T09:00:00.000Z",
  "availableTo": "2026-03-10T18:00:00.000Z",
  "durationMinutes": 60,
  "answerReviewMode": "AFTER_ASSESSMENT_END",
  "passPercentage": 70.0,
  "isPublished": true
}
```

**Answer Review Modes:**
- `IMMEDIATELY_AFTER_SUBMISSION` - Show answers right after submission
- `AFTER_ASSESSMENT_END` - Show after assessment period ends
- `AT_CUSTOM_TIME` - Show at specific date/time
- `NEVER` - Never show answers

**Response:**
```json
{
  "id": "assessment-uuid",
  "courseId": "course-uuid",
  "title": "Mathematics Quiz 1",
  "type": "QUIZ",
  "totalPoints": 0,
  "passPercentage": 70.0,
  "isPublished": true
}
```

### List Assessments
```http
GET /assessments?courseId=<uuid>&type=<QUIZ|EXAM|ASSIGNMENT>&isPublished=true
Authorization: Bearer <token>
```

### Get Assessment
```http
GET /assessments/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "assessment-uuid",
  "title": "Mathematics Quiz 1",
  "questions": [
    {
      "id": "aq-uuid",
      "order": 1,
      "pointsOverride": 10,
      "question": {
        "id": "q-uuid",
        "title": "What is 2+2?",
        "options": [...]
      }
    }
  ],
  "_count": {
    "attempts": 45
  }
}
```

### Update Assessment
```http
PATCH /assessments/:id
Authorization: Bearer <teacher/admin/assistant_token>
```

### Delete Assessment
```http
DELETE /assessments/:id
Authorization: Bearer <teacher/admin/assistant_token>
```

### Add Questions to Assessment
```http
POST /assessments/:id/questions
Authorization: Bearer <teacher/admin/assistant_token>
```

**Request Body:**
```json
{
  "questionIds": ["q-1-uuid", "q-2-uuid"],
  "pointsOverrides": {
    "q-1-uuid": 10,
    "q-2-uuid": 15
  }
}
```

### Remove Question from Assessment
```http
DELETE /assessments/:assessmentId/questions/:questionId
Authorization: Bearer <teacher/admin/assistant_token>
```

---

## 🎯 Student Attempts

### Start Attempt
```http
POST /assessments/:id/start
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "attemptId": "attempt-uuid",
  "assessmentId": "assessment-uuid",
  "status": "STARTED",
  "startedAt": "2026-03-08T10:00:00.000Z",
  "expiresAt": "2026-03-08T11:00:00.000Z",
  "remainingSeconds": 3600,
  "questions": [...]
}
```

### Get My Current Attempt
```http
GET /assessments/:id/my-attempt
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "attemptId": "attempt-uuid",
  "status": "IN_PROGRESS",
  "remainingSeconds": 1800,
  "editable": true,
  "questions": [...],
  "answers": [...]
}
```

### Save Draft Answers
```http
PATCH /assessments/:id/attempts/:attemptId/save
Authorization: Bearer <student_token>
```

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q-uuid",
      "selectedOptionId": "opt-uuid"
    },
    {
      "questionId": "q-uuid-2",
      "essayText": "My essay answer...",
      "essayImageUrl": "https://..."
    }
  ]
}
```

**Response:**
```json
{
  "message": "Draft saved successfully",
  "savedAnswers": [...],
  "remainingSeconds": 1800
}
```

### Submit Attempt
```http
POST /assessments/:id/submit
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "message": "Assessment submitted successfully",
  "attempt": {
    "id": "attempt-uuid",
    "status": "SUBMITTED",
    "submittedAt": "2026-03-08T10:45:00.000Z"
  }
}
```

### Get My Result
```http
GET /assessments/:id/my-result
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "id": "attempt-uuid",
  "score": 85,
  "maxScore": 100,
  "percentage": 85,
  "isPassed": true,
  "status": "GRADED",
  "answers": [
    {
      "questionId": "q-uuid",
      "isCorrect": true,
      "awardedPoints": 10
    }
  ]
}
```

---

## 📊 Teacher Submissions & Grading

### List Submissions
```http
GET /assessments/:id/submissions?status=<status>
Authorization: Bearer <teacher/admin/assistant_token>
```

**Query Parameters:**
- `status`: `STARTED`, `IN_PROGRESS`, `SUBMITTED`, `GRADED`, `PARTIALLY_GRADED`

**Response:**
```json
[
  {
    "id": "attempt-uuid",
    "studentId": "student-uuid",
    "score": 85,
    "percentage": 85,
    "status": "GRADED",
    "submittedAt": "2026-03-08T10:45:00.000Z"
  }
]
```

### Get Submission Detail
```http
GET /assessments/:id/submissions/:attemptId
Authorization: Bearer <teacher/admin/assistant_token>
```

### Grade Essay Answers
```http
POST /assessments/:id/submissions/:attemptId/grade-essay
Authorization: Bearer <teacher/admin/assistant_token>
```

**Request Body:**
```json
{
  "grades": [
    {
      "questionId": "q-uuid",
      "awardedPoints": 8,
      "feedback": "Good explanation, could include more examples."
    }
  ]
}
```

**Response:**
```json
{
  "attemptId": "attempt-uuid",
  "score": 88,
  "maxScore": 100,
  "percentage": 88,
  "status": "GRADED"
}
```

---

## 🚪 Assessment Gates (Content Gating)

### Create Assessment Gate
```http
POST /assessment-gates
Authorization: Bearer <teacher/admin/assistant_token>
```

**Request Body:**
```json
{
  "assessmentId": "assessment-uuid",
  "targetLessonId": "lesson-uuid",
  "minimumPassPercentage": 80.0
}
```

### Get Gate for Lesson
```http
GET /assessment-gates/:lessonId
Authorization: Bearer <token>
```

### Check Lesson Access
```http
GET /assessment-gates/:lessonId/check?studentId=<optional>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "locked": false,
  "message": "Lesson unlocked",
  "attempt": {
    "score": 85,
    "percentage": 85,
    "isPassed": true
  }
}
```

**Response (Locked):**
```json
{
  "locked": true,
  "message": "Assessment not passed",
  "requiredAssessment": {
    "id": "assessment-uuid",
    "title": "Required Quiz"
  },
  "minimumPassPercentage": 80.0
}
```

---

## 📈 Reporting

### Assessment Report
```http
GET /assessments/:id/report
Authorization: Bearer <teacher/admin/assistant_token>
```

**Response:**
```json
{
  "assessmentId": "assessment-uuid",
  "title": "Mathematics Quiz 1",
  "statistics": {
    "totalAttempts": 45,
    "completedAttempts": 40,
    "averageScore": 78.5,
    "passRate": 75.0
  },
  "questionStats": [
    {
      "questionId": "q-uuid",
      "correctRate": 85.0,
      "averageTime": 120
    }
  ]
}
```

### Course Assessments Report
```http
GET /courses/:courseId/assessments/report
Authorization: Bearer <teacher/admin/assistant_token>
```

### Course Attendance Report
```http
GET /courses/:courseId/assessments/attendance-report
Authorization: Bearer <teacher/admin/assistant_token>
```

**Response:**
```json
{
  "courseId": "course-uuid",
  "assessments": [
    {
      "assessmentId": "assessment-uuid",
      "title": "Quiz 1",
      "attendance": {
        "present": 40,
        "absent": 5,
        "total": 45
      }
    }
  ]
}
```

---

## 🔐 Role-Based Access

| Endpoint | Student | Teacher | Admin | Assistant |
|----------|---------|---------|-------|-----------|
| `GET /health` | ✅ | ✅ | ✅ | ✅ |
| `GET /question-banks` | ✅ | ✅ | ✅ | ✅ |
| `POST /question-banks` | ❌ | ✅ | ✅ | ❌ |
| `PATCH/DELETE /question-banks/:id` | ❌ | ✅ | ✅ | ❌ |
| Question CRUD | ❌ | ✅ | ✅ | ❌ |
| `GET /assessments` | ✅ | ✅ | ✅ | ✅ |
| `POST /assessments` | ❌ | ✅ | ✅ | ✅ |
| `PATCH/DELETE /assessments/:id` | ❌ | ✅ | ✅ | ✅ |
| `POST /assessments/:id/start` | ✅ | ❌ | ❌ | ❌ |
| `POST /assessments/:id/submit` | ✅ | ❌ | ❌ | ❌ |
| `GET /assessments/:id/submissions` | ❌ | ✅ | ✅ | ✅ |
| `POST /.../grade-essay` | ❌ | ✅ | ✅ | ✅ |
| Gates & Reports | ❌ | ✅ | ✅ | ✅ |

---

## �📊 API Examples

### Question Bank Management

```bash
# Create a grade-scoped question bank
curl -X POST http://localhost:3007/question-banks \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grade 10 Mathematics",
    "scopeType": "GRADE",
    "gradeId": "grade-10-uuid"
  }'

# Create a global question bank
curl -X POST http://localhost:3007/question-banks \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "General Knowledge",
    "scopeType": "GLOBAL"
  }'
```

### Question Management

```bash
# Create multiple choice question
curl -X POST http://localhost:3007/question-banks/bank-uuid/questions \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MULTIPLE_CHOICE",
    "title": "What is 2 + 2?",
    "body": "Solve the following addition problem.",
    "difficulty": "EASY",
    "defaultPoints": 5,
    "explanation": "2 + 2 = 4",
    "options": [
      {"text": "3", "isCorrect": false, "order": 1},
      {"text": "4", "isCorrect": true, "order": 2},
      {"text": "5", "isCorrect": false, "order": 3}
    ]
  }'

# Create essay question
curl -X POST http://localhost:3007/question-banks/bank-uuid/questions \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ESSAY",
    "title": "Explain the importance of mathematics",
    "body": "Write a detailed explanation about why mathematics is important in daily life.",
    "difficulty": "MEDIUM",
    "defaultPoints": 10,
    "explanation": "Answers should discuss practical applications"
  }'
```

### Assessment Management

```bash
# Create a quiz with time limit
curl -X POST http://localhost:3007/assessments \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-uuid",
    "title": "Mathematics Quiz 1",
    "description": "Basic arithmetic and algebra",
    "type": "QUIZ",
    "gradeId": "grade-10-uuid",
    "availableFrom": "2026-03-10T09:00:00.000Z",
    "availableTo": "2026-03-10T18:00:00.000Z",
    "durationMinutes": 60,
    "answerReviewMode": "AFTER_ASSESSMENT_END",
    "passPercentage": 70.0
  }'

# Add questions to assessment
curl -X POST http://localhost:3007/assessments/assessment-uuid/questions \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionIds": ["question-1-uuid", "question-2-uuid"],
    "pointsOverrides": {"question-1-uuid": 10}
  }'
```

### Student Attempt Flow

```bash
# Start an assessment attempt
curl -X POST http://localhost:3007/assessments/assessment-uuid/start \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Submit answers
curl -X POST http://localhost:3007/assessments/assessment-uuid/answers \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "question-1-uuid",
        "selectedOptionId": "option-2-uuid"
      },
      {
        "questionId": "question-2-uuid",
        "essayText": "Mathematics is important because..."
      }
    ]
  }'

# Submit the attempt
curl -X POST http://localhost:3007/assessments/assessment-uuid/submit \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# View results (when available)
curl -X GET http://localhost:3007/assessments/assessment-uuid/my-result \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### Teacher Grading

```bash
# Get all submissions for grading
curl -X GET http://localhost:3007/assessments/assessment-uuid/submissions \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# Grade essay answers
curl -X POST http://localhost:3007/assessments/assessment-uuid/submissions/attempt-uuid/grade-essay \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grades": [
      {
        "questionId": "question-2-uuid",
        "awardedPoints": 8,
        "feedback": "Good explanation, but could include more examples."
      }
    ]
  }'
```

### Content Gating

```bash
# Create assessment gate for lesson
curl -X POST http://localhost:3007/assessment-gates \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "assessment-uuid",
    "targetLessonId": "lesson-uuid",
    "minimumPassPercentage": 80.0
  }'

# Check if lesson is unlocked for student
curl -X GET "http://localhost:3007/assessment-gates/lesson-uuid/check?studentId=student-uuid" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔒 Business Rules

- Teachers can only create assessments for their own courses
- Questions must come from grade-scoped or global question banks
- Assessment total points are auto-calculated from question points
- Students can only start attempts during availability windows
- Time limits are enforced from attempt start time
- Essay answers require manual grading for final scores
- Answer review visibility follows configured modes
- Late-enrolled students are not counted as absent
- Content gates enforce minimum pass percentages

## 🔗 Integration Points

- **Identity Service**: JWT validation and user information
- **Course Service**: Course ownership and grade validation
- **Enrollment Service**: Active enrollment and enrollment date tracking
- **Staff Service**: Assistant permission validation
- **Content Service**: Lesson unlock gate integration

## 📈 Reporting & Analytics

- Assessment performance statistics
- Question difficulty analysis
- Student attendance tracking
- Most/least correctly answered questions
- Pass/fail rate analytics
- Time-based performance trends

## 🚀 Production Considerations

- Database connection pooling
- Redis caching for assessment data
- File upload handling for essay images
- Rate limiting for assessment attempts
- Data retention policies for old attempts
- Backup and recovery procedures

## 🔧 Future Improvements

- Real-time assessment monitoring
- Advanced question randomization
- Plagiarism detection for essays
- Adaptive difficulty algorithms
- Bulk assessment operations
- Integration with learning analytics platforms
