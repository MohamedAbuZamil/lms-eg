import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { QuestionType, AttemptStatus } from '@prisma/client';
import { GradeEssayDto } from './dto/grade-essay.dto';

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async autoGradeAttempt(attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt not found: ${attemptId}`);
    }

    let totalScore = 0;
    let maxScore = 0;
    let hasUngradedEssays = false;

    for (const assessmentQuestion of attempt.assessment.questions) {
      const question = assessmentQuestion.question;
      const answer = attempt.answers.find(a => a.questionId === question.id);
      const points = assessmentQuestion.pointsOverride || question.defaultPoints;
      maxScore += points;

      if (!answer) {
        // No answer provided - 0 points
        continue;
      }

      // Auto-grade based on question type
      if (question.type === QuestionType.MULTIPLE_CHOICE) {
        const correctOption = question.options.find(o => o.isCorrect);
        const isCorrect = correctOption && answer.selectedOptionId === correctOption.id;
        
        await this.prisma.attemptAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            awardedPoints: isCorrect ? points : 0,
          },
        });

        if (isCorrect) totalScore += points;
      } 
      else if (question.type === QuestionType.TRUE_FALSE) {
        // For TRUE_FALSE, we need to know the correct answer
        // This should be stored in the question or we need to check a correct answer reference
        // For now, we'll mark it as ungraded and let manual grading handle it
        // Or we can assume the first option's correctness
        
        // Since TRUE_FALSE doesn't have options like MCQ, we need a different approach
        // We'll mark it as needing manual review or use a stored correct answer
        const isCorrect = this.evaluateTrueFalseAnswer(question, answer.booleanAnswer);
        
        await this.prisma.attemptAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            awardedPoints: isCorrect ? points : 0,
          },
        });

        if (isCorrect) totalScore += points;
      } 
      else if (question.type === QuestionType.ESSAY) {
        // Essay answers are not auto-graded
        hasUngradedEssays = true;
      }
    }

    // Calculate percentage and pass status
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = percentage >= attempt.assessment.passPercentage;

    // Update attempt with grading results
    const status = hasUngradedEssays 
      ? AttemptStatus.PARTIALLY_GRADED 
      : AttemptStatus.GRADED;

    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        maxScore,
        percentage,
        isPassed,
        status,
      },
    });

    return {
      attemptId,
      score: totalScore,
      maxScore,
      percentage,
      isPassed,
      status,
    };
  }

  async gradeEssayAnswers(
    assessmentId: string,
    attemptId: string,
    dto: GradeEssayDto,
    graderId: string
  ) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, assessmentId },
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
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    let essayScoreDelta = 0;

    for (const grade of dto.grades) {
      const assessmentQuestion = attempt.assessment.questions.find(
        q => q.questionId === grade.questionId
      );

      if (!assessmentQuestion) {
        this.logger.warn(`Question ${grade.questionId} not found in assessment`);
        continue;
      }

      const answer = attempt.answers.find(a => a.questionId === grade.questionId);
      if (!answer) {
        this.logger.warn(`Answer for question ${grade.questionId} not found`);
        continue;
      }

      const maxPoints = assessmentQuestion.pointsOverride || 
                       assessmentQuestion.question?.defaultPoints || 0;
      
      // Validate points don't exceed max
      const awardedPoints = Math.min(grade.awardedPoints, maxPoints);

      await this.prisma.attemptAnswer.update({
        where: { id: answer.id },
        data: {
          awardedPoints,
          isCorrect: awardedPoints === maxPoints, // Full points = correct
          gradedByUserId: graderId,
          gradedAt: new Date(),
          feedback: grade.feedback,
        },
      });

      // Calculate delta for essay score
      essayScoreDelta += awardedPoints - (answer.awardedPoints || 0);
    }

    // Recalculate total score
    const allAnswers = await this.prisma.attemptAnswer.findMany({
      where: { attemptId },
    });

    const totalScore = allAnswers.reduce((sum, a) => sum + (a.awardedPoints || 0), 0);
    const maxScore = attempt.maxScore || attempt.assessment.totalPoints;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const isPassed = percentage >= attempt.assessment.passPercentage;

    // Check if all essays are graded
    const ungradedEssays = allAnswers.filter(a => 
      a.awardedPoints === null && 
      attempt.assessment.questions.some(q => 
        q.questionId === a.questionId && 
        q.question?.type === QuestionType.ESSAY
      )
    );

    const status = ungradedEssays.length === 0 
      ? AttemptStatus.GRADED 
      : AttemptStatus.PARTIALLY_GRADED;

    await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        percentage,
        isPassed,
        status,
      },
    });

    return {
      attemptId,
      score: totalScore,
      maxScore,
      percentage,
      isPassed,
      status,
      gradedEssays: dto.grades.length,
    };
  }

  private evaluateTrueFalseAnswer(question: any, booleanAnswer: boolean | null): boolean {
    // For TRUE_FALSE questions, we need to store the correct answer
    // This could be done by storing it in the question metadata or having a correctAnswer field
    // For now, we'll return false to indicate manual grading is needed
    // In a real implementation, you should add a correctAnswer field to the Question model
    
    // TODO: Implement TRUE_FALSE answer evaluation
    // This requires storing the correct boolean answer in the Question model
    return false;
  }

  async recalculateGrades(assessmentId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { assessmentId },
    });

    for (const attempt of attempts) {
      await this.autoGradeAttempt(attempt.id);
    }

    return {
      recalculatedAttempts: attempts.length,
    };
  }
}
