# Notification Service

A scalable, asynchronous notification microservice for the LMS (Learning Management System) platform. Handles in-app notifications, email delivery, system announcements, and event-based notifications for 50,000+ students.

## Features

- **Multi-Channel Notifications**: In-app, Email (SMTP/SendGrid/AWS SES), Push (future)
- **Event-Driven Architecture**: Automatic notifications for course events
- **Bulk Notifications**: Efficient processing for large user bases
- **System Announcements**: Admin broadcasts with role-based targeting
- **User Preferences**: Granular control over notification channels
- **Queue-Based Processing**: Redis + BullMQ for reliable async delivery
- **Rate Limiting**: Prevents email spam and API abuse
- **Horizontal Scalability**: Multiple worker instances supported

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis + BullMQ
- **Email**: Nodemailer (SMTP, SendGrid, AWS SES)
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the service
npm run start:dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://lms:lms@localhost:5438/notification_db"

# Service
PORT=3009
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
EMAIL_FROM="LMS Platform <notifications@lms.example.com>"

# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Internal API Key
INTERNAL_API_KEY=internal-api-key
```

## API Endpoints

### Notifications (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/me` | Get my notifications |
| GET | `/notifications/unread-count` | Get unread count |
| PATCH | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |
| GET | `/notifications/preferences` | Get preferences |
| PATCH | `/notifications/preferences` | Update preferences |

### Announcements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/announcements` | List announcements (public) |
| POST | `/announcements` | Create system announcement |
| POST | `/announcements/courses/:courseId` | Course announcement |
| GET | `/announcements/:id/status` | Job status |

### Events (Internal Webhooks)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events/course-enrolled` | Course enrollment |
| POST | `/events/course-purchased` | Course purchase |
| POST | `/events/assessment-published` | Assessment published |
| POST | `/events/assessment-graded` | Assessment graded |
| POST | `/events/assignment-feedback` | Assignment feedback |
| POST | `/events/payment-recorded` | Payment recorded |
| POST | `/events/lesson-unlocked` | Lesson unlocked |

**Full API documentation**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) or visit `/api/docs` when running.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Other Services │────▶│  Event Webhook  │────▶│  Queue (Redis)  │
│  (Course, etc)  │     │  /events/*      │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌────────────────────────┼────────────────────────┐
                              │                        │                        │
                              ▼                        ▼                        ▼
                        ┌─────────┐              ┌─────────┐              ┌─────────┐
                        │ In-App  │              │  Email  │              │  Push   │
                        │ Worker  │              │ Worker  │              │ (Future)│
                        └─────────┘              └─────────┘              └─────────┘
                              │                        │                        │
                              └────────────────────────┼────────────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────┐
                                              │ PostgreSQL  │
                                              │  Database   │
                                              └─────────────┘
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Queue Workers

Workers process notifications asynchronously:

```bash
# Start API server
npm run start:dev

# Start queue workers (separate terminal)
npm run worker:start
```

## Database Schema

### Models

- **Notification**: In-app notifications
- **NotificationDelivery**: Delivery tracking per channel
- **NotificationPreference**: User settings
- **SystemAnnouncement**: Admin broadcasts
- **BulkNotificationJob**: Bulk processing jobs
- **NotificationLog**: Rate limiting & deduplication

```bash
# View database with Prisma Studio
npx prisma studio
```

## Notification Types

| Type | Description |
|------|-------------|
| `COURSE_PURCHASED` | Course purchase confirmation |
| `COURSE_ENROLLED` | Enrollment success |
| `LESSON_UNLOCKED` | New lesson available |
| `ASSESSMENT_PUBLISHED` | New assessment |
| `ASSESSMENT_GRADED` | Grade notification |
| `ASSIGNMENT_FEEDBACK` | Feedback available |
| `PAYMENT_RECORDED` | Payment confirmation |
| `ANNOUNCEMENT` | System/course announcements |

## Docker Support

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Or start individual services
docker run -d --name notification-db -p 5439:5432 -e POSTGRES_USER=lms -e POSTGRES_PASSWORD=lms -e POSTGRES_DB=notification_db postgres:15-alpine

docker run -d --name notification-redis -p 6379:6379 redis:7-alpine
```

## Scaling

### Horizontal Scaling

Run multiple worker instances:

```bash
# Terminal 1 - API
npm run start:dev

# Terminal 2 - Worker 1
WORKER_ID=worker-1 npm run worker:start

# Terminal 3 - Worker 2
WORKER_ID=worker-2 npm run worker:start
```

### Queue Configuration

| Queue | Concurrency | Rate Limit |
|-------|-------------|------------|
| notification | 10 | - |
| email | 5 | 100/min |
| bulk-notification | 3 | - |
| announcement | 2 | - |

## Security

- JWT Bearer authentication
- Role-based access control (RBAC)
- API key for service-to-service communication
- Rate limiting on all endpoints
- Input validation with class-validator

## Monitoring

### Health Check

```http
GET /health
```

### Queue Status

Check BullMQ dashboard or query job status:

```http
GET /announcements/:jobId/status
```

## License

Private - LMS Platform

## Support

For issues or questions, contact the development team.
