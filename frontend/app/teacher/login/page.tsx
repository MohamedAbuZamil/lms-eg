'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LmsLogo } from '@/components/lms-logo';
import { MOCK_USER } from '@/lib/mock-data';
import { BookOpenCheck } from 'lucide-react';

export default function TeacherLoginPage() {
  const router = useRouter();
  const { login, demoLogin, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form);
      router.push('/teacher');
    } catch {}
  };

  const handleDemo = () => {
    demoLogin(MOCK_USER);
    router.push('/teacher');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lms-700 via-lms-600 to-lms-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-lms-gradient px-8 py-8 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center">
                <LmsLogo size={44} />
              </div>
            </div>
            <h1 className="text-white font-bold text-xl">LMS-EG</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <BookOpenCheck size={15} className="text-lms-200" />
              <span className="text-lms-200 text-sm font-medium">بوابة المدرسين</span>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <h2 className="text-lg font-bold text-foreground mb-1">تسجيل الدخول</h2>
            <p className="text-muted-foreground text-sm mb-6">أدخل بيانات حسابك كمدرس</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">البريد الإلكتروني</label>
                <input name="email" type="email" required autoComplete="email"
                  className="input-field" placeholder="teacher@lms-eg.com"
                  value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">كلمة المرور</label>
                <input name="password" type="password" required autoComplete="current-password"
                  className="input-field" placeholder="••••••••"
                  value={form.password} onChange={handleChange} />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl bg-lms-gradient text-white font-bold shadow-soft-md hover:shadow-glow-purple transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? 'جاري الدخول...' : 'دخول لوحة التحكم'}
              </button>
            </form>

            {/* Demo */}
            <div className="mt-5 pt-5 border-t border-lms-100">
              <p className="text-xs text-center text-muted-foreground mb-3">دخول تجريبي بدون backend</p>
              <button onClick={handleDemo}
                className="w-full py-2.5 rounded-xl bg-lms-gradient text-white text-sm font-semibold hover:shadow-glow-purple transition-shadow">
                دخول كمدرس (demo)
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-5">
              طالب؟{' '}
              <Link href="/login" className="text-lms-600 hover:text-lms-700 font-semibold">بوابة الطلاب</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
