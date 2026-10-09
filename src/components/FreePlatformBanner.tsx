import React from 'react';
import { Shield, CheckCircle, Zap } from 'lucide-react';

export const FreePlatformBanner: React.FC = () => {
  return (
    <div className="bg-[#121319] border-y border-[#22242d] py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase flex items-center justify-center md:justify-start gap-2">
              <span>100% Free Sports Intelligence Platform</span>
              <span className="hidden sm:inline text-yellow-400 font-bold">·</span>
              <span className="hidden sm:inline text-yellow-400 text-xs font-semibold">
                No VIP Fees Ever
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Verified statistical banker predictions, worldwide community chat, live data feeds, and booking code converters are completely free for all sports fans worldwide.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Zero Subscription</span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Transparent Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};
