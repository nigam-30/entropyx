import React, { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Palette, Shuffle, BookmarkPlus } from 'lucide-react';

// Curated high-contrast vibrant palette for light background
const VIBRANT_PALETTE = [
  'text-indigo-600',
  'text-rose-500',
  'text-amber-500',
  'text-emerald-500',
  'text-sky-500',
  'text-purple-600',
  'text-orange-500',
  'text-teal-600',
  'text-fuchsia-600',
  'text-cyan-600',
  'text-pink-600',
  'text-blue-600',
  'text-violet-600',
];

export default function PasswordDisplay({ password, loading, onRegenerate, onSaveToVault }) {
  const [copied, setCopied] = useState(false);
  const [colorCoded, setColorCoded] = useState(true);
  const [colorSeed, setColorSeed] = useState(0);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        if (onRegenerate) onRegenerate();
      }, 750);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Dynamically assign random vibrant colors to every character on each generation
  const charColors = useMemo(() => {
    if (!password) return [];
    let lastIndex = -1;
    return password.split('').map(() => {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * VIBRANT_PALETTE.length);
      } while (nextIndex === lastIndex && VIBRANT_PALETTE.length > 1);
      lastIndex = nextIndex;
      return VIBRANT_PALETTE[nextIndex];
    });
  }, [password, colorSeed]);

  // Counts of each character type
  const counts = useMemo(() => {
    if (!password) return {};
    return password.split('').reduce((acc, c) => {
      if (c >= 'A' && c <= 'Z') acc.upper = (acc.upper || 0) + 1;
      else if (c >= 'a' && c <= 'z') acc.lower = (acc.lower || 0) + 1;
      else if (c >= '0' && c <= '9') acc.digit = (acc.digit || 0) + 1;
      else acc.symbol = (acc.symbol || 0) + 1;
      return acc;
    }, {});
  }, [password]);

  // Large, bold, and open typography across all password lengths (8 to 32)
  const fontSizeClass = useMemo(() => {
    const len = password ? password.length : 16;
    if (len <= 16) return 'text-xl sm:text-2xl tracking-wider';
    if (len <= 24) return 'text-lg sm:text-xl tracking-wide';
    return 'text-base sm:text-lg tracking-wide';
  }, [password]);

  return (
    <div className="space-y-2.5">
      {/* Monospace Display Box - Wide, bold & spacious */}
      <div className="relative flex items-center bg-slate-50 border-2 border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 min-h-[58px] transition-all shadow-2xs">
        {/* Rendered Text (Single line, spacious font, strictly no wrapping) */}
        <div className={`min-w-0 flex-1 font-mono font-bold select-all py-0.5 leading-none whitespace-nowrap overflow-x-auto no-scrollbar ${fontSizeClass}`}>
          {password ? (
            colorCoded ? (
              password.split('').map((char, index) => (
                <span key={index} className={`${charColors[index] || 'text-indigo-600'} font-bold transition-colors duration-150`}>
                  {char}
                </span>
              ))
            ) : (
              <span className="text-[#161B33] font-bold">{password}</span>
            )
          ) : (
            <span className="text-slate-400 font-normal">Generating...</span>
          )}
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 pl-3.5 sm:pl-4 border-l border-slate-200 shrink-0">
          <button
            onClick={handleCopy}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              copied
                ? 'bg-teal-50 text-teal-600'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 active:scale-95'
            }`}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? <Check className="w-5 h-5 text-teal-600" /> : <Copy className="w-5 h-5" />}
          </button>

          {onSaveToVault && (
            <button
              onClick={onSaveToVault}
              className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer"
              title="Save to Encrypted Vault"
            >
              <BookmarkPlus className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onRegenerate}
            disabled={loading}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Generate New Password"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Character Breakdown Chips & Random Color Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Composition Counts */}
        <div className="flex items-center gap-1.5 font-mono">
          {counts.upper > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold" title="Uppercase letters">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              {counts.upper} Upper
            </span>
          )}
          {counts.lower > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 font-semibold" title="Lowercase letters">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              {counts.lower} Lower
            </span>
          )}
          {counts.digit > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 font-semibold" title="Numeric digits">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {counts.digit} Digits
            </span>
          )}
          {counts.symbol > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold" title="Special symbols">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {counts.symbol} Symbols
            </span>
          )}
        </div>

        {/* Random Colors Toggle & Shuffle Button */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setColorCoded(!colorCoded)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
              colorCoded ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Toggle random colorful characters"
          >
            <Palette className="w-3 h-3" />
            <span>Random Colors</span>
          </button>
          {colorCoded && (
            <button
              onClick={() => setColorSeed((s) => s + 1)}
              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Shuffle colors"
            >
              <Shuffle className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
