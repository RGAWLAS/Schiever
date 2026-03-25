export type TabId = 'overview' | 'social-media' | 'paid-media' | 'flyers' | 'invoicing' | 'kpi';

export type PlatformName = 'facebook' | 'instagram' | 'tiktok';

export interface SocialMediaMonth {
  month: string;
  followers: number;
  views: number;
  covering: number;
  interactions: number;
  ratio_interactions_followers: number;
}

export interface SocialMediaData {
  platforms: Record<PlatformName, { monthly: SocialMediaMonth[] }>;
}

export interface PaidMediaMonth {
  month: string;
  traffic: number;
  conversion_rate: number;
  orders: number;
  retention_rate: number;
  ad_spend: number;
  revenue: number;
}

export interface PaidMediaData {
  monthly: PaidMediaMonth[];
}

export interface Flyer {
  id: string;
  month: string;
  title: string;
  volume: number;
  ctr: number;
  pages: number;
  products_featured: number;
}

export interface FlyersData {
  flyers: Flyer[];
}

export interface InvoiceLineItem {
  description: string;
  category: string;
  amount: number;
}

export interface Invoice {
  month: string;
  line_items: InvoiceLineItem[];
  total: number;
  currency: string;
  status: string;
}

export interface InvoicingData {
  invoices: Invoice[];
}

export interface KpiMonthly {
  month: string;
  target: number;
  actual: number;
}

export interface KPI {
  id: string;
  name: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  period: string;
  monthly: KpiMonthly[];
}

export interface KpiData {
  kpis: KPI[];
}
