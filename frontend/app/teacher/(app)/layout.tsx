'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LmsLogo } from '@/components/lms-logo';
import { cn, getInitials, roleLabel } from '@/lib/utils';
import { LayoutDashboard, GraduationCap, Users, ClipboardList, UserCog, Bell, Settings, LogOut, Menu, X } from 'lucide-react';
import { MOCK_USER } from '@/lib/mock-data';

const NAV = [
  { label: 'لوحة التحكم', href: '/teacher',              icon: LayoutDashboard },
  { label: 'الكورسات',    href: '/teacher/courses',      icon: GraduationCap   },
  { label: 'الطلاب',      href: '/teacher/students',     icon: Users           },
  { label: 'الاختبارات',  href: '/teacher/assessments',  icon: ClipboardList   },
  { label: 'الفريق',      href: '/teacher/staff',        icon: UserCog         },
  { label: 'الإشعارات',   href: '/teacher/notifications',icon: Bell            },
  { label: 'الإعدادات',   href: '/teacher/settings',     icon: Settings        },
];

function SidebarContent({
  pathname, me, onNav, onLogout,
}: {
  pathname: string;
  me: { name?: string; email: string; role: string };
  onNav: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-lms-50 flex items-center gap-3">
        <LmsLogo size={32} className="shrink-0" />
        <span className="font-bold text-lg text-foreground">LMS-EG</span>
      </div>

      <div className="px-3 py-3 border-b border-lms-50">
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-br from-lms-50 to-white border border-lms-100">
          <div className="w-10 h-10 rounded-full bg-lms-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
            {getInitials(me.name || me.email)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{me.name || '—'}</p>
            <p className="text-xs text-lms-500 font-medium">{roleLabel(me.role)}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = href === '/teacher' ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onNav}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active ? 'bg-lms-gradient text-white shadow-soft-md' : 'text-muted-foreground hover:bg-lms-50 hover:text-lms-700')}>
              <Icon size={17} className="shrink-0" /><span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-4 pt-2 border-t border-lms-50">
        <button onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all w-full">
          <LogOut size={17} className="shrink-0" /><span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

export default function TeacherAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const me = user ?? MOCK_USER;
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); router.push('/teacher/login'); };

  return (
    <div className="min-h-screen bg-[#F5F0FF]" dir="rtl">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-l border-lms-100 flex-col fixed top-0 bottom-0 right-0 shadow-elevated z-30">
        <SidebarContent pathname={pathname} me={me} onNav={() => {}} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-lms-100 flex items-center justify-between px-4 shadow-soft-sm">
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-lms-50 text-foreground">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <LmsLogo size={28} />
          <span className="font-bold text-base text-foreground">LMS-EG</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-lms-gradient flex items-center justify-center text-white text-sm font-bold">
          {getInitials(me.name || me.email)}
        </div>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col mr-auto">
            <button onClick={() => setOpen(false)} className="absolute top-3 left-3 p-2 rounded-xl hover:bg-lms-50 text-muted-foreground z-10">
              <X size={18} />
            </button>
            <SidebarContent pathname={pathname} me={me} onNav={() => setOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="lg:mr-64 min-h-screen pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5 lg:py-6">{children}</div>
      </main>
    </div>
  );
}
