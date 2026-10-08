import React from 'react';
import { Wifi, BatteryMedium, Signal, Shield, User, LogOut, Info, Smartphone, Monitor } from 'lucide-react';
import { Member } from '../types';

interface AndroidHeaderProps {
  currentUser: Member | null;
  onLogout: () => void;
  onOpenInfo: () => void;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  period: string;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = ({
  currentUser,
  onLogout,
  onOpenInfo,
  isPhoneFrame,
  onTogglePhoneFrame,
  period,
}) => {
  return (
    <header className="bg-indigo-900 text-white select-none sticky top-0 z-40 shadow-md">
      {/* Android Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 text-xs font-mono tracking-wider bg-indigo-950/80 text-indigo-200">
        <span className="font-semibold text-white">10:55</span>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold tracking-tighter bg-indigo-800/80 px-1 rounded">5G</span>
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px]">100%</span>
        </div>
      </div>

      {/* Material 3 App Bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-indigo-800/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-400 flex items-center justify-center shadow-inner">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Room Agreement
              </h1>
              <span className="text-[10px] bg-indigo-700/80 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                {period}
              </span>
            </div>
            <p className="text-[11px] text-indigo-300 font-mono flex items-center gap-1">
              <span>com.example.roomagreement</span>
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-2">
          {/* Frame Toggle */}
          <button
            onClick={onTogglePhoneFrame}
            title={isPhoneFrame ? 'Switch to Full Screen' : 'Switch to Android Mobile Frame'}
            className="p-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-700 text-indigo-200 hover:text-white transition-colors"
          >
            {isPhoneFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* Info Modal Button */}
          <button
            onClick={onOpenInfo}
            title="App Details & Permissions"
            className="p-2 rounded-xl bg-indigo-800/60 hover:bg-indigo-700 text-indigo-200 hover:text-white transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* User Profile Chip */}
          {currentUser && (
            <div className="flex items-center space-x-2 bg-indigo-800/80 pl-2 pr-1 py-1 rounded-full border border-indigo-700/60">
              <div className="flex flex-col text-right leading-none pr-1">
                <span className="text-xs font-semibold text-white max-w-[80px] truncate">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    currentUser.role === 'Admin'
                      ? 'text-amber-300'
                      : currentUser.role === 'Editor'
                      ? 'text-cyan-300'
                      : 'text-indigo-200'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out or Switch Account"
                className="w-7 h-7 rounded-full bg-indigo-700 hover:bg-rose-600 flex items-center justify-center text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
