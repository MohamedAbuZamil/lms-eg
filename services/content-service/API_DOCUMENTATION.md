# Content Service API Documentation

## Overview

The Content Service manages course content, lessons, sections, and secure video playback within the LMS ecosystem. It handles content creation, organization, and access control with view limiting capabilities.

## Base URL
```
http://localhost:3005
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
  "service": "content-service"
}
```

---

## Course Management Endpoints

### Create Course

#### POST /courses
Create a new course.

**Authorization:** TEACHER, ADMIN

**Request Body:**
```json
{
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "category": "Programming",
  "level": "BEGINNER",
  "isPublic": true,
  "price": 99.99
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "category": "Programming",
  "level": "BEGINNER",
  "isPublic": true,
  "price": 99.99,
  "teacherId": "uuid",
  "createdAt": "2026-03-07T22:30:00.000Z",
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Get Course by ID

#### GET /courses/:courseId
Get course details.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Response:**
```json
{
  "id": "uuid",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "category": "Programming",
  "level": "BEGINNER",
  "isPublic": true,
  "price": 99.99,
  "teacherId": "uuid",
  "teacher": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "teacher@example.com"
  },
  "createdAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Update Course

#### PATCH /courses/:courseId
Update course details.

**Authorization:** Course owner, ADMIN

**Parameters:**
- `courseId` (string, path): UUID of the course

**Request Body:**
```json
{
  "title": "Updated Course Title",
  "description": "Updated description",
  "isPublic": false
}
```

---

### List Courses

#### GET /courses
List courses with pagination and filtering.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `category` (string, optional): Filter by category
- `level` (string, optional): Filter by level
- `teacherId` (string, optional): Filter by teacher
- `isPublic` (boolean, optional): Filter by visibility

**Response:**
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "category": "Programming",
      "level": "BEGINNER",
      "isPublic": true,
      "price": 99.99,
      "teacher": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2026-03-07T22:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

## Section Management Endpoints

### Create Section

#### POST /courses/:courseId/sections
Create a new section in a course.

**Authorization:** Course owner, ADMIN

**Parameters:**
- `courseId` (string, path): UUID of the course

**Request Body:**
```json
{
  "title": "Getting Started",
  "description": "Introduction to the course",
  "order": 1
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Getting Started",
  "description": "Introduction to the course",
  "order": 1,
  "courseId": "uuid",
  "createdAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Get Course Sections

#### GET /courses/:courseId/sections
Get all sections in a course.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Response:**
```json
{
  "sections": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "description": "Introduction to the course",
      "order": 1,
      "courseId": "uuid",
      "lessons": [
        {
          "id": "uuid",
          "title": "Course Introduction",
          "type": "VIDEO",
          "order": 1,
          "isPreview": true
        }
      ]
    }
  ]
}
```

---

## Lesson Management Endpoints

### Create Lesson

#### POST /sections/:sectionId/lessons
Create a new lesson in a section.

**Authorization:** Course owner, ADMIN

**Parameters:**
- `sectionId` (string, path): UUID of the section

**Request Body:**
```json
{
  "title": "Introduction to Variables",
  "type": "VIDEO",
  "content": {
    "videoUrl": "https://www.youtube.com/watch?v=example",
    "duration": 300
  },
  "order": 1,
  "isPreview": false,
  "viewLimitEnabled": true,
  "maxViews": 3,
  "viewCooldownHours": 6
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Introduction to Variables",
  "type": "VIDEO",
  "content": {
    "videoUrl": "https://www.youtube.com/watch?v=example",
    "duration": 300
  },
  "order": 1,
  "isPreview": false,
  "sectionId": "uuid",
  "viewLimitEnabled": true,
  "maxViews": 3,
  "viewCooldownHours": 6,
  "createdAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Get Lesson by ID

#### GET /lessons/:lessonId
Get lesson details.

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "id": "uuid",
  "title": "Introduction to Variables",
  "type": "VIDEO",
  "content": {
    "videoUrl": "https://www.youtube.com/watch?v=example",
    "duration": 300
  },
  "order": 1,
  "isPreview": false,
  "sectionId": "uuid",
  "section": {
    "id": "uuid",
    "title": "Getting Started",
    "courseId": "uuid"
  },
  "viewLimitEnabled": true,
  "maxViews": 3,
  "viewCooldownHours": 6,
  "createdAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Update Lesson

#### PATCH /lessons/:lessonId
Update lesson details.

**Authorization:** Course owner, ADMIN

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Request Body:**
```json
{
  "title": "Updated Lesson Title",
  "content": {
    "videoUrl": "https://www.youtube.com/watch?v=updated"
  }
}
```

---

## Video Playback Endpoints

### Generate Playback Token

#### GET /lessons/:lessonId/playback
Generate secure playback token for video lesson.

**Authorization:** Required

**Parameters:**
- `lessonId` (string, path): UUID of the lesson
- `isPreview` (boolean, query, optional): Preview access flag

**Response:**
```json
{
  "token": "secure-playback-token",
  "expiresAt": "2026-03-07T22:32:00.000Z",
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID?start=0&autoplay=1",
  "viewsConsumed": 1,
  "viewsRemaining": 2,
  "viewLimitStatus": "AVAILABLE"
}
```

**Example:**
```bash
curl -X GET "http://localhost:3005/lessons/lesson-uuid/playback?isPreview=false" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

### Get Video Embed URL

#### GET /lessons/:lessonId/embed
Get embed URL for video lesson.

**Authorization:** Required

**Parameters:**
- `lessonId` (string, path): UUID of the lesson
- `token` (string, query): Playback token

**Response:**
```json
{
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID?start=0&autoplay=1",
  "expiresAt": "2026-03-07T22:32:00.000Z"
}
```

---

## View Limit Management

### Get Lesson View Usage

#### GET /lessons/:lessonId/views
Get view usage statistics for a lesson.

**Authorization:** Course owner, ADMIN

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Response:**
```json
{
  "lessonId": "uuid",
  "totalViews": 150,
  "uniqueStudents": 45,
  "averageViewsPerStudent": 3.3,
  "viewLimitEnabled": true,
  "maxViews": 3,
  "studentsOnCooldown": 12,
  "studentsExhaustedViews": 8
}
```

---

### Grant Extra Views

#### POST /lessons/:lessonId/grant-views
Grant extra views to specific students.

**Authorization:** Course owner, ADMIN

**Parameters:**
- `lessonId` (string, path): UUID of the lesson

**Request Body:**
```json
{
  "studentIds": ["uuid1", "uuid2"],
  "extraViews": 2,
  "reason": "Student requested additional access"
}
```

**Response:**
```json
{
  "message": "Extra views granted successfully",
  "grantedCount": 2
}
```

---

## Course Structure Endpoints

### Get Full Course Content

#### GET /courses/:courseId/content
Get complete course structure with all sections and lessons.

**Parameters:**
- `courseId` (string, path): UUID of the course

**Response:**
```json
{
  "courseId": "uuid",
  "title": "Introduction to Programming",
  "sections": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "order": 1,
      "lessons": [
        {
          "id": "uuid",
          "title": "Course Introduction",
          "type": "VIDEO",
          "order": 1,
          "isPreview": true,
          "duration": 300,
          "viewLimitEnabled": false
        }
      ]
    }
  ],
  "totalLessons": 10,
  "totalDuration": 3600
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid lesson type",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid or expired token",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "message": "VIEW_LIMIT_EXCEEDED: Maximum views reached",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "Course not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## Lesson Types

- **VIDEO**: Video lessons with YouTube/Vimeo integration
- **TEXT**: Text-based lessons with rich content
- **PDF**: PDF document lessons
- **FILE**: File download lessons

---

## View Limit Status Values

- **UNLIMITED**: No view limits applied
- **AVAILABLE**: Views remaining, can access
- **COOLDOWN**: In cooldown period, wait required
- **EXCEEDED**: Maximum views reached, access denied

---

## Video Security Features

- **Secure Token Generation**: Time-limited playback tokens
- **View Limit Policies**: Configurable view restrictions
- **Cooldown Windows**: Prevent abuse with time-based restrictions
- **Preview Access**: Free preview lessons for marketing
- **Domain Restrictions**: Embed URL domain validation

---

## Usage Examples

### Complete Course Creation Flow

```bash
# 1. Create course
curl -X POST http://localhost:3005/courses \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced JavaScript",
    "description": "Deep dive into JavaScript",
    "category": "Programming",
    "level": "ADVANCED"
  }'

# 2. Create section
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript Fundamentals",
    "order": 1
  }'

# 3. Create video lesson with view limits
curl -X POST http://localhost:3005/sections/section-uuid/lessons \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Variables and Data Types",
    "type": "VIDEO",
    "content": {
      "videoUrl": "https://www.youtube.com/watch?v=example",
      "duration": 450
    },
    "viewLimitEnabled": true,
    "maxViews": 5,
    "viewCooldownHours": 12
  }'

# 4. Get playback token
curl -X GET "http://localhost:3005/lessons/lesson-uuid/playback" \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

---

## Data Models

### Course
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "category": "string",
  "level": "BEGINNER|INTERMEDIATE|ADVANCED",
  "isPublic": true,
  "price": 99.99,
  "teacherId": "uuid",
  "createdAt": "2026-03-07T22:30:00.000Z",
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

### Lesson
```json
{
  "id": "uuid",
  "title": "string",
  "type": "VIDEO|TEXT|PDF|FILE",
  "content": {
    "videoUrl": "string",
    "duration": 300
  },
  "order": 1,
  "isPreview": false,
  "sectionId": "uuid",
  "viewLimitEnabled": true,
  "maxViews": 3,
  "viewCooldownHours": 6,
  "createdAt": "2026-03-07T22:30:00.000Z"
}
```

### Playback Response
```json
{
  "token": "secure-token",
  "expiresAt": "2026-03-07T22:32:00.000Z",
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID",
  "viewsConsumed": 1,
  "viewsRemaining": 2,
  "viewLimitStatus": "AVAILABLE"
}
```
