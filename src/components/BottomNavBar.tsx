import React from 'react';
import { LayoutDashboard, Users, Receipt, History } from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 'dashboard' | 'members' | 'admin' | 'history';

interface BottomNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  membersCount: number;
  userRole?: UserRole;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onTabChange,
  membersCount,
  userRole,
}) => {
  const tabs = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'members' as NavTab,
      label: 'Members',
      icon: Users,
      badge: `${membersCount}/23`,
    },
    {
      id: 'admin' as NavTab,
      label: userRole === 'Member' ? 'Expenses' : 'Admin',
      icon: Receipt,
      badge: userRole === 'Admin' ? 'Admin' : userRole === 'Editor' ? 'Editor' : null,
    },
    {
      id: 'history' as NavTab,
      label: 'History',
      icon: History,
      badge: null,
    },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 sticky bottom-0 z-40 shadow-lg">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all group relative focus:outline-none"
            >
              {/* Material 3 Active Pill Indicator */}
              <div
                className={`relative px-5 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />

                {/* Badge if any */}
                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      tab.id === 'admin'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-indigo-600 text-white border-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-indigo-900 font-bold' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Android Gesture Bar */}
      <div className="h-4 flex items-center justify-center bg-slate-50">
        <div className="w-28 h-1 bg-slate-300 rounded-full"></div>
      </div>
    </nav>
  );
};
