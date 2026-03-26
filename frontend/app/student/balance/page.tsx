'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const BALANCES  = [{ teacherName: 'حسن النجار', subject: 'لغة انجليزية', balance: 1250 }];
const TXS = [
  { id: 'tx1', type: 'RECHARGE', amount:  500, desc: 'شحن رصيد بكود',  date: '2025-01-15T10:00:00Z' },
  { id: 'tx2', type: 'PURCHASE', amount: -350, desc: 'شراء Course 1',  date: '2025-01-16T12:00:00Z' },
  { id: 'tx3', type: 'RECHARGE', amount: 1000, desc: 'شحن رصيد بكود',  date: '2025-01-20T09:00:00Z' },
  { id: 'tx4', type: 'PURCHASE', amount: -300, desc: 'شراء Course 2',  date: '2025-01-22T14:00:00Z' },
];

export default function StudentBalancePage() {
  const total = BALANCES.reduce((s, b) => s + b.balance, 0);
  return (
    <div className="space-y-6 animate-fade-in-up max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">رصيدي</h1>

      <div className="bg-lms-gradient rounded-3xl p-6 text-white shadow-glow-purple">
        <div className="flex items-center gap-2 mb-1"><Wallet size={18} className="text-lms-200" /><p className="text-lms-200 text-sm">إجمالي الرصيد</p></div>
        <p className="text-4xl font-bold">{formatCurrency(total)}</p>
        <button className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-semibold transition-colors">
          <RefreshCw size={14} />شحن رصيد
        </button>
      </div>

      {BALANCES.map((b, i) => (
        <div key={i} className="bg-white rounded-2xl border border-lms-100 p-4 flex items-center gap-4 shadow-soft-sm">
          <div className="w-11 h-11 rounded-full bg-lms-gradient flex items-center justify-center text-white font-bold shrink-0">{b.teacherName[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{b.subject}</p>
            <p className="font-bold text-foreground">{b.teacherName}</p>
          </div>
          <div className="text-left">
            <p className="font-bold text-lms-700 text-lg">{formatCurrency(b.balance)}</p>
            <p className="text-xs text-muted-foreground text-left">رصيد متاح</p>
          </div>
        </div>
      ))}

      <div>
        <h2 className="text-base font-bold text-foreground mb-3">سجل المعاملات</h2>
        <div className="space-y-2">
          {TXS.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-lms-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'}`}>
                {tx.amount > 0 ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{tx.desc}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.date)}</p>
              </div>
              <p className={`font-bold text-sm shrink-0 ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
