'use client';

import { useState, useMemo } from 'react';
import { getKpiData } from '@/lib/data';
import { formatNumber, formatMonth } from '@/lib/formatters';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import { ShoppingCart, Newspaper, ChevronDown, ChevronRight, ArrowLeft, TrendingUp } from 'lucide-react';
import PdfExportButton from '@/components/ui/pdf-export-button';
import TimeRangeFilter, { type TimeRangeValue } from '@/components/ui/time-range-filter';
import type { KpiMetric, KpiMonthlyActual } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  'ecommerce': '#1e40af',
  'social-facebook': '#1877F2',
  'social-instagram': '#E4405F',
  'social-tiktok': '#000000',
  'flyers': '#f59e0b',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'ecommerce': ShoppingCart,
  'flyers': Newspaper,
};

function fv(value: number, format: string, unit: string): string {
  if (format === 'percent') return `${value.toFixed(1)}${unit}`;
  return formatNumber(value);
}

function getStatusColor(r: number) { return r >= 1 ? 'bg-green-500' : r >= 0.9 ? 'bg-green-400' : r >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'; }
function getStatusBg(r: number) { return r >= 0.9 ? 'bg-green-100 text-green-700' : r >= 0.7 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'; }
function getStatusLabel(r: number) { return r >= 1 ? 'Zrealizowany' : r >= 0.9 ? 'Na dobrej drodze' : r >= 0.7 ? 'Wymaga uwagi' : 'Zagrożony'; }

function calcTrend(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sX = points.reduce((s, d) => s + d.x, 0);
  const sY = points.reduce((s, d) => s + d.y, 0);
  const sXY = points.reduce((s, d) => s + d.x * d.y, 0);
  const sX2 = points.reduce((s, d) => s + d.x * d.x, 0);
  const slope = (n * sXY - sX * sY) / (n * sX2 - sX * sX);
  return { slope, intercept: (sY - slope * sX) / n };
}

interface KpiRow {
  kpi: KpiMetric;
  categoryId: string;
  categoryName: string;
  actuals: KpiMonthlyActual[];
  latestActual: number | null;
  latestTarget: number;
  latestMonth: string;
  ratio: number;
}

export default function KpiPanel() {
  const kpiData = getKpiData();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(kpiData.categories.map(c => c.id)));
  const [detailKpi, setDetailKpi] = useState<KpiRow | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({ type: 'all' });

  const allMonths = useMemo(() => {
    const s = new Set<string>();
    kpiData.categories.forEach(c => c.kpis.forEach(k => Object.keys(k.targets).forEach(m => s.add(m))));
    return Array.from(s).sort();
  }, [kpiData]);

  const allKpis = useMemo(() => {
    const result: KpiRow[] = [];
    for (const cat of kpiData.categories) {
      for (const kpi of cat.kpis) {
        // Filter actuals by time range
        let actuals = kpi.actuals;
        if (timeRange.type !== 'all') {
          if (timeRange.type === 'custom' && timeRange.customFrom && timeRange.customTo) {
            actuals = actuals.filter(a => a.month >= timeRange.customFrom! && a.month <= timeRange.customTo!);
          } else {
            const countMap: Record<string, number> = { 'last-1': 1, 'last-3': 3, 'last-6': 6, 'last-12': 12 };
            const count = countMap[timeRange.type] || actuals.length;
            actuals = actuals.slice(-count);
          }
        }
        const latest = actuals[actuals.length - 1];
        if (!latest) continue;
        const ratio = latest.actual !== null && latest.target > 0 ? latest.actual / latest.target : 0;
        result.push({
          kpi, categoryId: cat.id, categoryName: cat.name, actuals,
          latestActual: latest.actual, latestTarget: latest.target, latestMonth: latest.month, ratio,
        });
      }
    }
    return result;
  }, [kpiData, timeRange]);

  const toggleCategory = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedCategories(next);
  };

  const totalKpis = allKpis.length;
  const achieved = allKpis.filter(k => k.ratio >= 1.0).length;
  const onTrack = allKpis.filter(k => k.ratio >= 0.9 && k.ratio < 1.0).length;
  const atRisk = allKpis.filter(k => k.ratio < 0.7).length;
  const overallRatio = totalKpis > 0 ? allKpis.reduce((s, k) => s + Math.min(k.ratio, 1), 0) / totalKpis : 0;

  const filteredCats = filterCategory === 'all' ? kpiData.categories : kpiData.categories.filter(c => c.id === filterCategory);

  const barData = allKpis.map(k => ({ name: k.kpi.name, ratio: Math.round(k.ratio * 100), categoryId: k.categoryId }));

  // ===== DETAIL VIEW =====
  if (detailKpi) {
    const dk = detailKpi;
    const color = CATEGORY_COLORS[dk.categoryId] || '#1e40af';

    // All weekly entries flattened
    const allWeekly = dk.actuals.flatMap(a => a.weekly.map(w => ({ ...w, month: a.month })));
    const weeklyTrendPts = allWeekly.map((w, i) => ({ x: i, y: w.value }));
    const wTrend = calcTrend(weeklyTrendPts);
    const weeklyWithTrend = allWeekly.map((w, i) => ({
      period: w.period,
      value: w.value,
      trend: parseFloat((wTrend.intercept + wTrend.slope * i).toFixed(2)),
      month: w.month,
    }));

    // Monthly chart data
    const monthlyActualPts = dk.actuals.filter(a => a.actual !== null).map((a, i) => ({ x: i, y: a.actual! }));
    const mTrend = calcTrend(monthlyActualPts);
    const monthlyChart = dk.actuals.map((a, i) => ({
      month: formatMonth(a.month),
      Cel: a.target,
      Realizacja: a.actual ?? 0,
      Trend: a.actual !== null ? parseFloat((mTrend.intercept + mTrend.slope * i).toFixed(2)) : 0,
    }));

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setDetailKpi(null)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-muted">{dk.categoryName}</span>
            </div>
            <h2 className="text-xl font-bold">{dk.kpi.name}</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBg(dk.ratio)}`}>
            {getStatusLabel(dk.ratio)} ({Math.round(dk.ratio * 100)}%)
          </span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="text-xs text-muted">Cel ({formatMonth(dk.latestMonth)})</div>
            <div className="text-xl font-bold mt-1">{fv(dk.latestTarget, dk.kpi.format, dk.kpi.unit)}</div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="text-xs text-muted">Realizacja</div>
            <div className="text-xl font-bold mt-1" style={{ color }}>
              {dk.latestActual !== null ? fv(dk.latestActual, dk.kpi.format, dk.kpi.unit) : '—'}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="text-xs text-muted">% realizacji</div>
            <div className="text-xl font-bold mt-1">{Math.round(dk.ratio * 100)}%</div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className={`h-full rounded-full ${getStatusColor(dk.ratio)}`} style={{ width: `${Math.min(dk.ratio * 100, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="text-xs text-muted flex items-center gap-1"><TrendingUp size={12} /> Trend tyg.</div>
            <div className={`text-xl font-bold mt-1 ${wTrend.slope >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {wTrend.slope >= 0 ? '+' : ''}{dk.kpi.format === 'percent' ? wTrend.slope.toFixed(2) + '%' : formatNumber(Math.round(wTrend.slope))}/tydz.
            </div>
          </div>
        </div>

        {/* Monthly chart */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-1">Trend miesięczny: Cel vs. Realizacja</h3>
          <p className="text-sm text-muted mb-4">Przerywana linia = linia trendu realizacji</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Cel" stroke="#94a3b8" strokeWidth={2} strokeDasharray="8 4" dot={false} />
              <Line type="monotone" dataKey="Realizacja" stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} />
              <Line type="monotone" dataKey="Trend" stroke={color} strokeWidth={1.5} strokeDasharray="4 4" dot={false} opacity={0.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly chart */}
        {weeklyWithTrend.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-1">Rozkład tygodniowy</h3>
            <p className="text-sm text-muted mb-4">Czerwona linia = linia trendu</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyWithTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => dk.kpi.format === 'percent' ? `${v}%` : formatNumber(Number(v))} />
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} opacity={0.8} name="Wartość" />
                <Line type="monotone" dataKey="trend" stroke="#dc2626" strokeWidth={2} dot={false} name="Trend" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly table */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Dane miesięczne</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted font-medium">Miesiąc</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Cel</th>
                <th className="text-right py-2 px-3 text-muted font-medium">Realizacja</th>
                <th className="text-right py-2 px-3 text-muted font-medium">% realizacji</th>
                <th className="text-center py-2 px-3 text-muted font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dk.actuals.map(a => {
                const r = a.actual !== null && a.target > 0 ? a.actual / a.target : 0;
                return (
                  <tr key={a.month} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{formatMonth(a.month)}</td>
                    <td className="py-2 px-3 text-right">{fv(a.target, dk.kpi.format, dk.kpi.unit)}</td>
                    <td className="py-2 px-3 text-right font-medium" style={{ color: a.actual !== null ? color : undefined }}>
                      {a.actual !== null ? fv(a.actual, dk.kpi.format, dk.kpi.unit) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">{a.realization_pct !== null ? `${a.realization_pct}%` : '—'}</td>
                    <td className="py-2 px-3 text-center">
                      {a.actual !== null ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBg(r)}`}>{getStatusLabel(r)}</span> : <span className="text-muted text-xs">brak</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Weekly table */}
        {allWeekly.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">Dane tygodniowe</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted font-medium">Miesiąc</th>
                  <th className="text-left py-2 px-3 text-muted font-medium">Okres</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Wartość</th>
                </tr>
              </thead>
              <tbody>
                {weeklyWithTrend.map((w, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-muted">{formatMonth(w.month)}</td>
                    <td className="py-2 px-3">{w.period}</td>
                    <td className="py-2 px-3 text-right font-medium">{dk.kpi.format === 'percent' ? `${w.value}%` : formatNumber(w.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Realizacja KPI</h2>
        <PdfExportButton section="kpi" size="sm" />
      </div>
      <TimeRangeFilter value={timeRange} onChange={setTimeRange} availableMonths={allMonths} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="text-xs text-muted">Ogólna realizacja</div>
          <div className="text-2xl font-bold text-primary mt-1">{Math.round(overallRatio * 100)}%</div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.round(overallRatio * 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm"><div className="text-xs text-muted">Łącznie KPI</div><div className="text-2xl font-bold mt-1">{totalKpis}</div></div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm"><div className="text-xs text-muted">Zrealizowane</div><div className="text-2xl font-bold text-green-600 mt-1">{achieved}</div></div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm"><div className="text-xs text-muted">Na dobrej drodze</div><div className="text-2xl font-bold text-green-500 mt-1">{onTrack}</div></div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm"><div className="text-xs text-muted">Zagrożone</div><div className="text-2xl font-bold text-red-500 mt-1">{atRisk}</div></div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted font-medium">Kategoria:</span>
        <button onClick={() => setFilterCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCategory === 'all' ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-gray-50'}`}>Wszystkie</button>
        {kpiData.categories.map(cat => (
          <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${filterCategory === cat.id ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-gray-50'}`}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.id] }} />{cat.name}
          </button>
        ))}
      </div>

      {filteredCats.map(category => {
        const isExp = expandedCategories.has(category.id);
        const catKpis = allKpis.filter(k => k.categoryId === category.id);
        if (catKpis.length === 0) return null;
        const catOk = catKpis.filter(k => k.ratio >= 0.9).length;
        const catColor = CATEGORY_COLORS[category.id] || '#6b7280';
        const CatIcon = CATEGORY_ICONS[category.id];

        return (
          <div key={category.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <button onClick={() => toggleCategory(category.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${catColor}15` }}>
                  {CatIcon ? <CatIcon size={16} style={{ color: catColor }} /> : <span className="w-3 h-3 rounded-full" style={{ backgroundColor: catColor }} />}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                  <span className="text-xs text-muted">{catOk}/{catKpis.length} KPI na dobrej drodze</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">{catKpis.map(k => <div key={k.kpi.id} className={`w-2.5 h-2.5 rounded-full ${getStatusColor(k.ratio)}`} />)}</div>
                {isExp ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
              </div>
            </button>
            {isExp && (
              <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border">
                {catKpis.map(k => {
                  const pct = Math.min(k.ratio * 100, 100);
                  return (
                    <button key={k.kpi.id} onClick={() => setDetailKpi(k)} className="p-4 text-left hover:bg-blue-50/50 group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium group-hover:text-primary">{k.kpi.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStatusBg(k.ratio)}`}>{Math.round(pct)}%</span>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <div className="text-xl font-bold">{k.latestActual !== null ? fv(k.latestActual, k.kpi.format, k.kpi.unit) : '—'}</div>
                          <div className="text-[10px] text-muted">Realizacja ({formatMonth(k.latestMonth)})</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted font-medium">{fv(k.latestTarget, k.kpi.format, k.kpi.unit)}</div>
                          <div className="text-[10px] text-muted">Cel</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full ${getStatusColor(k.ratio)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[10px] text-primary mt-1.5 opacity-0 group-hover:opacity-100">Szczegóły →</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Realizacja KPI — przegląd (%)</h3>
        <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 32)}>
          <BarChart data={barData} layout="vertical" margin={{ left: 160 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={155} />
            <Tooltip formatter={(value) => `${value}%`} />
            <ReferenceLine x={100} stroke="#059669" strokeDasharray="3 3" strokeWidth={2} />
            <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={20}>
              {barData.map((e, i) => <Cell key={i} fill={e.ratio >= 100 ? '#059669' : e.ratio >= 90 ? '#22c55e' : e.ratio >= 70 ? '#f59e0b' : '#dc2626'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Tabela realizacji KPI</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Kategoria</th>
              <th className="text-left py-2 px-3 text-muted font-medium">KPI</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Cel</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Realizacja</th>
              <th className="text-right py-2 px-3 text-muted font-medium">%</th>
              <th className="text-center py-2 px-3 text-muted font-medium">Status</th>
              <th className="text-center py-2 px-3 text-muted font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {kpiData.categories.map(cat => {
              const rows = allKpis.filter(k => k.categoryId === cat.id);
              return rows.map((k, i) => (
                <tr key={k.kpi.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setDetailKpi(k)}>
                  {i === 0 && <td className="py-2 px-3 font-medium align-top" rowSpan={rows.length}><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.id] }} />{cat.name}</div></td>}
                  <td className="py-2 px-3">{k.kpi.name}</td>
                  <td className="py-2 px-3 text-right">{fv(k.latestTarget, k.kpi.format, k.kpi.unit)}</td>
                  <td className="py-2 px-3 text-right font-medium">{k.latestActual !== null ? fv(k.latestActual, k.kpi.format, k.kpi.unit) : '—'}</td>
                  <td className="py-2 px-3 text-right">{Math.round(k.ratio * 100)}%</td>
                  <td className="py-2 px-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBg(k.ratio)}`}>{getStatusLabel(k.ratio)}</span></td>
                  <td className="py-2 px-3 text-center text-primary text-xs">Szczegóły →</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
