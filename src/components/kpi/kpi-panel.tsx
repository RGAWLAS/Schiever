'use client';

import { useState } from 'react';
import { getKpiData } from '@/lib/data';
import { formatMonth } from '@/lib/formatters';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { KPI } from '@/types';
import PdfExportButton from '@/components/ui/pdf-export-button';

function getStatusColor(ratio: number): string {
  if (ratio >= 0.9) return 'bg-green-500';
  if (ratio >= 0.7) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getStatusBg(ratio: number): string {
  if (ratio >= 0.9) return 'bg-green-100';
  if (ratio >= 0.7) return 'bg-yellow-100';
  return 'bg-red-100';
}

function getStatusLabel(ratio: number): string {
  if (ratio >= 0.9) return 'Na dobrej drodze';
  if (ratio >= 0.7) return 'Wymaga uwagi';
  return 'Zagrożony';
}

export default function KpiPanel() {
  const data = getKpiData();
  const [selectedKpi, setSelectedKpi] = useState<KPI>(data.kpis[0]);

  const trendData = selectedKpi.monthly.map(m => ({
    month: formatMonth(m.month),
    'Cel': m.target,
    'Realizacja': m.actual,
  }));

  const overallProgress = data.kpis.reduce((sum, k) => sum + Math.min(k.current / k.target, 1), 0) / data.kpis.length;

  return (
    <div className="space-y-6">
      {/* Overall KPI score */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Realizacja KPI</h2>
        <PdfExportButton section="kpi" size="sm" />
      </div>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Ogólna realizacja KPI</h3>
          <span className="text-2xl font-bold text-primary">{Math.round(overallProgress * 100)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${Math.round(overallProgress * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>0%</span>
          <span>Cel: 100%</span>
        </div>
      </div>

      {/* KPI list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.kpis.map(kpi => {
          const ratio = kpi.current / kpi.target;
          const percent = Math.min(ratio * 100, 100);
          const isSelected = selectedKpi.id === kpi.id;

          return (
            <button
              key={kpi.id}
              onClick={() => setSelectedKpi(kpi)}
              className={`bg-white rounded-xl border p-5 shadow-sm text-left transition-all ${
                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{kpi.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBg(ratio)} ${
                  ratio >= 0.9 ? 'text-green-700' : ratio >= 0.7 ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {getStatusLabel(ratio)}
                </span>
              </div>
              <div className="text-xs text-muted mb-2">{kpi.category} | {kpi.period}</div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-2xl font-bold">{kpi.current}</span>
                  <span className="text-muted text-sm ml-1">{kpi.unit}</span>
                </div>
                <div className="text-right text-sm text-muted">
                  Cel: {kpi.target}{kpi.unit}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${getStatusColor(ratio)} transition-all`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-right text-xs text-muted mt-1">{percent.toFixed(0)}%</div>
            </button>
          );
        })}
      </div>

      {/* Selected KPI trend */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-1">{selectedKpi.name}</h3>
        <p className="text-sm text-muted mb-4">Trend: cel vs. realizacja ({selectedKpi.unit})</p>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Cel" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Realizacja" stroke="#1e40af" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* KPI summary table */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Podsumowanie KPI</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">KPI</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Kategoria</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Cel</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Realizacja</th>
              <th className="text-right py-2 px-3 text-muted font-medium">%</th>
              <th className="text-center py-2 px-3 text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.kpis.map(kpi => {
              const ratio = kpi.current / kpi.target;
              return (
                <tr key={kpi.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{kpi.name}</td>
                  <td className="py-2 px-3 text-muted">{kpi.category}</td>
                  <td className="py-2 px-3 text-right">{kpi.target}{kpi.unit}</td>
                  <td className="py-2 px-3 text-right font-medium">{kpi.current}{kpi.unit}</td>
                  <td className="py-2 px-3 text-right">{(ratio * 100).toFixed(0)}%</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(ratio)} ${
                      ratio >= 0.9 ? 'text-green-700' : ratio >= 0.7 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {getStatusLabel(ratio)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
