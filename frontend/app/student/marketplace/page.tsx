'use client';

import { useState } from 'react';
import { MOCK_COURSES, MOCK_USER, MOCK_TEACHER_STATS } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { BookOpen, ShoppingCart, Star, Users, CalendarDays, Search } from 'lucide-react';

export default function StudentMarketplacePage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_COURSES.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المتجر</h1>
        <p className="text-sm text-muted-foreground mt-0.5">تصفح الكورسات المتاحة</p>
      </div>

      {/* Teacher banner */}
      <div className="bg-white rounded-2xl border border-lms-100 p-4 flex items-center gap-4 shadow-soft-sm">
        <div className="w-14 h-14 rounded-full bg-lms-gradient flex items-center justify-center text-white text-xl font-bold shrink-0">{MOCK_USER.name[0]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{MOCK_TEACHER_STATS.subject}</p>
          <p className="font-bold text-foreground">{MOCK_USER.name}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground"><Users size={13} className="text-lms-500" />{MOCK_TEACHER_STATS.totalStudents.toLocaleString('ar-EG')}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-500"><Star size={13} className="fill-amber-400" />{MOCK_TEACHER_STATS.rating}</span>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="ابحث عن كورس..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-lms-200 bg-white focus:outline-none focus:ring-2 focus:ring-lms-500/30 focus:border-lms-500 text-sm transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course) => (
          <div key={course.id} className="bg-white rounded-2xl border border-lms-100 overflow-hidden hover:border-lms-300 hover:shadow-soft-md transition-all flex flex-col group">
            <div className="h-32 bg-lms-gradient flex items-center justify-center relative">
              <BookOpen size={38} className="text-white/50" />
              {course.price && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-white text-xs font-bold">{course.price} جنيه</div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-foreground text-sm line-clamp-2 flex-1">{course.title}</h3>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"><CalendarDays size={11} /><span>{formatDate(course.createdAt)}</span></div>
              <button className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lms-gradient text-white text-sm font-semibold hover:shadow-glow-purple transition-shadow">
                <ShoppingCart size={14} />اشترك الآن
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
