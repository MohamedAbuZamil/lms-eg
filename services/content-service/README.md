# Content Service

A comprehensive microservice for course content management within the LMS (Learning Management System) architecture. Handles course structure with sections and lessons, secure video playback, content access control, and preview functionality.

## 🏗️ Architecture Overview

The content-service is a core microservice responsible for:

- **Content Structure Management**: Create and organize course sections and lessons
- **Secure Video Playback**: External video provider integration with protected access
- **📊 Advanced View Limiting**: Per-student view tracking with cooldown windows
- **Content Access Control**: Preview lessons public, enrolled students full access
- **Teacher Authorization**: Course owners and authorized assistants can manage content
- **JWT Authentication**: Secure endpoints with token-based authentication
- **Cross-Service Integration**: Validates permissions through course, staff, and enrollment services

## 🔒 Video Security Features

- **External Video Providers**: YouTube, Vimeo, MUX, Bunny, Google Drive, Custom
- **Protected Playback**: Short-lived tokens (2 minutes expiry)
- **📊 View Limit Policies**: Per-student view tracking with flexible rules
- **Cooldown Windows**: Configurable cooldown periods (default: 6 hours)
- **Extra Views Override**: Teachers can grant additional views to students
- **Access Control**: Preview vs enrolled content validation
- **Provider URL Sanitization**: Raw URLs never exposed in standard responses
- **Playback Logging**: Access tracking and audit trails
- **Multiple Protection Levels**: Basic, Tokenized, Signed, Embed-only

---

## 📋 Complete Use Cases & Examples

### **🎯 Scenario 1: Complete Content Creation Workflow**

#### **Step 1: Teacher Creates Course Structure**
```bash
# Register and login as teacher
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@lms.com",
    "mobile": "01234567890",
    "password": "password123",
    "name": "Dr. Smith",
    "role": "TEACHER"
  }'

TEACHER_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@lms.com", "password": "password123"}' | jq -r '.accessToken')

# Create first section
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Chapter 1: Introduction to Programming",
    "order": 1
  }'

# Create second section
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Chapter 2: Basic Concepts",
    "order": 2
  }'
```

#### **Step 2: Add Lessons with Different Types**
```bash
# Add preview video lesson (public access)
curl -X POST http://localhost:3005/sections/section-1-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Course Introduction (Preview)",
    "type": "VIDEO",
    "url": "https://youtube.com/watch?v=preview123",
    "order": 1,
    "isPreview": true
  }'

# Add text lesson for enrolled students
curl -X POST http://localhost:3005/sections/section-1-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Programming Fundamentals",
    "type": "TEXT",
    "content": "Programming is the art of telling computers what to do...",
    "order": 2,
    "isPreview": false
  }'

# Add PDF lesson
curl -X POST http://localhost:3005/sections/section-1-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Course Syllabus",
    "type": "PDF",
    "url": "https://lms.com/files/syllabus.pdf",
    "order": 3,
    "isPreview": false
  }'

# Add file download lesson
curl -X POST http://localhost:3005/sections/section-2-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Exercise Files",
    "type": "FILE",
    "url": "https://lms.com/files/exercises.zip",
    "order": 1,
    "isPreview": false
  }'

# Add secure video lesson with YouTube provider
curl -X POST http://localhost:3005/sections/section-1-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Introduction to Variables",
    "type": "VIDEO",
    "videoProvider": "YOUTUBE",
    "providerVideoId": "dQw4w9WgXcQ",
    "order": 2,
    "isPreview": false,
    "playbackProtection": "TOKENIZED",
    "allowDownload": false
  }'

# Add Vimeo video lesson
curl -X POST http://localhost:3005/sections/section-1-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Advanced Concepts",
    "type": "VIDEO",
    "videoProvider": "VIMEO",
    "providerVideoId": "123456789",
    "order": 3,
    "isPreview": false,
    "playbackProtection": "EMBED_ONLY",
    "allowDownload": true
  }'
```

---

### **🎯 Scenario 2: Student Access Patterns**

#### **Public Access (Preview Only)**
```bash
# Anonymous user can see course structure but only preview lessons
curl -X GET http://localhost:3005/courses/course-uuid/content

# Expected: Shows all sections but only lessons with isPreview: true
{
  "courseId": "course-uuid",
  "sections": [
    {
      "id": "section-1-uuid",
      "title": "Chapter 1: Introduction to Programming",
      "order": 1,
      "lessons": [
        {
          "id": "preview-lesson-uuid",
          "title": "Course Introduction (Preview)",
          "type": "VIDEO",
          "videoProvider": "YOUTUBE",
          "providerVideoId": "preview123",
          "hasPlayback": true,
          "order": 1,
          "isPreview": true
        }
        // Other lessons filtered out (not preview)
        // Note: providerVideoUrl is never exposed in responses
      ]
    }
  ]
}
```

#### **Enrolled Student Access (Full Content)**
```bash
# Student registers and enrolls
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@lms.com",
    "mobile": "01234567891",
    "password": "password123",
    "name": "John Doe",
    "role": "STUDENT"
  }'

STUDENT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@lms.com", "password": "password123"}' | jq -r '.accessToken')

# Enroll in course
curl -X POST http://localhost:3003/enrollments/self \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "courseId": "course-uuid"
  }'

# Now student can see all content
curl -X GET http://localhost:3005/courses/course-uuid/content \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected: All lessons visible (preview + premium)
```

#### **Individual Lesson Access**
```bash
# Public access to preview lesson
curl -X GET http://localhost:3005/lessons/preview-lesson-uuid
# Expected: Full lesson details accessible (sanitized - no providerVideoUrl)

# Public access to premium lesson (should fail)
curl -X GET http://localhost:3005/lessons/premium-lesson-uuid
# Expected: 403 Forbidden - Authentication required

# Enrolled student access to premium lesson
curl -X GET http://localhost:3005/lessons/premium-lesson-uuid \
  -H "Authorization: Bearer $STUDENT_TOKEN"
# Expected: Full lesson details accessible (sanitized response)
```

---

### **🎯 Scenario 3: Secure Video Playback**

#### **Public Preview Video Access**
```bash
# Get playback token for preview lesson (no authentication required)
curl -X GET http://localhost:3005/lessons/preview-lesson-uuid/playback

# Expected response:
{
  "lessonId": "preview-lesson-uuid",
  "provider": "YOUTUBE",
  "playbackType": "EMBED",
  "expiresAt": "2026-03-07T12:05:00.000Z",
  "resolvedPlayback": {
    "type": "EMBED",
    "providerVideoId": "preview123",
    "embedUrl": "https://youtube.com/embed/preview123"
  }
}
```

#### **Enrolled Student Secure Playback**
```bash
# Get playback token for premium lesson (requires authentication)
curl -X GET http://localhost:3005/lessons/premium-lesson-uuid/playback \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected response for TOKENIZED protection:
{
  "lessonId": "premium-lesson-uuid",
  "provider": "YOUTUBE",
  "playbackType": "EMBED",
  "playbackToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-03-07T12:05:00.000Z",
  "embedUrl": "/playback/resolve?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Resolve playback token to get actual embed information
curl -X GET "http://localhost:3005/playback/resolve?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Expected response:
{
  "lessonId": "premium-lesson-uuid",
  "provider": "YOUTUBE",
  "isPreview": false,
  "expiresAt": "2026-03-07T12:05:00.000Z",
  "playback": {
    "type": "EMBED",
    "providerVideoId": "dQw4w9WgXcQ",
    "embedUrl": "https://youtube.com/embed/dQw4w9WgXcQ"
  }
}
```

#### **Access Denied Scenarios**
```bash
# Non-enrolled student tries to access premium video
curl -X GET http://localhost:3005/lessons/premium-lesson-uuid/playback \
  -H "Authorization: Bearer $STUDENT_TOKEN"
# Expected: 403 Forbidden - Active enrollment required

# Expired token resolution
curl -X GET "http://localhost:3005/playback/resolve?token=expired-token"
# Expected: 401 Unauthorized - Invalid or expired playback token

# Non-video lesson playback attempt
curl -X GET http://localhost:3005/text-lesson-uuid/playback
# Expected: 400 Bad Request - Playback only available for VIDEO lessons
```

---

### **🎯 Scenario 4: Assistant Authorization**

#### **Teacher Assigns Assistant with Content Permissions**
```bash
# Register assistant
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "assistant@lms.com",
    "mobile": "01234567892",
    "password": "password123",
    "name": "TA Jane",
    "role": "STUDENT"
  }'

ASSISTANT_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "assistant@lms.com", "password": "password123"}' | jq -r '.accessToken')

# Teacher assigns assistant with content management permissions
curl -X POST http://localhost:3004/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "assistantUserId": "assistant-user-uuid",
    "canManageCourses": true,
    "canManageEnrollments": false,
    "canManageContent": true
  }'
```

#### **Assistant Manages Content**
```bash
# Assistant creates new section
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ASSISTANT_TOKEN" \
  -d '{
    "title": "Chapter 3: Advanced Topics",
    "order": 3
  }'

# Assistant adds lessons
curl -X POST http://localhost:3005/sections/new-section-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ASSISTANT_TOKEN" \
  -d '{
    "title": "Advanced Programming Concepts",
    "type": "TEXT",
    "content": "In this lesson, we explore advanced topics...",
    "order": 1,
    "isPreview": false
  }'
```

---

### **🎯 Scenario 4: Content Management Operations**

#### **Update Section Order**
```bash
# Reorder sections
curl -X PATCH http://localhost:3005/sections/section-1-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "order": 2
  }'
```

#### **Update Lesson Content**
```bash
# Update lesson to make it preview
curl -X PATCH http://localhost:3005/lessons/lesson-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "isPreview": true,
    "title": "Updated Lesson Title"
  }'

# Change lesson type and content
curl -X PATCH http://localhost:3005/lessons/lesson-uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "type": "VIDEO",
    "url": "https://youtube.com/watch?v=newvideo123",
    "content": null
  }'
```

#### **Delete Content**
```bash
# Delete specific lesson
curl -X DELETE http://localhost:3005/lessons/lesson-uuid \
  -H "Authorization: Bearer $TEACHER_TOKEN"

# Delete entire section (cascades to lessons)
curl -X DELETE http://localhost:3005/sections/section-uuid \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

---

### **🎯 Scenario 5: Error Handling & Validation**

#### **Authorization Errors**
```bash
# Student tries to create content (should fail 403)
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "title": "Unauthorized Section",
    "order": 1
  }'
# Expected: 403 Forbidden - Insufficient permissions

# Wrong teacher tries to manage content (should fail 403)
curl -X POST http://localhost:3005/courses/other-course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Unauthorized Section",
    "order": 1
  }'
# Expected: 403 Forbidden - Not course owner
```

#### **Validation Errors**
```bash
# Missing required fields (should fail 400)
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": ""
  }'
# Expected: 400 Bad Request - title is required

# Invalid order value (should fail 400)
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Valid Title",
    "order": 0
  }'
# Expected: 400 Bad Request - order must be >= 1
```

#### **Content Type Validation**
```bash
# TEXT lesson without content or URL (should fail 400)
curl -X POST http://localhost:3005/sections/section-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Empty Text Lesson",
    "type": "TEXT",
    "order": 1
  }'
# Expected: 400 Bad Request - TEXT lessons need content or url

# VIDEO lesson without URL (should fail 400)
curl -X POST http://localhost:3005/sections/section-uuid/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Video Without URL",
    "type": "VIDEO",
    "order": 1
  }'
# Expected: 400 Bad Request - VIDEO lessons need url
```

#### **Order Conflicts**
```bash
# Duplicate section order (should fail 409)
curl -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Duplicate Order Section",
    "order": 1  # Same as existing section
  }'
# Expected: 409 Conflict - Section order must be unique within course
```

---

### **🎯 Scenario 6: Real-World Course Structure**

#### **Complete Programming Course Example**
```bash
# Chapter 1: Introduction
SECTION1=$(curl -s -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"title": "Chapter 1: Getting Started", "order": 1}' | jq -r '.id')

# Lessons in Chapter 1
curl -X POST http://localhost:3005/sections/$SECTION1/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Welcome to the Course",
    "type": "VIDEO",
    "url": "https://youtube.com/watch?v=welcome123",
    "order": 1,
    "isPreview": true
  }'

curl -X POST http://localhost:3005/sections/$SECTION1/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Course Overview and Objectives",
    "type": "TEXT",
    "content": "This course will teach you programming fundamentals...",
    "order": 2,
    "isPreview": false
  }'

curl -X POST http://localhost:3005/sections/$SECTION1/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Development Environment Setup",
    "type": "VIDEO",
    "url": "https://youtube.com/watch?v=setup123",
    "order": 3,
    "isPreview": false
  }'

# Chapter 2: Basic Concepts
SECTION2=$(curl -s -X POST http://localhost:3005/courses/course-uuid/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"title": "Chapter 2: Programming Basics", "order": 2}' | jq -r '.id')

# Lessons in Chapter 2
curl -X POST http://localhost:3005/sections/$SECTION2/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Variables and Data Types",
    "type": "TEXT",
    "content": "Variables are containers for storing data values...",
    "order": 1,
    "isPreview": false
  }'

curl -X POST http://localhost:3005/sections/$SECTION2/lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "title": "Exercise: Variable Declaration",
    "type": "FILE",
    "url": "https://lms.com/files/variables-exercise.zip",
    "order": 2,
    "isPreview": false
  }'
```

#### **View Complete Course Structure**
```bash
# Get full course content
curl -X GET http://localhost:3005/courses/course-uuid/content \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected: Complete hierarchical structure with all sections and lessons
```

---

## � **Security Architecture**

### **Video Protection Strategy**

**⚠️  Important Security Note**: While we implement multiple layers of protection, absolute prevention of video URL theft is impossible. Our approach adds significant barriers and access control, but determined users may still find ways to share content.

#### **Protection Levels**

1. **BASIC** - Direct provider embed information returned
2. **TOKENIZED** - Short-lived JWT tokens required for access
3. **SIGNED** - Time-limited signed URLs (for providers that support it)
4. **EMBED_ONLY** - Only embeddable player URLs, no direct access

#### **Access Control Flow**

```
1. User requests playback → /lessons/:id/playback
2. System validates:
   - Lesson exists and is VIDEO type
   - User permissions (preview vs enrolled)
   - Enrollment status (for non-preview)
3. Generate short-lived token (2 minutes)
4. Return sanitized playback response
5. Client resolves token → /playback/resolve?token=xxx
6. System validates token and returns embed info
```

#### **Security Features**

- **Short-lived Tokens**: 2-minute expiry prevents long-term sharing
- **User-bound Tokens**: Authenticated tokens tied to specific user ID
- **Preview vs Premium**: Clear separation of access levels
- **URL Sanitization**: Raw provider URLs never exposed in standard APIs
- **Access Logging**: All playback generations and resolutions logged
- **Cross-service Validation**: Enrollment and permissions verified in real-time

### **Supported Video Providers**

| Provider | Required Field | Embed Format | Protection Support |
|----------|----------------|--------------|-------------------|
| YOUTUBE | `providerVideoId` | `https://youtube.com/embed/{id}` | All levels |
| VIMEO | `providerVideoId` | `https://player.vimeo.com/video/{id}` | All levels |
| MUX | `providerVideoUrl` | Direct URL | TOKENIZED, SIGNED |
| BUNNY | `providerVideoUrl` | Direct URL | TOKENIZED, SIGNED |
| GOOGLE_DRIVE | `providerVideoId` | `https://drive.google.com/file/d/{id}/preview` | EMBED_ONLY |
| CUSTOM | `providerVideoUrl` | Direct URL | TOKENIZED, SIGNED |

---

## �🔧 **Advanced Features**

### **Content Type Guidelines**
- **TEXT**: Use for textual content, articles, documentation
- **VIDEO**: Use for video lessons (YouTube, Vimeo, self-hosted)
- **PDF**: Use for documents, slides, worksheets
- **FILE**: Use for downloadable resources, exercises, code files

### **Preview Strategy**
- Set `isPreview: true` for marketing/content samples
- Keep preview lessons short but valuable
- Use preview lessons to attract enrollments
- Limit preview content to 10-20% of total course

### **Order Management**
- Use sequential numbering (1, 2, 3...)
- Leave gaps for future content (1, 2, 5, 10...)
- Update orders when inserting new content
- Maintain consistent order within sections

---

## 📊 **Service Integration Examples**

### **Cross-Service Validation**
```bash
# Content service automatically validates:
# 1. Course exists (via course-service)
# 2. User is course owner or authorized assistant (via staff-service)
# 3. Student has active enrollment (via enrollment-service)
```

### **Permission Matrix**
| Role | Create Content | Update Content | Delete Content | View Preview | View Full Content |
|------|---------------|---------------|---------------|--------------|-------------------|
| Public | ❌ | ❌ | ❌ | ✅ | ❌ |
| Student | ❌ | ❌ | ❌ | ✅ | ✅ (if enrolled) |
| Assistant | ✅ (if authorized) | ✅ (if authorized) | ✅ (if authorized) | ✅ | ✅ |
| Teacher | ✅ (own courses) | ✅ (own courses) | ✅ (own courses) | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🚀 **Production Deployment Examples**

### **Environment Configuration**
```bash
# Production .env
DATABASE_URL="postgresql://user:secure_pass@prod-db:5438/content_db"
JWT_SECRET="super-secure-production-jwt-secret"
COURSE_SERVICE_URL="http://course-service:3002"
STAFF_SERVICE_URL="http://staff-service:3004"
ENROLLMENT_SERVICE_URL="http://enrollment-service:3003"
PORT=3005
NODE_ENV=production
```

### **Docker Deployment**
```bash
# Build and run content service
docker build -t lms-content-service .
docker run -d \
  --name content-service \
  -p 3005:3005 \
  --env-file .env \
  lms-content-service
```

---

## 🎯 **Video View Limit Policy**

### **📊 View Limiting Features**

The content service now supports **advanced video view limiting** with flexible policies:

#### **🔒 Policy Configuration**
```bash
# Create video lesson with view limits
curl -X POST http://localhost:3005/sections/section-uuid/lessons \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Programming Concepts",
    "type": "VIDEO",
    "videoProvider": "YOUTUBE",
    "providerVideoId": "dQw4w9WgXcQ",
    "viewLimitEnabled": true,
    "maxViews": 3,
    "viewCooldownHours": 6,
    "countOnlyAfterPlaybackStart": true,
    "allowUnlimitedViews": false,
    "playbackProtection": "TOKENIZED",
    "allowDownload": false
  }'
```

#### **📈 View Limit Behaviors**

| Scenario | Behavior | View Consumed |
|----------|----------|---------------|
| **First playback** | Counts as view 1 | ✅ Yes |
| **Replay within 6 hours** | No additional view counted | ❌ No |
| **Replay after 6 hours** | Counts as new view | ✅ Yes |
| **View limit exceeded** | Access denied (403) | N/A |
| **Extra views granted** | Increases effective limit | N/A |

#### **🎮 Enhanced Playback Response**
```bash
# Get playback token with view information
curl -X GET http://localhost:3005/lessons/lesson-uuid/playback \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Response includes view tracking:
{
  "lessonId": "lesson-uuid",
  "provider": "YOUTUBE",
  "playbackType": "EMBED",
  "playbackToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2026-03-07T23:00:00.000Z",
  "viewsConsumed": 1,
  "viewsRemaining": 2,
  "viewLimitStatus": "AVAILABLE"
}
```

#### **🔍 View Status Types**

- **UNLIMITED** - No view limits applied
- **AVAILABLE** - Can play and view will be counted
- **COOLDOWN** - Can play without consuming view
- **EXCEEDED** - No views remaining - access denied

#### **🎓 Teacher Features (Future)**

```bash
# Grant extra views to specific student (future feature)
curl -X POST http://localhost:3005/lessons/lesson-uuid/view-overrides \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student-uuid",
    "extraViewsGranted": 2,
    "reason": "Extra credit assignment"
  }'
```

#### **⚙️ Configuration Options**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `viewLimitEnabled` | Boolean | false | Enable view limiting |
| `maxViews` | Integer | null | Maximum allowed views |
| `viewCooldownHours` | Integer | 6 | Cooldown period in hours |
| `countOnlyAfterPlaybackStart` | Boolean | true | Count views only after playback |
| `allowUnlimitedViews` | Boolean | false | Override for unlimited access |

#### **🛡️ Business Rules**

- ✅ **View counting only after actual playback starts**
- ✅ **Cooldown window prevents view consumption**
- ✅ **Per-student view tracking**
- ✅ **Extra views override support**
- ✅ **Unlimited views option**
- ✅ **Comprehensive audit logging**

---

## 🧪 **Testing Examples**

### **Health Check**
```bash
curl -X GET http://localhost:3005/health
# {"status":"ok"}
```

### **Load Testing**
```bash
# Test concurrent content access
for i in {1..100}; do
  curl -X GET http://localhost:3005/courses/course-uuid/content &
done
wait
```

---

## 📝 **Summary**

This content-service provides:
- ✅ **Complete content management** with sections and lessons
- ✅ **Flexible access control** with preview functionality
- ✅ **Role-based permissions** with assistant authorization
- ✅ **🔒 Secure video playback** with external provider integration
- ✅ **📊 Advanced view limiting** with cooldown windows and tracking
- ✅ **Cross-service integration** for validation
- ✅ **Comprehensive error handling** and validation
- ✅ **Production-ready** with proper security

**All use cases covered:** from basic content creation to complex permission scenarios and video view management! 🎊
