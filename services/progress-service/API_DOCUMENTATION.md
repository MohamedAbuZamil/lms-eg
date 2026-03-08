# Progress Service API Documentation

## Overview

The Progress Service provides comprehensive student learning progress tracking within the LMS ecosystem. It handles lesson progress, course completion, video position tracking, and provides detailed analytics for teachers and administrators.

## Base URL
```
http://localhost:3006
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
  "service": "progress-service"
}
```

---

## Student Progress Endpoints

### Open Lesson / Initialize Progress

#### POST /progress/lessons/:lessonId/open
Initialize or update lesson progress when a student opens a lesson.

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 0,
  "lastPositionSeconds": 0
}
```

**Example:**
```bash
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/open \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

### Update Video Progress

#### PATCH /progress/lessons/:lessonId/video
Update progress for video lessons (position and percentage).

**Parameters:**
- `lessonId` (string, path): UUID of the video lesson

**Request Body:**
```json
{
  "lastPositionSeconds": 125,
  "progressPercent": 42
}
```

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 42,
  "lastPositionSeconds": 125
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3006/progress/lessons/lesson-uuid/video \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastPositionSeconds": 125,
    "progressPercent": 42
  }'
```

---

### Mark Lesson Completed

#### POST /progress/lessons/:lessonId/complete
Mark a lesson as completed.

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "COMPLETED",
  "progressPercent": 100,
  "completedAt": "2026-03-07T22:30:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/complete \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

### Get My Lesson Progress

#### GET /progress/lessons/:lessonId/me
Get current progress for a specific lesson.

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 42,
  "lastPositionSeconds": 125,
  "completedAt": null,
  "lastAccessedAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Get My Course Progress

#### GET /progress/courses/:courseId/me
Get overall progress for a course.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Response:**
```json
{
  "courseId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 60,
  "completedLessons": 6,
  "totalLessons": 10,
  "lastActivityAt": "2026-03-07T22:30:00.000Z",
  "startedAt": "2026-03-01T10:00:00.000Z",
  "completedAt": null
}
```

---

### List My Course Lesson Progress

#### GET /progress/courses/:courseId/me/lessons
Get progress for all lessons within a course.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Response:**
```json
{
  "courseId": "uuid",
  "lessons": [
    {
      "lessonId": "uuid",
      "title": "Introduction to Programming",
      "type": "VIDEO",
      "order": 1,
      "isPreview": false,
      "status": "COMPLETED",
      "progressPercent": 100,
      "lastPositionSeconds": 300,
      "completedAt": "2026-03-07T20:00:00.000Z",
      "lastAccessedAt": "2026-03-07T20:30:00.000Z"
    }
  ]
}
```

---

## Teacher/Admin Progress Endpoints

### Get Course Progress Summary

#### GET /progress/courses/:courseId/summary
Get aggregated progress statistics for a course.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Authorization:** TEACHER (own courses), ASSISTANT (with permissions), ADMIN

**Response:**
```json
{
  "courseId": "uuid",
  "studentsCount": 120,
  "activeStudentsCount": 80,
  "completedStudentsCount": 15,
  "averageProgressPercent": 47,
  "totalLessons": 10
}
```

---

### Get Specific Student Progress in Course

#### GET /progress/courses/:courseId/students/:studentId
Get detailed progress for a specific student in a course.

**Parameters:**
- `courseId` (string, path): UUID of the course
- `studentId` (string, path): UUID of the student

**Authorization:** TEACHER (own courses), ASSISTANT (with permissions), ADMIN

**Response:**
```json
{
  "courseId": "uuid",
  "studentId": "uuid",
  "courseProgress": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "progressPercent": 60,
    "completedLessons": 6,
    "totalLessons": 10
  },
  "lessonProgresses": [
    {
      "id": "uuid",
      "lessonId": "uuid",
      "status": "COMPLETED",
      "progressPercent": 100,
      "lastAccessedAt": "2026-03-07T22:30:00.000Z"
    }
  ]
}
```

---

### List Students Progress in Course

#### GET /progress/courses/:courseId/students
Get paginated list of all students' progress in a course.

**Parameters:**
- `courseId` (string, path): UUID of the course
- `status` (string, query, optional): Filter by progress status
- `completion` (string, query, optional): Filter by completion status
- `search` (string, query, optional): Search by student identifier
- `page` (number, query, optional): Page number (default: 1)
- `limit` (number, query, optional): Items per page (default: 20, max: 100)

**Authorization:** TEACHER (own courses), ASSISTANT (with permissions), ADMIN

**Response:**
```json
{
  "courseId": "uuid",
  "students": [
    {
      "id": "uuid",
      "userId": "uuid",
      "courseId": "uuid",
      "status": "IN_PROGRESS",
      "progressPercent": 60,
      "completedLessons": 6,
      "totalLessons": 10,
      "lastActivityAt": "2026-03-07T22:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 80,
    "totalPages": 4
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3006/progress/courses/course-uuid/students?status=IN_PROGRESS&page=1&limit=20" \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

---

## Admin Only Endpoints

### Reset Student Progress

#### POST /progress/admin/reset
Reset progress for a student (lesson or course level).

**Authorization:** ADMIN only

**Request Body:**
```json
{
  "studentId": "uuid",
  "scope": "LESSON", // or "COURSE"
  "lessonId": "uuid", // required when scope is LESSON
  "courseId": "uuid", // required when scope is COURSE
  "reason": "Student requested progress reset"
}
```

**Response (Lesson Reset):**
```json
{
  "deletedCount": 1
}
```

**Response (Course Reset):**
```json
{
  "deletedLessonProgressCount": 10,
  "deletedCourseProgressCount": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Progress updates are only allowed for VIDEO lessons",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 403 Forbidden
```json
{
  "message": "Active enrollment required to access this lesson",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "Lesson not found: uuid",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## Progress Status Values

### Lesson Status
- `NOT_STARTED`: Lesson has not been accessed
- `IN_PROGRESS`: Lesson has been opened but not completed
- `COMPLETED`: Lesson has been marked as completed

### Course Status
- `NOT_STARTED`: No lessons have been started
- `IN_PROGRESS`: At least one lesson is in progress but course not completed
- `COMPLETED`: All required lessons have been completed

---

## Rate Limiting

Progress update endpoints may have rate limiting to prevent abuse:
- Video progress updates: 10 requests per minute per user
- Lesson completion: 5 requests per minute per user

---

## Integration Notes

- The service automatically recalculates course progress when lesson progress changes
- Course completion percentage is based on non-preview lessons only
- Preview lessons can be accessed without enrollment but progress is still tracked for authenticated users
- All cross-service validations are performed in real-time to ensure data consistency

---

## Usage Examples

### Complete Student Learning Flow

```bash
# 1. Student opens a video lesson
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/open \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 2. Student watches video and progress updates
curl -X PATCH http://localhost:3006/progress/lessons/lesson-uuid/video \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lastPositionSeconds": 125, "progressPercent": 42}'

# 3. Student completes the lesson
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/complete \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 4. Student checks their overall course progress
curl -X GET http://localhost:3006/progress/courses/course-uuid/me \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### Teacher Monitoring Flow

```bash
# 1. Teacher views course summary
curl -X GET http://localhost:3006/progress/courses/course-uuid/summary \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# 2. Teacher lists all students with pagination
curl -X GET "http://localhost:3006/progress/courses/course-uuid/students?page=1&limit=20" \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# 3. Teacher checks specific student progress
curl -X GET http://localhost:3006/progress/courses/course-uuid/students/student-uuid \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

---

## Data Models

### LessonProgress
```json
{
  "id": "uuid",
  "userId": "uuid",
  "courseId": "uuid",
  "lessonId": "uuid",
  "lessonType": "VIDEO|TEXT|PDF|FILE",
  "status": "NOT_STARTED|IN_PROGRESS|COMPLETED",
  "progressPercent": 42,
  "lastPositionSeconds": 125,
  "completedAt": "2026-03-07T22:30:00.000Z",
  "lastAccessedAt": "2026-03-07T22:30:00.000Z",
  "createdAt": "2026-03-07T20:00:00.000Z",
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

### CourseProgress
```json
{
  "id": "uuid",
  "userId": "uuid",
  "courseId": "uuid",
  "totalLessons": 10,
  "completedLessons": 6,
  "progressPercent": 60,
  "status": "NOT_STARTED|IN_PROGRESS|COMPLETED",
  "startedAt": "2026-03-01T10:00:00.000Z",
  "completedAt": null,
  "lastActivityAt": "2026-03-07T22:30:00.000Z",
  "createdAt": "2026-03-01T10:00:00.000Z",
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

### Health Check

#### GET /health
Check service health status.

**Response:**
```json
{
  "status": "ok",
  "service": "progress-service"
}
```

---

## Student Progress Endpoints

### Open Lesson / Initialize Progress

#### POST /progress/lessons/:lessonId/open
Initialize or update lesson progress when a student opens a lesson.

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 0,
  "lastPositionSeconds": 0
}
```

**Example:**
```bash
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/open \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

### Update Video Progress

#### PATCH /progress/lessons/:lessonId/video
Update progress for video lessons (position and percentage).

**Parameters:**
- `lessonId` (string, path): UUID of the video lesson

**Request Body:**
```json
{
  "lastPositionSeconds": 125,
  "progressPercent": 42
}
```

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 42,
  "lastPositionSeconds": 125
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3006/progress/lessons/lesson-uuid/video \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastPositionSeconds": 125,
    "progressPercent": 42
  }'
```

---

### Mark Lesson Completed

#### POST /progress/lessons/:lessonId/complete
Mark a lesson as completed.

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "COMPLETED",
  "progressPercent": 100,
  "completedAt": "2026-03-07T22:30:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/complete \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

### Get My Lesson Progress

#### GET /progress/lessons/:lessonId/me
Get current progress for a specific lesson.

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "lessonId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 42,
  "lastPositionSeconds": 125,
  "completedAt": null,
  "lastAccessedAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Get My Course Progress

#### GET /progress/courses/:courseId/me
Get overall progress for a course.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Response:**
```json
{
  "courseId": "uuid",
  "status": "IN_PROGRESS",
  "progressPercent": 60,
  "completedLessons": 6,
  "totalLessons": 10,
  "lastActivityAt": "2026-03-07T22:30:00.000Z",
  "startedAt": "2026-03-01T10:00:00.000Z",
  "completedAt": null
}
```

---

### List My Course Lesson Progress

#### GET /progress/courses/:courseId/me/lessons
Get progress for all lessons within a course.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Response:**
```json
{
  "courseId": "uuid",
  "lessons": [
    {
      "lessonId": "uuid",
      "title": "Introduction to Programming",
      "type": "VIDEO",
      "order": 1,
      "isPreview": false,
      "status": "COMPLETED",
      "progressPercent": 100,
      "lastPositionSeconds": 300,
      "completedAt": "2026-03-07T20:00:00.000Z",
      "lastAccessedAt": "2026-03-07T20:30:00.000Z"
    }
  ]
}
```

---

## Teacher/Admin Progress Endpoints

### Get Course Progress Summary

#### GET /progress/courses/:courseId/summary
Get aggregated progress statistics for a course.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Authorization:** TEACHER (own courses), ASSISTANT (with permissions), ADMIN

**Response:**
```json
{
  "courseId": "uuid",
  "studentsCount": 120,
  "activeStudentsCount": 80,
  "completedStudentsCount": 15,
  "averageProgressPercent": 47,
  "totalLessons": 10
}
```

---

### Get Specific Student Progress in Course

#### GET /progress/courses/:courseId/students/:studentId
Get detailed progress for a specific student in a course.

**Parameters:**
- `courseId` (string, path): UUID of the course
- `studentId` (string, path): UUID of the student

**Authorization:** TEACHER (own courses), ASSISTANT (with permissions), ADMIN

**Response:**
```json
{
  "courseId": "uuid",
  "studentId": "uuid",
  "courseProgress": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "progressPercent": 60,
    "completedLessons": 6,
    "totalLessons": 10
  },
  "lessonProgresses": [
    {
      "id": "uuid",
      "lessonId": "uuid",
      "status": "COMPLETED",
      "progressPercent": 100,
      "lastAccessedAt": "2026-03-07T22:30:00.000Z"
    }
  ]
}
```

---

### List Students Progress in Course

#### GET /progress/courses/:courseId/students
Get paginated list of all students' progress in a course.

**Parameters:**
- `courseId` (string, path): UUID of the course
- `status` (string, query, optional): Filter by progress status
- `completion` (string, query, optional): Filter by completion status
- `search` (string, query, optional): Search by student identifier
- `page` (number, query, optional): Page number (default: 1)
- `limit` (number, query, optional): Items per page (default: 20, max: 100)

**Authorization:** TEACHER (own courses), ASSISTANT (with permissions), ADMIN

**Response:**
```json
{
  "courseId": "uuid",
  "students": [
    {
      "id": "uuid",
      "userId": "uuid",
      "courseId": "uuid",
      "status": "IN_PROGRESS",
      "progressPercent": 60,
      "completedLessons": 6,
      "totalLessons": 10,
      "lastActivityAt": "2026-03-07T22:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 80,
    "totalPages": 4
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:3006/progress/courses/course-uuid/students?status=IN_PROGRESS&page=1&limit=20" \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

---

## Admin Only Endpoints

### Reset Student Progress

#### POST /progress/admin/reset
Reset progress for a student (lesson or course level).

**Authorization:** ADMIN only

**Request Body:**
```json
{
  "studentId": "uuid",
  "scope": "LESSON", // or "COURSE"
  "lessonId": "uuid", // required when scope is LESSON
  "courseId": "uuid", // required when scope is COURSE
  "reason": "Student requested progress reset"
}
```

**Response (Lesson Reset):**
```json
{
  "deletedCount": 1
}
```

**Response (Course Reset):**
```json
{
  "deletedLessonProgressCount": 10,
  "deletedCourseProgressCount": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Progress updates are only allowed for VIDEO lessons",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 403 Forbidden
```json
{
  "message": "Active enrollment required to access this lesson",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "Lesson not found: uuid",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## Progress Status Values

### Lesson Status
- `NOT_STARTED`: Lesson has not been accessed
- `IN_PROGRESS`: Lesson has been opened but not completed
- `COMPLETED`: Lesson has been marked as completed

### Course Status
- `NOT_STARTED`: No lessons have been started
- `IN_PROGRESS`: At least one lesson is in progress but course not completed
- `COMPLETED`: All required lessons have been completed

---

## Rate Limiting

Progress update endpoints may have rate limiting to prevent abuse:
- Video progress updates: 10 requests per minute per user
- Lesson completion: 5 requests per minute per user

---

## Integration Notes

- The service automatically recalculates course progress when lesson progress changes
- Course completion percentage is based on non-preview lessons only
- Preview lessons can be accessed without enrollment but progress is still tracked for authenticated users
- All cross-service validations are performed in real-time to ensure data consistency
