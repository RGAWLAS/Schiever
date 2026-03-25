'use client';

import { getSocialMediaData, getPaidMediaData, getFlyersData, getKpiData } from '@/lib/data';
import { formatNumber, formatCurrency, formatPercent, formatMonth } from '@/lib/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Users, Eye, ShoppingCart, TrendingUp, Percent, Newspaper, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import PdfExportButton from '@/components/ui/pdf-export-button';

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
        {change} vs. poprzedni miesiąc
      </div>
    </div>
  );
}

export default function OverviewPanel() {
  const social = getSocialMediaData();
  const paid = getPaidMediaData();
  const flyers = getFlyersData();
  const kpis = getKpiData();

  const fbLatest = social.platforms.facebook.monthly;
  const igLatest = social.platforms.instagram.monthly;
  const tkLatest = social.platforms.tiktok.monthly;

  const totalFollowers = fbLatest[fbLatest.length - 1].followers + igLatest[igLatest.length - 1].followers + tkLatest[tkLatest.length - 1].followers;
  const prevFollowers = fbLatest[fbLatest.length - 2].followers + igLatest[igLatest.length - 2].followers + tkLatest[tkLatest.length - 2].followers;
  const followersChange = ((totalFollowers - prevFollowers) / prevFollowers * 100).toFixed(1);

  const paidLatest = paid.monthly[paid.monthly.length - 1];
  const paidPrev = paid.monthly[paid.monthly.length - 2];

  const latestFlyer = flyers.flyers[flyers.flyers.length - 1];
  const prevFlyer = flyers.flyers[flyers.flyers.length - 2];

  const kpiMet = kpis.kpis.filter(k => (k.current / k.target) >= 0.9).length;

  const chartData = paid.monthly.map((m) => ({
    month: formatMonth(m.month),
    'Wydatki reklamowe': m.ad_spend,
    'Przychód': m.revenue,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Podsumowanie</h2>
        <div className="flex gap-2">
          <PdfExportButton section="overview" label="Pobierz podsumowanie" variant="outline" size="sm" />
          <PdfExportButton section="all" label="Pełny raport PDF" size="sm" />
        </div>
      </div>
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
          change={`${((paidLatest.traffic - paidPrev.traffic) / paidPrev.traffic * 100).toFixed(1)}%`}
          icon={Eye}
          positive={paidLatest.traffic > paidPrev.traffic}
        />
        <KpiCard
          title="Zamówienia"
          value={formatNumber(paidLatest.orders)}
          change={`${((paidLatest.orders - paidPrev.orders) / paidPrev.orders * 100).toFixed(1)}%`}
          icon={ShoppingCart}
          positive={paidLatest.orders > paidPrev.orders}
        />
        <KpiCard
          title="Konwersja"
          value={formatPercent(paidLatest.conversion_rate)}
          change={`${(paidLatest.conversion_rate - paidPrev.conversion_rate).toFixed(1)}pp`}
          icon={Percent}
          positive={paidLatest.conversion_rate > paidPrev.conversion_rate}
        />
        <KpiCard
          title="Retencja"
          value={formatPercent(paidLatest.retention_rate)}
          change={`${(paidLatest.retention_rate - paidPrev.retention_rate).toFixed(1)}pp`}
          icon={TrendingUp}
          positive={paidLatest.retention_rate > paidPrev.retention_rate}
        />
        <KpiCard
          title="CTR Gazetki"
          value={formatPercent(latestFlyer.ctr)}
          change={`${(latestFlyer.ctr - prevFlyer.ctr).toFixed(1)}pp`}
          icon={Newspaper}
          positive={latestFlyer.ctr > prevFlyer.ctr}
        />
        <KpiCard
          title="ROAS"
          value={`${(paidLatest.revenue / paidLatest.ad_spend).toFixed(1)}x`}
          change={`${((paidLatest.revenue / paidLatest.ad_spend) - (paidPrev.revenue / paidPrev.ad_spend)).toFixed(1)}x`}
          icon={TrendingUp}
          positive={(paidLatest.revenue / paidLatest.ad_spend) > (paidPrev.revenue / paidPrev.ad_spend)}
        />
        <KpiCard
          title="KPI zrealizowane"
          value={`${kpiMet}/${kpis.kpis.length}`}
          change={`${Math.round(kpiMet / kpis.kpis.length * 100)}% celów`}
          icon={TrendingUp}
          positive={kpiMet / kpis.kpis.length >= 0.7}
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
