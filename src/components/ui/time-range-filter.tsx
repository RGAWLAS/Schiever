'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export type TimeRange = 'last-1' | 'last-3' | 'last-6' | 'last-12' | 'yoy' | 'custom' | 'all';

export interface TimeRangeValue {
  type: TimeRange;
  customFrom?: string;
  customTo?: string;
}

const PRESETS: { id: TimeRange; label: string }[] = [
  { id: 'last-1', label: 'Ostatni miesiąc' },
  { id: 'last-3', label: 'Ostatnie 3 mies.' },
  { id: 'last-6', label: 'Ostatnie 6 mies.' },
  { id: 'last-12', label: 'Ostatnie 12 mies.' },
  { id: 'yoy', label: 'Rok do roku (YoY)' },
  { id: 'custom', label: 'Własny zakres' },
  { id: 'all', label: 'Wszystko' },
];

interface TimeRangeFilterProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
  availableMonths: string[];
}

export default function TimeRangeFilter({ value, onChange, availableMonths }: TimeRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.customFrom || availableMonths[0] || '');
  const [customTo, setCustomTo] = useState(value.customTo || availableMonths[availableMonths.length - 1] || '');

  const handlePresetClick = (id: TimeRange) => {
    if (id === 'custom') {
      setShowCustom(true);
      onChange({ type: 'custom', customFrom, customTo });
    } else {
      setShowCustom(false);
      onChange({ type: id });
    }
  };

  const handleCustomApply = () => {
    onChange({ type: 'custom', customFrom, customTo });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={14} className="text-muted" />
      <div className="flex flex-wrap gap-1">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              value.type === preset.id
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-foreground hover:bg-gray-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {(showCustom || value.type === 'custom') && (
        <div className="flex items-center gap-2 ml-1">
          <select
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="px-2 py-1 border border-border rounded-md text-xs"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="text-xs text-muted">—</span>
          <select
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="px-2 py-1 border border-border rounded-md text-xs"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={handleCustomApply}
            className="px-2.5 py-1 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary-light transition-colors"
          >
            Zastosuj
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Filter an array of monthly data by the selected time range.
 * Items must have a `month` field in "YYYY-MM" format.
 */
export function filterByTimeRange<T extends { month: string }>(
  data: T[],
  range: TimeRangeValue,
): T[] {
  if (range.type === 'all') return data;

  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length === 0) return data;

  if (range.type === 'custom' && range.customFrom && range.customTo) {
    return sorted.filter(d => d.month >= range.customFrom! && d.month <= range.customTo!);
  }

  if (range.type === 'yoy') {
    // Show last 12 months + same months from previous year for comparison
    const last12 = sorted.slice(-12);
    const firstOfLast12 = last12[0]?.month;
    if (firstOfLast12) {
      const prevYear = String(parseInt(firstOfLast12.substring(0, 4)) - 1);
      const prevYearStart = prevYear + firstOfLast12.substring(4);
      return sorted.filter(d => d.month >= prevYearStart);
    }
    return last12;
  }

  const countMap: Record<string, number> = {
    'last-1': 1,
    'last-3': 3,
    'last-6': 6,
    'last-12': 12,
  };

  const count = countMap[range.type] || sorted.length;
  return sorted.slice(-count);
}

/**
 * For non-monthly data (like flyers without strict month ordering),
 * filter by month string range.
 */
export function filterItemsByTimeRange<T>(
  data: T[],
  range: TimeRangeValue,
  getMonth: (item: T) => string,
): T[] {
  const withMonth = data.map(item => ({ ...item, month: getMonth(item) }));
  const filtered = filterByTimeRange(withMonth, range);
  const allowedMonths = new Set(filtered.map(f => f.month));
  return data.filter(item => allowedMonths.has(getMonth(item)));
}
