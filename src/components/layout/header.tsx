'use client';

import { PdfExportMenu } from '@/components/ui/pdf-export-button';

export default function Header() {
  return (
    <header className="bg-white border-b border-border px-6 py-4 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Schiever</h1>
            <p className="text-xs text-muted">Marketing Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted hidden sm:block">
            Raport: Styczeń 2025 &ndash; Marzec 2026
          </div>
          <PdfExportMenu />
        </div>
      </div>
    </header>
  );
}
