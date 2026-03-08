# Identity Service API Documentation

## Overview

The Identity Service handles user authentication, registration, and authorization within the LMS ecosystem. It manages user accounts, JWT tokens, and role-based access control.

## Base URL
```
http://localhost:3001
```

## Authentication

All endpoints require JWT authentication (except registration and login). Include the token in the Authorization header:
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
  "service": "identity-service"
}
```

---

## Authentication Endpoints

### User Registration

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "isActive": true,
    "createdAt": "2026-03-07T22:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  }'
```

---

### User Login

#### POST /auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### Refresh Token

#### POST /auth/refresh
Refresh JWT token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m"
}
```

---

### Logout

#### POST /auth/logout
Logout user and invalidate token.

**Authorization:** Required

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## User Management Endpoints

### Get My Profile

#### GET /users/me
Get current user profile.

**Authorization:** Required

**Response:**
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "isActive": true,
  "createdAt": "2026-03-07T22:30:00.000Z",
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Update My Profile

#### PATCH /users/me
Update current user profile.

**Authorization:** Required

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "De Updated"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "firstName": "John Updated",
  "lastName": "De Updated",
  "role": "STUDENT",
  "isActive": true,
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Change Password

#### POST /users/change-password
Change user password.

**Authorization:** Required

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

---

## Admin Endpoints

### Get All Users

#### GET /users
Get all users (Admin only).

**Authorization:** ADMIN

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `role` (string, optional): Filter by role
- `search` (string, optional): Search by email or name

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT",
      "isActive": true,
      "createdAt": "2026-03-07T22:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### Get User by ID

#### GET /users/:userId
Get specific user by ID (Admin only).

**Authorization:** ADMIN

**Parameters:**
- `userId` (string, path): UUID of the user

**Response:**
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "isActive": true,
  "createdAt": "2026-03-07T22:30:00.000Z",
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

---

### Update User

#### PATCH /users/:userId
Update user (Admin only).

**Authorization:** ADMIN

**Parameters:**
- `userId` (string, path): UUID of the user

**Request Body:**
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "role": "TEACHER",
  "isActive": false
}
```

---

### Delete User

#### DELETE /users/:userId
Delete user (Admin only).

**Authorization:** ADMIN

**Parameters:**
- `userId` (string, path): UUID of the user

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Email already exists",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## User Roles

- **STUDENT**: Can access enrolled courses and track progress
- **TEACHER**: Can create and manage their own courses
- **ADMIN**: Full system access and user management
- **ASSISTANT**: Can access assigned courses with limited permissions

---

## Rate Limiting

- **Registration**: 5 requests per hour per IP
- **Login**: 10 requests per minute per IP
- **Password Change**: 3 requests per hour per user

---

## Security Features

- Password hashing with bcrypt
- JWT token expiration (15 minutes)
- Refresh token rotation
- Account lockout after failed attempts
- Email verification for registration

---

## Usage Examples

### Complete Authentication Flow

```bash
# 1. Register new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "TEACHER"
  }'

# 2. Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "SecurePassword123!"
  }'

# 3. Get profile with token
curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer $JWT_TOKEN"

# 4. Update profile
curl -X PATCH http://localhost:3001/users/me \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jane Updated"}'
```

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT|TEACHER|ADMIN|ASSISTANT",
  "isActive": true,
  "createdAt": "2026-03-07T22:30:00.000Z",
  "updatedAt": "2026-03-07T22:30:00.000Z"
}
```

### Auth Response
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "isActive": true
  },
  "token": "jwt-token-here",
  "expiresIn": "15m"
}
```
