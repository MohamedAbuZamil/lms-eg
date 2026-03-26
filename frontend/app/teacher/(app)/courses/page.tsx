'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MOCK_COURSES } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { BookOpen, CalendarDays, Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function TeacherCoursesPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_COURSES.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الكورسات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{MOCK_COURSES.length} كورس</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lms-gradient text-white font-semibold text-sm shadow-soft-md hover:shadow-glow-purple transition-shadow">
          <Plus size={15} />كورس جديد
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="ابحث عن كورس..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-lms-200 bg-white focus:outline-none focus:ring-2 focus:ring-lms-500/30 focus:border-lms-500 text-sm transition-all" />
      </div>

      <div className="space-y-3">
        {filtered.map((course) => (
          <div key={course.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-lms-100 hover:border-lms-200 hover:shadow-soft-md transition-all group">
            <div className="w-14 h-14 rounded-xl bg-lms-gradient flex items-center justify-center shrink-0 group-hover:shadow-glow-purple transition-shadow">
              <BookOpen size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/teacher/courses/${course.id}`} className="font-semibold text-foreground text-sm hover:text-lms-700 line-clamp-2">
                {course.title}
              </Link>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(course.createdAt)}</span>
                {course.price && <span className="font-semibold text-lms-600">{course.price} جنيه</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Link href={`/teacher/courses/${course.id}`}
                className="p-2 rounded-xl hover:bg-lms-50 text-muted-foreground hover:text-lms-700 transition-colors">
                <Pencil size={15} />
              </Link>
              <button className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
