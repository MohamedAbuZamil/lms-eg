'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LmsLogo } from '@/components/lms-logo';
import { MOCK_STUDENT } from '@/lib/mock-data';
import { GraduationCap } from 'lucide-react';

export default function StudentLoginPage() {
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
      router.push('/student');
    } catch {}
  };

  const handleDemo = () => {
    demoLogin(MOCK_STUDENT);
    router.push('/student');
  };

  return (
    <div className="card-glass p-8 animate-fade-in-up">
      {/* Logo */}
      <div className="text-center mb-7">
        <div className="flex justify-center mb-2">
          <LmsLogo size={60} />
        </div>
        <span className="text-2xl font-bold text-lms-700">LMS</span>
        <div className="flex items-center justify-center gap-2 mt-3 px-4 py-2 rounded-xl bg-lms-50 border border-lms-100 mx-auto w-fit">
          <GraduationCap size={16} className="text-lms-600" />
          <span className="text-sm font-semibold text-lms-700">بوابة الطلاب</span>
        </div>
        <p className="text-muted-foreground text-sm mt-2">سجّل دخولك كطالب للمتابعة</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">البريد الإلكتروني</label>
          <input
            name="email" type="email" required autoComplete="email"
            className="input-field" placeholder="example@email.com"
            value={form.email} onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">كلمة المرور</label>
          <input
            name="password" type="password" required autoComplete="current-password"
            className="input-field" placeholder="••••••••"
            value={form.password} onChange={handleChange}
          />
        </div>
        <button
          type="submit" disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-lms-gradient text-white font-semibold shadow-soft-md hover:shadow-glow-purple transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>

      {/* Demo */}
      <div className="mt-5 pt-5 border-t border-lms-100">
        <p className="text-xs text-center text-muted-foreground mb-3">دخول تجريبي بدون backend</p>
        <button
          onClick={handleDemo}
          className="w-full py-2.5 rounded-xl bg-lms-50 border border-lms-200 text-lms-700 text-sm font-semibold hover:bg-lms-100 transition-colors"
        >
          دخول كطالب (demo)
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="text-lms-600 hover:text-lms-700 font-semibold">إنشاء حساب</Link>
      </p>
    </div>
  );
}
