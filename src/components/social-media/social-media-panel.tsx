'use client';

import { useState } from 'react';
import { getSocialMediaData } from '@/lib/data';
import { formatNumber, formatPercent, formatMonth } from '@/lib/formatters';
import type { PlatformName } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from 'recharts';
import PdfExportButton from '@/components/ui/pdf-export-button';

const platformColors: Record<PlatformName, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
};

const platformLabels: Record<PlatformName, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

type FilterPlatform = PlatformName | 'all';

export default function SocialMediaPanel() {
  const [platform, setPlatform] = useState<FilterPlatform>('all');
  const data = getSocialMediaData();

  const platforms: PlatformName[] = ['facebook', 'instagram', 'tiktok'];
  const filteredPlatforms = platform === 'all' ? platforms : [platform];

  // Followers chart data
  const months = data.platforms.facebook.monthly.map(m => m.month);
  const followersData = months.map((month, i) => {
    const row: Record<string, string | number> = { month: formatMonth(month) };
    platforms.forEach(p => {
      row[platformLabels[p]] = data.platforms[p].monthly[i].followers;
    });
    return row;
  });

  // Latest stats per platform
  const latestStats = platforms.map(p => {
    const monthly = data.platforms[p].monthly;
    const latest = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    return {
      platform: p,
      label: platformLabels[p],
      followers: latest.followers,
      followersChange: ((latest.followers - prev.followers) / prev.followers * 100).toFixed(1),
      views: latest.views,
      covering: latest.covering,
      interactions: latest.interactions,
      ratio: latest.ratio_interactions_followers,
    };
  });

  // Engagement data for selected platforms
  const engagementData = months.map((month, i) => {
    const row: Record<string, string | number> = { month: formatMonth(month) };
    filteredPlatforms.forEach(p => {
      row[`${platformLabels[p]} Views`] = data.platforms[p].monthly[i].views;
      row[`${platformLabels[p]} Covering`] = data.platforms[p].monthly[i].covering;
    });
    return row;
  });

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted">Platforma:</span>
        {(['all', ...platforms] as FilterPlatform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              platform === p
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-foreground hover:bg-gray-50'
            }`}
          >
            {p === 'all' ? 'Wszystkie' : platformLabels[p]}
          </button>
        ))}
        </div>
        <PdfExportButton section="social-media" size="sm" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {latestStats.filter(s => platform === 'all' || s.platform === platform).map((stat) => (
          <div key={stat.platform} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platformColors[stat.platform] }} />
              <span className="font-semibold">{stat.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted">Obserwujący</div>
                <div className="font-bold text-lg">{formatNumber(stat.followers)}</div>
                <div className="text-accent text-xs">+{stat.followersChange}%</div>
              </div>
              <div>
                <div className="text-muted">Wyświetlenia</div>
                <div className="font-bold text-lg">{formatNumber(stat.views)}</div>
              </div>
              <div>
                <div className="text-muted">Zasięg</div>
                <div className="font-bold">{formatNumber(stat.covering)}</div>
              </div>
              <div>
                <div className="text-muted">Interakcje/Obs.</div>
                <div className="font-bold">{formatPercent(stat.ratio)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Followers chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Wzrost obserwujących</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={followersData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
            {filteredPlatforms.map(p => (
              <Line
                key={p}
                type="monotone"
                dataKey={platformLabels[p]}
                stroke={platformColors[p]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Views & Covering chart */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Wyświetlenia i zasięg</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
            {filteredPlatforms.map(p => (
              <Bar key={`${p}-views`} dataKey={`${platformLabels[p]} Views`} fill={platformColors[p]} opacity={0.8} />
            ))}
            {filteredPlatforms.map(p => (
              <Bar key={`${p}-covering`} dataKey={`${platformLabels[p]} Covering`} fill={platformColors[p]} opacity={0.4} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Szczegółowe dane</h3>
          <PdfExportButton section="social-media" label="Eksportuj raport" size="sm" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Miesiąc</th>
              <th className="text-left py-2 px-3 text-muted font-medium">Platforma</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Obserwujący</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Wyświetlenia</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Zasięg</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Interakcje</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlatforms.flatMap(p =>
              data.platforms[p].monthly.slice(-6).map((m) => (
                <tr key={`${p}-${m.month}`} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3">{formatMonth(m.month)}</td>
                  <td className="py-2 px-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColors[p] }} />
                      {platformLabels[p]}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">{formatNumber(m.followers)}</td>
                  <td className="py-2 px-3 text-right">{formatNumber(m.views)}</td>
                  <td className="py-2 px-3 text-right">{formatNumber(m.covering)}</td>
                  <td className="py-2 px-3 text-right">{formatNumber(m.interactions)}</td>
                  <td className="py-2 px-3 text-right">{formatPercent(m.ratio_interactions_followers)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
