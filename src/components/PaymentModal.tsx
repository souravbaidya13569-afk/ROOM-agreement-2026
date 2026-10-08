import React, { useState } from 'react';
import { X, CheckCircle2, IndianRupee, Sparkles, AlertCircle } from 'lucide-react';
import { Member } from '../types';
import { addPayment, getPaymentStatus } from '../services/roomService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember: Member;
  currentDue: number;
  recordedBy: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  targetMember,
  currentDue,
  recordedBy,
}) => {
  const [amount, setAmount] = useState<number>(500);
  const [customInput, setCustomInput] = useState<string>('500');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPaid = targetMember.paidAmount || 0;
  const currentBalance = Math.max(0, currentDue - currentPaid);
  const projectedPaid = currentPaid + (amount || 0);
  const projectedBalance = Math.max(0, currentDue - projectedPaid);
  const currentStatus = getPaymentStatus(currentDue, currentPaid);
  const projectedStatus = getPaymentStatus(currentDue, projectedPaid);

  const handlePreset = (val: number) => {
    setAmount(val);
    setCustomInput(val.toString());
    setErrorMsg(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
      setErrorMsg(null);
    } else {
      setAmount(0);
    }
  };

  const handlePayRemaining = () => {
    if (currentBalance > 0) {
      setAmount(currentBalance);
      setCustomInput(currentBalance.toString());
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addPayment(
        targetMember.id,
        targetMember.name,
        amount,
        targetMember.paidAmount,
        recordedBy,
        note
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Add Payment</h3>
              <p className="text-xs text-indigo-100">
                For {targetMember.name} (#{targetMember.memberOrder} • {targetMember.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current State Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Total Due</span>
              <span className="text-sm font-bold text-slate-800">₹{currentDue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Already Paid</span>
              <span className="text-sm font-bold text-emerald-600">₹{currentPaid.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Balance</span>
              <span className="text-sm font-bold text-rose-600">₹{currentBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Preset Buttons: Feature 5: +100, +500, +1000 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Quick Add Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePreset(100)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                  amount === 100
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-700'
                }`}
              >
                +₹100
              </button>
              <button
                type="button"
                onClick={() => handlePreset(500)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                  amount === 500
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-700'
                }`}
              >
                +₹500
              </button>
              <button
                type="button"
                onClick={() => handlePreset(1000)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                  amount === 1000
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-700'
                }`}
              >
                +₹1,000
              </button>
              {currentBalance > 0 && (
                <button
                  type="button"
                  onClick={handlePayRemaining}
                  title="Pay full remaining balance"
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                    amount === currentBalance
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                  }`}
                >
                  Full Due
                </button>
              )}
            </div>
          </div>

          {/* Custom Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={customInput}
                onChange={handleInputChange}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 text-base"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Note / Method (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-700"
              placeholder="e.g. GPay UPI, PhonePe, Cash, Bank Transfer"
            />
          </div>

          {/* Projected Status Preview */}
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[10px]">Projected Balance</span>
              <span className="font-bold text-indigo-900 text-sm">
                ₹{projectedBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-slate-500">Status will become:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-xs uppercase ${
                  projectedStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : projectedStatus === 'Partial'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {projectedStatus}
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span className="text-sm">Recording payment...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Record ₹{amount.toLocaleString()}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
