import socialMediaJson from '../../data/social-media.json';
import paidMediaJson from '../../data/paid-media.json';
import flyersJson from '../../data/flyers.json';
import invoicingJson from '../../data/invoicing.json';
import kpiJson from '../../data/kpi.json';

import type { SocialMediaData, PaidMediaData, FlyersData, InvoicingData, KpiData } from '@/types';

export function getSocialMediaData(): SocialMediaData {
  return socialMediaJson as SocialMediaData;
}

export function getPaidMediaData(): PaidMediaData {
  return paidMediaJson as PaidMediaData;
}

export function getFlyersData(): FlyersData {
  return flyersJson as FlyersData;
}

export function getInvoicingData(): InvoicingData {
  return invoicingJson as InvoicingData;
}

export function getKpiData(): KpiData {
  return kpiJson as KpiData;
}
