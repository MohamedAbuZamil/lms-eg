'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MOCK_ASSIGNMENTS, MOCK_QUESTIONS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { ChevronRight, CalendarDays, Clock, Send, CheckCircle2, FileText } from 'lucide-react';

export default function StudentAssignmentPage() {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const assignment = MOCK_ASSIGNMENTS.find((a) => a.id === assignmentId);
  const questions  = MOCK_QUESTIONS.filter((q) => q.assessmentId === assignmentId);

  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!assignment) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">الواجب غير موجود</p>
      <Link href={`/student/courses/${courseId}`} className="px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm">رجوع</Link>
    </div>
  );

  if (submitted) return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in-up text-center">
      <div className="bg-lms-gradient rounded-3xl p-10 text-white shadow-2xl">
        <CheckCircle2 size={52} className="mx-auto mb-4" />
        <p className="text-2xl font-black mb-1">تم التسليم!</p>
        <p className="text-lms-200 text-sm">تم إرسال الواجب بنجاح. سينظر فيه المدرس قريباً.</p>
      </div>
      <Link href={`/student/courses/${courseId}`}
        className="block w-full py-3 rounded-2xl border border-lms-200 bg-lms-50 text-lms-700 font-semibold text-sm hover:bg-lms-100 transition-colors">
        العودة للكورس
      </Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in-up">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/student/courses/${courseId}`} className="hover:text-lms-600">الكورس</Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium truncate max-w-[200px]">{assignment.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-3xl border border-lms-100 shadow-elevated overflow-hidden">
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-amber-100" />
            <span className="text-amber-100 text-xs font-medium">واجب</span>
          </div>
          <h1 className="text-white font-bold text-base">{assignment.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-amber-100 text-xs flex-wrap">
            <span className="flex items-center gap-1"><CalendarDays size={11} />من {formatDate(assignment.availableFrom)}</span>
            <span className="flex items-center gap-1"><Clock size={11} />حتى {formatDate(assignment.availableTo)}</span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {questions.length > 0 ? (
            questions.map((q, i) => (
              <div key={q.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{q.text}</p>
                </div>
                <textarea
                  rows={4}
                  placeholder="اكتب إجابتك هنا..."
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                  className="w-full mr-10 resize-none rounded-2xl border border-lms-200 bg-lms-50/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lms-500/30 focus:border-lms-500 transition-all placeholder:text-muted-foreground"
                  style={{ width: 'calc(100% - 2.5rem)', marginRight: '2.5rem' }}
                />
                {i < questions.length - 1 && <hr className="border-lms-100 my-2" />}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-8 gap-3 text-muted-foreground">
              <FileText size={32} className="text-amber-300" />
              <p className="text-sm">لا توجد أسئلة مكتوبة لهذا الواجب</p>
              <p className="text-xs">قد يكون الواجب ملف مرفق — راجع المدرس</p>
            </div>
          )}

          {questions.length > 0 && (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < questions.length || Object.values(answers).some((v) => !v.trim())}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold text-sm hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={15} />تسليم الواجب
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
