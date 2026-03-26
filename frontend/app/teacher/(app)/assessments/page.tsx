'use client';

import { useState } from 'react';
import { MOCK_ASSESSMENTS, MOCK_ASSIGNMENTS, MOCK_COURSES } from '@/lib/mock-data';
import { formatDate, cn } from '@/lib/utils';
import { ClipboardList, FileText, Clock, CalendarDays, CheckCircle2, Plus, Pencil, Trash2 } from 'lucide-react';

type Tab = 'exams' | 'assignments';

export default function TeacherAssessmentsPage() {
  const [tab, setTab] = useState<Tab>('exams');
  const getCourse = (id: string) => MOCK_COURSES.find((c) => c.id === id)?.title ?? id;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">الاختبارات والواجبات</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lms-gradient text-white font-semibold text-sm shadow-soft-md hover:shadow-glow-purple transition-shadow">
          <Plus size={15} />اختبار جديد
        </button>
      </div>

      <div className="flex bg-lms-50 rounded-2xl p-1 gap-1">
        {([['exams', 'الامتحانات', MOCK_ASSESSMENTS.length], ['assignments', 'الواجبات', MOCK_ASSIGNMENTS.length]] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === key ? 'bg-white text-lms-700 shadow-soft-sm' : 'text-muted-foreground hover:text-foreground')}>
            {label} <span className={cn('mr-1 text-xs', tab === key ? 'text-lms-500' : 'text-muted-foreground')}>({count})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tab === 'exams' && MOCK_ASSESSMENTS.map((exam) => (
          <div key={exam.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-lms-100 hover:border-lms-200 hover:shadow-soft-md transition-all">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', exam.isPublished ? 'bg-lms-gradient' : 'bg-gray-100')}>
              <ClipboardList size={20} className={exam.isPublished ? 'text-white' : 'text-gray-400'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-foreground">{exam.title}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', exam.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500')}>
                  {exam.isPublished ? 'منشور' : 'مسودة'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-lms-50 text-lms-600 font-medium">{exam.type === 'EXAM' ? 'امتحان' : 'كويز'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{getCourse(exam.courseId)}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(exam.availableFrom)}</span>
                {exam.durationMinutes && <span className="flex items-center gap-1"><Clock size={10} />{exam.durationMinutes} دقيقة</span>}
                <span className="flex items-center gap-1"><CheckCircle2 size={10} />نجاح {exam.passPercentage}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button className="p-2 rounded-xl hover:bg-lms-50 text-muted-foreground hover:text-lms-700 transition-colors"><Pencil size={14} /></button>
              <button className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}

        {tab === 'assignments' && MOCK_ASSIGNMENTS.map((w) => (
          <div key={w.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-lms-100 hover:border-lms-200 hover:shadow-soft-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><FileText size={20} className="text-amber-500" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">{w.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{getCourse(w.courseId)}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays size={10} />{formatDate(w.availableFrom)}</span>
                <span className="flex items-center gap-1"><Clock size={10} />ينتهي {formatDate(w.availableTo)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', w.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500')}>
                {w.isPublished ? 'متاح' : 'مسودة'}
              </span>
              <button className="p-2 rounded-xl hover:bg-lms-50 text-muted-foreground hover:text-lms-700 transition-colors"><Pencil size={14} /></button>
              <button className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
