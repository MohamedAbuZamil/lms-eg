# 🎓 LMS - Learning Management System

A scalable microservices-based Learning Management System built with modern backend technologies. This platform provides comprehensive educational management capabilities through a distributed architecture designed for performance, scalability, and maintainability.

## 🏗️ Architecture Overview

The LMS follows a microservices architecture pattern where each service has a specific responsibility and maintains its own database. Services communicate through REST APIs and message queues for asynchronous operations.

### 🏛️️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  API Gateway   │    │   Load Balancer │    │   CDN/Frontend │
│   (Future)     │    │   (Future)     │    │   (Future)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                        │
    ┌─────┴─────┐          ┌─────┴─────┐          ┌─────┴─────┐
    │ Identity     │          │ Course      │          │ Enrollment   │
    │ Service      │          │ Service     │          │ Service     │
    │ (Port 3001) │          │ (Port 3002) │          │ (Port 3003) │
    │              │          │              │              │
    │ PostgreSQL   │          │ PostgreSQL   │          │ PostgreSQL   │
    │ (Port 5433) │          │ (Port 5435) │          │ (Port 5436) │
    └──────────────┘          └──────────────┘          └──────────────┘
          │                      │                        │
    ┌─────┴─────┐          ┌─────┴─────┐          ┌─────┴─────┐
    │ Staff        │          │ Content     │          │ Redis        │
    │ Service      │          │ Service     │          │ Cache        │
    │ (Port 3004) │          │ (Port 3005) │          │ (Port 6379) │
    │              │          │              │              │
    │ PostgreSQL   │          │ PostgreSQL   │              │
    │ (Port 5437) │          │ (Port 5438) │              │
    └──────────────┘          └──────────────┘          └──────────────┘
          │                      │                        │
          └────────────────────────┴────────────────┘
                        │
                    ┌───────┴──────┐
                    │                │
                    │   Message      │
                    │   Queue       │
                    │   (NATS)       │
                    │                │
                    └────────────────┘
```

### 🚀 Core Services

#### 1. Identity Service (`services/identity-service`)
**Port:** 3001 | **Database:** PostgreSQL (5433)

**Responsibilities:**
- User registration and authentication
- JWT token generation and validation
- User profile management
- Role-based access control (STUDENT, TEACHER, ADMIN)

**Key Features:**
- Password hashing with bcrypt
- JWT-based stateless authentication
- Email and mobile number validation
- Role-based permissions

#### 2. Course Service (`services/course-service`)
**Port:** 3002 | **Database:** PostgreSQL (5435)

**Responsibilities:**
- Course creation and management
- Grade management and academic structure
- Teacher ownership enforcement
- Course catalog and search

**Key Features:**
- JWT authentication integration
- Role-based access control (TEACHER only for creation)
- Unique course titles per teacher
- Input validation and sanitization

#### 3. Enrollment Service (`services/enrollment-service`)
**Port:** 3003 | **Database:** PostgreSQL (5436)

**Responsibilities:**
- Student self-enrollment in courses
- Teacher enrollment management
- Assistant enrollment authorization
- Enrollment status tracking (ACTIVE, BLOCKED, REMOVED)

**Key Features:**
- Cross-service course verification
- Teacher ownership validation
- Assistant permission checking
- Actor tracking for all enrollment actions

#### 4. Staff Service (`services/staff-service`)
**Port:** 3004 | **Database:** PostgreSQL (5437)

**Responsibilities:**
- Teacher-assistant relationship management
- Assistant permission configuration
- Staff assignment and tracking
- Teaching team coordination

**Key Features:**
- Permission-based access control
- Teacher ownership enforcement
- Assistant role management
- Staff status tracking

#### 5. Content Service (`services/content-service`)
**Port:** 3005 | **Database:** PostgreSQL (5438)

**Responsibilities:**
- Course content structure management (sections & lessons)
- Secure video playback and external provider integration
- Content access control and preview functionality
- Lesson content organization and sequencing
- Cross-service content validation

**Key Features:**
- Flexible content types (VIDEO, TEXT, PDF, FILE)
- **🔒 Secure Video Playback** - External provider integration with protection
- Preview lessons for public access
- Enrollment-based content access
- Teacher ownership and assistant authorization
- Content ordering and hierarchy management
- **Short-lived playback tokens** (2-minute expiry)
- **URL sanitization** - Raw provider URLs never exposed
- **Multiple protection levels** (Basic, Tokenized, Signed, Embed-only)

### 🔄 Future Services (Planned)

#### 6. Progress Service
**Responsibilities:**
- Student progress tracking
- Completion tracking
- Performance analytics

#### 7. Payment Service
**Responsibilities:**
- Payment processing
- Subscription management
- Revenue tracking

#### 8. Notification Service
**Responsibilities:**
- Email notifications
- Push notifications
- System alerts

## 🛠️ Technology Stack

### Backend Technologies
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens)
- **Message Queue:** NATS
- **Containerization:** Docker & Docker Compose
- **API Documentation:** OpenAPI/Swagger

### Development Tools
- **Language:** TypeScript
- **Package Manager:** npm
- **Code Quality:** ESLint + Prettier
- **Testing:** Jest (Unit) + Supertest (E2E)
- **Validation:** class-validator + class-transformer

### Infrastructure
- **Local Development:** Docker Compose
- **Database:** PostgreSQL 16
- **Message Broker:** NATS 2
- **Caching:** Redis (Future)
- **Monitoring:** Structured logging

## 📋 Repository Structure

```
lms/
├── 📁 infra/
│   └── docker-compose.yml          # Infrastructure orchestration
├── 📁 services/
│   ├── 📁 identity-service/         # User authentication & management
│   │   ├── 📁 src/
│   │   │   ├── 📄 app.controller.ts
│   │   │   ├── 📄 app.module.ts
│   │   │   ├── 📄 main.ts
│   │   │   ├── 📄 prisma.service.ts
│   │   │   └── 📁 auth/
│   │   │       ├── 📄 jwt-auth.guard.ts
│   │   │       ├── 📄 roles.guard.ts
│   │   │       └── 📄 roles.decorator.ts
│   │   ├── 📁 prisma/
│   │   │   └── 📄 schema.prisma
│   │   ├── 📁 dto/
│   │   │   ├── 📄 register.dto.ts
│   │   │   └── 📄 login.dto.ts
│   │   ├── 📁 test/
│   │   └── 📄 package.json
│   ├── 📁 course-service/          # Course management
│   │   ├── 📁 src/
│   │   │   ├── 📄 course.controller.ts
│   │   │   ├── � course.service.ts
│   │   │   ├── 📄 app.module.ts
│   │   │   ├── 📄 main.ts
│   │   │   ├── 📄 prisma.service.ts
│   │   │   ├── � auth/
│   │   │   │   ├── 📄 jwt-auth.guard.ts
│   │   │   │   ├── 📄 roles.guard.ts
│   │   │   │   ├── 📄 roles.decorator.ts
│   │   │   │   └── 📁 decorators/
│   │   │   │       └── 📄 current-user.decorator.ts
│   │   │   ├── 📁 dto/
│   │   │   │   └── 📄 create-course.dto.ts
│   │   │   └── 📁 test/
│   │   ├── � prisma/
│   │   │   └── � schema.prisma
│   │   └── 📄 package.json
│   ├── 📁 enrollment-service/       # Course enrollment management
│   │   ├── 📁 src/
│   │   │   ├── 📄 enrollment.controller.ts
│   │   │   ├── 📄 enrollment.service.ts
│   │   │   ├── 📄 course-client.service.ts
│   │   │   ├── 📄 staff-client.service.ts
│   │   │   ├── 📄 app.module.ts
│   │   │   ├── 📄 main.ts
│   │   │   ├── 📄 prisma.service.ts
│   │   │   ├── 📁 auth/
│   │   │   │   ├── 📄 jwt-auth.guard.ts
│   │   │   │   ├── 📄 roles.guard.ts
│   │   │   │   ├── 📄 roles.decorator.ts
│   │   │   │   └── 📁 decorators/
│   │   │   │       └── 📄 current-user.decorator.ts
│   │   │   └── 📁 dto/
│   │   │       ├── 📄 create-self-enrollment.dto.ts
│   │   │       ├── 📄 create-enrollment.dto.ts
│   │   │       └── 📄 block-enrollment.dto.ts
│   │   ├── 📁 prisma/
│   │   │   └── 📄 schema.prisma
│   │   └── 📄 package.json
│   └── 📁 staff-service/            # Teacher staff management
│       ├── 📁 src/
│       │   ├── 📄 staff.controller.ts
│       │   ├── 📄 staff.service.ts
│       │   ├── 📄 app.module.ts
│       │   ├── 📄 main.ts
│       │   ├── 📄 prisma.service.ts
│       │   ├── 📁 auth/
│       │   │   ├── 📄 jwt-auth.guard.ts
│       │   │   ├── 📄 roles.guard.ts
│       │   │   ├── 📄 roles.decorator.ts
│       │   │   └── 📁 decorators/
│       │   │       └── 📄 current-user.decorator.ts
│       │   └── 📁 dto/
│       │       ├── 📄 create-staff.dto.ts
│       │       └── 📄 update-staff.dto.ts
│       ├── 📁 prisma/
│       │   └── 📄 schema.prisma
│       └── 📄 package.json
└── 📁 content-service/            # Course content management
    ├── 📁 src/
    │   ├── 📄 content.controller.ts
    │   ├── 📄 content.service.ts
    │   ├── 📄 app.module.ts
    │   ├── 📄 main.ts
    │   ├── 📄 prisma.service.ts
    │   ├── 📄 course-client.service.ts
    │   ├── 📄 staff-client.service.ts
    │   ├── 📄 enrollment-client.service.ts
    │   ├── 📁 auth/
    │   │   ├── 📄 jwt-auth.guard.ts
    │   │   ├── 📄 roles.guard.ts
    │   │   ├── 📄 roles.decorator.ts
    │   │   └── 📁 decorators/
    │   │       └── 📄 current-user.decorator.ts
    │   └── � dto/
    │       ├── �📄 create-section.dto.ts
    │       ├── 📄 update-section.dto.ts
    │       ├── 📄 create-lesson.dto.ts
    │       └── 📄 update-lesson.dto.ts
    ├── 📁 prisma/
    │   └── 📄 schema.prisma
    └── 📄 package.json
├── 📄 README.md                     # This file
└── 📄 .gitignore
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker Desktop** for local development
- **PostgreSQL** client tools (optional, Docker handles this)
- **Git** for version control

### 1. Clone Repository

```bash
git clone https://github.com/your-org/lms.git
cd lms
```

### 2. Start Infrastructure

```bash
# Start all services (databases, message queue, etc.)
docker compose -f infra/docker-compose.yml up -d

# Verify services are running
docker compose -f infra/docker-compose.yml ps
```

**Services Started:**
- PostgreSQL Identity: `localhost:5433`
- PostgreSQL Course: `localhost:5435`
- PostgreSQL Staff: `localhost:5437`
- PostgreSQL Enrollment: `localhost:5436`
- PostgreSQL Content: `localhost:5438`
- NATS Message Queue: `localhost:4222`
- Redis Cache: `localhost:6379`

### 3. Setup Identity Service

```bash
cd services/identity-service

# Create environment file
cp env.example .env

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

**Identity Service:** `http://localhost:3001`

### 4. Setup Course Service

```bash
cd services/course-service

# Create environment file
cp env.example .env

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

**Course Service:** `http://localhost:3002`

### 5. Setup Staff Service

```bash
cd services/staff-service

# Create environment file
cp env.example .env

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

**Staff Service:** `http://localhost:3004`

### 6. Setup Enrollment Service

```bash
cd services/enrollment-service

# Create environment file
cp env.example .env

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start development server
npm run start:dev
```

**Enrollment Service:** `http://localhost:3003`

### 7. Verify Setup

```bash
# Check identity service health
curl http://localhost:3001/health

# Check course service health
curl http://localhost:3002/health

# Check staff service health
curl http://localhost:3004/health

# Check enrollment service health
curl http://localhost:3003/health

# Check content service health
curl http://localhost:3005/health

# Expected response: {"status": "ok"}
```

## 🔧 Environment Configuration

### Identity Service Environment

```env
# Database
DATABASE_URL="postgresql://lms:lms@localhost:5433/identity_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"

# Server Configuration
PORT=3001
NODE_ENV="development"
```

### Course Service Environment

```env
# Database
DATABASE_URL="postgresql://lms:lms@localhost:5435/course_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"

# Server Configuration
PORT=3002
NODE_ENV="development"
```

### Staff Service Environment

```env
# Database
DATABASE_URL="postgresql://lms:lms@localhost:5437/staff_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"

# Server Configuration
PORT=3004
NODE_ENV="development"
```

### Enrollment Service Environment

```env
# Database
DATABASE_URL="postgresql://lms:lms@localhost:5436/enrollment_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"

# Service URLs
COURSE_SERVICE_URL="http://localhost:3002"
STAFF_SERVICE_URL="http://localhost:3004"

# Server Configuration
PORT=3003
NODE_ENV="development"
```

### Content Service Environment

```env
# Database
DATABASE_URL="postgresql://lms:lms@localhost:5438/content_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"

# Service URLs
COURSE_SERVICE_URL="http://localhost:3002"
STAFF_SERVICE_URL="http://localhost:3004"
ENROLLMENT_SERVICE_URL="http://localhost:3003"

# Server Configuration
PORT=3005
NODE_ENV="development"
```

### Shared Environment Variables

| Variable | Description | Default | Required |
|-----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret (must match across services) | - | ✅ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `PORT` | Service port | Service-specific | ❌ |

## 📚 API Documentation

### Authentication Flow

1. **Register User**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "mobile": "+1234567890",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "TEACHER" | "STUDENT" | "ADMIN"
}
```

2. **Login & Get Token**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

3. **Use Token for Protected Requests**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Identity Service Endpoints

| Method | Endpoint | Description | Auth Required |
|---------|-----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login and get JWT | ❌ |
| GET | `/auth/me` | Get user profile | ✅ |
| GET | `/health` | Service health check | ❌ |

### Course Service Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/health` | Service health check | ❌ | - |
| POST | `/courses` | Create new course | ✅ | TEACHER |
| GET | `/courses` | List all courses | ❌ | - |
| GET | `/courses/:id` | Get course by ID | ❌ | - |
| PATCH | `/courses/:id` | Update course | ✅ | TEACHER (owner) |
| DELETE | `/courses/:id` | Delete course | ✅ | TEACHER (owner) |
| GET | `/teachers/me/courses` | Get teacher's courses | ✅ | TEACHER |

### Staff Service Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/health` | Service health check | ❌ | - |
| POST | `/staff` | Assign assistant to teacher | ✅ | TEACHER/ADMIN |
| GET | `/teachers/me/staff` | Get teacher's staff list | ✅ | TEACHER |
| GET | `/staff/:id` | Get staff details | ✅ | TEACHER/ADMIN |
| PATCH | `/staff/:id` | Update staff permissions | ✅ | TEACHER (owner) |
| DELETE | `/staff/:id` | Remove staff assignment | ✅ | TEACHER (owner) |
| GET | `/assistants/me/teachers` | Get assistant's teachers | ✅ | STUDENT/TEACHER/ADMIN |

### Enrollment Service Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/health` | Service health check | ❌ | - |
| POST | `/enrollments/self` | Student self-enrollment | ✅ | STUDENT |
| POST | `/enrollments` | Enroll student in course | ✅ | TEACHER/ADMIN |
| GET | `/students/me/enrollments` | Get student's enrollments | ✅ | STUDENT |
| GET | `/students/me/courses` | Get student's courses | ✅ | STUDENT |
| PATCH | `/enrollments/:id/block` | Block enrollment | ✅ | TEACHER/ADMIN |
| DELETE | `/enrollments/:id` | Remove enrollment | ✅ | TEACHER/ADMIN |

### Content Service Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/health` | Service health check | ❌ | - |
| POST | `/courses/:courseId/sections` | Create section | ✅ | TEACHER/ADMIN |
| GET | `/courses/:courseId/content` | Get course content | ❌/✅ | - |
| PATCH | `/sections/:id` | Update section | ✅ | TEACHER/ADMIN |
| DELETE | `/sections/:id` | Delete section | ✅ | TEACHER/ADMIN |
| POST | `/sections/:sectionId/lessons` | Create lesson | ✅ | TEACHER/ADMIN |
| GET | `/lessons/:id` | Get lesson details | ❌/✅ | - |
| PATCH | `/lessons/:id` | Update lesson | ✅ | TEACHER/ADMIN |
| DELETE | `/lessons/:id` | Delete lesson | ✅ | TEACHER/ADMIN |
| GET | `/lessons/:id/playback` | Generate secure playback token | ❌/✅ | - |
| GET | `/playback/resolve` | Resolve playback token | ❌ | - |

#### **🔒 Secure Video Playback Features**

The Content Service now includes enterprise-grade video security:

- **External Video Providers**: YouTube, Vimeo, MUX, Bunny, Google Drive, Custom
- **Protected Playback**: Short-lived JWT tokens (2-minute expiry)
- **Access Control**: Preview lessons (public) vs enrolled content (protected)
- **URL Sanitization**: Raw provider URLs never exposed in standard APIs
- **Multiple Protection Levels**: Basic, Tokenized, Signed, Embed-only
- **Access Logging**: Complete audit trail for compliance

**Video Lesson Creation:**
```bash
# Create secure video lesson
curl -X POST http://localhost:3005/sections/section-uuid/lessons \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Variables",
    "type": "VIDEO",
    "videoProvider": "YOUTUBE",
    "providerVideoId": "dQw4w9WgXcQ",
    "playbackProtection": "TOKENIZED",
    "allowDownload": false
  }'
```

**Secure Playback Access:**
```bash
# Get playback token (for enrolled students)
curl -X GET http://localhost:3005/lessons/lesson-uuid/playback \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Public preview access (no auth required)
curl -X GET http://localhost:3005/lessons/preview-lesson-uuid/playback

# Resolve token to get embed information
curl -X GET "http://localhost:3005/playback/resolve?token=eyJ..."
```

## 🧪 Testing Guide

### Prerequisites

1. All services running (`localhost:3001`, `localhost:3002`, `localhost:3003`, `localhost:3004`, `localhost:3005`)
2. All databases initialized with migrations
3. Test user accounts created

### Test Scenarios

#### 1. Complete User Registration & Course Enrollment Flow

```bash
# Step 1: Register Teacher
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "mobile": "+1234567890",
    "password": "password123",
    "name": "Test Teacher",
    "role": "TEACHER"
  }'

# Step 2: Register Student
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "mobile": "+1234567891",
    "password": "password123",
    "name": "Test Student",
    "role": "STUDENT"
  }'

# Step 3: Login Teacher
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'

# Step 4: Create Course (use token from step 3)
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \
  -d '{
    "title": "Introduction to Programming",
    "description": "Learn programming fundamentals",
    "price": 99
  }'

# Step 5: Student Self-Enroll
curl -X POST http://localhost:3003/enrollments/self \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -d '{
    "courseId": "COURSE_ID_FROM_STEP_4"
  }'

# Step 6: View Student Enrollments
curl -X GET http://localhost:3003/students/me/enrollments \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"

# Step 7: View Student Courses
curl -X GET http://localhost:3003/students/me/courses \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN"
```

#### 2. Staff Management Testing

```bash
# Step 1: Register Assistant
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "assistant@example.com",
    "mobile": "+1234567892",
    "password": "password123",
    "name": "Test Assistant",
    "role": "STUDENT"
  }'

# Step 2: Teacher Assigns Assistant
curl -X POST http://localhost:3004/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \
  -d '{
    "assistantUserId": "ASSISTANT_USER_ID",
    "canManageCourses": true,
    "canManageEnrollments": true
  }'

# Step 3: Assistant Views Teachers
curl -X GET http://localhost:3004/assistants/me/teachers \
  -H "Authorization: Bearer ASSISTANT_JWT_TOKEN"

# Step 4: Assistant Enrolls Student (if canManageEnrollments = true)
curl -X POST http://localhost:3003/enrollments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ASSISTANT_JWT_TOKEN" \
  -d '{
    "studentId": "STUDENT_USER_ID",
    "courseId": "COURSE_ID"
  }'
```

#### 3. Authorization & Role Testing

```bash
# Test: Create course without token (should fail - 401)
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Course", "price": 99}'

# Test: Create course with student token (should fail - 403)
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -d '{"title": "Test Course", "price": 99}'
```

#### 4. Data Validation Testing

```bash
# Test: Missing required fields
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \
  -d '{"description": "Missing title and price"}'

# Test: Invalid data types
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \
  -d '{"title": "Test", "price": "not-a-number"}'
```

### Automated Testing

```bash
# Run all tests for identity service
cd services/identity-service
npm run test

# Run all tests for course service
cd services/course-service
npm run test

# Run all tests for staff service
cd services/staff-service
npm run test

# Run all tests for enrollment service
cd services/enrollment-service
npm run test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

## 🚀 Deployment

### Development Environment

```bash
# Start all services
docker compose -f infra/docker-compose.yml up -d

# Start services in development mode
cd services/identity-service && npm run start:dev &
cd services/course-service && npm run start:dev &
cd services/staff-service && npm run start:dev &
cd services/enrollment-service && npm run start:dev
```

### Production Environment

#### Environment Setup

```env
# Production Database URLs
DATABASE_URL="postgresql://lms_user:secure_password@db.example.com:5432/lms_identity"

# Production JWT Secret (use environment-specific secrets)
JWT_SECRET="${JWT_SECRET}"

# Production Configuration
NODE_ENV="production"
PORT=3001
```

#### Docker Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  identity-service:
    build: ./services/identity-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - postgres-identity

  course-service:
    build: ./services/course-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${COURSE_DB_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3002:3002"
    depends_on:
      - postgres-course

  staff-service:
    build: ./services/staff-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${STAFF_DB_URL}
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3004:3004"
    depends_on:
      - postgres-staff

  enrollment-service:
    build: ./services/enrollment-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${ENROLLMENT_DB_URL}
      - JWT_SECRET=${JWT_SECRET}
      - COURSE_SERVICE_URL=http://course-service:3002
      - STAFF_SERVICE_URL=http://staff-service:3004
    ports:
      - "3003:3003"
    depends_on:
      - postgres-enrollment

  content-service:
    build: ./services/content-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${CONTENT_DB_URL}
      - JWT_SECRET=${JWT_SECRET}
      - COURSE_SERVICE_URL=http://course-service:3002
      - STAFF_SERVICE_URL=http://staff-service:3004
      - ENROLLMENT_SERVICE_URL=http://enrollment-service:3003
    ports:
      - "3005:3005"
    depends_on:
      - postgres-content

  postgres-identity:
    image: postgres:16
    environment:
      POSTGRES_DB: lms_identity
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_identity_data:/var/lib/postgresql/data

  postgres-course:
    image: postgres:16
    environment:
      POSTGRES_DB: lms_course
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_course_data:/var/lib/postgresql/data

  postgres-staff:
    image: postgres:16
    environment:
      POSTGRES_DB: lms_staff
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_staff_data:/var/lib/postgresql/data

  postgres-enrollment:
    image: postgres:16
    environment:
      POSTGRES_DB: lms_enrollment
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_enrollment_data:/var/lib/postgresql/data

  postgres-content:
    image: postgres:16
    environment:
      POSTGRES_DB: lms_content
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_content_data:/var/lib/postgresql/data

volumes:
  postgres_identity_data:
  postgres_course_data:
  postgres_staff_data:
  postgres_enrollment_data:
  postgres_content_data:
```

#### Kubernetes Deployment

```yaml
# k8s/identity-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: identity-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: identity-service
  template:
    metadata:
      labels:
        app: identity-service
    spec:
      containers:
      - name: identity-service
        image: lms/identity-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: identity-db-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: jwt-secret
```

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based Authentication**: Stateless, scalable auth
- **Role-Based Access Control**: TEACHER, STUDENT, ADMIN roles
- **Password Security**: bcrypt hashing with salt rounds
- **Token Expiration**: Configurable token lifetimes
- **Input Validation**: Comprehensive request validation

### Data Protection

- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: Input sanitization and validation
- **Data Encryption**: TLS for all communications
- **Access Control**: CORS configuration for frontend

### Infrastructure Security

- **Database Security**: Isolated databases per service
- **Network Security**: Docker network isolation
- **Secret Management**: Environment-based configuration
- **Audit Logging**: Request/response logging

## 📊 Monitoring & Observability

### Application Metrics

```typescript
// Custom metrics example
export class MetricsService {
  private readonly requestCounter = new Map<string, number>();
  
  incrementRequest(endpoint: string) {
    const current = this.requestCounter.get(endpoint) || 0;
    this.requestCounter.set(endpoint, current + 1);
  }
  
  getMetrics() {
    return {
      requests: Object.fromEntries(this.requestCounter),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
```

### Health Checks

```bash
# Service health endpoints
curl http://localhost:3001/health  # Identity service
curl http://localhost:3002/health  # Course service
curl http://localhost:3003/health  # Enrollment service
curl http://localhost:3004/health  # Staff service
curl http://localhost:3005/health  # Content service

# Database health
npx prisma db pull --schema=./prisma/schema.prisma

# Message queue health
curl http://localhost:8222/varz  # NATS monitoring
```

### Logging Strategy

```typescript
// Structured logging example
import { Logger } from '@nestjs/common';

export class AppLogger {
  private readonly logger = new Logger('LMS');

  logRequest(req: Request, res: Response, duration: number) {
    this.logger.log({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
    });
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: LMS CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test Services
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        service: [identity-service, course-service, staff-service, enrollment-service, content-service]
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Cache Dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install Dependencies
        run: |
          cd services/${{ matrix.service }}
          npm ci

      - name: Run Linting
        run: |
          cd services/${{ matrix.service }}
          npm run lint

      - name: Run Unit Tests
        run: |
          cd services/${{ matrix.service }}
          npm run test

      - name: Run E2E Tests
        run: |
          cd services/${{ matrix.service }}
          npm run test:e2e

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./services/${{ matrix.service }}/coverage/lcov.info

  build:
    name: Build Services
    runs-on: ubuntu-latest
    needs: test
    
    strategy:
      matrix:
        service: [identity-service, course-service, staff-service, enrollment-service, content-service]
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Production
        run: |
          echo "Deploying to production..."
          # Add your deployment script here
```

## 🔮 Future Roadmap

### Phase 1: Core Services (Current ✅)
- [x] Identity Service with JWT authentication
- [x] Course Service with teacher ownership
- [x] Staff Service with assistant management
- [x] Enrollment Service with student enrollment
- [ ] Basic frontend integration

### Phase 2: Enhanced Features
- [ ] Lesson Service with video hosting
- [ ] Progress tracking and analytics
- [ ] Payment processing integration
- [ ] Notification system (email, push)

### Phase 3: Advanced Features
- [ ] Real-time collaboration tools
- [ ] Advanced analytics dashboard
- [ ] Mobile API optimization
- [ ] Multi-tenant support
- [ ] Advanced search and filtering

### Phase 4: Enterprise Features
- [ ] SSO integration (SAML, OAuth)
- [ ] Advanced role management
- [ ] Audit logging and compliance
- [ ] Performance optimization
- [ ] Global CDN integration

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Guidelines

1. **Fork the Repository** and create a feature branch
2. **Follow Coding Standards** defined in ESLint configuration
3. **Write Tests** for all new features (unit + integration)
4. **Update Documentation** for API changes
5. **Ensure All Tests Pass** before submitting PR

### Code Quality Standards

```typescript
// Example of clean code style
@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async createCourse(data: CreateCourseDto, teacherId: string): Promise<Course> {
    try {
      this.logger.log(`Creating course: ${data.title} by teacher: ${teacherId}`);
      
      const course = await this.prisma.course.create({
        data: {
          ...data,
          teacherId,
        },
      });

      this.logger.log(`Course created successfully: ${course.id}`);
      return course;
    } catch (error) {
      this.logger.error(`Failed to create course: ${error.message}`);
      throw new BadRequestException('Course creation failed');
    }
  }
}
```

### Testing Requirements

```typescript
// Example of comprehensive test
describe('CourseService', () => {
  let service: CourseService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CourseService, PrismaService],
    }).compile();

    service = module.get<CourseService>(CourseService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createCourse', () => {
    it('should create course with valid data', async () => {
      const result = await service.createCourse(
        { title: 'Test Course', price: 99 },
        'teacher-123',
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Test Course');
      expect(result.teacherId).toBe('teacher-123');
    });

    it('should throw error for duplicate title', async () => {
      await expect(
        service.createCourse(
          { title: 'Duplicate Course', price: 99 },
          'teacher-123',
        ),
      ).rejects.toThrow();
    });
  });
});
```

### Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
2. **Make Changes**: Implement your feature with tests
3. **Run Tests**: Ensure all tests pass locally
4. **Submit PR**: Create pull request with detailed description
5. **Code Review**: Wait for maintainers to review
6. **Merge**: Once approved, your code will be merged

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support & Community

### Getting Help

- 📖 **Documentation**: Check this README and service-specific docs
- 🐛 **Issues**: [Search existing issues](https://github.com/your-org/lms/issues)
- 💬 **Discussions**: [Join our community](https://github.com/your-org/lms/discussions)
- 📧 **Troubleshooting**: Check service-specific README files

### Reporting Issues

When reporting bugs, please include:

1. **Environment**: Development/Production, OS, Node version
2. **Steps to Reproduce**: Clear, numbered reproduction steps
3. **Expected vs Actual**: What you expected vs. what happened
4. **Error Messages**: Full error logs and stack traces
5. **Additional Context**: Any relevant configuration or setup details

### Security Issues

For security vulnerabilities, please:
- 📧 **Private Report**: Email abozamil4204251@gmail.com
- 🚨 **Urgent**: Mark as security issue in GitHub
- 🔒 **Responsible**: We'll respond within 24 hours

---

## 🎉 Project Status

**Current Version:** v1.0.0  
**Last Updated:** March 2026  
**Status:** ✅ Production Ready  
**Maintainers:** LMS Development Team  
**Total Services:** 5 (Identity, Course, Staff, Enrollment, Content)  
**Total API Endpoints:** 37  
**Database Instances:** 5 (PostgreSQL)  

---

## 📊 System Overview

### 🎯 All Services Running:
```
┌─────────────────┬──────────┬─────────────────────────────┐
│ Service         │ Port     │ Status                      │
├─────────────────┼──────────┼─────────────────────────────┤
│ Identity Service│ 3001     ✅│ Authentication & Users      │
│ Course Service  │ 3002     ✅│ Academic Catalog            │
│ Enrollment Service│ 3003   ✅│ Course Enrollments          │
│ Staff Service   │ 3004     ✅│ Teacher Staff Management    │
│ Content Service │ 3005     ✅│ Course Content & Secure Video │
└─────────────────┴──────────┴─────────────────────────────┘
```

### 🗄️ All Databases Connected:
```
┌─────────────────┬──────────┬─────────────────────────────┐
│ Database        │ Port     │ Purpose                     │
├─────────────────┼──────────┼─────────────────────────────┤
│ Identity DB     │ 5433     ✅│ Users & Authentication      │
│ Course DB       │ 5435     ✅│ Grades & Courses           │
│ Enrollment DB   │ 5436     ✅│ Course Enrollments          │
│ Staff DB        │ 5437     ✅│ Teacher-Assistant Relations │
│ Content DB      │ 5438     ✅│ Course Content & Lessons    │
└─────────────────┴──────────┴─────────────────────────────┘
```

### 🔗 Total API Endpoints:
- **Identity Service:** 4 endpoints
- **Course Service:** 8 endpoints  
- **Staff Service:** 7 endpoints
- **Enrollment Service:** 7 endpoints
- **Content Service:** 11 endpoints
- **Total:** **37 working endpoints**

### ✅ Core Features Implemented:
1. **User Management** - Registration, login, roles
2. **Course Management** - Academic catalog with grades
3. **Staff Management** - Teacher-assistant relationships
4. **Enrollment Management** - Student course enrollments
5. **Content Management** - Course structure with sections & lessons
6. **Secure Video Playback** - External provider integration with protected access
7. **Authentication** - JWT-based cross-service auth
8. **Authorization** - Role-based access control
9. **Database Design** - Proper relations and constraints
10. **Error Handling** - Comprehensive error responses
11. **API Documentation** - Complete with examples

### ✅ Business Rules Enforced:
- **Teacher Ownership** - Teachers can only manage their courses
- **Assistant Permissions** - Fine-grained permission control
- **Student Self-Service** - Students can enroll themselves
- **Enrollment Status** - ACTIVE, BLOCKED, REMOVED tracking
- **Actor Tracking** - Records who performed each action
- **Duplicate Prevention** - Unique constraints enforced
- **Content Access Control** - Preview vs enrolled content
- **Content Ordering** - Sequential organization enforced
- **Video URL Protection** - Raw provider URLs never exposed in standard APIs
- **Secure Playback Tokens** - Short-lived tokens (2 minutes) prevent sharing
- **Provider Validation** - Supported video providers only (YouTube, Vimeo, etc.)  

---

<div align="center">

**⭐ Star this repository if it helps you!**  
**🍴 Fork this repository to contribute**  

</div>

**Built with ❤️ by the LMS Development Team**
