'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MOCK_ASSESSMENTS, MOCK_QUESTIONS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ChevronRight, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight as ChevronNext, Send } from 'lucide-react';

export default function StudentExamPage() {
  const { courseId, examId } = useParams<{ courseId: string; examId: string }>();
  const router = useRouter();

  const exam      = MOCK_ASSESSMENTS.find((a) => a.id === examId);
  const questions = MOCK_QUESTIONS.filter((q) => q.assessmentId === examId);

  const totalSeconds = (exam?.durationMinutes ?? 30) * 60;
  const [timeLeft,  setTimeLeft]  = useState(totalSeconds);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [current,   setCurrent]   = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [started,   setStarted]   = useState(false);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
  }, []);

  useEffect(() => {
    if (!started || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [started, submitted, timeLeft, handleSubmit]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const answered = Object.keys(answers).length;
  const isLowTime = timeLeft < 120;

  if (!exam) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">الامتحان غير موجود</p>
      <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm">رجوع</button>
    </div>
  );

  /* ── Score screen ── */
  if (submitted) {
    const correct = questions.filter((q) => answers[q.id] === q.correctOptionId).length;
    const pct     = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const passed  = pct >= exam.passPercentage;
    return (
      <div className="max-w-md mx-auto space-y-6 animate-fade-in-up">
        <div className={cn('rounded-3xl p-8 text-center text-white shadow-2xl', passed ? 'bg-lms-gradient' : 'bg-gradient-to-br from-red-500 to-red-700')}>
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mx-auto mb-4">
            {passed ? <CheckCircle2 size={38} /> : <AlertCircle size={38} />}
          </div>
          <p className="text-5xl font-black mb-1">{pct}%</p>
          <p className="text-lg font-bold opacity-90">{passed ? 'مبروك! نجحت في الامتحان' : 'للأسف لم تنجح'}</p>
          <p className="text-sm opacity-75 mt-1">{correct} / {questions.length} إجابة صحيحة</p>
          <p className="text-xs opacity-60 mt-0.5">درجة النجاح {exam.passPercentage}%</p>
        </div>
        <div className="flex gap-3">
          {exam.answerReviewMode !== 'NEVER' && (
            <Link href={`/student/courses/${courseId}/exam/${examId}/answer-key`}
              className="flex-1 py-3 rounded-2xl bg-lms-gradient text-white font-bold text-sm text-center hover:shadow-glow-purple transition-shadow">
              نموذج الإجابة
            </Link>
          )}
          <Link href={`/student/courses/${courseId}`}
            className="flex-1 py-3 rounded-2xl border border-lms-200 bg-lms-50 text-lms-700 font-semibold text-sm text-center hover:bg-lms-100 transition-colors">
            العودة للكورس
          </Link>
        </div>
      </div>
    );
  }

  /* ── Start screen ── */
  if (!started) return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in-up">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/student/courses/${courseId}`} className="hover:text-lms-600">الكورس</Link>
        <ChevronRight size={13} /><span className="text-foreground font-medium">{exam.title}</span>
      </nav>
      <div className="bg-white rounded-3xl border border-lms-100 shadow-elevated overflow-hidden">
        <div className="bg-lms-gradient px-6 py-6 text-center">
          <p className="text-white/70 text-xs mb-1">{exam.type === 'EXAM' ? 'امتحان' : 'كويز'}</p>
          <h1 className="text-white font-bold text-base">{exam.title}</h1>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'عدد الأسئلة', value: `${questions.length} سؤال` },
            { label: 'المدة',        value: `${exam.durationMinutes} دقيقة` },
            { label: 'درجة النجاح', value: `${exam.passPercentage}%` },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-lms-50">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className="text-sm font-bold text-foreground">{r.value}</span>
            </div>
          ))}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">بمجرد البدء سيبدأ العد التنازلي ولا يمكن إيقافه. تأكد من جاهزيتك قبل البدء.</p>
          </div>
          <button onClick={() => setStarted(true)}
            className="w-full py-3.5 rounded-2xl bg-lms-gradient text-white font-bold text-sm hover:shadow-glow-purple transition-shadow">
            ابدأ الامتحان
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Exam screen ── */
  const q = questions[current];
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-lms-100 px-5 py-3 shadow-soft-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{answered}/{questions.length} تم الإجابة</span>
        </div>
        <div className={cn('flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-sm', isLowTime ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-lms-50 text-lms-700')}>
          <Clock size={15} />{mm}:{ss}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-lms-100 rounded-full overflow-hidden">
        <div className="h-full bg-lms-gradient rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-3xl border border-lms-100 shadow-elevated p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-lms-gradient text-white text-sm font-bold flex items-center justify-center shrink-0">{current + 1}</span>
          <p className="text-base font-semibold text-foreground leading-relaxed">{q.text}</p>
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.id;
            return (
              <button key={opt.id} onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.id }))}
                className={cn('w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-right transition-all',
                  selected ? 'border-lms-500 bg-lms-50 text-lms-700' : 'border-lms-100 hover:border-lms-300 hover:bg-lms-50/50')}>
                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  selected ? 'border-lms-500 bg-lms-500' : 'border-gray-300')}>
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm font-medium disabled:opacity-40 hover:bg-lms-100 transition-colors">
            <ChevronNext size={15} />السابق
          </button>

          {/* Question dots */}
          <div className="flex gap-1.5 flex-wrap justify-center max-w-[200px]">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={cn('w-7 h-7 rounded-full text-xs font-bold transition-all',
                  i === current ? 'bg-lms-gradient text-white shadow-soft-sm' :
                  answers[questions[i].id] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                {i + 1}
              </button>
            ))}
          </div>

          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent((p) => p + 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm font-medium hover:bg-lms-100 transition-colors">
              التالي<ChevronLeft size={15} />
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lms-gradient text-white text-sm font-bold hover:shadow-glow-purple transition-shadow">
              <Send size={14} />تسليم
            </button>
          )}
        </div>
      </div>

      {/* Answered summary */}
      <p className="text-center text-xs text-muted-foreground">
        أجبت على {answered} من {questions.length} سؤال
        {answered < questions.length && <span className="text-amber-500 mr-1">— {questions.length - answered} لم تُجب عليها</span>}
      </p>
    </div>
  );
}
