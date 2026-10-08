import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Check,
  Lock,
  Plus,
  CreditCard,
  Phone,
  Shield,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { Member, ExpenseBreakdown } from '../types';
import {
  calculateMemberDue,
  getPaymentStatus,
  updateMemberBills,
  MAX_MEMBERS
} from '../services/roomService';
import { PaymentModal } from './PaymentModal';

interface MembersViewProps {
  currentUser: Member | null;
  members: Member[];
  breakdown: ExpenseBreakdown;
  onOpenRegister: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  currentUser,
  members,
  breakdown,
  onOpenRegister,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Member | null>(null);
  const [updatingBillId, setUpdatingBillId] = useState<string | null>(null);

  const canEditBills = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';
  const canAddPaymentForOthers = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const handleToggleBill = async (
    member: Member,
    field: 'paysRent' | 'paysWifi' | 'paysCurrent' | 'paysOther'
  ) => {
    if (!canEditBills) return;

    setUpdatingBillId(`${member.id}_${field}`);
    try {
      const updatedValue = !member[field];
      await updateMemberBills(member.id, { [field]: updatedValue });
    } catch (err) {
      console.error('Failed to update member bill responsibility:', err);
    } finally {
      setUpdatingBillId(null);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mobile.includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter !== 'All') {
      const due = calculateMemberDue(m, breakdown);
      const status = getPaymentStatus(due, m.paidAmount);
      return status === statusFilter;
    }

    return true;
  });

  return (
    <div className="space-y-4 pb-24 p-3 sm:p-4 max-w-2xl mx-auto">
      {/* Header with Slot Counter and Invite Button */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-extrabold text-slate-900">Room Members</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {members.length}/{MAX_MEMBERS} Joined
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {MAX_MEMBERS - members.length > 0
              ? `${MAX_MEMBERS - members.length} spots remaining for Oct-Dec 2026 agreement.`
              : 'Room is at maximum capacity (23/23).'}
          </p>
        </div>

        {members.length < MAX_MEMBERS && (
          <button
            onClick={onOpenRegister}
            className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Permissions Indicator Banner */}
      <div
        className={`p-3 rounded-2xl text-xs flex items-center justify-between border ${
          canEditBills
            ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200'
            : 'bg-slate-50 text-slate-600 border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          {canEditBills ? (
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span>
            {canEditBills ? (
              <>
                Logged in as <b>{currentUser?.role}</b>. You can edit bill checkboxes and record payments.
              </>
            ) : (
              <>
                Logged in as <b>Member</b>. Bill assignments are view-only (editable by Admin & Editor).
              </>
            )}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or mobile..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs shadow-xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards List */}
      <div className="space-y-3">
        {filteredMembers.map((member) => {
          const due = calculateMemberDue(member, breakdown);
          const paid = member.paidAmount || 0;
          const balance = Math.max(0, due - paid);
          const status = getPaymentStatus(due, paid);

          return (
            <div
              key={member.id}
              className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Member Order & Role Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-inner shrink-0"
                    style={{ backgroundColor: member.avatarColor || '#4F46E5' }}
                  >
                    #{member.memberOrder}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          member.role === 'Admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : member.role === 'Editor'
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{member.mobile}</span>
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                <div
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 border ${
                    status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : status === 'Partial'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {status === 'Paid' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : status === 'Partial' ? (
                    <Clock className="w-3 h-3 text-amber-600" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                  )}
                  <span>{status}</span>
                </div>
              </div>

              {/* Dues & Payment Metrics */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Total Due</span>
                  <span className="font-bold text-slate-900">₹{due.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Paid Amount</span>
                  <span className="font-bold text-emerald-600">₹{paid.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Remaining Due</span>
                  <span
                    className={`font-bold ${
                      balance === 0 ? 'text-slate-600' : 'text-rose-600'
                    }`}
                  >
                    ₹{balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Feature 3: Checkboxes for what bills they pay (Rent, WiFi, Current, Other) */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Assigned Bills (Who Pays What):
                  </span>
                  {!canEditBills && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Read-only
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {/* Rent */}
                  <label
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs transition-colors select-none ${
                      member.paysRent
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    } ${canEditBills ? 'cursor-pointer hover:border-indigo-400' : 'cursor-not-allowed opacity-90'}`}
                  >
                    <input
                      type="checkbox"
                      checked={member.paysRent}
                      disabled={!canEditBills}
                      onChange={() => handleToggleBill(member, 'paysRent')}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>🏠 Rent</span>
                  </label>

                  {/* WiFi */}
                  <label
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs transition-colors select-none ${
                      member.paysWifi
                        ? 'bg-cyan-50/80 border-cyan-200 text-cyan-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    } ${canEditBills ? 'cursor-pointer hover:border-cyan-400' : 'cursor-not-allowed opacity-90'}`}
                  >
                    <input
                      type="checkbox"
                      checked={member.paysWifi}
                      disabled={!canEditBills}
                      onChange={() => handleToggleBill(member, 'paysWifi')}
                      className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>📶 WiFi</span>
                  </label>

                  {/* Current */}
                  <label
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs transition-colors select-none ${
                      member.paysCurrent
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    } ${canEditBills ? 'cursor-pointer hover:border-amber-400' : 'cursor-not-allowed opacity-90'}`}
                  >
                    <input
                      type="checkbox"
                      checked={member.paysCurrent}
                      disabled={!canEditBills}
                      onChange={() => handleToggleBill(member, 'paysCurrent')}
                      className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>⚡ Current</span>
                  </label>

                  {/* Other */}
                  <label
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs transition-colors select-none ${
                      member.paysOther
                        ? 'bg-purple-50/80 border-purple-200 text-purple-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    } ${canEditBills ? 'cursor-pointer hover:border-purple-400' : 'cursor-not-allowed opacity-90'}`}
                  >
                    <input
                      type="checkbox"
                      checked={member.paysOther}
                      disabled={!canEditBills}
                      onChange={() => handleToggleBill(member, 'paysOther')}
                      className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>📦 Other</span>
                  </label>
                </div>
              </div>

              {/* Action Button: Feature 4 & 5: Editor/Admin can add payment */}
              {canAddPaymentForOthers && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => setSelectedMemberForPayment(member)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Add Payment (+₹)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
            No room members found matching your search.
          </div>
        )}
      </div>

      {/* Payment Modal for Selected Member */}
      {selectedMemberForPayment && (
        <PaymentModal
          isOpen={true}
          onClose={() => setSelectedMemberForPayment(null)}
          targetMember={selectedMemberForPayment}
          currentDue={calculateMemberDue(selectedMemberForPayment, breakdown)}
          recordedBy={currentUser?.name || 'Editor'}
        />
      )}
    </div>
  );
};
