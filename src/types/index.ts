export type TabId = 'overview' | 'social-media' | 'paid-media' | 'flyers' | 'invoicing' | 'kpi' | 'photos';

export type PlatformName = 'facebook' | 'instagram' | 'tiktok';

export interface PhotoItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  category: string;
  uploadedAt: string;
  tags: string[];
}

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

export interface KpiMetric {
  id: string;
  name: string;
  metric: string;
  unit: string;
  format: 'number' | 'percent';
  targets: Record<string, number>;
}

export interface KpiCategory {
  id: string;
  name: string;
  icon: string;
  kpis: KpiMetric[];
}

export interface KpiData {
  categories: KpiCategory[];
}
