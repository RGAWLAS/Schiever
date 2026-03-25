'use client';

import { useState } from 'react';
import { getFlyersData } from '@/lib/data';
import { formatNumber, formatPercent, formatMonthFull } from '@/lib/formatters';
import {
  Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line,
} from 'recharts';
import { X, FileText, Eye, MousePointerClick, BookOpen, Package } from 'lucide-react';
import type { Flyer } from '@/types';

export default function FlyersPanel() {
  const data = getFlyersData();
  const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);

  const chartData = data.flyers.map(f => ({
    month: f.month.substring(5),
    title: f.title,
    'Nakład': f.volume,
    'CTR (%)': f.ctr,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Nakład i CTR gazetek</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(value, name) =>
              name === 'CTR (%)' ? `${value}%` : formatNumber(Number(value))
            } />
            <Legend />
            <Bar yAxisId="left" dataKey="Nakład" fill="#1e40af" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="CTR (%)" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Flyer Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Przegląd gazetek</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.flyers.map(flyer => (
            <button
              key={flyer.id}
              onClick={() => setSelectedFlyer(flyer)}
              className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                <FileText size={40} className="text-primary opacity-40" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{flyer.title}</h4>
              <p className="text-xs text-muted">{formatMonthFull(flyer.month)}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted">Nakład: {formatNumber(flyer.volume)}</span>
                <span className="font-medium text-primary">CTR: {flyer.ctr}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Flyer Detail Modal */}
      {selectedFlyer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFlyer(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedFlyer.title}</h3>
              <button onClick={() => setSelectedFlyer(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-5 flex items-center justify-center">
              <FileText size={60} className="text-primary opacity-30" />
            </div>
            <p className="text-muted text-sm mb-4">{formatMonthFull(selectedFlyer.month)}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted text-xs mb-1">
                  <Package size={14} /> Nakład
                </div>
                <div className="font-bold text-lg">{formatNumber(selectedFlyer.volume)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted text-xs mb-1">
                  <MousePointerClick size={14} /> CTR
                </div>
                <div className="font-bold text-lg">{formatPercent(selectedFlyer.ctr)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted text-xs mb-1">
                  <BookOpen size={14} /> Strony
                </div>
                <div className="font-bold text-lg">{selectedFlyer.pages}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted text-xs mb-1">
                  <Eye size={14} /> Produkty
                </div>
                <div className="font-bold text-lg">{selectedFlyer.products_featured}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
