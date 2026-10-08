import React from 'react';
import { X, Smartphone, Shield, CheckCircle, Database, Package, Code } from 'lucide-react';
import { MAX_MEMBERS, AGREEMENT_PERIOD } from '../services/roomService';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInfoModal: React.FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-snug">Room Agreement Android App</h3>
              <p className="text-xs text-indigo-200 font-mono">com.example.roomagreement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600">
          {/* Spec Badges */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100">
              <span className="text-[10px] text-indigo-600 font-bold uppercase block">Agreement Period</span>
              <span className="text-sm font-black text-indigo-950">{AGREEMENT_PERIOD}</span>
            </div>
            <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100">
              <span className="text-[10px] text-indigo-600 font-bold uppercase block">Max Capacity</span>
              <span className="text-sm font-black text-indigo-950">{MAX_MEMBERS} Roommates</span>
            </div>
          </div>

          {/* Role Hierarchy */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              Auto Role Assignment Matrix:
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span>• 1st Registered Member</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Admin</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• 2nd & 3rd Registered Members</span>
                <span className="font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">Editor (2 total)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• 4th to 23rd Registered Members</span>
                <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">Member (20 total)</span>
              </div>
            </div>
          </div>

          {/* Firestore Synchronized Collections */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] font-sans block">
              Firebase Real-Time Collections:
            </span>
            <p>• <b>members</b>: Roommate directory, roles, bill checkboxes, and paidAmount.</p>
            <p>• <b>expense/current</b>: Rent, Current Bill, WiFi, Other, and Period.</p>
            <p>• <b>payments</b>: Real-time payment logs with date & method.</p>
            <p>• <b>history</b>: Archived previous agreement quarters.</p>
          </div>

          {/* Android App Package Details */}
          <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl space-y-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-indigo-300 font-sans font-bold text-xs">
              <Code className="w-3.5 h-3.5" />
              <span>Android Manifest Metadata</span>
            </div>
            <p>package: com.example.roomagreement</p>
            <p>versionName: 1.0.0-oct-dec-2026</p>
            <p>targetSdkVersion: 35 (Android 15)</p>
            <p>uiFramework: Material 3 (Material You)</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
