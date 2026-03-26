'use client';

import { useState } from 'react';
import { getInitials } from '@/lib/utils';
import { Search, Users, UserPlus, MoreVertical } from 'lucide-react';

const STUDENTS = [
  { id: 's1', name: 'أحمد محمد علي',  email: 'ahmed@mail.com',   mobile: '01012345678', progress: 25, status: 'ACTIVE'  },
  { id: 's2', name: 'سارة إبراهيم',   email: 'sara@mail.com',    mobile: '01098765432', progress: 60, status: 'ACTIVE'  },
  { id: 's3', name: 'محمود حسن',       email: 'mahmoud@mail.com', mobile: '01112223344', progress: 0,  status: 'ACTIVE'  },
  { id: 's4', name: 'نور الدين',       email: 'nour@mail.com',    mobile: '01055556666', progress: 10, status: 'BLOCKED' },
  { id: 's5', name: 'ريم الشافعي',     email: 'reem@mail.com',    mobile: '01211112222', progress: 80, status: 'ACTIVE'  },
  { id: 's6', name: 'عمر عبدالله',     email: 'omar@mail.com',    mobile: '01533334444', progress: 45, status: 'ACTIVE'  },
  { id: 's7', name: 'منى حسين',        email: 'mona@mail.com',    mobile: '01677778888', progress: 30, status: 'ACTIVE'  },
  { id: 's8', name: 'خالد سعيد',       email: 'khaled@mail.com',  mobile: '01899990000', progress: 15, status: 'ACTIVE'  },
];

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const filtered = STUDENTS.filter((s) => s.name.includes(search) || s.mobile.includes(search));
  const active  = STUDENTS.filter((s) => s.status === 'ACTIVE').length;
  const blocked = STUDENTS.filter((s) => s.status === 'BLOCKED').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الطلاب</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{STUDENTS.length} طالب مسجّل</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lms-gradient text-white font-semibold text-sm shadow-soft-md hover:shadow-glow-purple transition-shadow">
          <UserPlus size={15} />تسجيل طالب
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي', value: STUDENTS.length, bg: 'bg-lms-gradient', text: 'text-white' },
          { label: 'نشط',    value: active,           bg: 'bg-emerald-50',  text: 'text-emerald-600' },
          { label: 'محظور',  value: blocked,          bg: 'bg-red-50',      text: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-lms-100 p-4 flex items-center gap-3 shadow-soft-sm">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.text} shrink-0`}>
              <Users size={18} />
            </div>
            <div><p className="text-xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="ابحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-lms-200 bg-white focus:outline-none focus:ring-2 focus:ring-lms-500/30 focus:border-lms-500 text-sm transition-all" />
      </div>

      <div className="bg-white rounded-2xl border border-lms-100 overflow-hidden shadow-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-lms-100 bg-lms-50">
              <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground">الطالب</th>
              <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground">رقم الهاتف</th>
              <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">التقدم</th>
              <th className="text-center px-5 py-3.5 font-semibold text-muted-foreground">الحالة</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-lms-50">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-lms-50/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-lms-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">{getInitials(s.name)}</div>
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{s.mobile}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-lms-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lms-gradient rounded-full" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-lms-600 w-8 text-left shrink-0">{s.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {s.status === 'ACTIVE' ? 'نشط' : 'محظور'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button className="p-1.5 rounded-lg hover:bg-lms-50 text-muted-foreground hover:text-lms-700 transition-colors"><MoreVertical size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
