'use client';

import { useState } from 'react';
import type { TabId } from '@/types';
import Header from '@/components/layout/header';
import TabNavigation from '@/components/layout/tab-navigation';
import OverviewPanel from '@/components/dashboard/overview-panel';
import SocialMediaPanel from '@/components/social-media/social-media-panel';
import PaidMediaPanel from '@/components/paid-media/paid-media-panel';
import FlyersPanel from '@/components/flyers/flyers-panel';
import InvoicingPanel from '@/components/invoicing/invoicing-panel';
import KpiPanel from '@/components/kpi/kpi-panel';

const panels: Record<TabId, React.ComponentType> = {
  'overview': OverviewPanel,
  'social-media': SocialMediaPanel,
  'paid-media': PaidMediaPanel,
  'flyers': FlyersPanel,
  'invoicing': InvoicingPanel,
  'kpi': KpiPanel,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const ActivePanel = panels[activeTab];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ActivePanel />
      </main>
    </div>
  );
}
