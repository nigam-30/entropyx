import React from 'react';
import { ShieldCheck, Zap, Lock, Unlock } from 'lucide-react';

export default function Header({
  backendHealth,
  activeTab = 'generator',
  onTabChange,
  vaultCount = 0,
  isVaultUnlocked = false,
}) {
  const isHealthy = Boolean(backendHealth);

  return (
    <header className="flex flex-col items-center justify-center gap-1.5 pt-0 pb-1">
      {/* Clean Centered Branding */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-4.5 h-4.5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#161B33]">EntropyX</h1>
      </div>

      {/* Centered Segmented View Switcher: Generator vs Encrypted Vault */}
      <div className="mt-1 flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => onTabChange('generator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'generator'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Generator</span>
        </button>

        <button
          onClick={() => onTabChange('vault')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isVaultUnlocked ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-teal-600" />
              <span>Vault</span>
              {vaultCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono font-bold">
                  {vaultCount}
                </span>
              )}
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Vault</span>
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 border border-amber-200">
                Locked
              </span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
