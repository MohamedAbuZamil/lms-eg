# Assessment Service API Documentation

## Overview

The Assessment Service manages quizzes, exams, assignments, and assessment-based content gating within the LMS ecosystem.

## Base URL
```
http://localhost:3007
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Health Check

#### GET /health
Check service health status.

**Response:**
```json
{
  "status": "ok",
  "service": "assessment-service"
}
```

---

## Question Bank Endpoints

### Create Question Bank

#### POST /question-banks
Create a new question bank.

**Authorization:** TEACHER, ADMIN

**Request Body:**
```json
{
  "name": "Grade 10 Mathematics",
  "scopeType": "GRADE",
  "gradeId": "grade-uuid"
}
```

### Get Question Banks

#### GET /question-banks
List question banks with filtering.

**Query Parameters:**
- `gradeId` (string, optional): Filter by grade
- `scopeType` (string, optional): GRADE or GLOBAL

### Get Question Bank by ID

#### GET /question-banks/:id
Get question bank details with questions.

---

## Question Endpoints

### Create Question

#### POST /question-banks/:bankId/questions
Create a question in a bank.

**Authorization:** TEACHER, ADMIN

**Request Body (Multiple Choice):**
```json
{
  "type": "MULTIPLE_CHOICE",
  "title": "What is 2 + 2?",
  "body": "Solve the following problem.",
  "difficulty": "EASY",
  "defaultPoints": 5,
  "explanation": "2 + 2 equals 4",
  "options": [
    {"text": "3", "isCorrect": false, "order": 1},
    {"text": "4", "isCorrect": true, "order": 2},
    {"text": "5", "isCorrect": false, "order": 3}
  ]
}
```

**Request Body (Essay):**
```json
{
  "type": "ESSAY",
  "title": "Explain mathematics importance",
  "body": "Write about why math matters.",
  "difficulty": "MEDIUM",
  "defaultPoints": 10
}
```

---

## Assessment Endpoints

### Create Assessment

#### POST /assessments
Create a new assessment.

**Authorization:** TEACHER, ADMIN, ASSISTANT

**Request Body:**
```json
{
  "courseId": "course-uuid",
  "title": "Math Quiz 1",
  "description": "Basic arithmetic",
  "type": "QUIZ",
  "gradeId": "grade-uuid",
  "availableFrom": "2026-03-10T09:00:00.000Z",
  "availableTo": "2026-03-10T18:00:00.000Z",
  "durationMinutes": 60,
  "answerReviewMode": "AFTER_ASSESSMENT_END",
  "passPercentage": 70
}
```

### Student Attempt Endpoints

#### POST /assessments/:id/start
Start an assessment attempt.

**Authorization:** STUDENT

#### POST /assessments/:id/answers
Submit answers during attempt.

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "q1-uuid",
      "selectedOptionId": "opt2-uuid"
    },
    {
      "questionId": "q2-uuid",
      "essayText": "My explanation here..."
    }
  ]
}
```

#### POST /assessments/:id/submit
Submit the assessment attempt.

#### GET /assessments/:id/my-result
Get student's result for an assessment.

---

## Teacher Grading Endpoints

#### GET /assessments/:id/submissions
Get all student submissions for grading.

#### POST /assessments/:id/submissions/:attemptId/grade-essay
Grade essay answers.

**Request Body:**
```json
{
  "grades": [
    {
      "questionId": "q-uuid",
      "awardedPoints": 8,
      "feedback": "Good work, but needs more examples"
    }
  ]
}
```

---

## Reporting Endpoints

#### GET /assessments/:id/report
Get detailed assessment performance report.

#### GET /courses/:courseId/assessments/report
Get course-wide assessments report.

#### GET /courses/:courseId/assessments/attendance-report
Get attendance report with late-enrollment awareness.

---

## Content Gate Endpoints

#### POST /assessment-gates
Create assessment gate for lesson unlock.

**Request Body:**
```json
{
  "assessmentId": "assessment-uuid",
  "targetLessonId": "lesson-uuid",
  "minimumPassPercentage": 70
}
```

#### GET /assessment-gates/:lessonId/check?studentId=...
Check if lesson is unlocked for student.

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

---

## Data Models

### Assessment
```json
{
  "id": "uuid",
  "title": "string",
  "type": "QUIZ|EXAM|ASSIGNMENT",
  "totalPoints": 100,
  "passPercentage": 70,
  "availableFrom": "2026-03-10T09:00:00.000Z",
  "availableTo": "2026-03-10T18:00:00.000Z",
  "durationMinutes": 60,
  "answerReviewMode": "AFTER_ASSESSMENT_END",
  "isPublished": true
}
```

### Attempt
```json
{
  "id": "uuid",
  "assessmentId": "uuid",
  "studentId": "uuid",
  "startedAt": "2026-03-10T10:00:00.000Z",
  "submittedAt": "2026-03-10T11:00:00.000Z",
  "status": "GRADED",
  "score": 85,
  "maxScore": 100,
  "percentage": 85,
  "isPassed": true
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid question type",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 403 Forbidden
```json
{
  "message": "Assessment not available",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "Question bank not found",
  "error": "Not Found",
  "statusCode": 404
}
```
