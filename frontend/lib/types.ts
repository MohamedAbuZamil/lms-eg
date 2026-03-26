// ─── User / Auth ────────────────────────────────────────────────────────────

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'ASSISTANT';

export interface User {
  id: string;
  email: string;
  mobile: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  mobile: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface LoginResponse {
  accessToken: string;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export interface Grade {
  id: string;
  name: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  teacherId: string;
  gradeId?: string;
  grade?: Grade;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  gradeId?: string;
}

// ─── Content ─────────────────────────────────────────────────────────────────

export type LessonType = 'VIDEO' | 'TEXT' | 'PDF' | 'LINK';
export type VideoProvider = 'YOUTUBE' | 'VIMEO' | 'BUNNY' | 'CUSTOM';
export type PlaybackProtection = 'NONE' | 'SIGNED_URL' | 'IP_LOCK';

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  type: LessonType;
  order: number;
  isPreview: boolean;
  content?: string;
  url?: string;
  videoProvider?: VideoProvider;
  providerVideoId?: string;
  providerVideoUrl?: string;
  playbackProtection?: PlaybackProtection;
  allowDownload?: boolean;
  viewLimitEnabled?: boolean;
  maxViews?: number;
  viewCooldownHours?: number;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseContent {
  courseId: string;
  sections: Section[];
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export type EnrollmentStatus = 'ACTIVE' | 'BLOCKED' | 'DROPPED';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  course?: Course;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export type AssessmentType = 'QUIZ' | 'EXAM' | 'ASSIGNMENT';
export type AnswerReviewMode =
  | 'IMMEDIATELY_AFTER_SUBMISSION'
  | 'AFTER_ASSESSMENT_END'
  | 'AT_CUSTOM_TIME'
  | 'NEVER';

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type: AssessmentType;
  gradeId?: string;
  availableFrom: string;
  availableTo: string;
  durationMinutes?: number;
  answerReviewMode: AnswerReviewMode;
  passPercentage: number;
  isPublished: boolean;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  randomizeQuestions: boolean;
  randomQuestionCount?: number;
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  bankId: string;
  type: QuestionType;
  text: string;
  points: number;
  options?: QuestionOption[];
  correctAnswer?: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface LessonProgress {
  lessonId: string;
  studentId: string;
  isCompleted: boolean;
  watchedSeconds?: number;
  totalSeconds?: number;
  watchPercentage?: number;
  openedAt?: string;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  studentId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

// ─── Commerce ─────────────────────────────────────────────────────────────────

export interface TeacherBalance {
  teacherId: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  teacherId: string;
  type: 'RECHARGE' | 'PURCHASE' | 'MANUAL';
  amount: number;
  description?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  createdAt: string;
  course?: Course;
}

export interface RechargeCodeBatch {
  id: string;
  teacherId: string;
  amount: number;
  count: number;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  teacherId: string;
  assistantUserId: string;
  permissions: string[];
  assignedCourseIds: string[];
  createdAt: string;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
