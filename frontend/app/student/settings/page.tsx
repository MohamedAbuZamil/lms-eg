'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { MOCK_STUDENT } from '@/lib/mock-data';
import { Mail, Phone, Shield, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentSettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const me = user ?? MOCK_STUDENT;

  return (
    <div className="space-y-6 animate-fade-in-up max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>

      <div className="bg-white rounded-3xl border border-lms-100 shadow-elevated overflow-hidden">
        <div className="bg-lms-gradient px-6 py-8 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-white text-3xl font-bold">
            {(me.name ?? 'U')[0]}
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{me.name}</p>
            <p className="text-lms-200 text-sm mt-0.5">طالب</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {[
            { icon: <User size={15} />,   label: 'الاسم',              value: me.name    },
            { icon: <Mail size={15} />,   label: 'البريد الإلكتروني', value: me.email   },
            { icon: <Phone size={15} />,  label: 'رقم الهاتف',        value: me.mobile  },
            { icon: <Shield size={15} />, label: 'نوع الحساب',        value: 'طالب'     },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 p-3 rounded-xl bg-lms-50">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-lms-600 shrink-0 shadow-soft-xs">{row.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{row.value ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3 rounded-2xl border border-lms-200 bg-lms-50 text-lms-700 font-semibold text-sm hover:bg-lms-100 transition-colors">
        تعديل البيانات
      </button>
      <button onClick={() => { logout(); router.push('/login'); }}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors">
        <LogOut size={17} />تسجيل الخروج
      </button>
    </div>
  );
}
