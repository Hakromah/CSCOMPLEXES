'use client';

import { Shield, LogOut, Clock } from 'lucide-react';

interface SessionTimeoutModalProps {
  show: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export default function SessionTimeoutModal({
  show, countdown, onStayLoggedIn, onLogoutNow
}: SessionTimeoutModalProps) {
  if (!show) return null;

  const urgency = countdown <= 15;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${urgency ? 'bg-rose-600' : 'bg-amber-500'} transition-colors duration-500`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Security Alert</p>
              <h2 className="text-lg font-black text-white leading-tight">Session Expiring</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            You have been inactive for <strong className="text-slate-900">10 minutes</strong>. 
            For your security, you will be automatically logged out in:
          </p>

          {/* Countdown circle */}
          <div className="flex justify-center">
            <div className={`relative flex items-center justify-center w-24 h-24 rounded-full border-4 ${urgency ? 'border-rose-500 bg-rose-50' : 'border-amber-400 bg-amber-50'} transition-colors duration-500`}>
              <Clock className={`absolute w-5 h-5 ${urgency ? 'text-rose-400' : 'text-amber-400'} top-3`} />
              <span className={`text-4xl font-black ${urgency ? 'text-rose-600' : 'text-amber-600'}`}>
                {countdown}
              </span>
              <span className={`text-[10px] font-black uppercase ${urgency ? 'text-rose-400' : 'text-amber-400'} absolute bottom-3`}>
                seconds
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-semibold uppercase tracking-wider">
            Any activity will keep your session active
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onStayLoggedIn}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 hover:scale-[1.02]"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogoutNow}
            className="flex gap-2 items-center justify-center px-5 h-12 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 border border-slate-200 hover:border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
