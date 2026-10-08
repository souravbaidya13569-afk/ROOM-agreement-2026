import React, { useState } from 'react';
import { User, Phone, Lock, UserPlus, LogIn, Shield, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { Member, UserRole } from '../types';
import { registerMember, MAX_MEMBERS, AGREEMENT_PERIOD } from '../services/roomService';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  members: Member[];
  onSelectUser: (member: Member) => void;
  requireAuthToContinue?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  members,
  onSelectUser,
  requireAuthToContinue = false,
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(members.length === 0);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCount = members.length;
  const isFull = currentCount >= MAX_MEMBERS;

  let nextRole: UserRole = 'Member';
  if (currentCount === 0) {
    nextRole = 'Admin';
  } else if (currentCount === 1 || currentCount === 2) {
    nextRole = 'Editor';
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !mobile.trim() || !password.trim()) {
      setErrorMsg('Please fill in Name, Mobile number, and Password.');
      return;
    }

    if (isFull) {
      setErrorMsg(`Cannot register: Room agreement is at maximum capacity (${MAX_MEMBERS} members).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const createdMember = await registerMember(name, mobile, password, members);
      onSelectUser(createdMember);
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMobile = mobile.trim();
    const found = members.find((m) => m.mobile === cleanMobile);

    if (!found) {
      setErrorMsg('No member found with this Mobile number. Please register first.');
      return;
    }

    if (found.password && found.password !== password.trim()) {
      setErrorMsg('Incorrect password. Please try again.');
      return;
    }

    onSelectUser(found);
    onClose?.();
  };

  const handleQuickDemoLogin = (member: Member) => {
    onSelectUser(member);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 text-white p-5 text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-inner">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Room Agreement 2026</h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            Agreement Period: {AGREEMENT_PERIOD}
          </p>

          {/* Role Allocation Notice */}
          <div className="mt-3 bg-indigo-950/60 rounded-xl p-2.5 text-[11px] text-indigo-200 text-left border border-indigo-700/50">
            <div className="font-semibold text-white flex items-center justify-between mb-1">
              <span>Automatic Role Assignment:</span>
              <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded-full text-white">
                {currentCount}/{MAX_MEMBERS} Members
              </span>
            </div>
            <ul className="space-y-0.5 text-[10px] text-indigo-200">
              <li>• 1st User: <b className="text-amber-300">Admin</b> (Full control)</li>
              <li>• Next 2 Users: <b className="text-cyan-300">Editor</b> (Expenses & payments)</li>
              <li>• Rest 20 Users: <b className="text-slate-300">Member</b> (View & personal dues)</li>
            </ul>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              !isRegister
                ? 'border-indigo-600 text-indigo-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              isRegister
                ? 'border-indigo-600 text-indigo-900 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New ({currentCount}/{MAX_MEMBERS})</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isRegister ? (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {isFull ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs text-center">
                  <p className="font-bold text-sm">Room Agreement is Full</p>
                  <p className="text-[11px] mt-1">
                    All 23 member slots for Oct-Dec 2026 have been registered. Please select an existing user to login.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                    <span>Next Member Slot: <b>#{currentCount + 1} of 23</b></span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        nextRole === 'Admin'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : nextRole === 'Editor'
                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}
                    >
                      Will be {nextRole}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isFull}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? 'Creating account...' : `Register as ${nextRole}`}
                  </button>
                </>
              )}
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter registered mobile"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            </form>
          )}

          {/* Quick Demo Switcher (Instant test for Admin, Editor, Member) */}
          {members.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Select Registered Member (Reviewer Shortcut):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(m)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                        #{m.memberOrder}
                      </span>
                      <span className="font-medium text-slate-800">{m.name}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        m.role === 'Admin'
                          ? 'bg-amber-100 text-amber-800'
                          : m.role === 'Editor'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
