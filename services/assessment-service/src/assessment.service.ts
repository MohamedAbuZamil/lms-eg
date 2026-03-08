import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CourseClient } from './integrations/course.client';
import { EnrollmentClient } from './integrations/enrollment.client';
import { StaffClient } from './integrations/staff.client';
import { ContentClient } from './integrations/content.client';
import { CreateQuestionBankDto, QuestionBankScope } from './dto/create-question-bank.dto';
import { CreateQuestionDto, QuestionType } from './dto/create-question.dto';
import { CreateAssessmentDto, AssessmentType, AnswerReviewMode } from './dto/create-assessment.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { SubmitAnswerDto, AnswerDto } from './dto/submit-answer.dto';
import { CreateAssessmentGateDto } from './dto/create-assessment-gate.dto';
import { SaveAttemptDraftDto } from './dto/save-attempt-draft.dto';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { Role } from './auth/decorators/roles.decorator';
import { AttemptStatus } from '@prisma/client';
import { GradingService } from './grading.service';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly courseClient: CourseClient,
    private readonly enrollmentClient: EnrollmentClient,
    private readonly staffClient: StaffClient,
    private readonly contentClient: ContentClient,
    private readonly gradingService: GradingService,
  ) {}

  // ==================== QUESTION BANKS ====================
  async createQuestionBank(dto: CreateQuestionBankDto, userId: string) {
    if (dto.scopeType === QuestionBankScope.GRADE && !dto.gradeId) {
      throw new BadRequestException('gradeId is required for GRADE-scoped question banks');
    }

    return this.prisma.questionBank.create({
      data: {
        name: dto.name,
        scopeType: dto.scopeType,
        gradeId: dto.gradeId,
        createdByUserId: userId,
      },
    });
  }

  async getQuestionBanks(filters: { gradeId?: string; scopeType?: string }) {
    const where: any = {};
    
    if (filters.gradeId) {
      where.OR = [
        { scopeType: QuestionBankScope.GLOBAL },
        { gradeId: filters.gradeId },
      ];
    }
    
    if (filters.scopeType) {
      where.scopeType = filters.scopeType;
    }

    return this.prisma.questionBank.findMany({
      where,
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async getQuestionBank(id: string) {
    const bank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            title: true,
            type: true,
            difficulty: true,
            defaultPoints: true,
            createdAt: true,
          },
        },
      },
    });

    if (!bank) {
      throw new NotFoundException(`Question bank not found: ${id}`);
    }

    return bank;
  }

  async updateQuestionBank(id: string, dto: Partial<CreateQuestionBankDto>) {
    await this.getQuestionBank(id); // Verify exists
    
    return this.prisma.questionBank.update({
      where: { id },
      data: dto,
    });
  }

  async deleteQuestionBank(id: string) {
    await this.getQuestionBank(id); // Verify exists
    
    return this.prisma.questionBank.delete({
      where: { id },
    });
  }

  // ==================== QUESTIONS ====================
  async createQuestion(dto: CreateQuestionDto, userId: string) {
    // Validate question bank exists
    const bank = await this.prisma.questionBank.findUnique({
      where: { id: dto.bankId },
    });

    if (!bank) {
      throw new NotFoundException(`Question bank not found: ${dto.bankId}`);
    }

    // Validate options for MCQ
    if (dto.type === QuestionType.MULTIPLE_CHOICE) {
      if (!dto.options || dto.options.length < 2) {
        throw new BadRequestException('MCQ must have at least 2 options');
      }
      
      const correctOptions = dto.options.filter(o => o.isCorrect);
      if (correctOptions.length === 0) {
        throw new BadRequestException('MCQ must have at least one correct answer');
      }
    }

    // Create question with options
    return this.prisma.question.create({
      data: {
        bankId: dto.bankId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        difficulty: dto.difficulty,
        defaultPoints: dto.defaultPoints,
        explanation: dto.explanation,
        createdByUserId: userId,
        options: dto.type === QuestionType.MULTIPLE_CHOICE ? {
          create: dto.options!.map((opt, index) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: index as number,
          })),
        } : undefined,
      },
      include: {
        options: true,
      },
    });
  }

  async getQuestionsByBank(bankId: string) {
    return this.prisma.question.findMany({
      where: { bankId },
      include: {
        options: true,
      },
    });
  }

  async getQuestion(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        options: true,
        bank: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question not found: ${id}`);
    }

    return question;
  }

  async updateQuestion(id: string, dto: Partial<CreateQuestionDto>) {
    await this.getQuestion(id); // Verify exists

    // Extract only the updatable fields (exclude bankId and options which require special handling)
    const { bankId, options, ...updatableData } = dto;

    return this.prisma.question.update({
      where: { id },
      data: updatableData,
      include: {
        options: true,
      },
    });
  }

  async deleteQuestion(id: string) {
    await this.getQuestion(id); // Verify exists

    return this.prisma.question.delete({
      where: { id },
    });
  }

  // ==================== ASSESSMENTS ====================
  async createAssessment(dto: CreateAssessmentDto, user: CurrentUser) {
    // Validate course ownership
    const course = await this.courseClient.getCourse(dto.courseId);
    if (!course) {
      throw new NotFoundException(`Course not found: ${dto.courseId}`);
    }

    if (user.role === Role.TEACHER && course.teacherId !== user.sub) {
      throw new ForbiddenException('You can only create assessments for your own courses');
    }

    if (user.role === Role.ASSISTANT) {
      const hasPermission = await this.staffClient.validateAssistantPermission(
        user.sub,
        dto.courseId,
        'CREATE_ASSESSMENT'
      );
      if (!hasPermission) {
        throw new ForbiddenException('Assistant does not have permission to create assessments');
      }
    }

    // Validate grade compatibility
    if (dto.gradeId && course.gradeId && dto.gradeId !== course.gradeId) {
      throw new BadRequestException('Assessment grade must match course grade');
    }

    // Validate answer review mode
    if (dto.answerReviewMode === AnswerReviewMode.AT_CUSTOM_TIME && !dto.answerReviewAt) {
      throw new BadRequestException('answerReviewAt is required when mode is AT_CUSTOM_TIME');
    }

    return this.prisma.assessment.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        gradeId: dto.gradeId || course.gradeId,
        availableFrom: new Date(dto.availableFrom),
        availableTo: new Date(dto.availableTo),
        durationMinutes: dto.durationMinutes,
        answerReviewMode: dto.answerReviewMode,
        answerReviewAt: dto.answerReviewAt ? new Date(dto.answerReviewAt) : null,
        totalPoints: 0,
        passPercentage: dto.passPercentage || 70.0,
        isPublished: dto.isPublished || false,
        createdByUserId: user.sub,
      },
    });
  }

  async getAssessments(filters: { courseId?: string; type?: string; isPublished?: string }) {
    const where: any = {};
    
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.type) where.type = filters.type;
    if (filters.isPublished !== undefined) where.isPublished = filters.isPublished === 'true';

    return this.prisma.assessment.findMany({
      where,
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssessment(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment not found: ${id}`);
    }

    return assessment;
  }

  async updateAssessment(id: string, dto: Partial<CreateAssessmentDto>, user: CurrentUser) {
    const assessment = await this.getAssessment(id);
    
    // Validate ownership
    await this.validateAssessmentAccess(assessment.courseId, user);

    return this.prisma.assessment.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAssessment(id: string, user: CurrentUser) {
    const assessment = await this.getAssessment(id);
    
    // Validate ownership
    await this.validateAssessmentAccess(assessment.courseId, user);

    return this.prisma.assessment.delete({
      where: { id },
    });
  }

  async addQuestionsToAssessment(id: string, dto: AddQuestionsDto, user: CurrentUser) {
    const assessment = await this.getAssessment(id);
    
    // Validate ownership
    await this.validateAssessmentAccess(assessment.courseId, user);

    // Validate questions exist and are from appropriate banks
    const questions = await this.prisma.question.findMany({
      where: { id: { in: dto.questionIds } },
      include: { bank: true },
    });

    if (questions.length !== dto.questionIds.length) {
      const foundIds = questions.map(q => q.id);
      const missingIds = dto.questionIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
    }

    // Validate grade compatibility
    for (const question of questions) {
      if (question.bank.scopeType === QuestionBankScope.GRADE && 
          question.bank.gradeId !== assessment.gradeId) {
        throw new BadRequestException(
          `Question ${question.id} is from a different grade bank and cannot be used`
        );
      }
    }

    // Get current max order
    const currentQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId: id },
      orderBy: { order: 'desc' },
      take: 1,
    });
    const startOrder = currentQuestions.length > 0 ? currentQuestions[0].order : 0;

    // Create assessment questions
    const assessmentQuestions = await this.prisma.$transaction(
      dto.questionIds.map((questionId, index) =>
        this.prisma.assessmentQuestion.create({
          data: {
            assessmentId: id,
            questionId,
            order: startOrder + index + 1,
            pointsOverride: dto.pointsOverrides?.[questionId],
          },
        })
      )
    );

    // Recalculate total points
    await this.recalculateAssessmentTotalPoints(id);

    return assessmentQuestions;
  }

  async removeQuestionFromAssessment(assessmentId: string, questionId: string, user: CurrentUser) {
    const assessment = await this.getAssessment(assessmentId);
    
    // Validate ownership
    await this.validateAssessmentAccess(assessment.courseId, user);

    const assessmentQuestion = await this.prisma.assessmentQuestion.findFirst({
      where: { assessmentId, questionId },
    });

    if (!assessmentQuestion) {
      throw new NotFoundException('Question not found in this assessment');
    }

    await this.prisma.assessmentQuestion.delete({
      where: { id: assessmentQuestion.id },
    });

    // Recalculate total points
    await this.recalculateAssessmentTotalPoints(assessmentId);

    return { message: 'Question removed successfully' };
  }

  private async recalculateAssessmentTotalPoints(assessmentId: string) {
    const assessmentQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId },
      include: { question: true },
    });

    const totalPoints = assessmentQuestions.reduce(
      (sum, aq) => sum + (aq.pointsOverride || aq.question.defaultPoints),
      0
    );

    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: { totalPoints },
    });
  }

  // ==================== TIMED ATTEMPT LIFECYCLE ====================
  async startAttempt(assessmentId: string, studentId: string) {
    const assessment = await this.getAssessment(assessmentId);

    // Check if assessment is published
    if (!assessment.isPublished) {
      throw new ForbiddenException('This assessment is not yet published');
    }

    // Check availability window
    const now = new Date();
    if (now < assessment.availableFrom || now > assessment.availableTo) {
      throw new ForbiddenException('Assessment is not currently available');
    }

    // Check enrollment
    const hasEnrollment = await this.enrollmentClient.hasActiveEnrollment(
      studentId,
      assessment.courseId
    );
    if (!hasEnrollment) {
      throw new ForbiddenException('You must be enrolled in this course to take the assessment');
    }

    // Check max attempts
    if (assessment.maxAttempts) {
      const attemptCount = await this.prisma.attempt.count({
        where: {
          assessmentId,
          studentId,
          status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.PARTIALLY_GRADED, AttemptStatus.SUBMITTED_AUTOMATICALLY] },
        },
      });
      if (attemptCount >= assessment.maxAttempts) {
        throw new ForbiddenException(`Maximum attempts (${assessment.maxAttempts}) reached for this assessment`);
      }
    }

    // Check for existing active attempt
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        assessmentId,
        studentId,
        status: { in: [AttemptStatus.STARTED, AttemptStatus.IN_PROGRESS] },
      },
      include: {
        answers: true,
      },
    });

    if (existingAttempt) {
      // Return existing attempt with remaining time
      const attemptWithTime = await this.checkAndUpdateAttemptExpiry(existingAttempt);
      return this.formatAttemptResponse(attemptWithTime, assessment);
    }

    // Create new attempt
    const expiresAt = assessment.durationMinutes 
      ? new Date(now.getTime() + assessment.durationMinutes * 60000)
      : null;

    // Handle random question selection
    let selectedQuestionIds: string[] = [];
    let questionOrder: any = null;
    let optionsOrder: any = null;

    const allAssessmentQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId },
      include: { question: { include: { options: true } } },
      orderBy: { order: 'asc' },
    });

    if (allAssessmentQuestions.length === 0) {
      throw new BadRequestException('Assessment has no questions');
    }

    // Select questions if randomized
    let questionsForAttempt = allAssessmentQuestions;
    if (assessment.randomizeQuestions && assessment.randomQuestionCount) {
      const shuffled = this.shuffleArray([...allAssessmentQuestions]);
      questionsForAttempt = shuffled.slice(0, assessment.randomQuestionCount);
      selectedQuestionIds = questionsForAttempt.map(q => q.questionId);
    } else {
      selectedQuestionIds = allAssessmentQuestions.map(q => q.questionId);
    }

    // Shuffle question order if enabled
    if (assessment.shuffleQuestions) {
      const shuffledQuestions = this.shuffleArray([...questionsForAttempt]);
      questionOrder = {};
      shuffledQuestions.forEach((q, index) => {
        questionOrder[q.questionId] = index + 1;
      });
    }

    // Shuffle options if enabled
    if (assessment.shuffleOptions) {
      optionsOrder = {};
      questionsForAttempt.forEach(aq => {
        if (aq.question.type === QuestionType.MULTIPLE_CHOICE && aq.question.options.length > 0) {
          const shuffledOptions = this.shuffleArray([...aq.question.options]);
          optionsOrder[aq.questionId] = shuffledOptions.map(o => o.id);
        }
      });
    }

    const newAttempt = await this.prisma.attempt.create({
      data: {
        assessmentId,
        studentId,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: now,
        expiresAt,
        selectedQuestionIds,
        questionOrder,
        optionsOrder,
      },
      include: {
        answers: true,
      },
    });

    return this.formatAttemptResponse(newAttempt, assessment);
  }

  async saveAttemptDraft(assessmentId: string, dto: SaveAttemptDraftDto, studentId: string) {
    const attempt = await this.getEditableAttempt(dto.attemptId, studentId);
    
    // Validate attempt belongs to this assessment
    if (attempt.assessmentId !== assessmentId) {
      throw new ForbiddenException('Attempt does not belong to this assessment');
    }

    // Check if expired and auto-submit if needed
    const now = new Date();
    if (attempt.expiresAt && now > attempt.expiresAt) {
      await this.autoSubmitExpiredAttempt(attempt);
      throw new ForbiddenException('Assessment time has expired and attempt was auto-submitted');
    }

    // Save answers as drafts
    const savedAnswers = [];
    for (const answer of dto.answers) {
      // Validate question belongs to assessment
      const isValidQuestion = attempt.selectedQuestionIds?.includes(answer.questionId) ||
        await this.prisma.assessmentQuestion.findFirst({
          where: { assessmentId, questionId: answer.questionId },
        });

      if (!isValidQuestion) {
        throw new BadRequestException(`Question ${answer.questionId} not found in assessment`);
      }

      // Validate answer format
      const question = await this.prisma.question.findUnique({
        where: { id: answer.questionId },
      });
      if (question) {
        this.validateAnswerFormat(answer, question.type);
      }

      // Save as draft
      const savedAnswer = await this.prisma.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: dto.attemptId,
            questionId: answer.questionId,
          },
        },
        update: {
          selectedOptionId: answer.selectedOptionId,
          booleanAnswer: answer.booleanAnswer,
          essayText: answer.essayText,
          essayImageUrl: answer.essayImageUrl,
          isDraft: true,
          lastEditedAt: now,
        },
        create: {
          attemptId: dto.attemptId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          booleanAnswer: answer.booleanAnswer,
          essayText: answer.essayText,
          essayImageUrl: answer.essayImageUrl,
          isDraft: true,
          answeredAt: now,
          lastEditedAt: now,
        },
      });

      savedAnswers.push(savedAnswer);
    }

    // Update lastSavedAt
    await this.prisma.attempt.update({
      where: { id: dto.attemptId },
      data: { lastSavedAt: now, status: AttemptStatus.IN_PROGRESS },
    });

    return {
      message: 'Draft saved successfully',
      savedAnswers,
      remainingSeconds: this.calculateRemainingSeconds(attempt.expiresAt),
    };
  }

  async getMyCurrentAttempt(assessmentId: string, studentId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        assessmentId,
        studentId,
        status: { in: [AttemptStatus.STARTED, AttemptStatus.IN_PROGRESS] },
      },
      include: {
        answers: {
          select: {
            questionId: true,
            selectedOptionId: true,
            booleanAnswer: true,
            essayText: true,
            essayImageUrl: true,
            isDraft: true,
            answeredAt: true,
            lastEditedAt: true,
          },
        },
      },
    });

    if (!attempt) {
      return null;
    }

    // Check expiry and auto-submit if expired
    const attemptWithTime = await this.checkAndUpdateAttemptExpiry(attempt);
    
    const assessment = await this.getAssessment(assessmentId);
    return this.formatAttemptResponse(attemptWithTime, assessment);
  }

  async submitAttempt(assessmentId: string, studentId: string) {
    const attempt = await this.getEditableAttemptByAssessment(assessmentId, studentId);

    // Check if already expired
    const now = new Date();
    let status: AttemptStatus = AttemptStatus.SUBMITTED;
    
    if (attempt.expiresAt && now > attempt.expiresAt) {
      status = AttemptStatus.SUBMITTED_AUTOMATICALLY;
    }

    // Mark all answers as not drafts
    await this.prisma.attemptAnswer.updateMany({
      where: { attemptId: attempt.id },
      data: { isDraft: false },
    });

    // Update attempt
    const updatedAttempt = await this.prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        status,
        submittedAt: now,
      },
    });

    // Trigger auto-grading
    await this.gradingService.autoGradeAttempt(attempt.id);

    return { 
      message: status === AttemptStatus.SUBMITTED_AUTOMATICALLY 
        ? 'Assessment auto-submitted due to time expiry' 
        : 'Assessment submitted successfully',
      attempt: updatedAttempt,
    };
  }

  async submitAnswers(assessmentId: string, dto: SubmitAnswerDto, studentId: string) {
    const attempt = await this.getActiveAttempt(assessmentId, studentId);
    
    // Check if time expired (for timed assessments)
    if (attempt.assessment.durationMinutes) {
      const elapsedMinutes = (new Date().getTime() - attempt.startedAt.getTime()) / 1000 / 60;
      if (elapsedMinutes > attempt.assessment.durationMinutes) {
        // Auto-submit due to time expiration
        return this.submitAttempt(assessmentId, studentId);
      }
    }

    // Validate and save answers
    const savedAnswers = [];
    for (const answer of dto.answers) {
      const assessmentQuestion = attempt.assessment.questions.find(
        q => q.questionId === answer.questionId
      );

      if (!assessmentQuestion) {
        throw new BadRequestException(`Question not found in assessment: ${answer.questionId}`);
      }

      const question = assessmentQuestion.question;

      // Validate answer format based on question type
      this.validateAnswerFormat(answer, question.type);

      // Save or update answer
      const savedAnswer = await this.prisma.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: answer.questionId,
          },
        },
        update: {
          selectedOptionId: answer.selectedOptionId,
          booleanAnswer: answer.booleanAnswer,
          essayText: answer.essayText,
          essayImageUrl: answer.essayImageUrl,
        },
        create: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          booleanAnswer: answer.booleanAnswer,
          essayText: answer.essayText,
          essayImageUrl: answer.essayImageUrl,
        },
      });

      savedAnswers.push(savedAnswer);
    }

    return { message: 'Answers saved successfully', answers: savedAnswers };
  }

  async getMyAttempt(assessmentId: string, studentId: string) {
    return this.prisma.attempt.findFirst({
      where: { assessmentId, studentId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                type: true,
                defaultPoints: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyResult(assessmentId: string, studentId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { 
        assessmentId, 
        studentId,
        status: { in: [AttemptStatus.GRADED, AttemptStatus.PARTIALLY_GRADED] },
      },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                type: true,
                explanation: true,
              },
            },
            selectedOption: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!attempt) {
      throw new NotFoundException('No completed attempt found for this assessment');
    }

    // Check answer review visibility
    const assessment = await this.getAssessment(assessmentId);
    const canViewAnswers = await this.canViewAnswers(assessment, attempt);

    if (!canViewAnswers) {
      return {
        attemptId: attempt.id,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        status: attempt.status,
        message: 'Answer review is not yet available',
      };
    }

    return attempt;
  }

  async getSubmissions(assessmentId: string, user: CurrentUser, filters: { status?: string }) {
    const assessment = await this.getAssessment(assessmentId);
    
    // Validate access
    await this.validateAssessmentAccess(assessment.courseId, user);

    const where: any = { assessmentId };
    if (filters.status) where.status = filters.status;

    return this.prisma.attempt.findMany({
      where,
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubmission(assessmentId: string, attemptId: string, user: CurrentUser) {
    const assessment = await this.getAssessment(assessmentId);
    
    // Validate access
    await this.validateAssessmentAccess(assessment.courseId, user);

    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, assessmentId },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            selectedOption: true,
            gradedBy: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Submission not found');
    }

    return attempt;
  }

  // ==================== CONTENT GATES ====================
  async createAssessmentGate(dto: CreateAssessmentGateDto, user: CurrentUser) {
    // Validate assessment ownership
    const assessment = await this.getAssessment(dto.assessmentId);
    await this.validateAssessmentAccess(assessment.courseId, user);

    // Validate lesson exists
    const lessonExists = await this.contentClient.validateLessonExists(dto.targetLessonId);
    if (!lessonExists) {
      throw new NotFoundException(`Lesson not found: ${dto.targetLessonId}`);
    }

    return this.prisma.assessmentGate.create({
      data: {
        assessmentId: dto.assessmentId,
        targetLessonId: dto.targetLessonId,
        minimumPassPercentage: dto.minimumPassPercentage || 70.0,
      },
    });
  }

  async getAssessmentGateForLesson(lessonId: string) {
    return this.prisma.assessmentGate.findUnique({
      where: { targetLessonId: lessonId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            totalPoints: true,
            passPercentage: true,
          },
        },
      },
    });
  }

  async checkLessonAccess(lessonId: string, studentId: string) {
    const gate = await this.getAssessmentGateForLesson(lessonId);

    if (!gate) {
      return { locked: false, message: 'No assessment gate configured' };
    }

    // Find student's best attempt
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        assessmentId: gate.assessmentId,
        studentId,
        status: AttemptStatus.GRADED,
      },
      orderBy: { percentage: 'desc' },
    });

    if (!attempt) {
      return {
        locked: true,
        message: 'Assessment not completed',
        requiredAssessment: gate.assessment,
        minimumPassPercentage: gate.minimumPassPercentage,
      };
    }

    const passed = attempt.percentage >= gate.minimumPassPercentage;

    return {
      locked: !passed,
      message: passed ? 'Lesson unlocked' : 'Assessment not passed',
      attempt: {
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
      },
      requiredAssessment: gate.assessment,
      minimumPassPercentage: gate.minimumPassPercentage,
    };
  }

  // ==================== HELPER METHODS ====================
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private calculateRemainingSeconds(expiresAt: Date | null): number {
    if (!expiresAt) return -1; // Unlimited time
    const remaining = Math.max(0, expiresAt.getTime() - Date.now()) / 1000;
    return Math.floor(remaining);
  }

  private async checkAndUpdateAttemptExpiry(attempt: any): Promise<any> {
    const now = new Date();
    
    // If already submitted or expired, return as-is
    if ([AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.PARTIALLY_GRADED, AttemptStatus.SUBMITTED_AUTOMATICALLY].includes(attempt.status)) {
      return attempt;
    }

    // Check if expired
    if (attempt.expiresAt && now > attempt.expiresAt) {
      // Auto-submit expired attempt
      return this.autoSubmitExpiredAttempt(attempt);
    }

    return attempt;
  }

  private async autoSubmitExpiredAttempt(attempt: any): Promise<any> {
    const now = new Date();

    // Mark all answers as not drafts
    await this.prisma.attemptAnswer.updateMany({
      where: { attemptId: attempt.id },
      data: { isDraft: false },
    });

    // Update attempt status
    const updatedAttempt = await this.prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        status: AttemptStatus.SUBMITTED_AUTOMATICALLY,
        submittedAt: now,
      },
    });

    // Trigger auto-grading
    await this.gradingService.autoGradeAttempt(attempt.id);

    return {
      ...attempt,
      status: AttemptStatus.SUBMITTED_AUTOMATICALLY,
      submittedAt: now,
      editable: false,
    };
  }

  private async getEditableAttempt(attemptId: string, studentId: string): Promise<any> {
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        id: attemptId,
        studentId,
        status: { in: [AttemptStatus.STARTED, AttemptStatus.IN_PROGRESS] },
      },
      include: {
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found');
    }

    // Check if expired
    if (attempt.expiresAt && new Date() > attempt.expiresAt) {
      await this.autoSubmitExpiredAttempt(attempt);
      throw new ForbiddenException('Assessment time has expired and attempt was auto-submitted');
    }

    return attempt;
  }

  private async getEditableAttemptByAssessment(assessmentId: string, studentId: string): Promise<any> {
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        assessmentId,
        studentId,
        status: { in: [AttemptStatus.STARTED, AttemptStatus.IN_PROGRESS] },
      },
      include: {
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found. Please start the assessment first.');
    }

    // Check if expired
    if (attempt.expiresAt && new Date() > attempt.expiresAt) {
      await this.autoSubmitExpiredAttempt(attempt);
      throw new ForbiddenException('Assessment time has expired and attempt was auto-submitted');
    }

    return attempt;
  }

  private async formatAttemptResponse(attempt: any, assessment: any) {
    const editable = [AttemptStatus.STARTED, AttemptStatus.IN_PROGRESS].includes(attempt.status) &&
      (!attempt.expiresAt || new Date() < attempt.expiresAt);

    const remainingSeconds = this.calculateRemainingSeconds(attempt.expiresAt);

    // Get questions for this attempt (respecting randomization)
    const questionIds = attempt.selectedQuestionIds?.length > 0 
      ? attempt.selectedQuestionIds 
      : assessment.questions.map((q: any) => q.questionId);

    // Get question details
    const questions = await this.prisma.assessmentQuestion.findMany({
      where: {
        assessmentId: assessment.id,
        questionId: { in: questionIds },
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            body: true,
            type: true,
            difficulty: true,
            defaultPoints: true,
            options: {
              select: {
                id: true,
                text: true,
                order: true,
              },
            },
          },
        },
      },
    });

    // Apply question order if shuffled
    let orderedQuestions = questions;
    if (attempt.questionOrder) {
      orderedQuestions = questions.sort((a: any, b: any) => {
        const orderA = attempt.questionOrder[a.questionId] || 0;
        const orderB = attempt.questionOrder[b.questionId] || 0;
        return orderA - orderB;
      });
    }

    // Apply options order if shuffled
    const questionsWithOrderedOptions = orderedQuestions.map((q: any) => {
      if (attempt.optionsOrder && attempt.optionsOrder[q.questionId]) {
        const optionOrder = attempt.optionsOrder[q.questionId];
        const orderedOptions = optionOrder.map((optionId: string) =>
          q.question.options.find((o: any) => o.id === optionId)
        ).filter(Boolean);
        return {
          ...q,
          question: {
            ...q.question,
            options: orderedOptions,
          },
        };
      }
      return q;
    });

    // Format answers
    const formattedAnswers = attempt.answers?.map((answer: any) => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      booleanAnswer: answer.booleanAnswer,
      essayText: answer.essayText,
      essayImageUrl: answer.essayImageUrl,
      isDraft: answer.isDraft,
      answeredAt: answer.answeredAt,
      lastEditedAt: answer.lastEditedAt,
    })) || [];

    return {
      attemptId: attempt.id,
      assessmentId: attempt.assessmentId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      lastSavedAt: attempt.lastSavedAt,
      remainingSeconds,
      editable,
      questions: questionsWithOrderedOptions.map((q: any) => ({
        assessmentQuestionId: q.id,
        questionId: q.questionId,
        title: q.question.title,
        body: q.question.body,
        type: q.question.type,
        difficulty: q.question.difficulty,
        points: q.pointsOverride || q.question.defaultPoints,
        options: q.question.options?.map((o: any) => ({
          id: o.id,
          text: o.text,
        })),
      })),
      answers: formattedAnswers,
    };
  }

  private async getActiveAttempt(assessmentId: string, studentId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: {
        assessmentId,
        studentId,
        status: { in: [AttemptStatus.STARTED, AttemptStatus.IN_PROGRESS] },
      },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found. Please start the assessment first.');
    }

    // Check for time expiration
    if (attempt.expiresAt && new Date() > attempt.expiresAt) {
      await this.autoSubmitExpiredAttempt(attempt);
      throw new ForbiddenException('Assessment time has expired and attempt was auto-submitted');
    }

    return attempt;
  }

  private async validateAssessmentAccess(courseId: string, user: CurrentUser) {
    if (user.role === Role.ADMIN) {
      return true;
    }

    if (user.role === Role.TEACHER) {
      const isOwner = await this.courseClient.validateCourseOwnership(courseId, user.sub);
      if (!isOwner) {
        throw new ForbiddenException('You can only manage assessments for your own courses');
      }
      return true;
    }

    if (user.role === Role.ASSISTANT) {
      const hasPermission = await this.staffClient.validateAssistantPermission(
        user.sub,
        courseId,
        'MANAGE_ASSESSMENTS'
      );
      if (!hasPermission) {
        throw new ForbiddenException('Assistant does not have permission to manage assessments');
      }
      return true;
    }

    throw new ForbiddenException('Access denied');
  }

  private async canViewAnswers(assessment: any, attempt: any): Promise<boolean> {
    switch (assessment.answerReviewMode) {
      case AnswerReviewMode.IMMEDIATELY_AFTER_SUBMISSION:
        return [AttemptStatus.GRADED, AttemptStatus.PARTIALLY_GRADED, AttemptStatus.SUBMITTED_AUTOMATICALLY].includes(attempt.status);
      
      case AnswerReviewMode.AFTER_ASSESSMENT_END:
        return new Date() > assessment.availableTo;
      
      case AnswerReviewMode.AT_CUSTOM_TIME:
        if (!assessment.answerReviewAt) return false;
        return new Date() >= assessment.answerReviewAt;
      
      case AnswerReviewMode.NEVER:
        return false;
      
      default:
        return false;
    }
  }

  private validateAnswerFormat(answer: AnswerDto, questionType: string) {
    switch (questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!answer.selectedOptionId) {
          throw new BadRequestException('MCQ answer must include selectedOptionId');
        }
        break;
      
      case QuestionType.TRUE_FALSE:
        if (answer.booleanAnswer === undefined || answer.booleanAnswer === null) {
          throw new BadRequestException('TRUE_FALSE answer must include booleanAnswer');
        }
        break;
      
      case QuestionType.ESSAY:
        if (!answer.essayText && !answer.essayImageUrl) {
          throw new BadRequestException('ESSAY answer must include essayText or essayImageUrl');
        }
        break;
    }
  }
}
