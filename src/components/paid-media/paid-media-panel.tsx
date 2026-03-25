'use client';

import { useState, useMemo } from 'react';
import { getPaidMediaData } from '@/lib/data';
import { formatNumber, formatCurrency, formatPercent, formatMonth } from '@/lib/formatters';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import PdfExportButton from '@/components/ui/pdf-export-button';
import TimeRangeFilter, { filterByTimeRange, type TimeRangeValue } from '@/components/ui/time-range-filter';

export default function PaidMediaPanel() {
  const data = getPaidMediaData();
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({ type: 'all' });

  const allMonths = data.monthly.map(m => m.month);
  const filtered = useMemo(() => filterByTimeRange(data.monthly, timeRange), [data.monthly, timeRange]);

  const chartData = filtered.map(m => ({
    month: formatMonth(m.month),
    traffic: m.traffic,
    orders: m.orders,
    conversion_rate: m.conversion_rate,
    retention_rate: m.retention_rate,
    ad_spend: m.ad_spend,
    revenue: m.revenue,
    roas: parseFloat((m.revenue / m.ad_spend).toFixed(1)),
  }));

  const latest = filtered.length > 0 ? filtered[filtered.length - 1] : null;
  const prev = filtered.length > 1 ? filtered[filtered.length - 2] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">E-commerce / Paid Media</h2>
        <PdfExportButton section="paid-media" size="sm" />
      </div>

      {/* Time Range Filter */}
      <TimeRangeFilter value={timeRange} onChange={setTimeRange} availableMonths={allMonths} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Traffic',
            value: latest ? formatNumber(latest.traffic) : '\u2014',
            change: latest && prev ? ((latest.traffic - prev.traffic) / prev.traffic * 100).toFixed(1) : null,
          },
          {
            label: 'Konwersja (CR)',
            value: latest ? formatPercent(latest.conversion_rate) : '\u2014',
            change: latest && prev ? (latest.conversion_rate - prev.conversion_rate).toFixed(1) + 'pp' : null,
          },
          {
            label: 'Zamówienia',
            value: latest ? formatNumber(latest.orders) : '\u2014',
            change: latest && prev ? ((latest.orders - prev.orders) / prev.orders * 100).toFixed(1) : null,
          },
          {
            label: 'Retencja',
            value: latest ? formatPercent(latest.retention_rate) : '\u2014',
            change: latest && prev ? (latest.retention_rate - prev.retention_rate).toFixed(1) + 'pp' : null,
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="text-sm text-muted mb-1">{card.label}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm text-accent mt-1">
              {card.change !== null ? `+${card.change} vs. poprzedni` : '\u2014'}
            </div>
          </div>
        ))}
      </div>

      {/* Traffic Chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Ruch na stronie (Traffic)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Area type="monotone" dataKey="traffic" stroke="#3b82f6" fill="url(#colorTraffic)" strokeWidth={2} name="Traffic" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders & Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Liczba zamówień</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatNumber(Number(value))} />
              <Bar dataKey="orders" fill="#1e40af" radius={[4, 4, 0, 0]} name="Zamówienia" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Współczynnik konwersji (%)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="conversion_rate" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="CR %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Retention & ROAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Wskaźnik retencji (%)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[25, 45]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line type="monotone" dataKey="retention_rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Retencja %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">ROAS (Return on Ad Spend)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${value}x`} />
              <Bar dataKey="roas" fill="#059669" radius={[4, 4, 0, 0]} name="ROAS" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Zestawienie miesięczne</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Miesiąc</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Traffic</th>
              <th className="text-right py-2 px-3 text-muted font-medium">CR</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Zamówienia</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Retencja</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Ad Spend</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Przychód</th>
              <th className="text-right py-2 px-3 text-muted font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.month} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3">{formatMonth(m.month)}</td>
                <td className="py-2 px-3 text-right">{formatNumber(m.traffic)}</td>
                <td className="py-2 px-3 text-right">{formatPercent(m.conversion_rate)}</td>
                <td className="py-2 px-3 text-right">{formatNumber(m.orders)}</td>
                <td className="py-2 px-3 text-right">{formatPercent(m.retention_rate)}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(m.ad_spend)}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(m.revenue)}</td>
                <td className="py-2 px-3 text-right font-medium">{(m.revenue / m.ad_spend).toFixed(1)}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
