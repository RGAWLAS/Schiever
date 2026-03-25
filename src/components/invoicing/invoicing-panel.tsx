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
  social: '#1877F2',
  paid: '#1e40af',
  content: '#8b5cf6',
  flyers: '#f59e0b',
  strategy: '#059669',
};

const categoryLabels: Record<string, string> = {
  social: 'Social Media',
  paid: 'Paid Media',
  content: 'Content Creation',
  flyers: 'Gazetki',
  strategy: 'Strategia',
};

export default function InvoicingPanel() {
  const data = getInvoicingData();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({ type: 'all' });

  const allMonths = data.invoices.map(inv => inv.month);

  const filtered = useMemo(() => {
    const withMonth = data.invoices.map(inv => ({ ...inv, month: inv.month }));
    return filterByTimeRange(withMonth, timeRange);
  }, [data, timeRange]);

  const chartData = filtered.map(inv => {
    const row: Record<string, string | number> = { month: formatMonth(inv.month) };
    inv.line_items.forEach(item => {
      row[categoryLabels[item.category] || item.category] = item.amount;
    });
    row['Total'] = inv.total;
    return row;
  });

  const totalSpent = filtered.reduce((sum, inv) => sum + inv.total, 0);
  const avgMonthly = filtered.length > 0 ? totalSpent / filtered.length : 0;
  const latestInvoice = filtered.length > 0 ? filtered[filtered.length - 1] : null;

  const selected = selectedMonth
    ? filtered.find(i => i.month === selectedMonth)
    : latestInvoice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fakturowanie</h2>
        <PdfExportButton section="invoicing" size="sm" />
      </div>

      {/* Time Range Filter */}
      <TimeRangeFilter value={timeRange} onChange={setTimeRange} availableMonths={allMonths} />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted mb-1">Łączne wydatki</div>
          <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          <div className="text-xs text-muted mt-1">{filtered.length} miesięcy</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted mb-1">Średnia miesięczna</div>
          <div className="text-2xl font-bold">{formatCurrency(avgMonthly)}</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="text-sm text-muted mb-1">Bieżący miesiąc</div>
          <div className="text-2xl font-bold">{latestInvoice ? formatCurrency(latestInvoice.total) : '—'}</div>
          {latestInvoice && (
            <div className={`text-xs mt-1 ${latestInvoice.status === 'paid' ? 'text-accent' : 'text-warning'}`}>
              {latestInvoice.status === 'paid' ? 'Opłacona' : 'Oczekująca'}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-8 shadow-sm text-center text-muted">
          Brak faktur w wybranym zakresie czasowym.
        </div>
      )}

      {filtered.length > 0 && (
      <>
      {/* Stacked bar chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Struktura kosztów miesięcznych</h3>
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

      {/* Month selector + detail */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-lg font-semibold">Szczegóły faktury</h3>
          <select
            value={selectedMonth || (latestInvoice ? latestInvoice.month : '')}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm"
          >
            {filtered.map(inv => (
              <option key={inv.month} value={inv.month}>
                {formatMonthFull(inv.month)}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selected.status === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {selected.status === 'paid' ? 'Opłacona' : 'Oczekująca'}
              </span>
              <span className="text-sm text-muted">{formatMonthFull(selected.month)}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted font-medium">Pozycja</th>
                  <th className="text-left py-2 px-3 text-muted font-medium">Kategoria</th>
                  <th className="text-right py-2 px-3 text-muted font-medium">Kwota</th>
                </tr>
              </thead>
              <tbody>
                {selected.line_items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 px-3">{item.description}</td>
                    <td className="py-2 px-3">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[item.category] }} />
                        {categoryLabels[item.category]}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={2} className="py-3 px-3 font-bold">RAZEM</td>
                  <td className="py-3 px-3 text-right font-bold text-lg">{formatCurrency(selected.total)}</td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>

      {/* All invoices table */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Historia faktur</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Miesiąc</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Social Media</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Paid Media</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Content</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Gazetki</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Strategia</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Razem</th>
              <th className="text-center py-2 px-3 text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => {
              const byCategory: Record<string, number> = {};
              inv.line_items.forEach(item => { byCategory[item.category] = item.amount; });
              return (
                <tr key={inv.month} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{formatMonth(inv.month)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(byCategory['social'] || 0)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(byCategory['paid'] || 0)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(byCategory['content'] || 0)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(byCategory['flyers'] || 0)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(byCategory['strategy'] || 0)}</td>
                  <td className="py-2 px-3 text-right font-bold">{formatCurrency(inv.total)}</td>
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
