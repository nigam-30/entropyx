import React from 'react';

export default function Controls({ options, setOptions }) {
  const handleToggle = (key) => {
    // Prevent unchecking all character sets
    const poolKeys = ['upper', 'lower', 'numbers', 'symbols'];
    if (poolKeys.includes(key) && options[key]) {
      const activeCount = poolKeys.filter((k) => options[k]).length;
      if (activeCount <= 1) return; // Keep at least one active
    }

    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-3">
      {/* Length Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
          <label htmlFor="length-slider">Password Length</label>
          <span className="font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs font-bold border border-indigo-200">
            {options.length} characters
          </span>
        </div>
        <input
          id="length-slider"
          type="range"
          min="8"
          max="32"
          value={options.length > 32 ? 32 : options.length}
          onChange={(e) =>
            setOptions((prev) => ({ ...prev, length: parseInt(e.target.value, 10) }))
          }
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Character Sets Grid */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <label className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800 select-none transition-colors">
          <input
            type="checkbox"
            checked={options.upper}
            onChange={() => handleToggle('upper')}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <span>Uppercase (A–Z)</span>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800 select-none transition-colors">
          <input
            type="checkbox"
            checked={options.lower}
            onChange={() => handleToggle('lower')}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <span>Lowercase (a–z)</span>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800 select-none transition-colors">
          <input
            type="checkbox"
            checked={options.numbers}
            onChange={() => handleToggle('numbers')}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <span>Numbers (0–9)</span>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800 select-none transition-colors">
          <input
            type="checkbox"
            checked={options.symbols}
            onChange={() => handleToggle('symbols')}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <span>Symbols (!@#$)</span>
        </label>
      </div>

      {/* Ambiguous Toggle (Defaulted ON) */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200">
        <div>
          <span className="text-xs font-semibold text-slate-800 block">
            Exclude Ambiguous Characters
          </span>
          <span className="text-[11px] text-slate-500">
            Filters out lookalikes: l, 1, I, O, 0
          </span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={options.avoidAmbiguous}
            onChange={() => handleToggle('avoidAmbiguous')}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
    </div>
  );
}
