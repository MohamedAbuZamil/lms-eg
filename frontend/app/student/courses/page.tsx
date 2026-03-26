'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MOCK_COURSES } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { BookOpen, CalendarDays, Search, Lock } from 'lucide-react';

const PROGRESS: Record<string, number> = { c1: 25, c2: 60, c3: 0, c4: 10, c5: 0 };

export default function StudentCoursesPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_COURSES.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">كورساتي</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{MOCK_COURSES.length} كورس مشترك</p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="ابحث عن كورس..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-lms-200 bg-white focus:outline-none focus:ring-2 focus:ring-lms-500/30 focus:border-lms-500 text-sm transition-all" />
      </div>

      <div className="space-y-3">
        {filtered.map((course) => {
          const prog = PROGRESS[course.id] ?? 0;
          return (
            <Link key={course.id} href={`/student/courses/${course.id}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-lms-100 hover:border-lms-300 hover:shadow-soft-md transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-lms-gradient flex items-center justify-center shrink-0 group-hover:shadow-glow-purple transition-shadow">
                <BookOpen size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="font-semibold text-foreground text-sm line-clamp-2">{course.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays size={11} /><span>{formatDate(course.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-lms-100 rounded-full overflow-hidden">
                    <div className="h-full bg-lms-gradient rounded-full" style={{ width: `${prog}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-lms-600 shrink-0">{prog}%</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center shrink-0">
                <Lock size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
