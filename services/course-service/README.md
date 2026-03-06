# Course Service

A comprehensive microservice for course management within the LMS (Learning Management System) architecture. Handles course creation, retrieval, and management with proper teacher ownership and role-based access control.

## 🏗️ Architecture Overview

The course-service is a core microservice responsible for:

- **Course Management**: Create and manage courses with proper ownership
- **Teacher Authorization**: Only TEACHER role can create courses
- **JWT Authentication**: Secure endpoints with token-based authentication
- **Role-Based Access**: Different access levels for different user roles
- **Data Validation**: Input sanitization and validation for all endpoints
- **Database Constraints**: Unique constraints prevent duplicate course titles per teacher

This service is part of a microservices-based LMS architecture, communicating with other services via REST APIs and maintaining its own PostgreSQL database.

## 📋 Requirements

- **Node.js** 18+ 
- **Docker Desktop** (for local development)
- **PostgreSQL** (runs via Docker Compose)
- **Identity Service** (for JWT authentication)

## 🚀 Quick Start

### Prerequisites

1. **Start Infrastructure Services** (from repo root):
   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres_course
   ```

2. **Start Identity Service** (in separate terminal):
   ```bash
   cd services/identity-service
   npm run start:dev
   ```

3. **Setup Course Service**:
   ```bash
   cd services/course-service
   
   # Create environment file
   cp env.example .env
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma client
   npx prisma generate
   
   # Start the service
   npm run start:dev
   ```

The service will be available at `http://localhost:3002`

## 🔧 Environment Variables

Copy `env.example` to `.env` in service root:

```env
DATABASE_URL="postgresql://lms:lms@localhost:5435/course_db?schema=public"
JWT_SECRET="dev_secret_change_me"
JWT_EXPIRES_IN="15m"
```

### Environment Variables Explained

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT token verification | - | ✅ |
| `JWT_EXPIRES_IN` | JWT token expiration time | `15m` | ❌ |

## 📚 API Documentation

### Base URL
```
http://localhost:3002
```

### Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

**JWT Token Structure:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com", 
  "role": "TEACHER|STUDENT|ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 🏥 Health Check

**Endpoint:** `GET /health`

**Description:** Check if the service is running

**Authentication:** None required

**Request:**
```bash
curl http://localhost:3002/health
```

**Response (200):**
```json
{
  "status": "ok"
}
```

### 📚 Create Course

**Endpoint:** `POST /courses`

**Description:** Create a new course (TEACHER role only)

**Authentication:** Required (TEACHER role)

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <teacher_jwt_token>
```

**Request Body:**
```json
{
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "price": 99
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Course title (unique per teacher) |
| `description` | string | ❌ | Course description |
| `price` | number | ✅ | Course price (must be ≥ 0) |

**Response (201):**
```json
{
  "id": "e2f0d354-76ad-4b19-8368-353cad0de474",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "price": 99,
  "teacherId": "94c55b09-c43d-465d-86a3-74df03a494cd",
  "createdAt": "2026-03-05T22:47:07.742Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing, invalid, or expired token
- `403 Forbidden` - User is not a TEACHER
- `400 Bad Request` - Validation errors in request body
- `409 Conflict` - Database constraint violation (duplicate title)

**Example Request:**
```bash
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming",
    "price": 99
  }'
```

### 📋 List All Courses

**Endpoint:** `GET /courses`

**Description:** Get a list of all courses (public endpoint)

**Authentication:** None required

**Request:**
```bash
curl http://localhost:3002/courses
```

**Response (200):**
```json
[
  {
    "id": "e2f0d354-76ad-4b19-8368-353cad0de474",
    "title": "Introduction to Programming",
    "price": 99,
    "teacherId": "94c55b09-c43d-465d-86a3-74df03a494cd"
  },
  {
    "id": "f3g1h456-87be-5c20-9479-464dbe1ef585",
    "title": "Advanced JavaScript",
    "price": 149,
    "teacherId": "a5d66b10-d54e-576e-97b4-85eg03a505de"
  }
]
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Course UUID |
| `title` | string | Course title |
| `price` | number | Course price |
| `teacherId` | string | Teacher's UUID |

### 🔍 Get Course by ID

**Endpoint:** `GET /courses/:id`

**Description:** Get detailed information about a specific course (public endpoint)

**Authentication:** None required

**Request:**
```bash
curl http://localhost:3002/courses/e2f0d354-76ad-4b19-8368-353cad0de474
```

**Response (200):**
```json
{
  "id": "e2f0d354-76ad-4b19-8368-353cad0de474",
  "title": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "price": 99,
  "teacherId": "94c55b09-c43d-465d-86a3-74df03a494cd",
  "createdAt": "2026-03-05T22:47:07.742Z"
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Course UUID |
| `title` | string | Course title |
| `description` | string | Course description |
| `price` | number | Course price |
| `teacherId` | string | Teacher's UUID |
| `createdAt` | string | ISO 8601 timestamp |

**Error Responses:**
- `404 Not Found` - Course with specified ID does not exist

**Example Error Response:**
```json
{
  "message": "Course not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### ✏️ Update Course

**Endpoint:** `PATCH /courses/:id`

**Description:** Update an existing course (TEACHER only, owner only)

**Authentication:** Required (TEACHER role)

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <teacher_jwt_token>
```

**Request Body:**
```json
{
  "title": "Updated Course Title",
  "description": "Updated description",
  "price": 199
}
```

**Request Body Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ❌ | New course title (unique per teacher) |
| `description` | string | ❌ | Course description |
| `price` | number | ❌ | Course price (must be ≥ 0) |

**Response (200):**
```json
{
  "id": "e2f0d354-76ad-4b19-8368-353cad0de474",
  "title": "Updated Course Title",
  "description": "Updated description",
  "price": 199,
  "teacherId": "94c55b09-c43d-465d-86a3-74df03a494cd",
  "createdAt": "2026-03-05T22:47:07.742Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing, invalid, or expired token
- `403 Forbidden` - User is not a TEACHER or not course owner
- `404 Not Found` - Course with specified ID does not exist
- `400 Bad Request` - Validation errors in request body
- `409 Conflict` - Course with this title already exists for this teacher

**Example Request:**
```bash
curl -X PATCH http://localhost:3002/courses/e2f0d354-76ad-4b19-8368-353cad0de474 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Updated Course Title",
    "price": 199
  }'
```

### 🗑️ Delete Course

**Endpoint:** `DELETE /courses/:id`

**Description:** Delete a course (TEACHER only, owner only)

**Authentication:** Required (TEACHER role)

**Request Headers:**
```http
Authorization: Bearer <teacher_jwt_token>
```

**Response (204):** No content (successful deletion)

**Error Responses:**
- `401 Unauthorized` - Missing, invalid, or expired token
- `403 Forbidden` - User is not a TEACHER or not course owner
- `404 Not Found` - Course with specified ID does not exist

**Example Request:**
```bash
curl -X DELETE http://localhost:3002/courses/e2f0d354-76ad-4b19-8368-353cad0de474 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 👨‍🏫 Get Teacher's Courses

**Endpoint:** `GET /teachers/me/courses`

**Description:** Get all courses belonging to the authenticated teacher

**Authentication:** Required (TEACHER role)

**Request Headers:**
```http
Authorization: Bearer <teacher_jwt_token>
```

**Response (200):**
```json
[
  {
    "id": "e2f0d354-76ad-4b19-8368-353cad0de474",
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming",
    "price": 99,
    "teacherId": "94c55b09-c43d-465d-86a3-74df03a494cd",
    "createdAt": "2026-03-05T22:47:07.742Z"
  },
  {
    "id": "f3g1h456-87be-5c20-9479-464dbe1ef585",
    "title": "Advanced JavaScript",
    "description": "Deep dive into JavaScript",
    "price": 149,
    "teacherId": "94c55b09-c43d-465d-86a3-74df03a494cd",
    "createdAt": "2026-03-05T22:45:00.000Z"
  }
]
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Course UUID |
| `title` | string | Course title |
| `description` | string | Course description |
| `price` | number | Course price |
| `teacherId` | string | Teacher's UUID |
| `createdAt` | string | ISO 8601 timestamp |

**Error Responses:**
- `401 Unauthorized` - Missing, invalid, or expired token
- `403 Forbidden` - User is not a TEACHER

**Example Request:**
```bash
curl http://localhost:3002/teachers/me/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Note:** Courses are returned in descending order by creation date (newest first).

## 🧪 Testing Guide

### Prerequisites for Testing

1. **Ensure both services are running:**
   - Identity Service: `http://localhost:3001`
   - Course Service: `http://localhost:3002`

2. **Database should be initialized** with migrations applied

### Test Scenarios

#### Scenario 1: Complete Course Creation Flow

```bash
# Step 1: Register a teacher user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "mobile": "+1234567890",
    "password": "password123",
    "name": "Test Teacher",
    "role": "TEACHER"
  }'

# Expected Response:
# {"id":"uuid","email":"teacher@example.com","mobile":"+1234567890","name":"Test Teacher","role":"TEACHER","createdAt":"2026-03-05T22:45:36.663Z"}

# Step 2: Login to get JWT token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'

# Expected Response:
# {"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# Step 3: Create a course with the token
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Introduction to Programming",
    "description": "Learn the basics of programming",
    "price": 99
  }'

# Expected Response:
# {"id":"course-uuid","title":"Introduction to Programming","description":"Learn the basics of programming","price":99,"teacherId":"teacher-uuid","createdAt":"2026-03-05T22:47:07.742Z"}
```

#### Scenario 2: Authorization Tests

```bash
# Test 1: Create course without token (should fail)
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "price": 99
  }'

# Expected: 401 Unauthorized

# Test 2: Create course with student token (should fail)
# First register/login as STUDENT, then:
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE" \
  -d '{
    "title": "Test Course",
    "price": 99
  }'

# Expected: 403 Forbidden
```

#### Scenario 3: Validation Tests

```bash
# Test 1: Create course with missing required fields
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_TOKEN_HERE" \
  -d '{
    "description": "Missing title and price"
  }'

# Expected: 400 Bad Request

# Test 2: Create course with negative price
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_TOKEN_HERE" \
  -d '{
    "title": "Test Course",
    "price": -10
  }'

# Expected: 400 Bad Request
```

#### Scenario 4: Database Constraint Tests

```bash
# Create first course
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_TOKEN_HERE" \
  -d '{
    "title": "Unique Title",
    "price": 99
  }'

# Try to create duplicate course with same teacher and title
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SAME_TEACHER_TOKEN_HERE" \
  -d '{
    "title": "Unique Title",
    "price": 149
  }'

# Expected: 409 Conflict (database constraint violation)
```

#### Scenario 5: Public Endpoint Tests

```bash
# Test empty courses list
curl http://localhost:3002/courses

# Expected: []

# Test non-existent course
curl http://localhost:3002/courses/non-existent-uuid

# Expected: 404 Not Found
```

### Automated Testing

```bash
# Run unit tests
npm run test

# Run end-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## 🛠️ Development

### Project Structure

```
src/
├── auth/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.decorator.ts
│   └── roles.guard.ts
├── course.controller.ts
├── course.controller.spec.ts
├── course.service.ts
├── dto/
│   └── create-course.dto.ts
├── app.module.ts
├── main.ts
└── prisma.service.ts
```

### Key Components

#### Authentication Guards
- **JwtAuthGuard**: Validates JWT tokens and extracts user payload
- **RolesGuard**: Enforces role-based access control

#### Decorators
- **@Roles()**: Specifies required roles for endpoints
- **@CurrentUser()**: Extracts user information from JWT payload

#### DTOs
- **CreateCourseDto**: Validates course creation requests

#### Database
- **PrismaService**: Database connection and query handling
- **Course Model**: Database schema with unique constraints

### Database Schema

```prisma
model Course {
  id          String   @id @default(uuid())
  title       String
  description String?
  price       Int
  teacherId   String
  createdAt   DateTime @default(now())

  @@unique([teacherId, title])
}
```

### Scripts

```bash
# Development
npm run start:dev      # Start in development mode
npm run start:debug    # Start in debug mode
npm run start          # Start in production mode

# Building
npm run build          # Build the application

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run test:cov       # Run tests with coverage
npm run test:watch     # Run tests in watch mode

# Database
npx prisma migrate dev  # Run migrations
npx prisma generate     # Generate Prisma client
npx prisma studio       # Open Prisma Studio
```

## 🔒 Security Features

### JWT Authentication
- Tokens verified using `JWT_SECRET` environment variable
- Token expiration enforced
- Invalid tokens rejected with proper error messages

### Role-Based Access Control
- Only users with `TEACHER` role can create courses
- Role information extracted from JWT token
- Proper error responses for unauthorized access attempts

### Input Validation
- All input validated using class-validator
- SQL injection prevention through Prisma ORM
- XSS protection through input sanitization

### Database Security
- Unique constraints prevent data integrity issues
- Foreign key relationships maintain referential integrity
- Password hashing handled by identity service

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables:**
```env
DATABASE_URL="postgresql://user:pass@host:5432/course_db"
JWT_SECRET="super-secure-production-secret"
JWT_EXPIRES_IN="1h"
NODE_ENV="production"
```

2. **Database Setup:**
```bash
# Run migrations in production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

3. **Build Application:**
```bash
npm run build
```

4. **Start Production Server:**
```bash
npm run start:prod
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3002
CMD ["node", "dist/main"]
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Database connection failed"
**Solution:** Ensure PostgreSQL is running and DATABASE_URL is correct
```bash
# Check database status
docker compose -f infra/docker-compose.yml ps postgres_course

# Restart database
docker compose -f infra/docker-compose.yml restart postgres_course
```

#### 2. "JWT verification failed"
**Solution:** Ensure JWT_SECRET matches between services
```bash
# Check JWT_SECRET in both services
grep JWT_SECRET services/identity-service/.env
grep JWT_SECRET services/course-service/.env
```

#### 3. "Prisma client not initialized"
**Solution:** Generate Prisma client
```bash
cd services/course-service
npx prisma generate
```

#### 4. "Migration failed"
**Solution:** Reset database and re-run migrations
```bash
cd services/course-service
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Health Checks

```bash
# Check service health
curl http://localhost:3002/health

# Check database connection
npx prisma db pull
```

### Logs

```bash
# View application logs
npm run start:dev

# Enable debug logging
DEBUG=* npm run start:dev
```

## 📊 Monitoring

### Metrics to Monitor

- **Response Times**: API endpoint performance
- **Error Rates**: 4xx and 5xx response frequencies
- **Database Performance**: Query execution times
- **Memory Usage**: Application memory consumption
- **Request Volume**: Number of API calls per minute

### Health Endpoints

- `/health` - Basic service health check
- Consider adding `/health/detailed` for comprehensive health information

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Course Service CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test
      - run: npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow ESLint configuration
- Write unit tests for new features
- Update documentation for API changes
- Use semantic versioning for releases

## 📝 Changelog

### v1.0.0 (2026-03-05)
- Initial course service implementation
- JWT authentication and role-based access control
- Course CRUD operations
- Database schema with unique constraints
- Comprehensive API documentation
- Unit and integration tests

## 📄 License

This project is licensed under the UNLICENSED license.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check existing GitHub issues
4. Create a new issue with detailed information

---

**Service Status:** ✅ Production Ready  
**Last Updated:** 2026-03-05  
**Version:** 1.0.0
