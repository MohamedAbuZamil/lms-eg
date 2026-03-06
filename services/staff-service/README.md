# Staff Service

Teacher staff management service for the LMS system. Handles teacher-assistant relationships and permissions.

## 🏗️ Architecture Overview

The staff-service is a microservice responsible for managing teacher staff relationships and permissions within the LMS ecosystem.

### Service Responsibilities
- **Staff Assignment**: Teachers can assign assistants to their staff
- **Permission Management**: Control what assistants can manage (courses, enrollments)
- **Staff Status**: Manage active/blocked status of assistants
- **Teacher Ownership**: Teachers can only manage their own staff
- **Admin Oversight**: Administrators can view all staff relationships

### Important Notes
- **Assistant is NOT a global role** - it's a teacher-specific relationship
- **No authentication logic** - uses identity-service for JWT validation
- **Cross-service validation** - verifies users exist in identity-service
- **Database per service** - separate PostgreSQL database

---

## 📋 Domain Model

### TeacherStaff Entity
```typescript
{
  id: string                    // UUID
  teacherId: string            // From JWT sub
  assistantUserId: string      // User ID of assistant
  canManageCourses: boolean    // Permission flag
  canManageEnrollments: boolean // Permission flag
  status: StaffStatus          // ACTIVE | BLOCKED
  createdAt: DateTime
  updatedAt: DateTime
}
```

### StaffStatus Enum
- `ACTIVE`: Assistant can perform assigned permissions
- `BLOCKED`: Assistant permissions are suspended

### Database Constraints
- **Unique constraint**: (teacherId, assistantUserId)
- **Meaning**: A teacher cannot assign the same assistant twice

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm or yarn
- Identity service running on port 3001

### Installation
```bash
npm install
```

### Environment Variables
```bash
cp env.example .env
```

Configure your `.env` file:
```env
DATABASE_URL="postgresql://lms:lms@localhost:5437/staff_db?schema=public"
JWT_SECRET="dev_secret_change_me"
IDENTITY_SERVICE_URL="http://localhost:3001"
PORT=3004
```

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### Running
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

Service starts on `http://localhost:3004`

---

## 📚 API Documentation

### Health Check

#### GET /health
Public endpoint to check service health.

```bash
curl -X GET http://localhost:3004/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### Staff Management

#### POST /staff
Assign an assistant to a teacher (TEACHER only).

```bash
curl -X POST http://localhost:3004/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "assistantUserId": "assistant-uuid",
    "canManageCourses": true,
    "canManageEnrollments": false
  }'
```

**Response:**
```json
{
  "id": "staff-record-uuid",
  "teacherId": "teacher-uuid",
  "assistantUserId": "assistant-uuid",
  "canManageCourses": true,
  "canManageEnrollments": false,
  "status": "ACTIVE",
  "createdAt": "2026-03-06T08:00:00.000Z",
  "updatedAt": "2026-03-06T08:00:00.000Z"
}
```

**Errors:**
- `401`: No/invalid JWT token
- `403`: User is not a TEACHER
- `400`: Teacher tries to assign themselves
- `409`: Assistant already assigned to this teacher

#### GET /teachers/me/staff
Get all assistants for the current teacher (TEACHER only).

```bash
curl -X GET http://localhost:3004/teachers/me/staff \
  -H "Authorization: Bearer <teacher-token>"
```

**Response:**
```json
[
  {
    "id": "staff-record-uuid",
    "teacherId": "teacher-uuid",
    "assistantUserId": "assistant-uuid",
    "canManageCourses": true,
    "canManageEnrollments": false,
    "status": "ACTIVE",
    "createdAt": "2026-03-06T08:00:00.000Z",
    "updatedAt": "2026-03-06T08:00:00.000Z"
  }
]
```

#### GET /staff/:id
Get a specific staff record (TEACHER owner or ADMIN only).

```bash
curl -X GET http://localhost:3004/staff/staff-uuid \
  -H "Authorization: Bearer <teacher-or-admin-token>"
```

**Errors:**
- `404`: Staff record not found
- `403`: Teacher tries to access another teacher's staff record

#### PATCH /staff/:id
Update staff permissions or status (TEACHER owner only).

```bash
curl -X PATCH http://localhost:3004/staff/staff-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "canManageCourses": false,
    "status": "BLOCKED"
  }'
```

**Response:**
```json
{
  "id": "staff-record-uuid",
  "teacherId": "teacher-uuid",
  "assistantUserId": "assistant-uuid",
  "canManageCourses": false,
  "canManageEnrollments": false,
  "status": "BLOCKED",
  "createdAt": "2026-03-06T08:00:00.000Z",
  "updatedAt": "2026-03-06T09:00:00.000Z"
}
```

**Errors:**
- `404`: Staff record not found
- `403`: Not the owner of the staff record

#### DELETE /staff/:id
Remove an assistant from teacher's staff (TEACHER owner only).

```bash
curl -X DELETE http://localhost:3004/staff/staff-uuid \
  -H "Authorization: Bearer <teacher-token>"
```

**Response:** `204 No Content`

**Errors:**
- `404`: Staff record not found
- `403`: Not the owner of the staff record

---

### Assistant Endpoints

#### GET /assistants/me/teachers
Get all teachers where the current user is assigned as an assistant.

```bash
curl -X GET http://localhost:3004/assistants/me/teachers \
  -H "Authorization: Bearer <assistant-token>"
```

**Response:**
```json
[
  {
    "id": "staff-record-uuid",
    "teacherId": "teacher-uuid",
    "assistantUserId": "assistant-uuid",
    "canManageCourses": true,
    "canManageEnrollments": false,
    "status": "ACTIVE",
    "createdAt": "2026-03-06T08:00:00.000Z",
    "updatedAt": "2026-03-06T08:00:00.000Z"
  }
]
```

---

### Admin Endpoints

#### GET /admin/staff
Get all staff records in the system (ADMIN only).

```bash
curl -X GET http://localhost:3004/admin/staff \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
[
  {
    "id": "staff-record-uuid",
    "teacherId": "teacher-uuid",
    "assistantUserId": "assistant-uuid",
    "canManageCourses": true,
    "canManageEnrollments": false,
    "status": "ACTIVE",
    "createdAt": "2026-03-06T08:00:00.000Z",
    "updatedAt": "2026-03-06T08:00:00.000Z"
  }
]
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "STUDENT | TEACHER | ADMIN"
}
```

### Role Permissions
- **STUDENT**: Can view their own teacher assignments
- **TEACHER**: Can manage their own staff, view their own records
- **ADMIN**: Can view all staff records, full system access

### Authorization Headers
```http
Authorization: Bearer <jwt-token>
```

---

## 🧪 Testing Examples

### Complete Staff Management Flow

#### 1. Setup Users
```bash
# Register teacher
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "mobile": "01234567890",
    "password": "password123",
    "role": "TEACHER"
  }'

# Register assistant (as regular user)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "assistant@test.com",
    "mobile": "01234567891",
    "password": "password123",
    "role": "STUDENT"
  }'

# Get tokens
TEACHER_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@test.com", "password": "password123"}' | jq -r '.accessToken')

ASSISTANT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "assistant@test.com", "password": "password123"}' | jq -r '.accessToken')
```

#### 2. Assign Assistant to Teacher
```bash
# Get assistant user ID (you might need this from identity service)
ASSISTANT_ID="assistant-uuid-here"

curl -X POST http://localhost:3004/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "assistantUserId": "'$ASSISTANT_ID'",
    "canManageCourses": true,
    "canManageEnrollments": false
  }'
```

#### 3. View Teacher's Staff
```bash
curl -X GET http://localhost:3004/teachers/me/staff \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

#### 4. Assistant Views Their Teachers
```bash
curl -X GET http://localhost:3004/assistants/me/teachers \
  -H "Authorization: Bearer $ASSISTANT_TOKEN"
```

#### 5. Update Staff Permissions
```bash
STAFF_ID="staff-record-uuid"

curl -X PATCH http://localhost:3004/staff/$STAFF_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "canManageEnrollments": true,
    "status": "ACTIVE"
  }'
```

#### 6. Remove Assistant
```bash
curl -X DELETE http://localhost:3004/staff/$STAFF_ID \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

### Error Testing

#### Teacher Assigns Themselves (400)
```bash
curl -X POST http://localhost:3004/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "assistantUserId": "teacher-own-uuid",
    "canManageCourses": true
  }'
# Expected: 400 Bad Request
```

#### Duplicate Assignment (409)
```bash
# Try to assign the same assistant twice
curl -X POST http://localhost:3004/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "assistantUserId": "'$ASSISTANT_ID'",
    "canManageCourses": true
  }'
# Expected: 409 Conflict
```

#### Student Tries to Assign Staff (403)
```bash
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@test.com", "password": "password123"}' | jq -r '.accessToken')

curl -X POST http://localhost:3004/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "assistantUserId": "'$ASSISTANT_ID'",
    "canManageCourses": true
  }'
# Expected: 403 Forbidden
```

---

## 📊 Error Handling

### HTTP Status Codes
- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **204 No Content**: Resource deleted successfully
- **400 Bad Request**: Validation errors or business rule violations
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource

### Error Response Format
```json
{
  "message": "Error description",
  "error": "ErrorType",
  "statusCode": 400
}
```

---

## 📝 Scripts

- `npm run build`: Build the application
- `npm run start`: Start the application
- `npm run start:dev`: Start in development mode
- `npm run start:prod`: Start in production mode
- `npm run lint`: Run ESLint
- `npm run test`: Run tests
- `npm run db:generate`: Generate Prisma client
- `npm run db:migrate`: Run database migrations

---

## 🔧 Development

### Project Structure
```
src/
├── auth/              # Authentication guards & decorators
├── dto/               # Data transfer objects
├── staff.controller.ts
├── staff.service.ts
├── prisma.service.ts
└── app.module.ts
```

### Adding New Features
1. Update Prisma schema
2. Run migration: `npm run db:migrate`
3. Create/update DTOs
4. Implement service methods
5. Add controller endpoints
6. Add tests

---

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5437/staff_db"
JWT_SECRET="production-jwt-secret"
IDENTITY_SERVICE_URL="http://identity-service:3001"
PORT=3004
```

### Health Check
```bash
curl -X GET http://localhost:3004/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues and questions, please create an issue in the repository.
