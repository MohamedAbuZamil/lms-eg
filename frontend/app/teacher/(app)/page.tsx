'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { MOCK_COURSES, MOCK_TEACHER_STATS, MOCK_USER } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { Users, Star, BookOpen, GraduationCap, ClipboardList, TrendingUp, ChevronLeft, CalendarDays, Plus } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const me = user ?? MOCK_USER;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">مرحباً بعودتك 👋</p>
          <h1 className="text-2xl font-bold text-foreground mt-0.5">{me.name}</h1>
        </div>
        <Link href="/teacher/courses" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lms-gradient text-white font-semibold text-sm shadow-soft-md hover:shadow-glow-purple transition-shadow shrink-0">
          <Plus size={15} />كورس جديد
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الطلاب', value: MOCK_TEACHER_STATS.totalStudents.toLocaleString('ar-EG'), icon: <Users size={20} />,       color: 'from-lms-500 to-lms-700'         },
          { label: 'التقييم',        value: String(MOCK_TEACHER_STATS.rating),                         icon: <Star size={20} />,        color: 'from-amber-400 to-amber-500'     },
          { label: 'الكورسات',       value: String(MOCK_TEACHER_STATS.totalCourses),                   icon: <GraduationCap size={20} />, color: 'from-blue-400 to-blue-600'     },
          { label: 'الاختبارات',     value: '5',                                                        icon: <ClipboardList size={20} />, color: 'from-emerald-400 to-emerald-600'},
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-lms-100 p-4 flex items-center gap-3 shadow-soft-sm hover:shadow-soft-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shrink-0`}>{s.icon}</div>
            <div><p className="text-xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Recent courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">آخر الكورسات</h2>
          <Link href="/teacher/courses" className="text-sm text-lms-600 hover:text-lms-700 font-medium flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_COURSES.slice(0, 4).map((course) => (
            <Link key={course.id} href={`/teacher/courses/${course.id}`}
              className="bg-white rounded-2xl border border-lms-100 p-4 flex items-center gap-4 hover:border-lms-300 hover:shadow-soft-md transition-all group">
              <div className="w-14 h-14 rounded-xl bg-lms-gradient flex items-center justify-center shrink-0 group-hover:shadow-glow-purple transition-shadow">
                <BookOpen size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm line-clamp-2">{course.title}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><CalendarDays size={11} /><span>{formatDate(course.createdAt)}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إضافة كورس',  href: '/teacher/courses',     icon: GraduationCap, color: 'from-lms-500 to-lms-700'         },
            { label: 'الطلاب',       href: '/teacher/students',    icon: Users,         color: 'from-blue-400 to-blue-600'       },
            { label: 'اختبار جديد', href: '/teacher/assessments', icon: ClipboardList, color: 'from-emerald-400 to-emerald-600' },
            { label: 'إحصائيات',    href: '/teacher/students',    icon: TrendingUp,    color: 'from-amber-400 to-amber-500'     },
          ].map((item) => (
            <Link key={item.href + item.label} href={item.href}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border border-lms-100 hover:border-lms-200 hover:shadow-soft-md transition-all text-center group">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-soft-sm group-hover:shadow-glow-purple transition-shadow`}>
                <item.icon size={19} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
