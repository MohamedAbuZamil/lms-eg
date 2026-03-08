export interface ProgressEventPayload {
  userId: string;
  courseId: string;
  lessonId?: string;
  timestamp: string;
  metadata?: any;
}

export interface LessonOpenedEvent extends ProgressEventPayload {
  eventType: 'progress.lesson.opened';
  lessonType: string;
}

export interface VideoProgressUpdatedEvent extends ProgressEventPayload {
  eventType: 'progress.video.updated';
  lastPositionSeconds: number;
  progressPercent: number;
}

export interface LessonCompletedEvent extends ProgressEventPayload {
  eventType: 'progress.lesson.completed';
  lessonType: string;
  completionTime: string;
}

export interface CourseCompletedEvent extends ProgressEventPayload {
  eventType: 'progress.course.completed';
  totalLessons: number;
  completedLessons: number;
  finalProgressPercent: number;
}

export interface ProgressResetEvent extends ProgressEventPayload {
  eventType: 'progress.reset';
  scope: 'LESSON' | 'COURSE';
  reason?: string;
}

// Events to consume (future)
export interface ContentLessonDeletedEvent {
  eventType: 'content.lesson.deleted';
  lessonId: string;
  courseId: string;
  deletedAt: string;
}

export interface ContentCourseStructureChangedEvent {
  eventType: 'content.course.structure_changed';
  courseId: string;
  oldTotalLessons: number;
  newTotalLessons: number;
  changedAt: string;
}

export interface EnrollmentRevokedEvent {
  eventType: 'enrollment.revoked';
  studentId: string;
  courseId: string;
  revokedAt: string;
}
