'use client';

import { getInitials } from '@/lib/utils';
import { UserCog, Plus, Shield, Trash2, Pencil } from 'lucide-react';

const STAFF = [
  { id: 'st1', name: 'مريم أحمد',  email: 'mariam@mail.com', courses: 3, status: 'ACTIVE'   },
  { id: 'st2', name: 'خالد سعيد',  email: 'khaled@mail.com', courses: 2, status: 'ACTIVE'   },
  { id: 'st3', name: 'منى حسين',   email: 'mona@mail.com',   courses: 1, status: 'INACTIVE' },
];

export default function TeacherStaffPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الفريق</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{STAFF.length} مساعد</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lms-gradient text-white font-semibold text-sm shadow-soft-md hover:shadow-glow-purple transition-shadow">
          <Plus size={15} />إضافة مساعد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAFF.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-lms-100 p-5 hover:border-lms-300 hover:shadow-soft-md transition-all">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-lms-gradient flex items-center justify-center text-white font-bold shrink-0 shadow-soft-sm">
                {getInitials(s.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {s.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lms-50 text-lms-600 text-xs font-medium flex-1 justify-center">
                <Shield size={12} />مساعد
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lms-50 text-lms-600 text-xs font-medium flex-1 justify-center">
                <UserCog size={12} />{s.courses} كورس
              </div>
              <button className="p-2 rounded-xl hover:bg-lms-50 text-muted-foreground hover:text-lms-700 transition-colors"><Pencil size={14} /></button>
              <button className="p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
