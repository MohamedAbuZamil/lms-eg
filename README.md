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
    │ (Port 3001) │          │ (Port 3002) │          │ (Future)    │
    │              │          │              │              │
    │ PostgreSQL   │          │ PostgreSQL   │          │ PostgreSQL   │
    │ (Port 5433) │          │ (Port 5435) │          │ (Future)    │
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
- Teacher ownership enforcement
- Course catalog and search
- Public course access

**Key Features:**
- JWT authentication integration
- Role-based access control (TEACHER only for creation)
- Unique course titles per teacher
- Input validation and sanitization

### 🔄 Future Services (Planned)

#### 3. Enrollment Service
**Responsibilities:**
- Student course enrollment
- Enrollment status tracking
- Waitlist management

#### 4. Lesson Service
**Responsibilities:**
- Lesson content management
- Video and material hosting
- Lesson sequencing

#### 5. Progress Service
**Responsibilities:**
- Student progress tracking
- Completion tracking
- Performance analytics

#### 6. Payment Service
**Responsibilities:**
- Payment processing
- Subscription management
- Revenue tracking

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
│   └── 📁 course-service/          # Course management
│       ├── 📁 src/
│       │   ├── 📄 course.controller.ts
│       │   ├── 📄 course.service.ts
│       │   ├── 📄 app.module.ts
│       │   ├── 📄 main.ts
│       │   ├── 📄 prisma.service.ts
│       │   ├── 📁 auth/
│       │   │   ├── 📄 jwt-auth.guard.ts
│       │   │   ├── 📄 roles.guard.ts
│       │   │   ├── 📄 roles.decorator.ts
│       │   │   └── 📁 decorators/
│       │   │       └── 📄 current-user.decorator.ts
│       │   ├── 📁 dto/
│       │   │   └── 📄 create-course.dto.ts
│       │   └── 📁 test/
│       ├── 📁 prisma/
│       │   └── 📄 schema.prisma
│       └── 📄 package.json
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

### 5. Verify Setup

```bash
# Check identity service health
curl http://localhost:3001/health

# Check course service health
curl http://localhost:3002/health

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

### Course Service Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/health` | Service health check | ❌ | - |
| POST | `/courses` | Create new course | ✅ | TEACHER |
| GET | `/courses` | List all courses | ❌ | - |
| GET | `/courses/:id` | Get course by ID | ❌ | - |

## 🧪 Testing Guide

### Prerequisites

1. Both services running (`localhost:3001`, `localhost:3002`)
2. Databases initialized with migrations
3. Test user accounts created

### Test Scenarios

#### 1. Complete User Registration & Course Creation

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

# Step 2: Login Teacher
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'

# Step 3: Create Course (use token from step 2)
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \
  -d '{
    "title": "Introduction to Programming",
    "description": "Learn programming fundamentals",
    "price": 99
  }'
```

#### 2. Authorization & Role Testing

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

#### 3. Data Validation Testing

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
cd services/course-service && npm run start:dev
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
        service: [identity-service, course-service]
    
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
        service: [identity-service, course-service]
    
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
- [ ] Enrollment Service
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

---

<div align="center">

**⭐ Star this repository if it helps you!**  
**🍴 Fork this repository to contribute**  

</div>

**Built with ❤️ by the LMS Development Team**
