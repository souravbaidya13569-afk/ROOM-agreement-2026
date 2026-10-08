import React, { useState } from 'react';
import {
  Calendar,
  IndianRupee,
  Home,
  Zap,
  Wifi,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  CreditCard,
  Plus,
  Users,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Member, ExpenseData, ExpenseBreakdown, PaymentLog } from '../types';
import {
  calculateMemberDue,
  getPaymentStatus,
  addPayment,
  MAX_MEMBERS,
  AGREEMENT_PERIOD
} from '../services/roomService';
import { PaymentModal } from './PaymentModal';

interface DashboardViewProps {
  currentUser: Member | null;
  expense: ExpenseData;
  breakdown: ExpenseBreakdown;
  members: Member[];
  payments: PaymentLog[];
  onNavigateToMembers: () => void;
  onNavigateToAdmin: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  expense,
  breakdown,
  members,
  payments,
  onNavigateToMembers,
  onNavigateToAdmin,
}) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [quickPayLoading, setQuickPayLoading] = useState<number | null>(null);

  // Current user metrics
  const myDue = currentUser ? calculateMemberDue(currentUser, breakdown) : 0;
  const myPaid = currentUser ? currentUser.paidAmount || 0 : 0;
  const myBalance = Math.max(0, myDue - myPaid);
  const myStatus = getPaymentStatus(myDue, myPaid);

  // Room aggregates
  const totalCollected = members.reduce((acc, m) => acc + (m.paidAmount || 0), 0);
  const collectionPercentage = breakdown.totalExpense > 0
    ? Math.min(100, Math.round((totalCollected / breakdown.totalExpense) * 100))
    : 0;

  const handleQuickAdd = async (amount: number) => {
    if (!currentUser) return;
    setQuickPayLoading(amount);
    try {
      await addPayment(
        currentUser.id,
        currentUser.name,
        amount,
        currentUser.paidAmount || 0,
        currentUser.name,
        `Quick payment +₹${amount}`
      );
    } catch (err) {
      console.error('Quick payment error:', err);
    } finally {
      setQuickPayLoading(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 p-3 sm:p-4 max-w-2xl mx-auto">
      {/* 1. Agreement Period Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-4 rounded-3xl shadow-md border border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200 block">
              Agreement Period
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">
              {expense.period || AGREEMENT_PERIOD}
            </h2>
            <p className="text-[11px] text-indigo-100 flex items-center gap-1.5 mt-0.5">
              <span>Total Room Capacity:</span>
              <span className="font-bold bg-white/20 px-1.5 py-0.2 rounded-md">
                {members.length}/{MAX_MEMBERS} Roommates
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToAdmin}
          className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1 border border-white/20"
        >
          <span>Manage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. My Account Hero Card (Status: Paid [green], Partial [yellow], Unpaid [red]) */}
      {currentUser && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 relative overflow-hidden">
          {/* Accent top ribbon based on status */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              myStatus === 'Paid'
                ? 'bg-emerald-500'
                : myStatus === 'Partial'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />

          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">My Account</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  #{currentUser.memberOrder} • {currentUser.role}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{currentUser.name}</h3>
            </div>

            {/* Status Pill: Paid (green), Partial (yellow), Unpaid (red) */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center space-x-1.5 border shadow-sm ${
                myStatus === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : myStatus === 'Partial'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {myStatus === 'Paid' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : myStatus === 'Partial' ? (
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className="uppercase text-[11px]">{myStatus}</span>
            </div>
          </div>

          {/* Key Metrics: My Due, My Paid, My Balance */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-3">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">My Due</span>
              <span className="text-base font-extrabold text-slate-800">
                ₹{myDue.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">My Paid</span>
              <span className="text-base font-extrabold text-emerald-600">
                ₹{myPaid.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">My Balance</span>
              <span
                className={`text-base font-extrabold ${
                  myBalance === 0 ? 'text-slate-700' : 'text-rose-600'
                }`}
              >
                ₹{myBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* User's Bill Contributions */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Assigned Bills:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                  currentUser.paysRent
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                }`}
              >
                🏠 Rent
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                  currentUser.paysCurrent
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                }`}
              >
                ⚡ Current Bill
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                  currentUser.paysWifi
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                }`}
              >
                📶 WiFi
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                  currentUser.paysOther
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                }`}
              >
                📦 Other
              </span>
            </div>
          </div>

          {/* Feature 5: Quick Payment Buttons (+100, +500, +1000) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Instant Payment:</span>
              </span>
              <span className="text-[10px] text-slate-400">Updates balance automatically</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickAdd(100)}
                disabled={quickPayLoading !== null}
                className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center justify-center shadow-xs"
              >
                {quickPayLoading === 100 ? '...' : '+₹100'}
              </button>
              <button
                onClick={() => handleQuickAdd(500)}
                disabled={quickPayLoading !== null}
                className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center justify-center shadow-xs"
              >
                {quickPayLoading === 500 ? '...' : '+₹500'}
              </button>
              <button
                onClick={() => handleQuickAdd(1000)}
                disabled={quickPayLoading !== null}
                className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center justify-center shadow-xs"
              >
                {quickPayLoading === 1000 ? '...' : '+₹1000'}
              </button>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center"
              >
                Custom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Total Expense Overview Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Oct - Dec 2026 Room Budget
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-slate-900">
                ₹{breakdown.totalExpense.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">Total Room Expense</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-400 block">Room Collected</span>
            <span className="text-sm font-bold text-emerald-600">
              ₹{totalCollected.toLocaleString()} ({collectionPercentage}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${collectionPercentage}%` }}
          />
        </div>

        {/* Breakdown Equation: Total Expense = Rent + Current Bill + WiFi + Other */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Rent */}
          <div className="p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-bold flex items-center gap-1">
                <Home className="w-3.5 h-3.5" /> Rent
              </span>
              <span className="text-[10px] font-medium bg-white px-1.5 py-0.2 rounded-md text-indigo-600">
                {breakdown.rentPayersCount} payers
              </span>
            </div>
            <div className="text-sm font-black text-indigo-950">
              ₹{breakdown.rentTotal.toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
              ₹{breakdown.rentPerPerson} / person
            </div>
          </div>

          {/* Current Bill */}
          <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-xs font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Current
              </span>
              <span className="text-[10px] font-medium bg-white px-1.5 py-0.2 rounded-md text-amber-700">
                {breakdown.currentPayersCount} payers
              </span>
            </div>
            <div className="text-sm font-black text-amber-950">
              ₹{breakdown.currentTotal.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
              ₹{breakdown.currentPerPerson} / person
            </div>
          </div>

          {/* WiFi */}
          <div className="p-2.5 rounded-2xl bg-cyan-50/70 border border-cyan-100">
            <div className="flex items-center justify-between text-cyan-800 mb-1">
              <span className="text-xs font-bold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" /> WiFi
              </span>
              <span className="text-[10px] font-medium bg-white px-1.5 py-0.2 rounded-md text-cyan-700">
                {breakdown.wifiPayersCount} payers
              </span>
            </div>
            <div className="text-sm font-black text-cyan-950">
              ₹{breakdown.wifiTotal.toLocaleString()}
            </div>
            <div className="text-[10px] text-cyan-700 font-medium mt-0.5">
              ₹{breakdown.wifiPerPerson} / person
            </div>
          </div>

          {/* Other */}
          <div className="p-2.5 rounded-2xl bg-purple-50/70 border border-purple-100">
            <div className="flex items-center justify-between text-purple-800 mb-1">
              <span className="text-xs font-bold flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Other
              </span>
              <span className="text-[10px] font-medium bg-white px-1.5 py-0.2 rounded-md text-purple-700">
                {breakdown.otherPayersCount} payers
              </span>
            </div>
            <div className="text-sm font-black text-purple-950">
              ₹{breakdown.otherTotal.toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-700 font-medium mt-0.5">
              ₹{breakdown.otherPerPerson} / person
            </div>
          </div>
        </div>
      </div>

      {/* 4. Per Person Cost Calculation Sheet */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>Per Person Cost Formula</span>
          </h4>
          <span className="text-[10px] text-slate-400">Divided among respective payers</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-600">Rent per head</span>
            <span className="font-semibold text-slate-900">
              ₹{breakdown.rentTotal} ÷ {breakdown.rentPayersCount || 1} ={' '}
              <b className="text-indigo-600 font-bold">₹{breakdown.rentPerPerson}</b>
            </span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-600">Electricity / Current Bill per head</span>
            <span className="font-semibold text-slate-900">
              ₹{breakdown.currentTotal} ÷ {breakdown.currentPayersCount || 1} ={' '}
              <b className="text-amber-600 font-bold">₹{breakdown.currentPerPerson}</b>
            </span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-600">WiFi Internet per head</span>
            <span className="font-semibold text-slate-900">
              ₹{breakdown.wifiTotal} ÷ {breakdown.wifiPayersCount || 1} ={' '}
              <b className="text-cyan-600 font-bold">₹{breakdown.wifiPerPerson}</b>
            </span>
          </div>
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-600">Other expenses per head</span>
            <span className="font-semibold text-slate-900">
              ₹{breakdown.otherTotal} ÷ {breakdown.otherPayersCount || 1} ={' '}
              <b className="text-purple-600 font-bold">₹{breakdown.otherPerPerson}</b>
            </span>
          </div>
          <div className="pt-2 flex items-center justify-between font-bold bg-slate-50/80 -mx-4 px-4 py-2 mt-1 rounded-xl">
            <span className="text-slate-900">Max Per Person (If paying all 4)</span>
            <span className="text-indigo-700 text-sm">
              ₹{(
                breakdown.rentPerPerson +
                breakdown.currentPerPerson +
                breakdown.wifiPerPerson +
                breakdown.otherPerPerson
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Roommates Quick Roster preview */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Roommates ({members.length}/{MAX_MEMBERS})
            </h4>
          </div>
          <button
            onClick={onNavigateToMembers}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {members.slice(0, 4).map((m) => {
            const due = calculateMemberDue(m, breakdown);
            const status = getPaymentStatus(due, m.paidAmount);
            return (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                    style={{ backgroundColor: m.avatarColor || '#4F46E5' }}
                  >
                    #{m.memberOrder}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Paid: ₹{m.paidAmount} / Due: ₹{due}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : status === 'Partial'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Recent Payments Log */}
      {payments.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Recent Payment Activity</span>
          </h4>
          <div className="space-y-1.5">
            {payments.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">{p.memberName}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {p.note || 'Payment'}
                  </span>
                </div>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  +₹{p.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {currentUser && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          targetMember={currentUser}
          currentDue={myDue}
          recordedBy={currentUser.name}
        />
      )}
    </div>
  );
};
