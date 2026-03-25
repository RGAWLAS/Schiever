'use client';

import { useState, useMemo } from 'react';
import { getKpiData, getSocialMediaData, getPaidMediaData, getFlyersData } from '@/lib/data';
import { formatNumber, formatMonth } from '@/lib/formatters';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { ShoppingCart, Newspaper, ChevronDown, ChevronRight } from 'lucide-react';
import PdfExportButton from '@/components/ui/pdf-export-button';
import type { KpiMetric } from '@/types';

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

function getActualValue(
  kpiCategoryId: string,
  metric: string,
  month: string,
  socialData: ReturnType<typeof getSocialMediaData>,
  paidData: ReturnType<typeof getPaidMediaData>,
  flyersData: ReturnType<typeof getFlyersData>,
): number | null {
  if (kpiCategoryId === 'ecommerce') {
    const entry = paidData.monthly.find(m => m.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }

  if (kpiCategoryId === 'social-facebook') {
    const entry = socialData.platforms.facebook.monthly.find(m => m.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }

  if (kpiCategoryId === 'social-instagram') {
    const entry = socialData.platforms.instagram.monthly.find(m => m.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }

  if (kpiCategoryId === 'social-tiktok') {
    const entry = socialData.platforms.tiktok.monthly.find(m => m.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }

  if (kpiCategoryId === 'flyers') {
    const entry = flyersData.flyers.find(f => f.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }

  return null;
}

function formatValue(value: number, format: string, unit: string): string {
  if (format === 'percent') return `${value.toFixed(1)}${unit}`;
  return formatNumber(value);
}

function getStatusColor(ratio: number): string {
  if (ratio >= 1.0) return 'bg-green-500';
  if (ratio >= 0.9) return 'bg-green-400';
  if (ratio >= 0.7) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getStatusBg(ratio: number): string {
  if (ratio >= 0.9) return 'bg-green-100 text-green-700';
  if (ratio >= 0.7) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function getStatusLabel(ratio: number): string {
  if (ratio >= 1.0) return 'Zrealizowany';
  if (ratio >= 0.9) return 'Na dobrej drodze';
  if (ratio >= 0.7) return 'Wymaga uwagi';
  return 'Zagrożony';
}

interface KpiWithActuals {
  kpi: KpiMetric;
  categoryId: string;
  monthlyData: { month: string; target: number; actual: number | null }[];
  latestActual: number | null;
  latestTarget: number;
  latestMonth: string;
  ratio: number;
}

export default function KpiPanel() {
  const kpiData = getKpiData();
  const socialData = getSocialMediaData();
  const paidData = getPaidMediaData();
  const flyersData = getFlyersData();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(kpiData.categories.map(c => c.id))
  );
  const [selectedKpi, setSelectedKpi] = useState<KpiWithActuals | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const allKpisWithActuals = useMemo(() => {
    const result: KpiWithActuals[] = [];

    for (const category of kpiData.categories) {
      for (const kpi of category.kpis) {
        const months = Object.keys(kpi.targets).sort();
        const monthlyData = months.map(month => ({
          month,
          target: kpi.targets[month],
          actual: getActualValue(category.id, kpi.metric, month, socialData, paidData, flyersData),
        }));

        const latest = monthlyData[monthlyData.length - 1];
        const ratio = latest.actual !== null ? latest.actual / latest.target : 0;

        result.push({
          kpi,
          categoryId: category.id,
          monthlyData,
          latestActual: latest.actual,
          latestTarget: latest.target,
          latestMonth: latest.month,
          ratio,
        });
      }
    }
    return result;
  }, [kpiData, socialData, paidData, flyersData]);

  const toggleCategory = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCategories(next);
  };

  // Overall stats
  const totalKpis = allKpisWithActuals.length;
  const achieved = allKpisWithActuals.filter(k => k.ratio >= 1.0).length;
  const onTrack = allKpisWithActuals.filter(k => k.ratio >= 0.9 && k.ratio < 1.0).length;
  const atRisk = allKpisWithActuals.filter(k => k.ratio < 0.7).length;
  const overallRatio = allKpisWithActuals.reduce((s, k) => s + Math.min(k.ratio, 1), 0) / totalKpis;

  const filteredCategories = filterCategory === 'all'
    ? kpiData.categories
    : kpiData.categories.filter(c => c.id === filterCategory);

  // Trend data for selected KPI
  const trendData = selectedKpi?.monthlyData.map(m => ({
    month: formatMonth(m.month),
    'Cel': m.target,
    'Realizacja': m.actual ?? 0,
  })) ?? [];

  // Bar chart: latest month all KPIs
  const barData = allKpisWithActuals.map(k => ({
    name: `${k.kpi.name}`,
    ratio: Math.round(k.ratio * 100),
    categoryId: k.categoryId,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Realizacja KPI</h2>
        <PdfExportButton section="kpi" size="sm" />
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="text-xs text-muted">Ogólna realizacja</div>
          <div className="text-2xl font-bold text-primary mt-1">{Math.round(overallRatio * 100)}%</div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.round(overallRatio * 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="text-xs text-muted">Łącznie KPI</div>
          <div className="text-2xl font-bold mt-1">{totalKpis}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="text-xs text-muted">Zrealizowane</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{achieved}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="text-xs text-muted">Na dobrej drodze</div>
          <div className="text-2xl font-bold text-green-500 mt-1">{onTrack}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
          <div className="text-xs text-muted">Zagrożone</div>
          <div className="text-2xl font-bold text-red-500 mt-1">{atRisk}</div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted font-medium">Kategoria:</span>
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterCategory === 'all' ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-gray-50'
          }`}
        >
          Wszystkie
        </button>
        {kpiData.categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterCategory === cat.id ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-gray-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.id] || '#6b7280' }} />
            {cat.name}
          </button>
        ))}
      </div>

      {/* KPI categories accordion */}
      {filteredCategories.map(category => {
        const isExpanded = expandedCategories.has(category.id);
        const categoryKpis = allKpisWithActuals.filter(k => k.categoryId === category.id);
        const catAchieved = categoryKpis.filter(k => k.ratio >= 0.9).length;
        const catColor = CATEGORY_COLORS[category.id] || '#6b7280';
        const CatIcon = CATEGORY_ICONS[category.id];

        return (
          <div key={category.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${catColor}15` }}>
                  {CatIcon ? <CatIcon size={16} style={{ color: catColor }} /> :
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: catColor }} />}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                  <span className="text-xs text-muted">{catAchieved}/{categoryKpis.length} KPI na dobrej drodze</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {categoryKpis.map(k => (
                    <div key={k.kpi.id} className={`w-2.5 h-2.5 rounded-full ${getStatusColor(k.ratio)}`} title={k.kpi.name} />
                  ))}
                </div>
                {isExpanded ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
              </div>
            </button>

            {/* KPI cards */}
            {isExpanded && (
              <div className="border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y divide-border">
                  {categoryKpis.map(k => {
                    const percent = Math.min(k.ratio * 100, 100);
                    const isSelected = selectedKpi?.kpi.id === k.kpi.id;

                    return (
                      <button
                        key={k.kpi.id}
                        onClick={() => setSelectedKpi(k)}
                        className={`p-4 text-left hover:bg-blue-50/50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{k.kpi.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStatusBg(k.ratio)}`}>
                            {Math.round(percent)}%
                          </span>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                          <div>
                            <div className="text-xl font-bold">
                              {k.latestActual !== null ? formatValue(k.latestActual, k.kpi.format, k.kpi.unit) : '—'}
                            </div>
                            <div className="text-[10px] text-muted">Realizacja ({formatMonth(k.latestMonth)})</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted font-medium">
                              {formatValue(k.latestTarget, k.kpi.format, k.kpi.unit)}
                            </div>
                            <div className="text-[10px] text-muted">Cel</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getStatusColor(k.ratio)} transition-all`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Selected KPI trend chart */}
      {selectedKpi && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold">{selectedKpi.kpi.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBg(selectedKpi.ratio)}`}>
              {getStatusLabel(selectedKpi.ratio)}
            </span>
          </div>
          <p className="text-sm text-muted mb-4">
            {kpiData.categories.find(c => c.id === selectedKpi.categoryId)?.name} — Trend: cel vs. realizacja
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Cel" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="Realizacja" stroke={CATEGORY_COLORS[selectedKpi.categoryId] || '#1e40af'} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* All KPIs bar chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Realizacja KPI — przegląd (%)</h3>
        <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 32)}>
          <BarChart data={barData} layout="vertical" margin={{ left: 160 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={155} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={20}>
              {barData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.ratio >= 100 ? '#059669' : entry.ratio >= 90 ? '#22c55e' : entry.ratio >= 70 ? '#f59e0b' : '#dc2626'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
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
            </tr>
          </thead>
          <tbody>
            {kpiData.categories.map(category =>
              allKpisWithActuals
                .filter(k => k.categoryId === category.id)
                .map((k, i) => (
                  <tr key={k.kpi.id} className="border-b border-gray-50 hover:bg-gray-50">
                    {i === 0 && (
                      <td className="py-2 px-3 font-medium align-top" rowSpan={category.kpis.length}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category.id] }} />
                          {category.name}
                        </div>
                      </td>
                    )}
                    <td className="py-2 px-3">{k.kpi.name}</td>
                    <td className="py-2 px-3 text-right">{formatValue(k.latestTarget, k.kpi.format, k.kpi.unit)}</td>
                    <td className="py-2 px-3 text-right font-medium">
                      {k.latestActual !== null ? formatValue(k.latestActual, k.kpi.format, k.kpi.unit) : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">{Math.round(k.ratio * 100)}%</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBg(k.ratio)}`}>
                        {getStatusLabel(k.ratio)}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
