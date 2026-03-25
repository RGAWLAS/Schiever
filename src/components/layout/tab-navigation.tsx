'use client';

import { cn } from '@/lib/utils';
import type { TabId } from '@/types';
import {
  LayoutDashboard,
  Share2,
  ShoppingCart,
  Newspaper,
  Receipt,
  Target,
  ImageIcon,
} from 'lucide-react';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'social-media', label: 'Social Media', icon: Share2 },
  { id: 'paid-media', label: 'E-commerce', icon: ShoppingCart },
  { id: 'flyers', label: 'Gazetki', icon: Newspaper },
  { id: 'invoicing', label: 'Fakturowanie', icon: Receipt },
  { id: 'kpi', label: 'Realizacja KPI', icon: Target },
  { id: 'photos', label: 'Zdjęcia', icon: ImageIcon },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="bg-white border-b border-border no-print overflow-x-auto">
      <div className="max-w-7xl mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground hover:border-gray-300'
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
