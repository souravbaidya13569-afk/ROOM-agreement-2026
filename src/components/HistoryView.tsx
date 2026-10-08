import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Calendar,
  IndianRupee,
  Home,
  Zap,
  Wifi,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { AgreementHistory, ExpenseData, Member, ExpenseBreakdown } from '../types';
import { archiveAgreement, AGREEMENT_PERIOD } from '../services/roomService';

interface HistoryViewProps {
  historyList: AgreementHistory[];
  currentUser: Member | null;
  expense: ExpenseData;
  members: Member[];
  breakdown: ExpenseBreakdown;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyList,
  currentUser,
  expense,
  members,
  breakdown,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  const canArchive = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const handleSnapshotNow = async () => {
    if (!canArchive) return;
    setIsCreatingSnapshot(true);
    try {
      await archiveAgreement(
        expense,
        members,
        breakdown,
        currentUser?.name || 'Admin',
        expense.period || AGREEMENT_PERIOD,
        `Snapshot created on ${new Date().toLocaleDateString()}`
      );
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 p-3 sm:p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Agreement History</h2>
            <p className="text-xs text-slate-500">
              Archived past room agreement periods and settlements
            </p>
          </div>
        </div>

        {canArchive && (
          <button
            onClick={handleSnapshotNow}
            disabled={isCreatingSnapshot}
            className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isCreatingSnapshot ? 'Saving...' : 'Save Snapshot'}</span>
          </button>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        {historyList.map((record) => {
          const isExpanded = expandedId === record.id;
          const summary = record.membersSummary;

          return (
            <div
              key={record.id}
              className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                className="cursor-pointer flex items-start justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{record.period}</h3>
                    <p className="text-[11px] text-slate-500">
                      Archived by {record.archivedBy} on{' '}
                      {new Date(record.archivedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Total Expense</span>
                    <span className="font-black text-slate-900 text-sm">
                      ₹{record.totalExpense.toLocaleString()}
                    </span>
                  </div>
                  <button className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Settlement Summary Pill Strip */}
              {summary && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Total Due</span>
                    <span className="font-bold text-slate-800">₹{summary.totalDue?.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <span className="text-[10px] text-emerald-700 block">Collected</span>
                    <span className="font-bold text-emerald-700">₹{summary.totalCollected?.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Members</span>
                    <span className="font-bold text-slate-800">{summary.totalMembers} Roommates</span>
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && record.expenseSnapshot && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-150">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                    Expense Breakdown at Snapshot:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-indigo-50/70 rounded-xl border border-indigo-100">
                      <span className="text-[10px] text-indigo-700 block">🏠 Rent</span>
                      <span className="font-bold text-indigo-950">
                        ₹{record.expenseSnapshot.rent.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-amber-800 block">⚡ Current</span>
                      <span className="font-bold text-amber-950">
                        ₹{record.expenseSnapshot.currentBill.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-cyan-50/70 rounded-xl border border-cyan-100">
                      <span className="text-[10px] text-cyan-800 block">📶 WiFi</span>
                      <span className="font-bold text-cyan-950">
                        ₹{record.expenseSnapshot.wifi.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-purple-50/70 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-purple-800 block">📦 Other</span>
                      <span className="font-bold text-purple-950">
                        ₹{record.expenseSnapshot.other.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{record.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {historyList.length === 0 && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <Archive className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">No Previous Agreements Saved Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When a room agreement quarter concludes, Admin or Editor can archive the snapshot here for legal and financial records.
            </p>
            {canArchive && (
              <button
                onClick={handleSnapshotNow}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Current Period (Oct-Dec 2026)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
