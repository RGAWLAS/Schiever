import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSocialMediaData, getPaidMediaData, getFlyersData, getInvoicingData, getKpiData } from '@/lib/data';
import { formatNumber, formatCurrency, formatPercent, formatMonthFull } from '@/lib/formatters';
import type { PlatformName } from '@/types';

const PRIMARY = [30, 64, 175] as const;    // #1e40af
const ACCENT = [5, 150, 105] as const;     // #059669
const MUTED = [100, 116, 139] as const;    // #64748b

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function addPageHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Blue header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Schiever', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Marketing Dashboard', 14, 20);

  // Date on the right
  doc.setFontSize(8);
  doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 196, 13, { align: 'right' });

  // Section title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 38);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(subtitle, 14, 44);
  }
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, y);
  return y + 6;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ---- OVERVIEW SECTION ----
function addOverviewSection(doc: JsPDFWithAutoTable): void {
  const social = getSocialMediaData();
  const paid = getPaidMediaData();
  const flyers = getFlyersData();
  const kpis = getKpiData();

  addPageHeader(doc, 'Dashboard - Podsumowanie', 'Przegląd najważniejszych wskaźników marketingowych');

  const fb = social.platforms.facebook.monthly;
  const ig = social.platforms.instagram.monthly;
  const tk = social.platforms.tiktok.monthly;
  const totalFollowers = fb[fb.length - 1].followers + ig[ig.length - 1].followers + tk[tk.length - 1].followers;
  const paidLatest = paid.monthly[paid.monthly.length - 1];
  const latestFlyer = flyers.flyers[flyers.flyers.length - 1];
  const totalKpis = kpis.categories.reduce((s, c) => s + c.kpis.length, 0);

  const kpiCards = [
    ['Obserwujący (łącznie)', formatNumber(totalFollowers)],
    ['Ruch E-com', formatNumber(paidLatest.traffic)],
    ['Zamówienia', formatNumber(paidLatest.orders)],
    ['Konwersja (CR)', formatPercent(paidLatest.conversion_rate)],
    ['Retencja', formatPercent(paidLatest.retention_rate)],
    ['CTR Gazetki', formatPercent(latestFlyer.ctr)],
    ['ROAS', `${(paidLatest.revenue / paidLatest.ad_spend).toFixed(1)}x`],
    ['Łącznie KPI', `${totalKpis}`],
  ];

  let y = 50;
  // KPI cards as table
  autoTable(doc, {
    startY: y,
    head: [['Wskaźnik', 'Wartość']],
    body: kpiCards,
    theme: 'grid',
    headStyles: { fillColor: [...PRIMARY], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 }, 1: { halign: 'right', cellWidth: 60 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;
  y = addSectionTitle(doc, y, 'Wydatki vs. Przychód E-com (miesięcznie)');

  const revenueData = paid.monthly.map(m => [
    formatMonthFull(m.month),
    formatCurrency(m.ad_spend),
    formatCurrency(m.revenue),
    `${(m.revenue / m.ad_spend).toFixed(1)}x`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Miesiąc', 'Wydatki reklamowe', 'Przychód', 'ROAS']],
    body: revenueData,
    theme: 'striped',
    headStyles: { fillColor: [...PRIMARY], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
}

// ---- SOCIAL MEDIA SECTION ----
function addSocialMediaSection(doc: JsPDFWithAutoTable): void {
  doc.addPage();
  const data = getSocialMediaData();
  addPageHeader(doc, 'Social Media', 'Facebook, Instagram, TikTok - metryki i zaangażowanie');

  const platforms: PlatformName[] = ['facebook', 'instagram', 'tiktok'];
  const platformLabels: Record<PlatformName, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };

  let y = 50;

  for (const p of platforms) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionTitle(doc, y, platformLabels[p]);

    const rows = data.platforms[p].monthly.map(m => [
      formatMonthFull(m.month),
      formatNumber(m.followers),
      formatNumber(m.views),
      formatNumber(m.covering),
      formatNumber(m.interactions),
      `${m.ratio_interactions_followers.toFixed(2)}%`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Miesiąc', 'Obserwujący', 'Wyświetlenia', 'Zasięg', 'Interakcje', 'Ratio']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [...PRIMARY], fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
        4: { halign: 'right' }, 5: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc.lastAutoTable?.finalY ?? y) + 12;
  }

  // Summary comparison
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, y, 'Podsumowanie - ostatni miesiąc');

  const summaryRows = platforms.map(p => {
    const latest = data.platforms[p].monthly[data.platforms[p].monthly.length - 1];
    const prev = data.platforms[p].monthly[data.platforms[p].monthly.length - 2];
    const growth = ((latest.followers - prev.followers) / prev.followers * 100).toFixed(1);
    return [
      platformLabels[p],
      formatNumber(latest.followers),
      `+${growth}%`,
      formatNumber(latest.views),
      formatNumber(latest.interactions),
      `${latest.ratio_interactions_followers.toFixed(2)}%`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Platforma', 'Obserwujący', 'Zmiana m/m', 'Wyświetlenia', 'Interakcje', 'Ratio']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [...ACCENT], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });
}

// ---- PAID MEDIA / E-COMMERCE SECTION ----
function addPaidMediaSection(doc: JsPDFWithAutoTable): void {
  doc.addPage();
  const data = getPaidMediaData();
  addPageHeader(doc, 'E-commerce / Paid Media', 'Traffic, konwersja, zamówienia, retencja i ROAS');

  let y = 50;

  const rows = data.monthly.map(m => [
    formatMonthFull(m.month),
    formatNumber(m.traffic),
    `${m.conversion_rate.toFixed(1)}%`,
    formatNumber(m.orders),
    `${m.retention_rate.toFixed(1)}%`,
    formatCurrency(m.ad_spend),
    formatCurrency(m.revenue),
    `${(m.revenue / m.ad_spend).toFixed(1)}x`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Miesiąc', 'Traffic', 'CR', 'Zamówienia', 'Retencja', 'Ad Spend', 'Przychód', 'ROAS']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [...PRIMARY], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 12;
  y = checkPageBreak(doc, y, 40);
  y = addSectionTitle(doc, y, 'Kluczowe wskaźniki');

  const latest = data.monthly[data.monthly.length - 1];
  const totalRevenue = data.monthly.reduce((s, m) => s + m.revenue, 0);
  const totalSpend = data.monthly.reduce((s, m) => s + m.ad_spend, 0);
  const totalOrders = data.monthly.reduce((s, m) => s + m.orders, 0);
  const avgCR = (data.monthly.reduce((s, m) => s + m.conversion_rate, 0) / data.monthly.length).toFixed(1);

  autoTable(doc, {
    startY: y,
    head: [['Wskaźnik', 'Wartość']],
    body: [
      ['Łączny przychód', formatCurrency(totalRevenue)],
      ['Łączne wydatki reklamowe', formatCurrency(totalSpend)],
      ['Łączna liczba zamówień', formatNumber(totalOrders)],
      ['Średni CR', `${avgCR}%`],
      ['Średni ROAS', `${(totalRevenue / totalSpend).toFixed(1)}x`],
      ['Ostatni miesiąc - traffic', formatNumber(latest.traffic)],
      ['Ostatni miesiąc - retencja', `${latest.retention_rate}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [...ACCENT], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
}

// ---- FLYERS SECTION ----
function addFlyersSection(doc: JsPDFWithAutoTable): void {
  doc.addPage();
  const data = getFlyersData();
  addPageHeader(doc, 'Gazetki Promocyjne', 'Nakład, CTR i przegląd gazetek');

  let y = 50;

  const rows = data.flyers.map(f => [
    formatMonthFull(f.month),
    f.title,
    formatNumber(f.volume),
    `${f.ctr}%`,
    `${f.pages}`,
    `${f.products_featured}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Miesiąc', 'Tytuł', 'Nakład', 'CTR', 'Strony', 'Produkty']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [...PRIMARY], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 12;
  y = checkPageBreak(doc, y, 30);
  y = addSectionTitle(doc, y, 'Podsumowanie');

  const avgCtr = (data.flyers.reduce((s, f) => s + f.ctr, 0) / data.flyers.length).toFixed(1);
  const totalVolume = data.flyers.reduce((s, f) => s + f.volume, 0);
  const maxCtr = data.flyers.reduce((best, f) => f.ctr > best.ctr ? f : best, data.flyers[0]);

  autoTable(doc, {
    startY: y,
    head: [['Wskaźnik', 'Wartość']],
    body: [
      ['Łączny nakład', formatNumber(totalVolume)],
      ['Średni CTR', `${avgCtr}%`],
      ['Najwyższy CTR', `${maxCtr.title} (${maxCtr.ctr}%)`],
      ['Liczba gazetek', `${data.flyers.length}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [...ACCENT], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
}

// ---- INVOICING SECTION ----
function addInvoicingSection(doc: JsPDFWithAutoTable): void {
  doc.addPage();
  const data = getInvoicingData();
  addPageHeader(doc, 'Fakturowanie', 'Zestawienie kosztów i historia faktur');

  let y = 50;

  const rows = data.invoices.map(inv => {
    const byCategory: Record<string, number> = {};
    inv.line_items.forEach(item => { byCategory[item.category] = item.amount; });
    return [
      formatMonthFull(inv.month),
      formatCurrency(byCategory['social'] || 0),
      formatCurrency(byCategory['paid'] || 0),
      formatCurrency(byCategory['content'] || 0),
      formatCurrency(byCategory['flyers'] || 0),
      formatCurrency(byCategory['strategy'] || 0),
      formatCurrency(inv.total),
      inv.status === 'paid' ? 'Opłacona' : 'Oczekująca',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Miesiąc', 'Social', 'Paid Media', 'Content', 'Gazetki', 'Strategia', 'Razem', 'Status']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [...PRIMARY], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 12;
  y = checkPageBreak(doc, y, 30);
  y = addSectionTitle(doc, y, 'Podsumowanie finansowe');

  const totalSpent = data.invoices.reduce((s, inv) => s + inv.total, 0);
  const avgMonthly = totalSpent / data.invoices.length;
  const paidCount = data.invoices.filter(i => i.status === 'paid').length;

  autoTable(doc, {
    startY: y,
    head: [['Wskaźnik', 'Wartość']],
    body: [
      ['Łączne wydatki', formatCurrency(totalSpent)],
      ['Średnia miesięczna', formatCurrency(avgMonthly)],
      ['Faktury opłacone', `${paidCount}/${data.invoices.length}`],
      ['Faktury oczekujące', `${data.invoices.length - paidCount}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [...ACCENT], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
}

// ---- KPI helper to get actual values ----
function getKpiActual(
  categoryId: string, metric: string, month: string,
): number | null {
  if (categoryId === 'ecommerce') {
    const entry = getPaidMediaData().monthly.find(m => m.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }
  const platformMap: Record<string, 'facebook' | 'instagram' | 'tiktok'> = {
    'social-facebook': 'facebook', 'social-instagram': 'instagram', 'social-tiktok': 'tiktok',
  };
  if (platformMap[categoryId]) {
    const entry = getSocialMediaData().platforms[platformMap[categoryId]].monthly.find(m => m.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }
  if (categoryId === 'flyers') {
    const entry = getFlyersData().flyers.find(f => f.month === month);
    if (!entry) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (entry as any)[metric] as number ?? null;
  }
  return null;
}

function formatKpiVal(value: number, format: string, unit: string): string {
  if (format === 'percent') return `${value.toFixed(1)}${unit}`;
  return formatNumber(value);
}

// ---- KPI SECTION ----
function addKpiSection(doc: JsPDFWithAutoTable): void {
  doc.addPage();
  const data = getKpiData();
  addPageHeader(doc, 'Realizacja KPI', 'Cele i postęp realizacji kluczowych wskaźników');

  let y = 50;

  for (const category of data.categories) {
    y = checkPageBreak(doc, y, 50);
    y = addSectionTitle(doc, y, category.name);

    const rows = category.kpis.map(kpi => {
      const months = Object.keys(kpi.targets).sort();
      const latestMonth = months[months.length - 1];
      const target = kpi.targets[latestMonth];
      const actual = getKpiActual(category.id, kpi.metric, latestMonth);
      const ratio = actual !== null ? actual / target : 0;
      const status = ratio >= 1.0 ? 'Zrealizowany' : ratio >= 0.9 ? 'Na dobrej drodze' : ratio >= 0.7 ? 'Wymaga uwagi' : 'Zagrożony';
      return [
        kpi.name,
        formatKpiVal(target, kpi.format, kpi.unit),
        actual !== null ? formatKpiVal(actual, kpi.format, kpi.unit) : '—',
        `${Math.round(ratio * 100)}%`,
        status,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['KPI', 'Cel', 'Realizacja', '%', 'Status']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [...PRIMARY], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: (cellData) => {
        if (cellData.section === 'body' && cellData.column.index === 4) {
          const val = cellData.cell.raw as string;
          if (val === 'Zrealizowany' || val === 'Na dobrej drodze') {
            cellData.cell.styles.textColor = [5, 150, 105];
            cellData.cell.styles.fontStyle = 'bold';
          } else if (val === 'Wymaga uwagi') {
            cellData.cell.styles.textColor = [245, 158, 11];
            cellData.cell.styles.fontStyle = 'bold';
          } else {
            cellData.cell.styles.textColor = [220, 38, 38];
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    y = (doc.lastAutoTable?.finalY ?? y) + 12;
  }
}

// ---- FOOTER ----
function addFooters(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Schiever Marketing Dashboard | Strona ${i} z ${pageCount}`, 105, 290, { align: 'center' });
  }
}

// ---- PUBLIC API ----
export type PdfSection = 'all' | 'overview' | 'social-media' | 'paid-media' | 'flyers' | 'invoicing' | 'kpi';

export function generatePdf(section: PdfSection = 'all'): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPDFWithAutoTable;

  const sections: Record<Exclude<PdfSection, 'all'>, (doc: JsPDFWithAutoTable) => void> = {
    'overview': addOverviewSection,
    'social-media': addSocialMediaSection,
    'paid-media': addPaidMediaSection,
    'flyers': addFlyersSection,
    'invoicing': addInvoicingSection,
    'kpi': addKpiSection,
  };

  if (section === 'all') {
    const allSections: Exclude<PdfSection, 'all'>[] = ['overview', 'social-media', 'paid-media', 'flyers', 'invoicing', 'kpi'];
    allSections.forEach((s, i) => {
      if (i === 0) {
        sections[s](doc);
      } else {
        sections[s](doc);
      }
    });
  } else {
    sections[section](doc);
  }

  addFooters(doc);

  const dateStr = new Date().toISOString().split('T')[0];
  const sectionLabel = section === 'all' ? 'pelny-raport' : section;
  doc.save(`Schiever_${sectionLabel}_${dateStr}.pdf`);
}
