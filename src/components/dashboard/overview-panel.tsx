'use client';

import { useState, useMemo } from 'react';
import { getSocialMediaData, getPaidMediaData, getFlyersData, getKpiData } from '@/lib/data';
import { formatNumber, formatCurrency, formatPercent, formatMonth } from '@/lib/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Users, Eye, ShoppingCart, TrendingUp, Percent, Newspaper, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PdfExportButton from '@/components/ui/pdf-export-button';
import TimeRangeFilter, { filterByTimeRange, type TimeRangeValue } from '@/components/ui/time-range-filter';

function KpiCard({ title, value, change, icon: Icon, positive }: {
  title: string; value: string; change: string; icon: React.ElementType; positive: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon size={18} className="text-primary" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className={`flex items-center gap-1 mt-1 text-sm ${positive ? 'text-accent' : 'text-danger'}`}>
        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change} vs. poprzedni okres
      </div>
    </div>
  );
}

export default function OverviewPanel() {
  const social = getSocialMediaData();
  const paid = getPaidMediaData();
  const flyers = getFlyersData();
  const kpis = getKpiData();

  const allMonths = paid.monthly.map(m => m.month);
  const [timeRange, setTimeRange] = useState<TimeRangeValue>({ type: 'all' });

  const filteredPaid = useMemo(() => filterByTimeRange(paid.monthly, timeRange), [paid.monthly, timeRange]);
  const filteredFb = useMemo(() => filterByTimeRange(social.platforms.facebook.monthly, timeRange), [social, timeRange]);
  const filteredIg = useMemo(() => filterByTimeRange(social.platforms.instagram.monthly, timeRange), [social, timeRange]);
  const filteredTk = useMemo(() => filterByTimeRange(social.platforms.tiktok.monthly, timeRange), [social, timeRange]);

  const totalFollowers = (filteredFb.at(-1)?.followers ?? 0) + (filteredIg.at(-1)?.followers ?? 0) + (filteredTk.at(-1)?.followers ?? 0);
  const prevFollowers = (filteredFb.at(-2)?.followers ?? 0) + (filteredIg.at(-2)?.followers ?? 0) + (filteredTk.at(-2)?.followers ?? 0);
  const followersChange = prevFollowers > 0 ? ((totalFollowers - prevFollowers) / prevFollowers * 100).toFixed(1) : '0';

  const paidLatest = filteredPaid.at(-1);
  const paidPrev = filteredPaid.at(-2);

  const filteredFlyers = useMemo(() => {
    const withMonth = flyers.flyers.map(f => ({ ...f, month: f.month }));
    return filterByTimeRange(withMonth, timeRange);
  }, [flyers, timeRange]);
  const latestFlyer = filteredFlyers.at(-1);
  const prevFlyer = filteredFlyers.at(-2);

  const totalKpis = kpis.categories.reduce((s, c) => s + c.kpis.length, 0);

  const chartData = filteredPaid.map((m) => ({
    month: formatMonth(m.month),
    'Wydatki reklamowe': m.ad_spend,
    'Przychód': m.revenue,
  }));

  if (!paidLatest) return <div className="text-muted text-center py-12">Brak danych dla wybranego zakresu</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Podsumowanie</h2>
        <div className="flex gap-2">
          <PdfExportButton section="overview" label="Pobierz podsumowanie" variant="outline" size="sm" />
          <PdfExportButton section="all" label="Pełny raport PDF" size="sm" />
        </div>
      </div>

      <TimeRangeFilter value={timeRange} onChange={setTimeRange} availableMonths={allMonths} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Obserwujący (łącznie)"
          value={formatNumber(totalFollowers)}
          change={`${followersChange}%`}
          icon={Users}
          positive={parseFloat(followersChange) > 0}
        />
        <KpiCard
          title="Ruch E-com"
          value={formatNumber(paidLatest.traffic)}
          change={paidPrev ? `${((paidLatest.traffic - paidPrev.traffic) / paidPrev.traffic * 100).toFixed(1)}%` : '—'}
          icon={Eye}
          positive={paidPrev ? paidLatest.traffic > paidPrev.traffic : true}
        />
        <KpiCard
          title="Zamówienia"
          value={formatNumber(paidLatest.orders)}
          change={paidPrev ? `${((paidLatest.orders - paidPrev.orders) / paidPrev.orders * 100).toFixed(1)}%` : '—'}
          icon={ShoppingCart}
          positive={paidPrev ? paidLatest.orders > paidPrev.orders : true}
        />
        <KpiCard
          title="Konwersja"
          value={formatPercent(paidLatest.conversion_rate)}
          change={paidPrev ? `${(paidLatest.conversion_rate - paidPrev.conversion_rate).toFixed(1)}pp` : '—'}
          icon={Percent}
          positive={paidPrev ? paidLatest.conversion_rate > paidPrev.conversion_rate : true}
        />
        <KpiCard
          title="Retencja"
          value={formatPercent(paidLatest.retention_rate)}
          change={paidPrev ? `${(paidLatest.retention_rate - paidPrev.retention_rate).toFixed(1)}pp` : '—'}
          icon={TrendingUp}
          positive={paidPrev ? paidLatest.retention_rate > paidPrev.retention_rate : true}
        />
        <KpiCard
          title="CTR Gazetki"
          value={latestFlyer ? formatPercent(latestFlyer.ctr) : '—'}
          change={latestFlyer && prevFlyer ? `${(latestFlyer.ctr - prevFlyer.ctr).toFixed(1)}pp` : '—'}
          icon={Newspaper}
          positive={latestFlyer && prevFlyer ? latestFlyer.ctr > prevFlyer.ctr : true}
        />
        <KpiCard
          title="ROAS"
          value={`${(paidLatest.revenue / paidLatest.ad_spend).toFixed(1)}x`}
          change={paidPrev ? `${((paidLatest.revenue / paidLatest.ad_spend) - (paidPrev.revenue / paidPrev.ad_spend)).toFixed(1)}x` : '—'}
          icon={TrendingUp}
          positive={paidPrev ? (paidLatest.revenue / paidLatest.ad_spend) > (paidPrev.revenue / paidPrev.ad_spend) : true}
        />
        <KpiCard
          title="KPI zrealizowane"
          value={`${totalKpis} KPI`}
          change="szczegóły w zakładce KPI"
          icon={TrendingUp}
          positive={true}
        />
      </div>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Wydatki vs. Przychód E-com</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e40af" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Area type="monotone" dataKey="Przychód" stroke="#059669" fill="url(#colorRevenue)" strokeWidth={2} />
            <Area type="monotone" dataKey="Wydatki reklamowe" stroke="#1e40af" fill="url(#colorSpend)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
