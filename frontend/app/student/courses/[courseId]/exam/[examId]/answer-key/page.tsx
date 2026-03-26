'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MOCK_ASSESSMENTS, MOCK_QUESTIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ChevronRight, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

export default function AnswerKeyPage() {
  const { courseId, examId } = useParams<{ courseId: string; examId: string }>();
  const exam      = MOCK_ASSESSMENTS.find((a) => a.id === examId);
  const questions = MOCK_QUESTIONS.filter((q) => q.assessmentId === examId);

  if (!exam) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">الامتحان غير موجود</p>
      <Link href={`/student/courses/${courseId}`} className="px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm">رجوع</Link>
    </div>
  );

  if (exam.answerReviewMode === 'NEVER') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <XCircle size={40} className="text-muted-foreground" />
      <div>
        <p className="font-semibold text-foreground">نموذج الإجابة غير متاح</p>
        <p className="text-sm text-muted-foreground mt-1">لم يسمح المدرس بعرض نموذج الإجابة</p>
      </div>
      <Link href={`/student/courses/${courseId}`} className="px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm font-medium hover:bg-lms-100 transition-colors">
        العودة للكورس
      </Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in-up">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/student/courses/${courseId}`} className="hover:text-lms-600">الكورس</Link>
        <ChevronRight size={13} />
        <Link href={`/student/courses/${courseId}/exam/${examId}`} className="hover:text-lms-600 truncate max-w-[160px]">{exam.title}</Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium">نموذج الإجابة</span>
      </nav>

      <div className="bg-lms-gradient rounded-2xl p-5 text-white">
        <h1 className="font-bold text-base">{exam.title}</h1>
        <p className="text-lms-200 text-sm mt-1">نموذج الإجابة — {questions.length} سؤال</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-2xl border border-lms-100 p-5 space-y-3 shadow-soft-sm">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-lms-gradient text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <p className="text-sm font-semibold text-foreground leading-relaxed">{q.text}</p>
            </div>
            <div className="space-y-2 mr-10">
              {q.options.map((opt) => {
                const correct = opt.id === q.correctOptionId;
                return (
                  <div key={opt.id} className={cn('flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border',
                    correct ? 'border-emerald-300 bg-emerald-50' : 'border-lms-100 bg-gray-50/50')}>
                    {correct
                      ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      : <XCircle size={15} className="text-gray-300 shrink-0" />}
                    <span className={cn('text-sm', correct ? 'font-semibold text-emerald-700' : 'text-muted-foreground')}>{opt.text}</span>
                  </div>
                );
              })}
            </div>
            {q.explanation && (
              <div className="mr-10 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Link href={`/student/courses/${courseId}`}
        className="block w-full py-3 rounded-2xl border border-lms-200 bg-lms-50 text-lms-700 font-semibold text-sm text-center hover:bg-lms-100 transition-colors">
        العودة للكورس
      </Link>
    </div>
  );
}
