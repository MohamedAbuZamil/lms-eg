# Notification Service API Documentation

A scalable, asynchronous notification microservice for the LMS platform supporting in-app, email, and push notifications.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [API Endpoints](#api-endpoints)
  - [Notifications](#notifications)
  - [Announcements](#announcements)
  - [Events (Webhooks)](#events-webhooks)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The Notification Service provides:

- **In-app notifications** - Real-time alerts within the LMS platform
- **Email notifications** - SMTP, SendGrid, AWS SES support
- **Push notifications** - Firebase/OneSignal (future)
- **System announcements** - Admin broadcasts to all users or specific roles
- **Event-based notifications** - Automated triggers for course events
- **Bulk notifications** - Efficient processing for large user bases (50,000+)

**Tech Stack:** NestJS, PostgreSQL, Redis (BullMQ), Prisma ORM

---

## Authentication

All endpoints (except public announcement listing) require **JWT Bearer Token** authentication.

### Header Format
```
Authorization: Bearer <jwt_token>
```

### JWT Token Structure
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "STUDENT|TEACHER|ADMIN|ASSISTANT",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Roles & Permissions

| Role | Permissions |
|------|------------|
| `STUDENT` | View own notifications, manage preferences |
| `TEACHER` | All student permissions + create course announcements |
| `ADMIN` | All permissions + create system announcements, platform-wide broadcasts |
| `ASSISTANT` | View notifications, limited announcement creation |

---

## Base URL

```
Development: http://localhost:3009
Production: https://notifications.lms.example.com
```

---

## API Endpoints

### Notifications

#### 1. Get My Notifications

Retrieve paginated notifications for the authenticated user.

```http
GET /notifications/me?page=1&limit=20
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max: 100) |

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "notif-uuid",
      "userId": "user-123",
      "title": "Course Enrollment Successful",
      "body": "You have been enrolled in 'Introduction to Programming'",
      "type": "COURSE_ENROLLED",
      "entityType": "course",
      "entityId": "course-456",
      "isRead": false,
      "createdAt": "2024-03-08T10:30:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "unreadCount": 5
}
```

---

#### 2. Get Unread Count

Get the count of unread notifications.

```http
GET /notifications/unread-count
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "count": 5
}
```

---

#### 3. Mark Notification as Read

Mark a specific notification as read.

```http
PATCH /notifications/:id/read
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Notification UUID |

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `404 Not Found` - Notification doesn't exist or doesn't belong to user

---

#### 4. Mark All as Read

Mark all notifications as read.

```http
POST /notifications/read-all
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "markedCount": 5
}
```

---

#### 5. Delete Notification

Delete a specific notification.

```http
DELETE /notifications/:id
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Notification UUID |

**Response (200 OK):**
```json
{
  "success": true
}
```

---

#### 6. Get Notification Preferences

Get user's notification preferences.

```http
GET /notifications/preferences
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "userId": "user-123",
  "emailEnabled": true,
  "pushEnabled": true,
  "inAppEnabled": true,
  "marketingEnabled": false,
  "typePreferences": {
    "ASSESSMENT_PUBLISHED": { "email": true, "push": false },
    "COURSE_ENROLLED": { "email": false, "push": true }
  }
}
```

---

#### 7. Update Notification Preferences

Update user's notification preferences.

```http
PATCH /notifications/preferences
```

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailEnabled": false,
  "marketingEnabled": true,
  "typePreferences": {
    "ANNOUNCEMENT": { "email": true, "push": true }
  }
}
```

**Response (200 OK):**
```json
{
  "userId": "user-123",
  "emailEnabled": false,
  "pushEnabled": true,
  "inAppEnabled": true,
  "marketingEnabled": true,
  "typePreferences": {
    "ANNOUNCEMENT": { "email": true, "push": true }
  }
}
```

---

### Announcements

#### 8. Get Announcements (Public)

Retrieve active system announcements. No authentication required.

```http
GET /announcements?page=1&limit=20
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "announce-uuid",
      "title": "Platform Maintenance",
      "message": "Scheduled maintenance on March 15, 2024",
      "targetRole": "ALL",
      "targetCourseId": null,
      "publishAt": "2024-03-08T00:00:00Z",
      "expireAt": "2024-03-16T00:00:00Z",
      "isPublished": true,
      "processingStatus": "COMPLETED",
      "processedCount": 5000,
      "totalTargetCount": 5000,
      "createdAt": "2024-03-01T10:00:00Z"
    }
  ],
  "total": 10
}
```

---

#### 9. Create System Announcement

Create a platform-wide or role-specific announcement. **Admin/Teacher only.**

```http
POST /announcements
```

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Important Update",
  "message": "New features have been added to the platform",
  "targetRole": "STUDENT",
  "publishAt": "2024-03-08T12:00:00Z",
  "expireAt": "2024-03-15T12:00:00Z"
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Announcement title (max 200 chars) |
| `message` | string | Yes | Announcement content |
| `targetRole` | enum | No | `ALL`, `STUDENT`, `TEACHER`, `ADMIN`, `ASSISTANT` (default: `ALL`) |
| `targetCourseId` | string | No | If set, only for enrolled students |
| `publishAt` | datetime | No | Schedule publish time (ISO 8601) |
| `expireAt` | datetime | No | Expiration time (ISO 8601) |

**Response (201 Created):**
```json
{
  "id": "announce-uuid",
  "title": "Important Update",
  "message": "New features have been added to the platform",
  "targetRole": "STUDENT",
  "publishAt": "2024-03-08T12:00:00Z",
  "expireAt": "2024-03-15T12:00:00Z",
  "isPublished": true,
  "processingStatus": "PENDING",
  "processedCount": 0,
  "totalTargetCount": 0,
  "createdAt": "2024-03-08T10:00:00Z"
}
```

**Error Responses:**
- `403 Forbidden` - Only admins can create `ALL` role announcements

---

#### 10. Create Course Announcement

Send announcement to all students enrolled in a course. **Teacher/Admin only.**

```http
POST /announcements/courses/:courseId
```

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `courseId` | string | Course UUID |

**Request Body:**
```json
{
  "title": "New Assignment Available",
  "message": "Assignment 3 is now available. Due date: March 20",
  "sendAsEmail": true,
  "showInApp": true
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Announcement title |
| `message` | string | Yes | Announcement content |
| `sendAsEmail` | boolean | No | Send as email (default: true) |
| `showInApp` | boolean | No | Show in-app notification (default: true) |

**Response (201 Created):**
```json
{
  "success": true,
  "jobId": "bulk-job-uuid",
  "message": "Announcement is being processed and sent to all enrolled students"
}
```

---

#### 11. Get Announcement Job Status

Check the processing status of an announcement or bulk job. **Admin/Teacher only.**

```http
GET /announcements/:id/status
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Announcement ID or Job ID |

**Response (200 OK):**
```json
{
  "status": "PROCESSING",
  "totalCount": 1000,
  "processedCount": 750,
  "failedCount": 10,
  "progress": 75
}
```

**Status Values:**
- `PENDING` - Job queued, not started
- `PROCESSING` - Currently sending
- `COMPLETED` - All notifications sent
- `FAILED` - Error occurred

---

### Events (Webhooks)

These endpoints are called by other LMS services to trigger notifications. They require an **internal API key**.

#### 12. Course Enrolled Event

```http
POST /events/course-enrolled
```

**Headers:**
```
x-api-key: internal-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "courseId": "course-456",
  "courseTitle": "Introduction to Programming"
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

---

#### 13. Course Purchased Event

```http
POST /events/course-purchased
```

**Headers:**
```
x-api-key: internal-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "courseId": "course-456",
  "courseTitle": "Advanced Web Development"
}
```

---

#### 14. Assessment Published Event

```http
POST /events/assessment-published
```

**Headers:**
```
x-api-key: internal-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "assessmentId": "assess-789",
  "assessmentTitle": "Midterm Exam"
}
```

---

#### 15. Assessment Graded Event

```http
POST /events/assessment-graded
```

**Headers:**
```
x-api-key: internal-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "assessmentId": "assess-789",
  "assessmentTitle": "Midterm Exam",
  "score": 85
}
```

---

#### 16. Assignment Feedback Event

```http
POST /events/assignment-feedback
```

**Headers:**
```
x-api-key: internal-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "assignmentId": "assign-101",
  "assignmentTitle": "Homework 3"
}
```

---

#### 17. Payment Recorded Event

```http
POST /events/payment-recorded
```

**Headers:**
```
x-api-key: internal-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "paymentId": "pay-202",
  "amount": 1500
}
```

---

#### 18. Lesson Unlocked Event

```http
POST /events/lesson-unlocked
```

**Headers:**
```
x-api-key: internal-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student-123",
  "courseId": "course-456",
  "lessonId": "lesson-789",
  "lessonTitle": "Introduction to Variables"
}
```

---

## Data Models

### Notification Types

| Type | Description | Priority |
|------|-------------|----------|
| `COURSE_PURCHASED` | Student purchased a course | Normal |
| `COURSE_ENROLLED` | Student enrolled in a course | Normal |
| `LESSON_UNLOCKED` | New lesson available | Low |
| `ASSESSMENT_PUBLISHED` | New assessment/quiz available | High |
| `ASSESSMENT_GRADED` | Assessment has been graded | High |
| `ASSIGNMENT_FEEDBACK` | Feedback available on assignment | High |
| `PAYMENT_RECORDED` | Payment confirmation | Normal |
| `ANNOUNCEMENT` | System/course announcement | Normal |
| `SYSTEM_MESSAGE` | Platform-wide message | Low |
| `REMINDER` | Scheduled reminder | Normal |

### Notification Channels

| Channel | Description |
|---------|-------------|
| `IN_APP` | In-app notification (stored in database) |
| `EMAIL` | Email delivery via SMTP/SendGrid |
| `PUSH` | Mobile push notification (future) |

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Error Codes

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Missing or invalid JWT token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Unexpected error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| General API | 100 requests/minute per user |
| Event Webhooks | 1000 requests/minute per service |
| Email Queue | 100 emails/minute (configurable) |
| Bulk Notifications | 1000 users/batch |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1646740800
```

---

## API Documentation (Swagger UI)

Interactive API documentation is available at:

```
http://localhost:3009/api/docs
```

---

## WebSocket / Real-time (Future)

For real-time notifications, WebSocket support will be added:

```javascript
// Connect to notification socket
const socket = io('ws://localhost:3009/notifications', {
  auth: { token: 'jwt_token' }
});

// Listen for new notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

---

## Support

For API support or issues, contact the LMS development team.
