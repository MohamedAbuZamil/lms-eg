'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LmsLogo } from '@/components/lms-logo';
import { MOCK_COURSES, MOCK_TEACHER_STATS, MOCK_STUDENT, MOCK_USER } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { Users, Star, BookOpen, CalendarDays, TrendingUp, ChevronLeft, ArrowLeft } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const me = user ?? MOCK_STUDENT;

  return (
    <div className="space-y-7 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-bold text-foreground">مرحباً، {me.name} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">استمر في رحلة تعلّمك</p>
      </div>

      {/* Teacher card */}
      <div className="bg-white rounded-3xl border border-lms-100 shadow-elevated p-5">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-lms-gradient flex items-center justify-center text-white text-2xl font-bold shadow-soft-lg border-4 border-white">
              {MOCK_USER.name[0]}
            </div>
            <div className="absolute -bottom-1 -left-1 w-9 h-9 rounded-full bg-lms-gradient border-2 border-white flex items-center justify-center shadow-soft-sm">
              <LmsLogo size={18} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{MOCK_TEACHER_STATS.subject}</p>
            <h2 className="text-xl font-bold text-foreground">{MOCK_USER.name}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lms-50 border border-lms-100 text-xs font-semibold text-foreground">
                <Users size={12} className="text-lms-600" />{MOCK_TEACHER_STATS.totalStudents.toLocaleString('ar-EG')} طالب
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-xs font-semibold text-foreground">
                <Star size={12} className="text-amber-400 fill-amber-400" />{MOCK_TEACHER_STATS.rating}
              </span>
            </div>
          </div>
          <Link href="/student/courses" className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lms-50 hover:bg-lms-100 border border-lms-200 text-lms-700 font-semibold text-sm transition-colors">
            <ArrowLeft size={15} />كورساتي
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'الكورسات المشتركة', value: MOCK_COURSES.length, icon: <BookOpen size={20} />, color: 'from-lms-500 to-lms-700' },
          { label: 'الدروس المكتملة',   value: 4,                  icon: <TrendingUp size={20} />, color: 'from-blue-400 to-blue-600' },
          { label: 'متوسط التقدم',      value: '28%',              icon: <Star size={20} />,      color: 'from-amber-400 to-amber-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-lms-100 p-4 flex items-center gap-3 shadow-soft-sm">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shrink-0`}>{s.icon}</div>
            <div><p className="text-xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Recent courses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">آخر الكورسات</h2>
          <Link href="/student/courses" className="text-xs text-lms-600 hover:text-lms-700 font-medium flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </Link>
        </div>
        <div className="space-y-2.5">
          {MOCK_COURSES.slice(0, 4).map((course) => (
            <Link key={course.id} href={`/student/courses/${course.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-lms-100 hover:border-lms-300 hover:shadow-soft-md transition-all group">
              <div className="w-14 h-14 rounded-xl bg-lms-gradient flex items-center justify-center shrink-0 group-hover:shadow-glow-purple transition-shadow">
                <BookOpen size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm line-clamp-2">{course.title}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <CalendarDays size={11} /><span>{formatDate(course.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
