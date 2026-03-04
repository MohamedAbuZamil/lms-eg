# Identity Service

A microservice for user authentication and management within the LMS (Learning Management System) architecture. Handles user registration, login, JWT token management, and user profile operations.

## Architecture

The identity-service is a core microservice responsible for:

- **User Registration**: Create new user accounts with secure password hashing
- **Authentication**: Login users and issue JWT tokens
- **Token Management**: Validate JWT tokens for protected endpoints
- **User Profile**: Retrieve and manage user profile information
- **Security**: Password hashing with bcrypt and secure token handling

This service is part of a microservices-based LMS architecture, communicating with other services via NATS messaging and maintaining its own PostgreSQL database.

## Requirements

- **Node.js** 18+ 
- **Docker Desktop** (for local development)
- **PostgreSQL** (runs via Docker Compose)

## Environment Variables

Create a `.env` file in the service root:

```env
DATABASE_URL="postgresql://lms:lms@localhost:5433/identity_db?schema=public"
JWT_SECRET="dev_secret_change_me"
JWT_EXPIRES_IN="15m"
```

## Run Locally

1. **Start infrastructure services** (from repo root):
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

2. **Navigate to identity service**:
   ```bash
   cd services/identity-service
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run database migrations** (if needed):
   ```bash
   npx prisma migrate dev
   ```

5. **Start the service**:
   ```bash
   npm run start:dev
   ```

The service will be available at `http://localhost:3001`

## API Endpoints

### Health Check

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok"
}
```

### Register User

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "mobile": "+1234567890",
    "password": "password123",
    "name": "John Doe",
    "role": "STUDENT"
  }'
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "mobile": "+1234567890",
  "name": "John Doe",
  "role": "STUDENT",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400` - Validation errors
- `409` - Email or mobile already exists

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401` - Invalid credentials

### Get Current User Profile

```bash
# First, login to get a token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Copy the accessToken from the response, then:
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "mobile": "+1234567890",
  "name": "John Doe",
  "role": "STUDENT",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - Missing, invalid, or expired token
- `401` - User not found

## Testing

Run the test suite:

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

**Note**: CI pipeline runs linting, build, and all tests automatically.

## Contributing

We welcome contributions! Please follow these guidelines:

- **Pull Requests Required**: All changes must be submitted via PR
- **CI Must Pass**: All checks (lint, build, tests) must pass
- **Branch Protection**: PRs target protected branches (main/develop)
- **Focused Changes**: Keep PRs small and focused on single features/fixes
- **Code Quality**: Follow existing code patterns and maintain test coverage

## Development Notes

- Service runs on port `3001`
- Database: PostgreSQL on port `5433`
- JWT tokens expire in 15 minutes by default
- Passwords are hashed using bcrypt with salt rounds of 10
- All endpoints use global validation pipe for input sanitization
