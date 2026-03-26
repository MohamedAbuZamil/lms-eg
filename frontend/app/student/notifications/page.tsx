'use client';

import { useState } from 'react';
import { Bell, Check } from 'lucide-react';

const INITIAL = [
  { id: '1', title: 'تم نشر كورس جديد',  body: 'Course 1: Unit 7 متاح الآن',              time: 'منذ ساعة',    read: false },
  { id: '2', title: 'نتيجة الامتحان',     body: 'تم تصحيح امتحان Active & Passive Voice', time: 'منذ 3 ساعات', read: false },
  { id: '3', title: 'تذكير بالواجب',      body: 'موعد تسليم واجب Unit 7 غداً',            time: 'أمس',          read: true  },
  { id: '4', title: 'إشعار من المدرس',    body: 'تم إضافة محتوى جديد لـ Course 2',        time: 'أمس',          read: true  },
  { id: '5', title: 'انتهت مشاهداتك',     body: 'استهلكت جميع مشاهدات Homework of Unit 7', time: 'منذ يومين', read: true  },
];

export default function StudentNotificationsPage() {
  const [notifs, setNotifs] = useState(INITIAL);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإشعارات</h1>
          {unread > 0 && <p className="text-sm text-muted-foreground mt-0.5">{unread} غير مقروء</p>}
        </div>
        {unread > 0 && (
          <button onClick={() => setNotifs((p) => p.map((n) => ({ ...n, read: true })))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lms-50 border border-lms-200 text-lms-700 text-sm font-medium hover:bg-lms-100 transition-colors">
            <Check size={14} />تعليم الكل مقروء
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifs.map((n) => (
          <button key={n.id} onClick={() => setNotifs((p) => p.map((x) => x.id === n.id ? { ...x, read: true } : x))}
            className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-right transition-all duration-200 ${
              n.read ? 'bg-white border-lms-100' : 'bg-lms-50 border-lms-200 hover:bg-lms-100/60'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-gray-100 text-gray-400' : 'bg-lms-gradient text-white'}`}>
              <Bell size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{n.time}</span>
              {!n.read && <div className="w-2 h-2 rounded-full bg-lms-500" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
