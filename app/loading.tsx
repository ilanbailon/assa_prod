import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-clear-day z-[999] flex flex-col items-center justify-center font-sf-pro">
      <div className="relative flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/40 backdrop-blur-xs border border-white/20 shadow-xl max-w-sm w-full mx-4">
        {/* Ring Spinner & Pulse Logo combo */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 border-4 border-mosque/20 border-t-mosque rounded-full animate-spin" />
          <span className="material-symbols-outlined text-2xl text-mosque animate-pulse select-none">
            lan
          </span>
        </div>
        
        {/* Loading text */}
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Control ASSA
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Cargando información...
          </p>
        </div>
      </div>
    </div>
  );
}
