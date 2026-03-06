# Course Service - API Examples

## 🚀 Quick Test Examples

### Prerequisites
1. Identity service running on port 3001
2. Course service running on port 3002
3. Database initialized with seed data

---

## 📚 Grade API Examples

### 1. Get All Grades (Public)
```bash
curl -X GET http://localhost:3002/grades
```

**Expected Response:**
```json
[
  {
    "id": "uuid",
    "name": "first_preparatory",
    "createdAt": "2026-03-06T08:00:00.000Z"
  },
  {
    "id": "uuid", 
    "name": "second_preparatory",
    "createdAt": "2026-03-06T08:00:00.000Z"
  }
]
```

### 2. Get Specific Grade (Public)
```bash
curl -X GET http://localhost:3002/grades/grade-uuid
```

### 3. Create Grade (Admin Only)
```bash
# First login as admin
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Use admin token to create grade
curl -X POST http://localhost:3002/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "fourth_secondary"
  }'
```

---

## 📖 Course API Examples

### 1. Get All Courses (Public)
```bash
curl -X GET http://localhost:3002/courses
```

**Expected Response:**
```json
[
  {
    "id": "course-uuid",
    "title": "Mathematics 101",
    "description": "Basic mathematics course",
    "price": 100,
    "teacherId": "teacher-uuid",
    "gradeId": "grade-uuid",
    "createdAt": "2026-03-06T08:00:00.000Z",
    "grade": {
      "id": "grade-uuid",
      "name": "first_preparatory"
    }
  }
]
```

### 2. Get Specific Course (Public)
```bash
curl -X GET http://localhost:3002/courses/course-uuid
```

### 3. Create Course (Teacher Only)
```bash
# First register/login as teacher
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "role": "TEACHER"
  }'

# Login to get token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'

# Create course with teacher token
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Mathematics 101",
    "description": "Basic mathematics course for beginners",
    "price": 100,
    "gradeId": "grade-uuid"
  }'
```

### 4. Update Course (Teacher Only - Owner)
```bash
curl -X PATCH http://localhost:3002/courses/course-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Advanced Mathematics 101",
    "price": 150,
    "description": "Updated course description"
  }'
```

### 5. Delete Course (Teacher Only - Owner)
```bash
curl -X DELETE http://localhost:3002/courses/course-uuid \
  -H "Authorization: Bearer <teacher-token>"
```

### 6. Get Teacher's Courses (Teacher Only)
```bash
curl -X GET http://localhost:3002/teachers/me/courses \
  -H "Authorization: Bearer <teacher-token>"
```

---

## 🔐 Authorization Examples

### Student Cannot Create Courses (403)
```bash
# Register/login as student
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "role": "STUDENT"
  }'

# Try to create course (should fail)
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-token>" \
  -d '{
    "title": "Student Course",
    "price": 50,
    "gradeId": "grade-uuid"
  }'

# Expected Response: 403 Forbidden
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

### Teacher Cannot Update Other's Courses (403)
```bash
# Teacher 1 creates course
# Teacher 2 tries to update it (should fail)
curl -X PATCH http://localhost:3002/courses/teacher1-course-uuid \
  -H "Authorization: Bearer <teacher2-token>" \
  -d '{
    "title": "Hacked Title"
  }'

# Expected Response: 403 Forbidden
{
  "message": "You can only update your own courses",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

## 🚨 Error Handling Examples

### Validation Errors (400)
```bash
# Create course with invalid data
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "",
    "price": -10,
    "gradeId": "invalid-uuid"
  }'

# Expected Response: 400 Bad Request
{
  "message": [
    "title should not be empty",
    "price must not be less than 0",
    "gradeId must be a UUID"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Grade Not Found (400)
```bash
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Valid Title",
    "price": 100,
    "gradeId": "non-existent-grade-uuid"
  }'

# Expected Response: 400 Bad Request
{
  "message": "Grade does not exist",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Course Not Found (404)
```bash
curl -X GET http://localhost:3002/courses/non-existent-course-uuid

# Expected Response: 404 Not Found
{
  "message": "Course not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Duplicate Course Title (409)
```bash
# Create course with same title twice
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Duplicate Title",
    "price": 100,
    "gradeId": "grade-uuid"
  }'

# Try again with same title
curl -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Duplicate Title",
    "price": 200,
    "gradeId": "grade-uuid"
  }'

# Expected Response: 409 Conflict
{
  "message": "Course with this title already exists for this teacher",
  "error": "Conflict",
  "statusCode": 409
}
```

---

## 🧪 Complete Test Flow

### 1. Setup Users
```bash
# Create admin
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "role": "ADMIN"
  }'

# Create teacher
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "password123",
    "role": "TEACHER"
  }'

# Create student
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "password123",
    "role": "STUDENT"
  }'
```

### 2. Get Tokens
```bash
# Admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123"}' | \
  jq -r '.token')

# Teacher token
TEACHER_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@test.com", "password": "password123"}' | \
  jq -r '.token')

# Student token
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@test.com", "password": "password123"}' | \
  jq -r '.token')
```

### 3. Test Grade Operations
```bash
# Create grade (admin)
GRADE_ID=$(curl -s -X POST http://localhost:3002/grades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "test_grade"}' | jq -r '.id')

# Get all grades
curl -X GET http://localhost:3002/grades

# Get specific grade
curl -X GET http://localhost:3002/grades/$GRADE_ID
```

### 4. Test Course Operations
```bash
# Create course (teacher)
COURSE_ID=$(curl -s -X POST http://localhost:3002/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d "{
    \"title\": \"Test Course\",
    \"description\": \"Test Description\",
    \"price\": 100,
    \"gradeId\": \"$GRADE_ID\"
  }" | jq -r '.id')

# Get all courses
curl -X GET http://localhost:3002/courses

# Get specific course
curl -X GET http://localhost:3002/courses/$COURSE_ID

# Update course
curl -X PATCH http://localhost:3002/courses/$COURSE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Updated Test Course",
    "price": 150
  }'

# Get teacher's courses
curl -X GET http://localhost:3002/teachers/me/courses \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# Delete course
curl -X DELETE http://localhost:3002/courses/$COURSE_ID \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

---

## 📊 Performance Testing

### Concurrent Requests
```bash
# Test 10 concurrent course requests
for i in {1..10}; do
  curl -X GET http://localhost:3002/courses &
done
wait

# Test course creation under load
for i in {1..5}; do
  curl -X POST http://localhost:3002/courses \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEACHER_TOKEN" \
    -d "{
      \"title\": \"Load Test Course $i\",
      \"price\": 100,
      \"gradeId\": \"$GRADE_ID\"
    }" &
done
wait
```

---

## 🔍 Debugging

### Check Service Health
```bash
curl -X GET http://localhost:3002/health
```

### Check Database Connection
```bash
# Try to get grades (tests DB connection)
curl -X GET http://localhost:3002/grades
```

### Verify JWT Token
```bash
# Decode JWT token (requires jq)
echo $TEACHER_TOKEN | jq -R 'split(".") | .[1] | @base64d | fromjson'
```

---

## 📝 Notes

- All datetime fields are in ISO 8601 format
- UUIDs are generated automatically
- Price is stored as integer (cents/points)
- Course titles must be unique per teacher
- Grade names must be unique globally
- All protected endpoints require valid JWT token
- Teacher can only manage their own courses
