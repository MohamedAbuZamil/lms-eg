'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LmsLogo } from '@/components/lms-logo';
import type { UserRole } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const { register, login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'STUDENT' as UserRole,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      await login({ email: form.email, password: form.password });
      const role = useAuthStore.getState().user?.role ?? form.role;
      router.push(role === 'STUDENT' ? '/student' : '/teacher');
    } catch {}
  };

  return (
    <div className="card-glass p-8 animate-fade-in-up">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-2"><LmsLogo size={52} /></div>
        <span className="text-xl font-bold text-lms-700">LMS</span>
        <h1 className="text-xl font-bold text-foreground mt-2">إنشاء حساب جديد</h1>
        <p className="text-muted-foreground text-sm mt-0.5">انضم إلى منصة LMS-EG</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">الاسم</label>
          <input
            name="name"
            type="text"
            className="input-field"
            placeholder="الاسم الكامل"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            البريد الإلكتروني
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input-field"
            placeholder="example@email.com"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">رقم الهاتف</label>
          <input
            name="mobile"
            type="tel"
            required
            className="input-field"
            placeholder="01xxxxxxxxx"
            value={form.mobile}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">كلمة المرور</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="input-field"
            placeholder="6 أحرف على الأقل"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">نوع الحساب</label>
          <select
            name="role"
            className="input-field"
            value={form.role}
            onChange={handleChange}
          >
            <option value="STUDENT">طالب</option>
            <option value="TEACHER">مدرس</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-lms-gradient text-white font-semibold shadow-soft-md hover:shadow-glow-purple transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="text-lms-600 hover:text-lms-700 font-semibold">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
