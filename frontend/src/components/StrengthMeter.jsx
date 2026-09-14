import React from 'react';
import { Clock } from 'lucide-react';

export default function StrengthMeter({ entropy, strength, crackTime }) {
  const getLevel = () => {
    if (entropy < 40) return 1;
    if (entropy < 55) return 2;
    if (entropy < 70) return 3;
    return 4;
  };

  const level = getLevel();

  const getColor = () => {
    switch (level) {
      case 1:
        return 'bg-rose-500 text-rose-600';
      case 2:
        return 'bg-amber-500 text-amber-600';
      case 3:
        return 'bg-teal-500 text-teal-600';
      case 4:
      default:
        return 'bg-emerald-500 text-emerald-600';
    }
  };

  return (
    <div className="space-y-2 pt-1">
      {/* 4 Segment Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={`rounded-full transition-all duration-300 ${
              seg <= level ? getColor().split(' ')[0] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Meta Stats */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Strength:</span>
          <span className={`font-bold capitalize ${getColor().split(' ')[1]}`}>
            {strength || 'Evaluating...'}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            ({Math.round(entropy || 0)} bits)
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Crack time: <strong className="text-slate-700 font-medium">{crackTime || '...'}</strong></span>
        </div>
      </div>
    </div>
  );
}
