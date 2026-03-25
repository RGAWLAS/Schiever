'use client';

import { useState, useMemo } from 'react';
import { getInvoicingData } from '@/lib/data';
import { formatCurrency, formatMonth, formatMonthFull } from '@/lib/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import PdfExportButton from '@/components/ui/pdf-export-button';
import TimeRangeFilter, { filterByTimeRange, type TimeRangeValue } from '@/components/ui/time-range-filter';

const categoryColors: Record<string, string> = {
  gazetki: '#f59e0b',
  grafika: '#8b5cf6',
  digital: '#1e40af',
  audyt: '#06b6d4',
  raportowanie: '#059669',
  marketing_automation: '#ec4899',
  social_media: '#1877F2',
};

const categoryLabels: Record<string, string> = {
  gazetki: 'Gazetki / Katalogi',
  grafika: 'Grafika',
  digital: 'Digital / Media',
  audyt: 'Audyt / Analityka',
  raportowanie: 'Raportowanie',
  marketing_automation: 'Marketing Automation',
  social_media: 'Social Media',
};

export default function InvoicingPanel() {
  const data = getInvoicingData();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({ type: 'all' });
  const [showView, setShowView] = useState<'actual' | 'budget' | 'comparison'>('comparison');

  const allMonths = data.invoices.map(inv => inv.month);

  const filtered = useMemo(() => {
    const withMonth = data.invoices.map(inv => ({ ...inv, month: inv.month }));
    return filterByTimeRange(withMonth, timeRange);
  }, [data, timeRange]);

  const chartData = filtered.map(inv => {
    const row: Record<string, string | number> = { month: formatMonth(inv.month) };
    const byCat: Record<string, number> = {};
    inv.line_items.forEach(item => {
      byCat[item.category] = (byCat[item.category] || 0) + item.actual;
    });
    Object.entries(byCat).forEach(([cat, val]) => {
      row[categoryLabels[cat] || cat] = val;
    });
    return row;
  });

  const totalBudget = filtered.reduce((s, inv) => s + inv.total_budget, 0);
  const totalActual = filtered.reduce((s, inv) => s + inv.total_actual, 0);
  const avgMonthly = filtered.length > 0 ? totalActual / filtered.length : 0;
  const latestInvoice = filtered.length > 0 ? filtered[filtered.length - 1] : null;
  const budgetUtilization = totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : '0';

  const selected = selectedMonth
    ? filtered.find(i => i.month === selectedMonth)
    : latestInvoice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fakturowanie</h2>
        <PdfExportButton section="invoicing" size="sm" />
      </div>

      <TimeRangeFilter value={timeRange} onChange={setTimeRange} availableMonths={allMonths} />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted mb-1">Budżet łączny</div>
          <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          <div className="text-xs text-muted mt-1">{filtered.length} miesięcy</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted mb-1">Wykonanie łączne</div>
          <div className="text-2xl font-bold">{formatCurrency(totalActual)}</div>
          <div className={`text-xs mt-1 ${totalActual <= totalBudget ? 'text-accent' : 'text-danger'}`}>
            {budgetUtilization}% budżetu
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted mb-1">Średnia miesięczna</div>
          <div className="text-2xl font-bold">{formatCurrency(avgMonthly)}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted mb-1">Oszczędności</div>
          <div className={`text-2xl font-bold ${totalBudget - totalActual >= 0 ? 'text-accent' : 'text-danger'}`}>
            {formatCurrency(totalBudget - totalActual)}
          </div>
          <div className="text-xs text-muted mt-1">budżet vs. wykonanie</div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-8 shadow-sm text-center text-muted">
          Brak faktur w wybranym zakresie czasowym.
        </div>
      )}

      {filtered.length > 0 && (
      <>
      {/* Budget vs Actual bar chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Budżet vs. Wykonanie</h3>
          <div className="flex gap-1">
            {(['comparison', 'actual', 'budget'] as const).map(v => (
              <button key={v} onClick={() => setShowView(v)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${showView === v ? 'bg-primary text-white' : 'bg-white border border-border hover:bg-gray-50'}`}>
                {v === 'comparison' ? 'Porównanie' : v === 'actual' ? 'Wykonanie' : 'Budżet'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filtered.map(inv => ({
            month: formatMonth(inv.month),
            Budżet: inv.total_budget,
            Wykonanie: inv.total_actual,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            {(showView === 'budget' || showView === 'comparison') && (
              <Bar dataKey="Budżet" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={showView === 'comparison' ? 0.5 : 1} />
            )}
            {(showView === 'actual' || showView === 'comparison') && (
              <Bar dataKey="Wykonanie" fill="#1e40af" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost structure */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Struktura kosztów (wykonanie)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Bar key={key} dataKey={label} stackId="costs" fill={categoryColors[key]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month detail */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-lg font-semibold">Szczegóły faktury</h3>
          <select
            value={selectedMonth || (latestInvoice ? latestInvoice.month : '')}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            {filtered.map(inv => (
              <option key={inv.month} value={inv.month}>{formatMonthFull(inv.month)}</option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selected.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {selected.status === 'paid' ? 'Opłacona' : 'Oczekująca'}
              </span>
              <span className="text-sm text-muted">{formatMonthFull(selected.month)}</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted font-medium">Pozycja</th>
                  <th className="text-left py-2 px-3 text-muted font-medium">Kategoria</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Budżet</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Wykonanie</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Różnica</th>
                </tr>
              </thead>
              <tbody>
                {selected.line_items.map((item, i) => {
                  const diff = item.budget - item.actual;
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 px-3">{item.description}</td>
                      <td className="py-2 px-3">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[item.category] }} />
                          {categoryLabels[item.category] || item.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-muted">{formatCurrency(item.budget)}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.actual)}</td>
                      <td className={`py-2 px-3 text-right ${diff >= 0 ? 'text-accent' : 'text-danger'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={2} className="py-3 px-3 font-bold">RAZEM</td>
                  <td className="py-3 px-3 text-right font-bold text-muted">{formatCurrency(selected.total_budget)}</td>
                  <td className="py-3 px-3 text-right font-bold text-lg">{formatCurrency(selected.total_actual)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${selected.total_budget - selected.total_actual >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {selected.total_budget - selected.total_actual >= 0 ? '+' : ''}{formatCurrency(selected.total_budget - selected.total_actual)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </>
        )}
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Historia faktur</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Miesiąc</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Budżet</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Wykonanie</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Różnica</th>
              <th className="text-right py-2 px-3 text-muted font-medium">% wykorzystania</th>
              <th className="text-center py-2 px-3 text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => {
              const diff = inv.total_budget - inv.total_actual;
              const pct = inv.total_budget > 0 ? ((inv.total_actual / inv.total_budget) * 100).toFixed(1) : '—';
              return (
                <tr key={inv.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{formatMonth(inv.month)}</td>
                  <td className="py-2 px-3 text-right text-muted">{formatCurrency(inv.total_budget)}</td>
                  <td className="py-2 px-3 text-right font-medium">{formatCurrency(inv.total_actual)}</td>
                  <td className={`py-2 px-3 text-right ${diff >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                  </td>
                  <td className="py-2 px-3 text-right">{pct}%</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {inv.status === 'paid' ? 'Opłacona' : 'Oczekująca'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
