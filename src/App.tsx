/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { testConnection } from './firebase';
import {
  Member,
  ExpenseData,
  PaymentLog,
  AgreementHistory,
  ExpenseBreakdown
} from './types';
import {
  subscribeToMembers,
  subscribeToCurrentExpense,
  subscribeToPayments,
  subscribeToHistory,
  calculateBreakdown,
  AGREEMENT_PERIOD,
  MAX_MEMBERS,
  seedDemoMembersIfEmpty
} from './services/roomService';
import { AndroidHeader } from './components/AndroidHeader';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { MembersView } from './components/MembersView';
import { AdminExpensesView } from './components/AdminExpensesView';
import { HistoryView } from './components/HistoryView';
import { AuthModal } from './components/AuthModal';
import { AppInfoModal } from './components/AppInfoModal';
import { Shield, Sparkles, Loader2, Smartphone } from 'lucide-react';

const CURRENT_USER_STORAGE_KEY = 'room_agreement_user_id';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Firestore Real-time State
  const [members, setMembers] = useState<Member[]>([]);
  const [expense, setExpense] = useState<ExpenseData>({
    period: AGREEMENT_PERIOD,
    rent: 24000,
    currentBill: 3600,
    wifi: 1500,
    other: 900,
  });
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [historyList, setHistoryList] = useState<AgreementHistory[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Test Firestore Connection on Boot (Required by Firebase Skill)
  useEffect(() => {
    testConnection();
  }, []);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setIsLoading(true);

    const unsubMembers = subscribeToMembers((updatedMembers) => {
      setMembers(updatedMembers);
      setIsLoading(false);
    });

    const unsubExpense = subscribeToCurrentExpense((updatedExpense) => {
      setExpense(updatedExpense);
    });

    const unsubPayments = subscribeToPayments((updatedPayments) => {
      setPayments(updatedPayments);
    });

    const unsubHistory = subscribeToHistory((updatedHistory) => {
      setHistoryList(updatedHistory);
    });

    return () => {
      unsubMembers();
      unsubExpense();
      unsubPayments();
      unsubHistory();
    };
  }, []);

  // Compute Current User Object
  const currentUser = useMemo(() => {
    if (!currentUserId || members.length === 0) return null;
    return members.find((m) => m.id === currentUserId) || null;
  }, [currentUserId, members]);

  // Compute Expense Breakdown Per Person
  const breakdown: ExpenseBreakdown = useMemo(() => {
    return calculateBreakdown(expense, members);
  }, [expense, members]);

  // If no user is logged in after loading finishes, automatically prompt login/register
  useEffect(() => {
    if (!isLoading && !currentUser && members.length >= 0) {
      setIsAuthModalOpen(true);
    }
  }, [isLoading, currentUser, members.length]);

  const handleSelectUser = (member: Member) => {
    setCurrentUserId(member.id);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, member.id);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    setIsAuthModalOpen(true);
  };

  const handleSeedDemo = async () => {
    await seedDemoMembersIfEmpty();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Outer Shell: Adaptive Mobile/Desktop Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[430px] my-0 sm:my-4 h-screen sm:h-[920px] rounded-none sm:rounded-[42px] shadow-2xl border-0 sm:border-[8px] border-slate-800'
            : 'max-w-3xl min-h-screen sm:my-4 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-700'
        } bg-slate-100 flex flex-col overflow-hidden relative`}
      >
        {/* Android Top Header */}
        <AndroidHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenInfo={() => setIsInfoModalOpen(true)}
          isPhoneFrame={isPhoneFrame}
          onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
          period={expense.period || AGREEMENT_PERIOD}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-6 text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold">Connecting to Room Firestore database...</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  currentUser={currentUser}
                  expense={expense}
                  breakdown={breakdown}
                  members={members}
                  payments={payments}
                  onNavigateToMembers={() => setCurrentTab('members')}
                  onNavigateToAdmin={() => setCurrentTab('admin')}
                />
              )}

              {currentTab === 'members' && (
                <MembersView
                  currentUser={currentUser}
                  members={members}
                  breakdown={breakdown}
                  onOpenRegister={() => setIsAuthModalOpen(true)}
                />
              )}

              {currentTab === 'admin' && (
                <AdminExpensesView
                  currentUser={currentUser}
                  expense={expense}
                  breakdown={breakdown}
                  members={members}
                  onNavigateToHistory={() => setCurrentTab('history')}
                />
              )}

              {currentTab === 'history' && (
                <HistoryView
                  historyList={historyList}
                  currentUser={currentUser}
                  expense={expense}
                  members={members}
                  breakdown={breakdown}
                />
              )}
            </>
          )}
        </main>

        {/* Android Material 3 Bottom Navigation Bar */}
        <BottomNavBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          membersCount={members.length}
          userRole={currentUser?.role}
        />

        {/* Modals */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            if (currentUser) setIsAuthModalOpen(false);
          }}
          members={members}
          onSelectUser={handleSelectUser}
          requireAuthToContinue={!currentUser}
        />

        <AppInfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
        />
      </div>
    </div>
  );
}
