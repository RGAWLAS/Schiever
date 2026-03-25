'use client';

import { useState } from 'react';
import { Download, FileDown, Loader2 } from 'lucide-react';
import { generatePdf, type PdfSection } from '@/lib/pdf-export';

interface PdfExportButtonProps {
  section: PdfSection;
  label?: string;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md';
}

export default function PdfExportButton({ section, label, variant = 'primary', size = 'md' }: PdfExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    // Small delay to allow UI to update
    await new Promise(r => setTimeout(r, 50));
    try {
      generatePdf(section);
    } finally {
      setLoading(false);
    }
  };

  const text = label || (section === 'all' ? 'Pobierz pełny raport PDF' : 'Pobierz PDF');

  const baseClasses = `inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 ${
    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  }`;

  const variantClasses = variant === 'primary'
    ? 'bg-primary text-white hover:bg-primary-light'
    : 'bg-white border border-border text-foreground hover:bg-gray-50';

  return (
    <button onClick={handleExport} disabled={loading} className={`${baseClasses} ${variantClasses}`}>
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : <Download size={size === 'sm' ? 14 : 16} />}
      {text}
    </button>
  );
}

interface PdfExportMenuProps {
  className?: string;
}

export function PdfExportMenu({ className }: PdfExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (section: PdfSection) => {
    setLoading(section);
    await new Promise(r => setTimeout(r, 50));
    try {
      generatePdf(section);
    } finally {
      setLoading(null);
      setOpen(false);
    }
  };

  const sections: { id: PdfSection; label: string }[] = [
    { id: 'all', label: 'Pełny raport (wszystkie sekcje)' },
    { id: 'overview', label: 'Dashboard - Podsumowanie' },
    { id: 'social-media', label: 'Social Media' },
    { id: 'paid-media', label: 'E-commerce / Paid Media' },
    { id: 'flyers', label: 'Gazetki Promocyjne' },
    { id: 'invoicing', label: 'Fakturowanie' },
    { id: 'kpi', label: 'Realizacja KPI' },
  ];

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
      >
        <FileDown size={16} />
        Eksport PDF
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-border shadow-lg z-50 py-1">
            <div className="px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">Wybierz raport do pobrania</span>
            </div>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => handleExport(s.id)}
                disabled={loading !== null}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading === s.id ? (
                  <Loader2 size={14} className="animate-spin text-primary" />
                ) : (
                  <Download size={14} className={s.id === 'all' ? 'text-primary' : 'text-muted'} />
                )}
                <span className={s.id === 'all' ? 'font-semibold' : ''}>{s.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
