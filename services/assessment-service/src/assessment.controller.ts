import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { GradingService } from './grading.service';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles, Role } from './auth/decorators/roles.decorator';
import { CurrentUser, CurrentUser as User } from './auth/decorators/current-user.decorator';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GradeEssayDto } from './dto/grade-essay.dto';
import { CreateAssessmentGateDto } from './dto/create-assessment-gate.dto';
import { SaveAttemptDraftDto } from './dto/save-attempt-draft.dto';

@Controller()
export class AssessmentController {
  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly gradingService: GradingService,
    private readonly reportingService: ReportingService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'assessment-service' };
  }

  // ==================== QUESTION BANKS ====================
  @Post('question-banks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  createQuestionBank(@Body() dto: CreateQuestionBankDto, @CurrentUser() user: User) {
    return this.assessmentService.createQuestionBank(dto, user.sub);
  }

  @Get('question-banks')
  @UseGuards(JwtAuthGuard)
  getQuestionBanks(@Query('gradeId') gradeId?: string, @Query('scopeType') scopeType?: string) {
    return this.assessmentService.getQuestionBanks({ gradeId, scopeType });
  }

  @Get('question-banks/:id')
  @UseGuards(JwtAuthGuard)
  getQuestionBank(@Param('id') id: string) {
    return this.assessmentService.getQuestionBank(id);
  }

  @Patch('question-banks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  updateQuestionBank(@Param('id') id: string, @Body() dto: Partial<CreateQuestionBankDto>) {
    return this.assessmentService.updateQuestionBank(id, dto);
  }

  @Delete('question-banks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  deleteQuestionBank(@Param('id') id: string) {
    return this.assessmentService.deleteQuestionBank(id);
  }

  // ==================== QUESTIONS ====================
  @Post('question-banks/:bankId/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  createQuestion(
    @Param('bankId') bankId: string, 
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: User
  ) {
    return this.assessmentService.createQuestion({ ...dto, bankId }, user.sub);
  }

  @Get('question-banks/:bankId/questions')
  @UseGuards(JwtAuthGuard)
  getQuestionsByBank(@Param('bankId') bankId: string) {
    return this.assessmentService.getQuestionsByBank(bankId);
  }

  @Get('questions/:id')
  @UseGuards(JwtAuthGuard)
  getQuestion(@Param('id') id: string) {
    return this.assessmentService.getQuestion(id);
  }

  @Patch('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  updateQuestion(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>) {
    return this.assessmentService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  deleteQuestion(@Param('id') id: string) {
    return this.assessmentService.deleteQuestion(id);
  }

  // ==================== ASSESSMENTS ====================
  @Post('assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  createAssessment(@Body() dto: CreateAssessmentDto, @CurrentUser() user: User) {
    return this.assessmentService.createAssessment(dto, user);
  }

  @Get('assessments')
  @UseGuards(JwtAuthGuard)
  getAssessments(
    @Query('courseId') courseId?: string,
    @Query('type') type?: string,
    @Query('isPublished') isPublished?: string
  ) {
    return this.assessmentService.getAssessments({ courseId, type, isPublished });
  }

  @Get('assessments/:id')
  @UseGuards(JwtAuthGuard)
  getAssessment(@Param('id') id: string) {
    return this.assessmentService.getAssessment(id);
  }

  @Patch('assessments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  updateAssessment(@Param('id') id: string, @Body() dto: Partial<CreateAssessmentDto>, @CurrentUser() user: User) {
    return this.assessmentService.updateAssessment(id, dto, user);
  }

  @Delete('assessments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  deleteAssessment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assessmentService.deleteAssessment(id, user);
  }

  @Post('assessments/:id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  addQuestionsToAssessment(@Param('id') id: string, @Body() dto: AddQuestionsDto, @CurrentUser() user: User) {
    return this.assessmentService.addQuestionsToAssessment(id, dto, user);
  }

  @Delete('assessments/:assessmentId/questions/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  removeQuestionFromAssessment(
    @Param('assessmentId') assessmentId: string, 
    @Param('questionId') questionId: string,
    @CurrentUser() user: User
  ) {
    return this.assessmentService.removeQuestionFromAssessment(assessmentId, questionId, user);
  }

  // ==================== STUDENT ATTEMPTS WITH TIMED SUPPORT ====================
  @Post('assessments/:id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async startAttempt(@Param('id') assessmentId: string, @CurrentUser() user: User) {
    return this.assessmentService.startAttempt(assessmentId, user.sub);
  }

  @Get('assessments/:id/my-attempt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getMyCurrentAttempt(@Param('id') assessmentId: string, @CurrentUser() user: User) {
    return this.assessmentService.getMyCurrentAttempt(assessmentId, user.sub);
  }

  @Patch('assessments/:id/attempts/:attemptId/save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async saveAttemptDraft(
    @Param('id') assessmentId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SaveAttemptDraftDto,
    @CurrentUser() user: User
  ) {
    // Ensure attemptId in body matches path parameter
    const saveDto = { ...dto, attemptId };
    return this.assessmentService.saveAttemptDraft(assessmentId, saveDto, user.sub);
  }

  @Post('assessments/:id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async submitAttempt(@Param('id') assessmentId: string, @CurrentUser() user: User) {
    return this.assessmentService.submitAttempt(assessmentId, user.sub);
  }

  @Get('assessments/:id/my-attempt')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  getMyAttempt(@Param('id') assessmentId: string, @CurrentUser() user: User) {
    return this.assessmentService.getMyAttempt(assessmentId, user.sub);
  }

  @Get('assessments/:id/my-result')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  getMyResult(@Param('id') assessmentId: string, @CurrentUser() user: User) {
    return this.assessmentService.getMyResult(assessmentId, user.sub);
  }

  // ==================== TEACHER GRADING ====================
  @Get('assessments/:id/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  getSubmissions(
    @Param('id') assessmentId: string,
    @CurrentUser() user: User,
    @Query('status') status?: string
  ) {
    return this.assessmentService.getSubmissions(assessmentId, user, { status });
  }

  @Get('assessments/:id/submissions/:attemptId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  getSubmission(
    @Param('id') assessmentId: string,
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: User
  ) {
    return this.assessmentService.getSubmission(assessmentId, attemptId, user);
  }

  @Post('assessments/:id/submissions/:attemptId/grade-essay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  gradeEssay(
    @Param('id') assessmentId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: GradeEssayDto,
    @CurrentUser() user: User
  ) {
    return this.gradingService.gradeEssayAnswers(assessmentId, attemptId, dto, user.sub);
  }

  // ==================== REPORTS ====================
  @Get('assessments/:id/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  getAssessmentReport(@Param('id') assessmentId: string, @CurrentUser() user: User) {
    return this.reportingService.getAssessmentReport(assessmentId, user);
  }

  @Get('courses/:courseId/assessments/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  getCourseAssessmentsReport(@Param('courseId') courseId: string, @CurrentUser() user: User) {
    return this.reportingService.getCourseAssessmentsReport(courseId, user);
  }

  @Get('courses/:courseId/assessments/attendance-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  getAttendanceReport(@Param('courseId') courseId: string, @CurrentUser() user: User) {
    return this.reportingService.getAttendanceReport(courseId, user);
  }

  // ==================== CONTENT GATES ====================
  @Post('assessment-gates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.ASSISTANT)
  createAssessmentGate(@Body() dto: CreateAssessmentGateDto, @CurrentUser() user: User) {
    return this.assessmentService.createAssessmentGate(dto, user);
  }

  @Get('assessment-gates/:lessonId')
  @UseGuards(JwtAuthGuard)
  getAssessmentGateForLesson(@Param('lessonId') lessonId: string) {
    return this.assessmentService.getAssessmentGateForLesson(lessonId);
  }

  @Get('assessment-gates/:lessonId/check')
  @UseGuards(JwtAuthGuard)
  checkLessonAccess(
    @Param('lessonId') lessonId: string,
    @Query('studentId') studentId: string,
    @CurrentUser() user: User
  ) {
    const targetStudentId = studentId || user.sub;
    return this.assessmentService.checkLessonAccess(lessonId, targetStudentId);
  }
}
