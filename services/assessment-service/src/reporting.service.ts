import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CourseClient } from './integrations/course.client';
import { EnrollmentClient } from './integrations/enrollment.client';
import { StaffClient } from './integrations/staff.client';
import { AttemptStatus, QuestionType } from '@prisma/client';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { Role } from './auth/decorators/roles.decorator';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly courseClient: CourseClient,
    private readonly enrollmentClient: EnrollmentClient,
    private readonly staffClient: StaffClient,
  ) {}

  async getAssessmentReport(assessmentId: string, user: CurrentUser) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment not found: ${assessmentId}`);
    }

    await this.validateAccess(assessment.courseId, user);

    // Get all attempts
    const attempts = await this.prisma.attempt.findMany({
      where: { assessmentId },
      include: {
        answers: true,
      },
    });

    // Calculate statistics
    const gradedAttempts = attempts.filter(a => 
      a.status === AttemptStatus.GRADED || a.status === AttemptStatus.PARTIALLY_GRADED
    );
    
    const scores = gradedAttempts.map(a => a.percentage || 0);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    const passedCount = gradedAttempts.filter(a => a.isPassed).length;
    const failedCount = gradedAttempts.filter(a => !a.isPassed).length;

    // Question analytics
    const questionStats = await this.getQuestionAnalytics(assessmentId, assessment.questions);

    return {
      assessmentId,
      title: assessment.title,
      totalPoints: assessment.totalPoints,
      passPercentage: assessment.passPercentage,
      statistics: {
        totalAttempts: attempts.length,
        gradedAttempts: gradedAttempts.length,
        startedButNotSubmitted: attempts.filter(a => a.status === AttemptStatus.STARTED).length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.round(highestScore * 100) / 100,
        lowestScore: Math.round(lowestScore * 100) / 100,
        passedCount,
        failedCount,
        passRate: gradedAttempts.length > 0 ? Math.round((passedCount / gradedAttempts.length) * 100) : 0,
      },
      questionStats,
    };
  }

  async getCourseAssessmentsReport(courseId: string, user: CurrentUser) {
    await this.validateAccess(courseId, user);

    const assessments = await this.prisma.assessment.findMany({
      where: { courseId },
      include: {
        attempts: {
          where: {
            status: { in: [AttemptStatus.GRADED, AttemptStatus.PARTIALLY_GRADED] }
          },
        },
      },
    });

    const assessmentStats = assessments.map(assessment => {
      const scores = assessment.attempts.map(a => a.percentage || 0);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const passedCount = assessment.attempts.filter(a => a.isPassed).length;

      return {
        assessmentId: assessment.id,
        title: assessment.title,
        type: assessment.type,
        totalPoints: assessment.totalPoints,
        averageScore: Math.round(averageScore * 100) / 100,
        attemptsCount: assessment.attempts.length,
        passedCount,
        passRate: assessment.attempts.length > 0 
          ? Math.round((passedCount / assessment.attempts.length) * 100) 
          : 0,
      };
    });

    // Find best and worst performing assessments
    const sortedByAverage = [...assessmentStats].sort((a, b) => b.averageScore - a.averageScore);
    const sortedByPassRate = [...assessmentStats].sort((a, b) => b.passRate - a.passRate);

    return {
      courseId,
      assessmentsCount: assessments.length,
      overallStats: {
        totalAttempts: assessmentStats.reduce((sum, a) => sum + a.attemptsCount, 0),
        overallAverageScore: assessmentStats.length > 0
          ? Math.round(assessmentStats.reduce((sum, a) => sum + a.averageScore, 0) / assessmentStats.length * 100) / 100
          : 0,
      },
      assessments: assessmentStats,
      bestPerformingAssessment: sortedByAverage[0] || null,
      worstPerformingAssessment: sortedByAverage[sortedByAverage.length - 1] || null,
      highestPassRateAssessment: sortedByPassRate[0] || null,
      lowestPassRateAssessment: sortedByPassRate[sortedByPassRate.length - 1] || null,
    };
  }

  async getAttendanceReport(courseId: string, user: CurrentUser) {
    await this.validateAccess(courseId, user);

    // Get all assessments in course
    const assessments = await this.prisma.assessment.findMany({
      where: { courseId, isPublished: true },
    });

    // Get all enrolled students
    const enrollments = await this.enrollmentClient.getCourseEnrollments(courseId, 'ACTIVE');
    
    const attendanceData = [];

    for (const assessment of assessments) {
      const attempts = await this.prisma.attempt.findMany({
        where: { assessmentId: assessment.id },
      });

      const presentStudentIds = new Set(attempts.map(a => a.studentId));
      
      const attendance = enrollments.map(enrollment => {
        // Check if student enrolled before assessment was available
        const enrolledAt = new Date(enrollment.enrolledAt);
        const isEligible = enrolledAt <= assessment.availableTo;

        return {
          studentId: enrollment.studentId,
          status: presentStudentIds.has(enrollment.studentId) ? 'PRESENT' : 'ABSENT',
          isEligible,
        };
      });

      const eligibleStudents = attendance.filter(a => a.isEligible);
      const presentEligible = eligibleStudents.filter(a => a.status === 'PRESENT');
      const absentEligible = eligibleStudents.filter(a => a.status === 'ABSENT');

      attendanceData.push({
        assessmentId: assessment.id,
        title: assessment.title,
        availableFrom: assessment.availableFrom,
        availableTo: assessment.availableTo,
        totalEligible: eligibleStudents.length,
        present: presentEligible.length,
        absent: absentEligible.length,
        attendanceRate: eligibleStudents.length > 0 
          ? Math.round((presentEligible.length / eligibleStudents.length) * 100) 
          : 0,
        notEligibleCount: attendance.filter(a => !a.isEligible).length,
      });
    }

    return {
      courseId,
      totalStudents: enrollments.length,
      assessmentsAttendance: attendanceData,
    };
  }

  private async getQuestionAnalytics(assessmentId: string, assessmentQuestions: any[]) {
    const questionStats = [];

    for (const aq of assessmentQuestions) {
      const answers = await this.prisma.attemptAnswer.findMany({
        where: {
          questionId: aq.questionId,
          attempt: {
            assessmentId,
            status: { in: [AttemptStatus.GRADED, AttemptStatus.PARTIALLY_GRADED] }
          }
        },
        include: {
          selectedOption: true,
        },
      });

      const totalAnswers = answers.length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const skippedAnswers = answers.filter(a => !a.selectedOptionId && !a.essayText && !a.booleanAnswer).length;

      let optionDistribution = {};
      if (aq.question.type === QuestionType.MULTIPLE_CHOICE) {
        optionDistribution = answers.reduce((acc, answer) => {
          if (answer.selectedOptionId) {
            acc[answer.selectedOptionId] = (acc[answer.selectedOptionId] || 0) + 1;
          }
          return acc;
        }, {});
      }

      questionStats.push({
        questionId: aq.questionId,
        title: aq.question.title,
        type: aq.question.type,
        points: aq.pointsOverride || aq.question.defaultPoints,
        totalAnswers,
        correctCount: correctAnswers,
        incorrectCount: totalAnswers - correctAnswers - skippedAnswers,
        skippedCount: skippedAnswers,
        correctRate: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
        optionDistribution,
      });
    }

    // Find most/least correct questions
    const sortedByCorrectRate = [...questionStats].sort((a, b) => b.correctRate - a.correctRate);
    const sortedBySkipRate = [...questionStats].sort((a, b) => {
      const aSkipRate = a.totalAnswers > 0 ? a.skippedCount / a.totalAnswers : 0;
      const bSkipRate = b.totalAnswers > 0 ? b.skippedCount / b.totalAnswers : 0;
      return bSkipRate - aSkipRate;
    });

    return {
      questions: questionStats,
      mostCorrectQuestion: sortedByCorrectRate[0] || null,
      mostIncorrectQuestion: sortedByCorrectRate[sortedByCorrectRate.length - 1] || null,
      mostSkippedQuestion: sortedBySkipRate[0] || null,
    };
  }

  private async validateAccess(courseId: string, user: CurrentUser) {
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (user.role === Role.TEACHER) {
      const isOwner = await this.courseClient.validateCourseOwnership(courseId, user.sub);
      if (!isOwner) {
        throw new ForbiddenException('You can only view reports for your own courses');
      }
      return true;
    }

    if (user.role === Role.ASSISTANT) {
      const hasPermission = await this.staffClient.validateAssistantPermission(
        user.sub,
        courseId,
        'VIEW_REPORTS'
      );
      if (!hasPermission) {
        throw new ForbiddenException('Assistant does not have permission to view reports');
      }
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}
