'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MOCK_COURSES, MOCK_SECTIONS, MOCK_ASSESSMENTS, MOCK_ASSIGNMENTS, MOCK_LESSON_VIEWS } from '@/lib/mock-data';
import { cn, formatDate } from '@/lib/utils';
import { ChevronRight, Lock, Play, Eye, CalendarDays, Clock, CheckCircle2, ChevronDown, ChevronUp, FileText, ClipboardList, AlertCircle } from 'lucide-react';

type Tab = 'videos' | 'exams' | 'assignments';

export default function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>('videos');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['s1']));
  const [alert, setAlert]     = useState(false);

  const course      = MOCK_COURSES.find((c) => c.id === courseId);
  const sections    = MOCK_SECTIONS.filter((s) => s.courseId === courseId);
  const exams       = MOCK_ASSESSMENTS.filter((a) => a.courseId === courseId && a.type !== 'ASSIGNMENT');
  const assignments = MOCK_ASSIGNMENTS.filter((a) => a.courseId === courseId);

  if (!course) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">الكورس غير موجود</p>
      <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm font-medium">رجوع</button>
    </div>
  );

  const toggle = (id: string) => setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const onLesson = (id: string) => { const v = MOCK_LESSON_VIEWS[id]; if (v && v.watched >= v.max) { setAlert(true); setTimeout(() => setAlert(false), 3000); } };

  const TABS = [
    { key: 'videos' as Tab,      label: 'الفيديوهات',  count: sections.reduce((s, x) => s + x.lessons.length, 0) },
    { key: 'exams' as Tab,       label: 'الامتحانات',  count: exams.length },
    { key: 'assignments' as Tab, label: 'الواجبات',    count: assignments.length },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up max-w-3xl mx-auto">
      {alert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-destructive text-white shadow-elevated">
          <AlertCircle size={17} /><span className="font-semibold text-sm">تم استهلاك جميع المشاهدات</span>
          <button onClick={() => setAlert(false)} className="mr-2 opacity-70 hover:opacity-100 text-lg leading-none">✕</button>
        </div>
      )}

      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student/courses" className="hover:text-lms-600 transition-colors">كورساتي</Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium line-clamp-1 max-w-xs">{course.title}</span>
      </nav>

      <div className="bg-white rounded-3xl border border-lms-100 shadow-elevated overflow-hidden">
        {/* Banner */}
        <div className="bg-lms-gradient px-6 py-5">
          <h1 className="text-white font-bold text-base leading-snug">{course.title}</h1>
          <div className="flex items-center gap-1.5 mt-2 text-lms-200 text-xs">
            <CalendarDays size={13} /><span>{formatDate(course.createdAt)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-lms-100">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex-1 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px',
                tab === t.key ? 'border-lms-600 text-lms-700' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t.label}
              <span className={cn('mr-1 text-xs px-1.5 py-0.5 rounded-full', tab === t.key ? 'bg-lms-100 text-lms-700' : 'bg-gray-100 text-gray-500')}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {/* Videos */}
          {tab === 'videos' && sections.map((sec) => {
            const open = expanded.has(sec.id);
            return (
              <div key={sec.id} className="rounded-2xl border border-lms-100 overflow-hidden">
                <button onClick={() => toggle(sec.id)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-lms-50 transition-colors">
                  <span className="font-bold text-lms-700 text-sm">{sec.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-lms-50 border border-lms-100 px-2 py-0.5 rounded-full">{sec.lessons.length} فيديو</span>
                    {open ? <ChevronUp size={15} className="text-lms-500" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                  </div>
                </button>
                {open && (
                  <div className="divide-y divide-lms-50/60">
                    {sec.lessons.map((lesson) => {
                      const v = MOCK_LESSON_VIEWS[lesson.id];
                      const exhausted = v && v.watched >= v.max;
                      return (
                        <button key={lesson.id} onClick={() => onLesson(lesson.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-lms-50/50 transition-colors text-right group">
                          <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                            exhausted ? 'bg-red-50 text-red-400' : 'bg-lms-100 text-lms-600 group-hover:bg-lms-600 group-hover:text-white')}>
                            <Play size={13} />
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className={cn('text-sm font-medium', exhausted && 'line-through text-muted-foreground')}>{lesson.title}</p>
                            {v && (
                              <p className={cn('text-xs mt-0.5 flex items-center gap-1', exhausted ? 'text-red-400' : 'text-muted-foreground')}>
                                <Eye size={10} />
                                {exhausted ? `استهلكت (${v.max}/${v.max})` : `مشاهداتك: ${v.watched}/${v.max}`}
                              </p>
                            )}
                          </div>
                          <Lock size={13} className={cn('shrink-0', exhausted ? 'text-red-300' : 'text-gray-300')} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Exams */}
          {tab === 'exams' && exams.map((exam) => (
            <div key={exam.id} className="rounded-2xl border border-lms-100 hover:border-lms-200 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', exam.isPublished ? 'bg-lms-gradient' : 'bg-gray-100')}>
                  <ClipboardList size={19} className={exam.isPublished ? 'text-white' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{exam.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(exam.availableFrom)}</span>
                    {exam.durationMinutes && <span className="flex items-center gap-1"><Clock size={10} />{exam.durationMinutes} دقيقة</span>}
                    <span className="flex items-center gap-1"><CheckCircle2 size={10} />نجاح {exam.passPercentage}%</span>
                  </div>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', exam.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500')}>
                  {exam.isPublished ? 'متاح' : 'غير متاح'}
                </span>
              </div>
              {exam.isPublished && (
                <div className="flex border-t border-lms-50 divide-x divide-x-reverse divide-lms-50">
                  <Link href={`/student/courses/${courseId}/exam/${exam.id}`}
                    className="flex-1 py-2.5 text-center text-xs font-semibold text-lms-700 hover:bg-lms-50 transition-colors">
                    ابدأ الامتحان
                  </Link>
                  {exam.answerReviewMode !== 'NEVER' && (
                    <Link href={`/student/courses/${courseId}/exam/${exam.id}/answer-key`}
                      className="flex-1 py-2.5 text-center text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
                      نموذج الإجابة
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Assignments */}
          {tab === 'assignments' && assignments.map((w) => (
            <div key={w.id} className="rounded-2xl border border-lms-100 hover:border-amber-200 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <FileText size={19} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{w.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(w.availableFrom)}</span>
                    <span className="flex items-center gap-1"><Clock size={10} />ينتهي {formatDate(w.availableTo)}</span>
                  </div>
                </div>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium shrink-0', w.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500')}>
                  {w.isPublished ? 'متاح' : 'مسودة'}
                </span>
              </div>
              {w.isPublished && (
                <div className="border-t border-amber-50">
                  <Link href={`/student/courses/${courseId}/assignment/${w.id}`}
                    className="block w-full py-2.5 text-center text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
                    حل الواجب وتسليمه
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
