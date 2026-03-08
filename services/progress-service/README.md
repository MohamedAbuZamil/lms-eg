# Progress Service

A dedicated microservice for tracking student learning progress within the LMS ecosystem.

## 🏗️ Architecture Overview

The Progress Service is responsible for:
- **Lesson Progress Tracking**: Per-student progress across different lesson types
- **Course Progress Aggregation**: Automatic calculation of course completion percentages
- **Video Position Tracking**: Resume video lessons from last watched position
- **Learning Activity History**: Comprehensive audit trail of student interactions
- **Role-Based Access**: Secure access control for students, teachers, assistants, and admins

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
DATABASE_URL="postgresql://username:password@localhost:5439/progress_db"

# Service Configuration
PORT=3006
NODE_ENV=development

# Integration Services
CONTENT_SERVICE_URL=http://localhost:3005
ENROLLMENT_SERVICE_URL=http://localhost:3003
COURSE_SERVICE_URL=http://localhost:3002
STAFF_SERVICE_URL=http://localhost:3004

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# NATS Configuration (Future)
NATS_URL=nats://localhost:4222
NATS_PROGRESS_STREAM=progress_events
```

## 🚀 Quick Start

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Health check
curl http://localhost:3006/health
```

## � Use Cases & Scenarios

### 🎓 Student Learning Journey

#### **Scenario 1: Starting a New Lesson**
```bash
# Student opens a video lesson for the first time
POST /progress/lessons/lesson-uuid/open
# Creates lesson progress, updates course progress, logs activity
```

#### **Scenario 2: Video Lesson Progress**
```bash
# Student watches video and position updates
PATCH /progress/lessons/lesson-uuid/video
# Updates lastPositionSeconds for resume functionality
```

#### **Scenario 3: Completing a Text Lesson**
```bash
# Student marks text/PDF lesson as complete
POST /progress/lessons/lesson-uuid/complete
# Sets progress to 100%, updates course completion percentage
```

#### **Scenario 4: Checking Overall Progress**
```bash
# Student views their course progress
GET /progress/courses/course-uuid/me
# Returns: progressPercent, completedLessons, totalLessons, status
```

### 👨‍🏫 Teacher Monitoring

#### **Scenario 5: Class Progress Overview**
```bash
# Teacher views summary of all students in their course
GET /progress/courses/course-uuid/summary
# Returns: studentsCount, averageProgress, completedStudents
```

#### **Scenario 6: Individual Student Tracking**
```bash
# Teacher checks specific student progress
GET /progress/courses/course-uuid/students/student-uuid
# Returns detailed progress and activity history
```

#### **Scenario 7: Filtering Students**
```bash
# Teacher filters students by completion status
GET /progress/courses/course-uuid/students?status=IN_PROGRESS&page=1&limit=20
# Paginated results with filtering
```

### 🔐 Access Control Scenarios

#### **Scenario 8: Preview Lesson Access**
- **Unauthenticated**: Cannot access any progress endpoints
- **Student**: Can access preview lessons without enrollment
- **Enrolled Student**: Full access to all lessons in enrolled courses
- **Teacher**: Can view progress only for their own courses
- **Admin**: Full access to all progress data

#### **Scenario 9: Cross-Service Validation**
```bash
# Progress service validates through:
# ✅ Content Service - lesson exists and belongs to course
# ✅ Enrollment Service - student is actively enrolled
# ✅ Course Service - teacher owns the course
# ✅ Staff Service - assistant has permissions
```

## �📊 API Examples

### Student Progress Management

```bash
# Open/initialize lesson progress
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/open \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Update video progress
curl -X PATCH http://localhost:3006/progress/lessons/lesson-uuid/video \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastPositionSeconds": 125,
    "progressPercent": 42
  }'

# Mark lesson as completed
curl -X POST http://localhost:3006/progress/lessons/lesson-uuid/complete \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Get my course progress
curl -X GET http://localhost:3006/progress/courses/course-uuid/me \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### Teacher/Admin Progress Monitoring

```bash
# Get course progress summary
curl -X GET http://localhost:3006/progress/courses/course-uuid/summary \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# List all students progress in a course
curl -X GET http://localhost:3006/progress/courses/course-uuid/students \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -G \
  -d "status=IN_PROGRESS" \
  -d "page=1" \
  -d "limit=20"
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

- Progress is tracked only for authenticated users
- Students can only update progress in actively enrolled courses
- Course progress is automatically recalculated when lesson progress changes
- Teachers can view progress only for their own courses
- Admins have full read access to all progress data
- Video lessons support position tracking and resume functionality
- Course completion requires all non-preview lessons to be completed

## 🔗 Integration Points

- **Identity Service**: JWT validation and user information
- **Content Service**: Course structure and lesson information
- **Enrollment Service**: Active enrollment validation
- **Course Service**: Teacher ownership verification
- **Staff Service**: Assistant permission validation

## 📈 Monitoring & Logging

- Structured logging with Winston
- Progress activity audit trail
- Performance metrics for progress calculations
- Error tracking and alerting

## 🚀 Production Considerations

- Database connection pooling
- Caching strategy for course structures
- Rate limiting for progress updates
- Data retention policies for activity logs
- Backup and recovery procedures
