'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MOCK_COURSES, MOCK_SECTIONS, MOCK_ASSESSMENTS, MOCK_ASSIGNMENTS } from '@/lib/mock-data';
import { cn, formatDate } from '@/lib/utils';
import { ChevronRight, CalendarDays, Clock, CheckCircle2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Play, FileText, ClipboardList, BookOpen, Users, Eye } from 'lucide-react';

type Tab = 'content' | 'exams' | 'assignments' | 'students';

export default function TeacherCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>('content');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['s1']));

  const course      = MOCK_COURSES.find((c) => c.id === courseId);
  const sections    = MOCK_SECTIONS.filter((s) => s.courseId === courseId);
  const exams       = MOCK_ASSESSMENTS.filter((a) => a.courseId === courseId && a.type !== 'ASSIGNMENT');
  const assignments = MOCK_ASSIGNMENTS.filter((a) => a.courseId === courseId);

  if (!course) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-muted-foreground">الكورس غير موجود</p>
      <button onClick={() => router.back()} className="px-4 py-2 rounded-xl bg-lms-50 text-lms-700 text-sm">رجوع</button>
    </div>
  );

  const toggle = (id: string) => setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'content',     label: 'المحتوى',    count: sections.reduce((s, x) => s + x.lessons.length, 0) },
    { key: 'exams',       label: 'الامتحانات', count: exams.length },
    { key: 'assignments', label: 'الواجبات',   count: assignments.length },
    { key: 'students',    label: 'الطلاب',     count: 8 },
  ];

  const MOCK_STUDENT_NAMES = ['أحمد محمد', 'سارة إبراهيم', 'محمود حسن', 'نور الدين', 'ريم الشافعي', 'عمر عبدالله', 'منى حسين', 'خالد سعيد'];
  const MOCK_PROGRESS      = [25, 60, 0, 10, 80, 45, 30, 15];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/teacher/courses" className="hover:text-lms-600">الكورسات</Link>
        <ChevronRight size={13} />
        <span className="text-foreground font-medium line-clamp-1 max-w-sm">{course.title}</span>
      </nav>

      <div className="bg-white rounded-3xl border border-lms-100 shadow-elevated overflow-hidden">
        {/* Banner */}
        <div className="bg-lms-gradient px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white font-bold text-base leading-snug">{course.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-lms-200 text-xs flex-wrap">
              <span className="flex items-center gap-1"><CalendarDays size={12} />{formatDate(course.createdAt)}</span>
              <span className="flex items-center gap-1"><Users size={12} />8 طالب</span>
              {course.price && <span className="text-white font-semibold">{course.price} جنيه</span>}
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors shrink-0">
            <Pencil size={13} />تعديل
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-lms-100 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('flex-1 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px min-w-[90px]',
                tab === t.key ? 'border-lms-600 text-lms-700' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t.label}
              {t.count !== undefined && (
                <span className={cn('mr-1 text-xs px-1.5 py-0.5 rounded-full',
                  tab === t.key ? 'bg-lms-100 text-lms-700' : 'bg-gray-100 text-gray-500')}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {/* Content */}
          {tab === 'content' && (
            <>
              <div className="flex justify-end">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lms-gradient text-white text-xs font-semibold hover:shadow-glow-purple transition-shadow">
                  <Plus size={13} />إضافة وحدة
                </button>
              </div>
              {sections.map((sec) => {
                const open = expanded.has(sec.id);
                return (
                  <div key={sec.id} className="rounded-2xl border border-lms-100 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-lms-50/50">
                      <button onClick={() => toggle(sec.id)} className="flex items-center gap-2 flex-1 text-right">
                        <span className="font-bold text-lms-700 text-sm">{sec.title}</span>
                        <span className="text-xs text-muted-foreground bg-white border border-lms-100 px-2 py-0.5 rounded-full">{sec.lessons.length} درس</span>
                        {open ? <ChevronUp size={14} className="text-lms-500 mr-auto" /> : <ChevronDown size={14} className="text-muted-foreground mr-auto" />}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button className="p-1.5 rounded-lg hover:bg-lms-100 text-muted-foreground hover:text-lms-700"><Pencil size={13} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button>
                        <button className="p-1.5 rounded-lg bg-lms-gradient text-white hover:shadow-glow-purple transition-shadow"><Plus size={13} /></button>
                      </div>
                    </div>
                    {open && (
                      <div className="divide-y divide-lms-50/50">
                        {sec.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-lms-50/30">
                            <div className="w-8 h-8 rounded-full bg-lms-100 text-lms-600 flex items-center justify-center shrink-0"><Play size={12} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1"><Eye size={10} />حد المشاهدات: {lesson.maxViews ?? '∞'}</span>
                                {lesson.isPreview && <span className="text-emerald-500 font-medium">معاينة مجانية</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button className="p-1.5 rounded-lg hover:bg-lms-100 text-muted-foreground hover:text-lms-700"><Pencil size={12} /></button>
                              <button className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {sections.length === 0 && (
                <div className="flex flex-col items-center py-14 gap-3 text-muted-foreground">
                  <div className="w-14 h-14 rounded-2xl bg-lms-50 flex items-center justify-center"><BookOpen size={26} className="text-lms-300" /></div>
                  <p className="text-sm">لا يوجد محتوى بعد</p>
                </div>
              )}
            </>
          )}

          {/* Exams */}
          {tab === 'exams' && (
            <>
              <div className="flex justify-end">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lms-gradient text-white text-xs font-semibold hover:shadow-glow-purple transition-shadow">
                  <Plus size={13} />اختبار جديد
                </button>
              </div>
              {exams.map((exam) => (
                <div key={exam.id} className="flex items-center gap-4 p-4 rounded-2xl border border-lms-100 hover:border-lms-200">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', exam.isPublished ? 'bg-lms-gradient' : 'bg-gray-100')}>
                    <ClipboardList size={18} className={exam.isPublished ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground">{exam.title}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', exam.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500')}>
                        {exam.isPublished ? 'منشور' : 'مسودة'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(exam.availableFrom)}</span>
                      {exam.durationMinutes && <span className="flex items-center gap-1"><Clock size={10} />{exam.durationMinutes} د</span>}
                      <span className="flex items-center gap-1"><CheckCircle2 size={10} />نجاح {exam.passPercentage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-2 rounded-xl hover:bg-lms-50 text-muted-foreground hover:text-lms-700"><Pencil size={14} /></button>
                    <button className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Assignments */}
          {tab === 'assignments' && (
            <>
              <div className="flex justify-end">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lms-gradient text-white text-xs font-semibold hover:shadow-glow-purple transition-shadow">
                  <Plus size={13} />واجب جديد
                </button>
              </div>
              {assignments.map((w) => (
                <div key={w.id} className="flex items-center gap-4 p-4 rounded-2xl border border-lms-100 hover:border-lms-200">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><FileText size={18} className="text-amber-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{w.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(w.availableFrom)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />ينتهي {formatDate(w.availableTo)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-2 rounded-xl hover:bg-lms-50 text-muted-foreground hover:text-lms-700"><Pencil size={14} /></button>
                    <button className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Students */}
          {tab === 'students' && (
            <div className="space-y-2">
              {MOCK_STUDENT_NAMES.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-lms-100 hover:bg-lms-50/50">
                  <div className="w-9 h-9 rounded-full bg-lms-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">{name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-lms-100 rounded-full overflow-hidden">
                        <div className="h-full bg-lms-gradient rounded-full" style={{ width: `${MOCK_PROGRESS[i]}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-lms-600 shrink-0">{MOCK_PROGRESS[i]}%</span>
                    </div>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', i === 3 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600')}>
                    {i === 3 ? 'محظور' : 'نشط'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
