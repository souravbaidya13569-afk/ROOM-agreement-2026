import React, { useState, useEffect } from 'react';
import {
  Shield,
  Receipt,
  Save,
  Archive,
  RefreshCw,
  Home,
  Zap,
  Wifi,
  Package,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles
} from 'lucide-react';
import { Member, ExpenseData, ExpenseBreakdown } from '../types';
import {
  updateExpenses,
  archiveAgreement,
  seedDemoMembersIfEmpty,
  AGREEMENT_PERIOD,
  MAX_MEMBERS
} from '../services/roomService';

interface AdminExpensesViewProps {
  currentUser: Member | null;
  expense: ExpenseData;
  breakdown: ExpenseBreakdown;
  members: Member[];
  onNavigateToHistory: () => void;
}

export const AdminExpensesView: React.FC<AdminExpensesViewProps> = ({
  currentUser,
  expense,
  breakdown,
  members,
  onNavigateToHistory,
}) => {
  const [rent, setRent] = useState<string>(expense.rent.toString());
  const [currentBill, setCurrentBill] = useState<string>(expense.currentBill.toString());
  const [wifi, setWifi] = useState<string>(expense.wifi.toString());
  const [other, setOther] = useState<string>(expense.other.toString());
  const [period, setPeriod] = useState<string>(expense.period || AGREEMENT_PERIOD);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [archiveNotes, setArchiveNotes] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setRent(expense.rent.toString());
    setCurrentBill(expense.currentBill.toString());
    setWifi(expense.wifi.toString());
    setOther(expense.other.toString());
    setPeriod(expense.period || AGREEMENT_PERIOD);
  }, [expense]);

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  // Live preview calculation based on input values
  const numRent = parseFloat(rent) || 0;
  const numCurrent = parseFloat(currentBill) || 0;
  const numWifi = parseFloat(wifi) || 0;
  const numOther = parseFloat(other) || 0;
  const previewTotal = numRent + numCurrent + numWifi + numOther;

  const previewRentPerPerson =
    breakdown.rentPayersCount > 0 ? (numRent / breakdown.rentPayersCount).toFixed(2) : '0';
  const previewCurrentPerPerson =
    breakdown.currentPayersCount > 0 ? (numCurrent / breakdown.currentPayersCount).toFixed(2) : '0';
  const previewWifiPerPerson =
    breakdown.wifiPayersCount > 0 ? (numWifi / breakdown.wifiPayersCount).toFixed(2) : '0';
  const previewOtherPerPerson =
    breakdown.otherPayersCount > 0 ? (numOther / breakdown.otherPayersCount).toFixed(2) : '0';

  const handleSaveExpenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      await updateExpenses(
        {
          rent: numRent,
          currentBill: numCurrent,
          wifi: numWifi,
          other: numOther,
          period,
        },
        currentUser?.name || 'Admin/Editor'
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update expenses in Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveCurrentAgreement = async () => {
    if (!canEdit) return;
    if (!window.confirm(`Archive current agreement snapshot for ${period}?`)) return;

    setIsArchiving(true);
    setErrorMsg(null);
    try {
      await archiveAgreement(
        expense,
        members,
        breakdown,
        currentUser?.name || 'Admin',
        period,
        archiveNotes || `Settlement snapshot for ${period}`
      );
      setArchiveSuccess(true);
      setTimeout(() => setArchiveSuccess(false), 3000);
      onNavigateToHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to archive agreement');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      await seedDemoMembersIfEmpty();
    } catch (err) {
      console.error('Error seeding demo data:', err);
    }
  };

  return (
    <div className="space-y-4 pb-24 p-3 sm:p-4 max-w-2xl mx-auto">
      {/* View Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Expense Management
            </h2>
            <p className="text-xs text-slate-500">
              Synced with Firestore document <code className="text-indigo-600 font-mono font-bold">expense/current</code>
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Notification */}
      <div
        className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border ${
          canEdit
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-amber-50 text-amber-900 border-amber-200'
        }`}
      >
        {canEdit ? (
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <span>
          {canEdit ? (
            <>
              You have <b>{currentUser?.role}</b> privileges. You can edit bill amounts and archive agreements.
            </>
          ) : (
            <>
              You are signed in as <b>Member</b>. Expense amounts can only be edited by Admin and Editor.
            </>
          )}
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Expenses successfully updated and synced in Firestore!</span>
        </div>
      )}

      {/* Expense Form */}
      <form onSubmit={handleSaveExpenses} className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Bill Amounts Configuration
          </span>
          <span className="text-xs font-black text-indigo-700">
            Total: ₹{previewTotal.toLocaleString()}
          </span>
        </div>

        {/* Agreement Period Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Agreement Period</span>
          </label>
          <input
            type="text"
            value={period}
            disabled={!canEdit}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="e.g. Oct - Dec 2026"
            required
          />
        </div>

        {/* 1. Rent Amount */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
            <span className="flex items-center gap-1.5">
              <Home className="w-4 h-4 text-indigo-600" />
              <span>Room Rent (₹)</span>
            </span>
            <span className="text-[11px] text-indigo-600">
              ÷ {breakdown.rentPayersCount} payers = <b>₹{previewRentPerPerson}/person</b>
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={rent}
            disabled={!canEdit}
            onChange={(e) => setRent(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="Enter total rent"
            required
          />
        </div>

        {/* 2. Current Bill Amount */}
        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Current / Electricity Bill (₹)</span>
            </span>
            <span className="text-[11px] text-amber-700">
              ÷ {breakdown.currentPayersCount} payers = <b>₹{previewCurrentPerPerson}/person</b>
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentBill}
            disabled={!canEdit}
            onChange={(e) => setCurrentBill(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="Enter electricity bill"
            required
          />
        </div>

        {/* 3. WiFi Amount */}
        <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-900">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-cyan-600" />
              <span>WiFi Internet Bill (₹)</span>
            </span>
            <span className="text-[11px] text-cyan-700">
              ÷ {breakdown.wifiPayersCount} payers = <b>₹{previewWifiPerPerson}/person</b>
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={wifi}
            disabled={!canEdit}
            onChange={(e) => setWifi(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-cyan-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="Enter WiFi bill"
            required
          />
        </div>

        {/* 4. Other Amount */}
        <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-600" />
              <span>Other Miscellaneous Expenses (₹)</span>
            </span>
            <span className="text-[11px] text-purple-700">
              ÷ {breakdown.otherPayersCount} payers = <b>₹{previewOtherPerPerson}/person</b>
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={other}
            disabled={!canEdit}
            onChange={(e) => setOther(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="Enter other expenses"
            required
          />
        </div>

        {/* Submit Save Button */}
        {canEdit && (
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
          >
            {isSaving ? (
              <span>Saving to Firestore...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Sync Expense Changes</span>
              </>
            )}
          </button>
        )}
      </form>

      {/* Feature 7: History Archival Section */}
      {canEdit && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center space-x-2">
            <Archive className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Archive Agreement Snapshot
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Save a permanent historical record of the current agreement ({period}), including all expenses and roommate settlement dues.
          </p>

          <input
            type="text"
            value={archiveNotes}
            onChange={(e) => setArchiveNotes(e.target.value)}
            placeholder="Optional archive settlement notes..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="button"
            onClick={handleArchiveCurrentAgreement}
            disabled={isArchiving}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Archive className="w-4 h-4 text-amber-400" />
            <span>{isArchiving ? 'Archiving...' : 'Save Current Agreement to History'}</span>
          </button>
        </div>
      )}

      {/* Room Rule Specs Summary */}
      <div className="bg-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-sm space-y-2 text-xs">
        <h4 className="font-bold flex items-center gap-2 text-indigo-200 uppercase tracking-wider text-[11px]">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>Room Agreement Specifications</span>
        </h4>
        <ul className="space-y-1 text-slate-300 text-[11px] divide-y divide-indigo-900/60">
          <li className="pt-1">• <b>Max Roommates:</b> {MAX_MEMBERS} members maximum.</li>
          <li className="pt-1">• <b>1st Member:</b> Admin (full permissions).</li>
          <li className="pt-1">• <b>2nd & 3rd Members:</b> Editor (edit bills & add payments).</li>
          <li className="pt-1">• <b>4th to 23rd Members:</b> Member (view only).</li>
          <li className="pt-1">• <b>Agreement Period:</b> {AGREEMENT_PERIOD}.</li>
          <li className="pt-1">• <b>Package:</b> <code className="text-indigo-300">com.example.roomagreement</code>.</li>
        </ul>

        {members.length === 0 && (
          <div className="pt-2">
            <button
              onClick={handleSeedDemoData}
              className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Seed Sample Roommates (Admin, 2 Editors, Members)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
