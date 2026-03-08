import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { GradingService } from './grading.service';
import { ReportingService } from './reporting.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { QuestionType, Difficulty } from './dto/create-question.dto';
import { QuestionBankScope } from './dto/create-question-bank.dto';
import { AssessmentType, AnswerReviewMode } from './dto/create-assessment.dto';
import { Role } from './auth/decorators/roles.decorator';
import { AttemptStatus } from '@prisma/client';

describe('AssessmentController', () => {
  let controller: AssessmentController;
  let service: AssessmentService;
  let gradingService: GradingService;
  let reportingService: ReportingService;

  const mockUser = {
    sub: 'user-uuid',
    email: 'test@example.com',
    role: Role.TEACHER,
  };

  const mockStudent = {
    sub: 'student-uuid',
    email: 'student@example.com',
    role: Role.STUDENT,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssessmentController],
      providers: [
        {
          provide: AssessmentService,
          useValue: {
            createQuestionBank: jest.fn(),
            getQuestionBanks: jest.fn(),
            getQuestionBank: jest.fn(),
            updateQuestionBank: jest.fn(),
            deleteQuestionBank: jest.fn(),
            createQuestion: jest.fn(),
            getQuestionsByBank: jest.fn(),
            getQuestion: jest.fn(),
            updateQuestion: jest.fn(),
            deleteQuestion: jest.fn(),
            createAssessment: jest.fn(),
            getAssessments: jest.fn(),
            getAssessment: jest.fn(),
            updateAssessment: jest.fn(),
            deleteAssessment: jest.fn(),
            addQuestionsToAssessment: jest.fn(),
            removeQuestionFromAssessment: jest.fn(),
            startAttempt: jest.fn(),
            getMyCurrentAttempt: jest.fn(),
            saveAttemptDraft: jest.fn(),
            submitAttempt: jest.fn(),
            getMyAttempt: jest.fn(),
            getMyResult: jest.fn(),
            getSubmissions: jest.fn(),
            getSubmission: jest.fn(),
            createAssessmentGate: jest.fn(),
            getAssessmentGateForLesson: jest.fn(),
            checkLessonAccess: jest.fn(),
          },
        },
        {
          provide: GradingService,
          useValue: {
            autoGradeAttempt: jest.fn(),
            gradeEssayAnswers: jest.fn(),
          },
        },
        {
          provide: ReportingService,
          useValue: {
            getAssessmentReport: jest.fn(),
            getCourseAssessmentsReport: jest.fn(),
            getAttendanceReport: jest.fn(),
          },
        },
      ],
      imports: [
        JwtModule.register({
          secret: 'test-secret',
        }),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AssessmentController>(AssessmentController);
    service = module.get<AssessmentService>(AssessmentService);
    gradingService = module.get<GradingService>(GradingService);
    reportingService = module.get<ReportingService>(ReportingService);
  });

  describe('health', () => {
    it('should return status ok', () => {
      expect(controller.health()).toEqual({ status: 'ok', service: 'assessment-service' });
    });
  });

  describe('createQuestionBank', () => {
    it('should create a question bank', async () => {
      const dto = {
        name: 'Math Questions',
        scopeType: QuestionBankScope.GLOBAL,
      };
      const result = { id: 'bank-uuid', ...dto };
      jest.spyOn(service, 'createQuestionBank').mockResolvedValue(result as any);

      expect(await controller.createQuestionBank(dto, mockUser)).toEqual(result);
      expect(service.createQuestionBank).toHaveBeenCalledWith(dto, mockUser.sub);
    });
  });

  describe('getQuestionBanks', () => {
    it('should return list of question banks', async () => {
      const result = [{ id: 'bank-1', name: 'Bank 1' }];
      jest.spyOn(service, 'getQuestionBanks').mockResolvedValue(result as any);

      expect(await controller.getQuestionBanks('grade-1', 'GLOBAL')).toEqual(result);
      expect(service.getQuestionBanks).toHaveBeenCalledWith({ gradeId: 'grade-1', scopeType: 'GLOBAL' });
    });
  });

  describe('getQuestionBank', () => {
    it('should return a question bank by id', async () => {
      const result = { id: 'bank-uuid', name: 'Bank 1' };
      jest.spyOn(service, 'getQuestionBank').mockResolvedValue(result as any);

      expect(await controller.getQuestionBank('bank-uuid')).toEqual(result);
      expect(service.getQuestionBank).toHaveBeenCalledWith('bank-uuid');
    });
  });

  describe('updateQuestionBank', () => {
    it('should update a question bank', async () => {
      const dto = { name: 'Updated Bank' };
      const result = { id: 'bank-uuid', ...dto };
      jest.spyOn(service, 'updateQuestionBank').mockResolvedValue(result as any);

      expect(await controller.updateQuestionBank('bank-uuid', dto)).toEqual(result);
      expect(service.updateQuestionBank).toHaveBeenCalledWith('bank-uuid', dto);
    });
  });

  describe('deleteQuestionBank', () => {
    it('should delete a question bank', async () => {
      const result = { id: 'bank-uuid' };
      jest.spyOn(service, 'deleteQuestionBank').mockResolvedValue(result as any);

      expect(await controller.deleteQuestionBank('bank-uuid')).toEqual(result);
      expect(service.deleteQuestionBank).toHaveBeenCalledWith('bank-uuid');
    });
  });

  describe('createQuestion', () => {
    it('should create a question', async () => {
      const dto = {
        bankId: 'bank-uuid',
        type: QuestionType.MULTIPLE_CHOICE,
        title: 'What is 2+2?',
        body: 'Basic math question',
        difficulty: Difficulty.EASY,
        defaultPoints: 10,
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
        ],
      };
      const result = { id: 'question-uuid', ...dto };
      jest.spyOn(service, 'createQuestion').mockResolvedValue(result as any);

      expect(await controller.createQuestion('bank-uuid', dto, mockUser)).toEqual(result);
      expect(service.createQuestion).toHaveBeenCalledWith(dto, mockUser.sub);
    });
  });

  describe('getQuestionsByBank', () => {
    it('should return questions by bank', async () => {
      const result = [{ id: 'q-1', title: 'Question 1' }];
      jest.spyOn(service, 'getQuestionsByBank').mockResolvedValue(result as any);

      expect(await controller.getQuestionsByBank('bank-uuid')).toEqual(result);
      expect(service.getQuestionsByBank).toHaveBeenCalledWith('bank-uuid');
    });
  });

  describe('getQuestion', () => {
    it('should return a question by id', async () => {
      const result = { id: 'q-uuid', title: 'Question 1' };
      jest.spyOn(service, 'getQuestion').mockResolvedValue(result as any);

      expect(await controller.getQuestion('q-uuid')).toEqual(result);
      expect(service.getQuestion).toHaveBeenCalledWith('q-uuid');
    });
  });

  describe('updateQuestion', () => {
    it('should update a question', async () => {
      const dto = { title: 'Updated Question' };
      const result = { id: 'q-uuid', ...dto };
      jest.spyOn(service, 'updateQuestion').mockResolvedValue(result as any);

      expect(await controller.updateQuestion('q-uuid', dto)).toEqual(result);
      expect(service.updateQuestion).toHaveBeenCalledWith('q-uuid', dto);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      const result = { id: 'q-uuid' };
      jest.spyOn(service, 'deleteQuestion').mockResolvedValue(result as any);

      expect(await controller.deleteQuestion('q-uuid')).toEqual(result);
      expect(service.deleteQuestion).toHaveBeenCalledWith('q-uuid');
    });
  });

  describe('createAssessment', () => {
    it('should create an assessment', async () => {
      const dto = {
        courseId: 'course-uuid',
        title: 'Midterm Exam',
        description: 'Midterm assessment',
        type: AssessmentType.QUIZ,
        availableFrom: new Date().toISOString(),
        availableTo: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
        answerReviewMode: AnswerReviewMode.IMMEDIATELY_AFTER_SUBMISSION,
      };
      const result = { id: 'assessment-uuid', ...dto };
      jest.spyOn(service, 'createAssessment').mockResolvedValue(result as any);

      expect(await controller.createAssessment(dto, mockUser)).toEqual(result);
      expect(service.createAssessment).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('getAssessments', () => {
    it('should return list of assessments', async () => {
      const result = [{ id: 'a-1', title: 'Assessment 1' }];
      jest.spyOn(service, 'getAssessments').mockResolvedValue(result as any);

      expect(await controller.getAssessments('course-1', 'QUIZ', 'true')).toEqual(result);
      expect(service.getAssessments).toHaveBeenCalledWith({ courseId: 'course-1', type: 'QUIZ', isPublished: 'true' });
    });
  });

  describe('getAssessment', () => {
    it('should return an assessment by id', async () => {
      const result = { id: 'a-uuid', title: 'Assessment 1' };
      jest.spyOn(service, 'getAssessment').mockResolvedValue(result as any);

      expect(await controller.getAssessment('a-uuid')).toEqual(result);
      expect(service.getAssessment).toHaveBeenCalledWith('a-uuid');
    });
  });

  describe('updateAssessment', () => {
    it('should update an assessment', async () => {
      const dto = { title: 'Updated Assessment' };
      const result = { id: 'a-uuid', ...dto };
      jest.spyOn(service, 'updateAssessment').mockResolvedValue(result as any);

      expect(await controller.updateAssessment('a-uuid', dto, mockUser)).toEqual(result);
      expect(service.updateAssessment).toHaveBeenCalledWith('a-uuid', dto, mockUser);
    });
  });

  describe('deleteAssessment', () => {
    it('should delete an assessment', async () => {
      const result = { id: 'a-uuid' };
      jest.spyOn(service, 'deleteAssessment').mockResolvedValue(result as any);

      expect(await controller.deleteAssessment('a-uuid', mockUser)).toEqual(result);
      expect(service.deleteAssessment).toHaveBeenCalledWith('a-uuid', mockUser);
    });
  });

  describe('addQuestionsToAssessment', () => {
    it('should add questions to assessment', async () => {
      const dto = {
        questionIds: ['q-1', 'q-2'],
      };
      const result = [{ id: 'aq-1' }, { id: 'aq-2' }];
      jest.spyOn(service, 'addQuestionsToAssessment').mockResolvedValue(result as any);

      expect(await controller.addQuestionsToAssessment('a-uuid', dto, mockUser)).toEqual(result);
      expect(service.addQuestionsToAssessment).toHaveBeenCalledWith('a-uuid', dto, mockUser);
    });
  });

  describe('removeQuestionFromAssessment', () => {
    it('should remove question from assessment', async () => {
      const result = { id: 'aq-uuid' };
      jest.spyOn(service, 'removeQuestionFromAssessment').mockResolvedValue(result as any);

      expect(await controller.removeQuestionFromAssessment('a-uuid', 'q-uuid', mockUser)).toEqual(result);
      expect(service.removeQuestionFromAssessment).toHaveBeenCalledWith('a-uuid', 'q-uuid', mockUser);
    });
  });

  describe('startAttempt', () => {
    it('should start an attempt', async () => {
      const result = {
        attemptId: 'attempt-uuid',
        assessmentId: 'a-uuid',
        status: AttemptStatus.STARTED,
        startedAt: new Date(),
      };
      jest.spyOn(service, 'startAttempt').mockResolvedValue(result as any);

      expect(await controller.startAttempt('a-uuid', mockStudent)).toEqual(result);
      expect(service.startAttempt).toHaveBeenCalledWith('a-uuid', mockStudent.sub);
    });
  });

  describe('getMyCurrentAttempt', () => {
    it('should return current attempt', async () => {
      const result = {
        attemptId: 'attempt-uuid',
        status: AttemptStatus.IN_PROGRESS,
      };
      jest.spyOn(service, 'getMyCurrentAttempt').mockResolvedValue(result as any);

      expect(await controller.getMyCurrentAttempt('a-uuid', mockStudent)).toEqual(result);
      expect(service.getMyCurrentAttempt).toHaveBeenCalledWith('a-uuid', mockStudent.sub);
    });
  });

  describe('saveAttemptDraft', () => {
    it('should save attempt draft', async () => {
      const dto = {
        answers: [
          {
            questionId: 'q-1',
            selectedOptionId: 'opt-1',
          },
        ],
      };
      const result = {
        message: 'Draft saved successfully',
        savedAnswers: dto.answers,
        remainingSeconds: 3000,
      };
      jest.spyOn(service, 'saveAttemptDraft').mockResolvedValue(result as any);

      expect(await controller.saveAttemptDraft('a-uuid', 'attempt-uuid', dto as any, mockStudent)).toEqual(result);
      expect(service.saveAttemptDraft).toHaveBeenCalledWith('a-uuid', { ...dto, attemptId: 'attempt-uuid' }, mockStudent.sub);
    });
  });

  describe('submitAttempt', () => {
    it('should submit an attempt', async () => {
      const result = {
        message: 'Assessment submitted successfully',
        attempt: { id: 'attempt-uuid', status: AttemptStatus.SUBMITTED },
      };
      jest.spyOn(service, 'submitAttempt').mockResolvedValue(result as any);

      expect(await controller.submitAttempt('a-uuid', mockStudent)).toEqual(result);
      expect(service.submitAttempt).toHaveBeenCalledWith('a-uuid', mockStudent.sub);
    });
  });

  describe('getMyAttempt', () => {
    it('should return my attempt', async () => {
      const result = { id: 'attempt-uuid', score: 85 };
      jest.spyOn(service, 'getMyAttempt').mockResolvedValue(result as any);

      expect(await controller.getMyAttempt('a-uuid', mockStudent)).toEqual(result);
      expect(service.getMyAttempt).toHaveBeenCalledWith('a-uuid', mockStudent.sub);
    });
  });

  describe('getMyResult', () => {
    it('should return my result', async () => {
      const result = {
        id: 'attempt-uuid',
        score: 85,
        maxScore: 100,
        percentage: 85,
        status: AttemptStatus.GRADED,
      };
      jest.spyOn(service, 'getMyResult').mockResolvedValue(result as any);

      expect(await controller.getMyResult('a-uuid', mockStudent)).toEqual(result);
      expect(service.getMyResult).toHaveBeenCalledWith('a-uuid', mockStudent.sub);
    });
  });

  describe('getSubmissions', () => {
    it('should return submissions', async () => {
      const result = [{ id: 'attempt-1', score: 90 }];
      jest.spyOn(service, 'getSubmissions').mockResolvedValue(result as any);

      expect(await controller.getSubmissions('a-uuid', mockUser, 'GRADED')).toEqual(result);
      expect(service.getSubmissions).toHaveBeenCalledWith('a-uuid', mockUser, { status: 'GRADED' });
    });
  });

  describe('getSubmission', () => {
    it('should return a submission', async () => {
      const result = { id: 'attempt-uuid', score: 90 };
      jest.spyOn(service, 'getSubmission').mockResolvedValue(result as any);

      expect(await controller.getSubmission('a-uuid', 'attempt-uuid', mockUser)).toEqual(result);
      expect(service.getSubmission).toHaveBeenCalledWith('a-uuid', 'attempt-uuid', mockUser);
    });
  });

  describe('gradeEssay', () => {
    it('should grade essay answers', async () => {
      const dto = {
        grades: [
          {
            questionId: 'q-1',
            awardedPoints: 8,
            feedback: 'Good work!',
          },
        ],
      };
      const result = {
        attemptId: 'attempt-uuid',
        score: 88,
        maxScore: 100,
      };
      jest.spyOn(gradingService, 'gradeEssayAnswers').mockResolvedValue(result as any);

      expect(await controller.gradeEssay('a-uuid', 'attempt-uuid', dto, mockUser)).toEqual(result);
      expect(gradingService.gradeEssayAnswers).toHaveBeenCalledWith('a-uuid', 'attempt-uuid', dto, mockUser.sub);
    });
  });

  describe('createAssessmentGate', () => {
    it('should create assessment gate', async () => {
      const dto = {
        assessmentId: 'a-uuid',
        targetLessonId: 'lesson-uuid',
        minimumPassPercentage: 70,
      };
      const result = { id: 'gate-uuid', ...dto };
      jest.spyOn(service, 'createAssessmentGate').mockResolvedValue(result as any);

      expect(await controller.createAssessmentGate(dto, mockUser)).toEqual(result);
      expect(service.createAssessmentGate).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('getAssessmentGateForLesson', () => {
    it('should return assessment gate for lesson', async () => {
      const result = { id: 'gate-uuid', targetLessonId: 'lesson-uuid' };
      jest.spyOn(service, 'getAssessmentGateForLesson').mockResolvedValue(result as any);

      expect(await controller.getAssessmentGateForLesson('lesson-uuid')).toEqual(result);
      expect(service.getAssessmentGateForLesson).toHaveBeenCalledWith('lesson-uuid');
    });
  });

  describe('checkLessonAccess', () => {
    it('should check lesson access for current user', async () => {
      const result = { locked: false, message: 'Lesson unlocked' };
      jest.spyOn(service, 'checkLessonAccess').mockResolvedValue(result as any);

      expect(await controller.checkLessonAccess('lesson-uuid', undefined, mockStudent)).toEqual(result);
      expect(service.checkLessonAccess).toHaveBeenCalledWith('lesson-uuid', mockStudent.sub);
    });

    it('should check lesson access for specified student', async () => {
      const result = { locked: true, message: 'Assessment not completed' };
      jest.spyOn(service, 'checkLessonAccess').mockResolvedValue(result as any);

      expect(await controller.checkLessonAccess('lesson-uuid', 'other-student', mockUser)).toEqual(result);
      expect(service.checkLessonAccess).toHaveBeenCalledWith('lesson-uuid', 'other-student');
    });
  });

  describe('getAssessmentReport', () => {
    it('should return assessment report', async () => {
      const result = { assessmentId: 'a-uuid', totalAttempts: 10 };
      jest.spyOn(reportingService, 'getAssessmentReport').mockResolvedValue(result as any);

      expect(await controller.getAssessmentReport('a-uuid', mockUser)).toEqual(result);
      expect(reportingService.getAssessmentReport).toHaveBeenCalledWith('a-uuid', mockUser);
    });
  });

  describe('getCourseAssessmentsReport', () => {
    it('should return course assessments report', async () => {
      const result = { courseId: 'course-uuid', assessments: [] };
      jest.spyOn(reportingService, 'getCourseAssessmentsReport').mockResolvedValue(result as any);

      expect(await controller.getCourseAssessmentsReport('course-uuid', mockUser)).toEqual(result);
      expect(reportingService.getCourseAssessmentsReport).toHaveBeenCalledWith('course-uuid', mockUser);
    });
  });

  describe('getAttendanceReport', () => {
    it('should return course attendance report', async () => {
      const result = { courseId: 'course-uuid', attendance: [] };
      jest.spyOn(reportingService, 'getAttendanceReport').mockResolvedValue(result as any);

      expect(await controller.getAttendanceReport('course-uuid', mockUser)).toEqual(result);
      expect(reportingService.getAttendanceReport).toHaveBeenCalledWith('course-uuid', mockUser);
    });
  });
});
