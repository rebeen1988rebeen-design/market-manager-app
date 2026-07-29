import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Award, 
  PieChart as PieIcon,
  Download,
  FileText,
  Printer,
  X,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { SaleInvoice, Product, Category, Customer, Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';
import { downloadOrShareFile } from '../utils/fileDownloader';

interface ReportsViewProps {
  invoices: SaleInvoice[];
  products: Product[];
  categories: Category[];
  customers: Customer[];
  lang: Language;
  currency: Currency;
  exchangeRate: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  products,
  categories,
  customers,
  lang,
  currency,
  exchangeRate,
}) => {
  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filter invoices based on date range
  const filteredInvoices = invoices.filter((inv) => {
    if (filterRange === 'all') return true;

    const invDate = new Date(inv.createdAt);
    const now = new Date();

    if (filterRange === 'today') {
      return invDate.toDateString() === now.toDateString();
    }

    if (filterRange === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
      return invDate >= oneWeekAgo;
    }

    if (filterRange === 'month') {
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

  // Calculate totals
  const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

  // Estimate profit = Total revenue - Cost of sold items
  let totalCost = 0;
  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const liveProd = productMap.get(item.product.id);
      const purchasePrice = (item.product.purchasePrice && item.product.purchasePrice > 0)
        ? item.product.purchasePrice
        : (liveProd?.purchasePrice || 0);
      totalCost += purchasePrice * item.quantity;
    });
  });
  const netProfit = Math.max(0, totalRevenue - totalCost);
  const totalInvoicesCount = filteredInvoices.length;
  const totalOutstandingDebt = customers.reduce((acc, c) => acc + c.debtBalance, 0);

  // Chart 1 Data: Group Sales & Profit by Date
  const salesByDateMap: Record<string, { date: string; sales: number; profit: number }> = {};

  filteredInvoices.forEach((inv) => {
    const d = new Date(inv.createdAt);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

    let invCost = 0;
    inv.items.forEach((item) => {
      const liveProd = productMap.get(item.product.id);
      const purchasePrice = (item.product.purchasePrice && item.product.purchasePrice > 0)
        ? item.product.purchasePrice
        : (liveProd?.purchasePrice || 0);
      invCost += purchasePrice * item.quantity;
    });
    const invProfit = Math.max(0, inv.totalAmount - invCost);

    if (!salesByDateMap[dateStr]) {
      salesByDateMap[dateStr] = { date: dateStr, sales: 0, profit: 0 };
    }

    salesByDateMap[dateStr].sales += inv.totalAmount;
    salesByDateMap[dateStr].profit += invProfit;
  });

  const dailyChartData = Object.values(salesByDateMap);

  // Chart 2 Data: Category Share
  const catSalesMap: Record<string, number> = {};
  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const catId = item.product.category;
      catSalesMap[catId] = (catSalesMap[catId] || 0) + item.total;
    });
  });

  const pieColors = ['#D97706', '#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#64748B'];
  const categoryChartData = Object.entries(catSalesMap).map(([catId, amount], idx) => {
    const catObj = categories.find((c) => c.id === catId);
    return {
      name: catObj ? (lang === 'ku' ? catObj.nameKu : catObj.nameEn) : catId,
      value: amount,
      color: pieColors[idx % pieColors.length],
    };
  });

  // Top Selling Products
  const prodSalesMap: Record<string, { product: Product; totalQty: number; totalRev: number }> = {};
  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const pid = item.product.id;
      if (!prodSalesMap[pid]) {
        prodSalesMap[pid] = { product: item.product, totalQty: 0, totalRev: 0 };
      }
      prodSalesMap[pid].totalQty += item.quantity;
      prodSalesMap[pid].totalRev += item.total;
    });
  });

  const topProductsList = Object.values(prodSalesMap)
    .sort((a, b) => b.totalRev - a.totalRev)
    .slice(0, 15);

  // Function to Export Monthly / Filtered Sales & Profit Summary as a Kurdish PDF file
  const handleExportPDF = async () => {
    setIsGeneratingPdf(true);
    if (!isPrintModalOpen) {
      setIsPrintModalOpen(true);
    }

    setTimeout(async () => {
      const reportElem = document.getElementById('kurdish-report-printable');
      if (!reportElem) {
        setIsGeneratingPdf(false);
        return;
      }

      try {
        const canvas = await html2canvas(reportElem, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794,
          onclone: (clonedDoc) => {
            // Replace all oklch and oklab color references in <style> tags to prevent html2canvas color parsing errors
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((style) => {
              if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab') || style.textContent.includes('color('))) {
                style.textContent = style.textContent
                  .replace(/oklch\([^\)]*\)/gi, '#1e293b')
                  .replace(/oklab\([^\)]*\)/gi, '#1e293b')
                  .replace(/(oklch|oklab)\s*\([^;\}]+/gi, '#1e293b');
              }
            });

            const container = clonedDoc.getElementById('kurdish-report-printable');
            if (!container) return;

            // Enforce exact A4 pixel width (794px = 210mm at 96 DPI)
            container.style.width = '794px';
            container.style.maxWidth = '794px';
            container.style.minWidth = '794px';
            container.style.maxHeight = 'none';
            container.style.height = 'auto';
            container.style.overflow = 'visible';
            container.style.position = 'static';
            container.style.margin = '0 auto';
            container.style.boxSizing = 'border-box';

            const modalParent = container.parentElement;
            if (modalParent) {
              modalParent.style.maxHeight = 'none';
              modalParent.style.height = 'auto';
              modalParent.style.overflow = 'visible';
            }

            // Strip oklch from all cloned elements
            const elements = container.querySelectorAll('*');
            const sanitizeElement = (el: HTMLElement) => {
              const style = clonedDoc.defaultView?.getComputedStyle(el);
              if (!style) return;

              ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'boxShadow'].forEach((prop) => {
                const val = style.getPropertyValue(prop);
                if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('color('))) {
                  if (prop === 'backgroundColor') el.style.backgroundColor = '#ffffff';
                  else if (prop === 'color') el.style.color = '#1e293b';
                  else if (prop === 'borderColor') el.style.borderColor = '#e2e8f0';
                  else if (prop === 'boxShadow') el.style.boxShadow = 'none';
                }
              });
            };

            sanitizeElement(container);
            elements.forEach((node) => sanitizeElement(node as HTMLElement));
          },
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Render Page 1
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Render subsequent pages if report exceeds 1 page
        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `raporti-froshtn-ku-${filterRange}-${dateStr}.pdf`;

        const pdfBlob = pdf.output('blob');
        await downloadOrShareFile({
          fileBits: [pdfBlob],
          fileName,
          mimeType: 'application/pdf',
          title: `ڕاپۆرتی فرۆشتن (${filterRange})`,
          text: `Sales Report PDF (${fileName})`,
        });
      } catch (err) {
        console.error('PDF generation error:', err);
        window.print();
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 400);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Bar with Time Filters & PDF Export */}
      <div className="liquid-glass p-6 rounded-3xl border border-white/80 shadow-xl shadow-slate-900/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 border border-amber-300/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{getTranslation(lang, 'reports')}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {lang === 'ku' ? 'شیکاری دارایی، داهات، قازانجی خاوێن و داگرتنی ڕاپۆرتی PDF' : 'Financial breakdown of revenue, profit margins and downloadable PDF reports'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* PDF & Print Report Button */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer border border-amber-300/30"
            title={getTranslation(lang, 'exportPdf')}
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ku' ? 'چاپکردنی ڕاپۆرتی کوردی (PDF)' : getTranslation(lang, 'exportPdf')}</span>
          </button>

          {/* Filter Buttons */}
          <div className="flex items-center space-x-1 space-x-reverse bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-inner">
            {[
              { id: 'today', labelKey: 'filterToday' },
              { id: 'week', labelKey: 'filterWeek' },
              { id: 'month', labelKey: 'filterMonth' },
              { id: 'all', labelKey: 'filterAll' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterRange(btn.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterRange === btn.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getTranslation(lang, btn.labelKey as any)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold border border-amber-300/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {getTranslation(lang, 'totalRevenue')}
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {formatCurrency(totalRevenue, currency, exchangeRate)}
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold border border-emerald-300/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {getTranslation(lang, 'totalProfit')}
            </span>
            <span className="text-xl font-black text-emerald-600 font-mono">
              {formatCurrency(netProfit, currency, exchangeRate)}
            </span>
          </div>
        </div>

        {/* Total Invoices Count */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold border border-blue-300/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {getTranslation(lang, 'totalInvoices')}
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {totalInvoicesCount} {getTranslation(lang, 'itemCount')}
            </span>
          </div>
        </div>

        {/* Outstanding Debts */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-bold border border-rose-300/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {getTranslation(lang, 'totalMarketDebt')}
            </span>
            <span className="text-xl font-black text-rose-600 font-mono">
              {formatCurrency(totalOutstandingDebt, currency, exchangeRate)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Chart: Sales & Net Profit over time (7 cols) */}
        <div className="lg:col-span-7 liquid-glass rounded-3xl border border-white/80 p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span>{getTranslation(lang, 'dailySalesChart')}</span>
            </h3>
            <span className="text-xs font-bold text-amber-700 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-300/30">
              {filterRange.toUpperCase()}
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            {dailyChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                {lang === 'ku' ? 'هیچ داتایەکی فرۆشتن لەم ماوەیەدا نییە.' : 'No sales data available for this range.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value), currency, exchangeRate)}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #ffffff', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="sales" fill="#f59e0b" radius={[8, 8, 0, 0]} name={getTranslation(lang, 'totalRevenue')} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name={getTranslation(lang, 'totalProfit')} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Share Donut Chart (5 cols) */}
        <div className="lg:col-span-5 liquid-glass rounded-3xl border border-white/80 p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2 space-x-reverse">
            <PieIcon className="w-5 h-5 text-amber-600" />
            <span>{getTranslation(lang, 'categoryShare')}</span>
          </h3>

          <div className="h-[280px] w-full flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <div className="text-slate-400 text-xs">
                {lang === 'ku' ? 'داتای کاتێگۆری دەستنەکەوت.' : 'No category data available.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val), currency, exchangeRate)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products List */}
      <div className="liquid-glass rounded-3xl border border-white/80 p-6 shadow-xl shadow-slate-900/5 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2 space-x-reverse">
          <Award className="w-5 h-5 text-amber-600" />
          <span>{getTranslation(lang, 'topProducts')}</span>
        </h3>

        <div className="space-y-3">
          {topProductsList.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              {lang === 'ku' ? 'هیچ داتایەک نەکڕدراوە.' : 'No items sold yet.'}
            </p>
          ) : (
            topProductsList.map((item, idx) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-3.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-xs hover:bg-white/80 transition"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="w-8 h-8 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {lang === 'ku' ? item.product.nameKu : item.product.nameEn}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {item.totalQty} {item.product.unit} {lang === 'ku' ? 'فرۆشراوە' : 'sold'}
                    </p>
                  </div>
                </div>

                <div className="font-black text-sm text-amber-600 font-mono">
                  {formatCurrency(item.totalRev, currency, exchangeRate)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Printable Kurdish Financial Report */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-white/80 max-h-[92vh] flex flex-col">
            
            {/* Modal Header Actions (Hidden during browser print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 print:hidden">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'ku' ? 'پێشاندانی ڕاپۆرتی کوردی (PDF & Print)' : 'Kurdish Report Preview'}
                </h3>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={handleExportPDF}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer border border-amber-300/30"
                  title="Download Kurdish PDF"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isGeneratingPdf
                      ? (lang === 'ku' ? 'دروستکردنی PDF...' : 'Generating PDF...')
                      : (lang === 'ku' ? 'دابەزاندنی فایلی PDF' : 'Download PDF')}
                  </span>
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50 border border-emerald-400/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ku' ? 'چاپکردن (Print)' : 'Print'}</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/60 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Content Container */}
            <div
              id="kurdish-report-printable"
              className="flex-1 overflow-y-auto p-6 rounded-2xl border space-y-6 dir-rtl print:p-0 print:bg-white print:border-none print:shadow-none"
              style={{ backgroundColor: '#F9F7F2', color: '#1A1A1A', borderColor: '#E2E8F0' }}
            >
              
              {/* Report Document Title Banner */}
              <div
                className="p-6 rounded-2xl border-b-4 flex items-center justify-between"
                style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', borderBottomColor: '#D97706' }}
              >
                <div>
                  <h1 className="text-xl font-extrabold font-serif">
                    {lang === 'ku'
                      ? `ڕاپۆرتی ${
                          filterRange === 'today'
                            ? 'ئەمڕۆ'
                            : filterRange === 'week'
                            ? 'ئەم هەفتەیە'
                            : filterRange === 'month'
                            ? 'ئەم مانگە'
                            : 'گشتی'
                        }ی فرۆشتن و قازانجی خاوێن`
                      : `Sales & Net Profit Report (${filterRange.toUpperCase()})`}
                  </h1>
                  <p className="text-xs mt-1 flex items-center gap-2" style={{ color: '#FCD34D' }}>
                    <Calendar className="w-3.5 h-3.5 inline" />
                    <span>بەرواری دروستکردن: {new Date().toLocaleDateString('ar-EG')}</span>
                    <span>•</span>
                    <span>دراو: {currency}</span>
                  </p>
                </div>
                <div className="text-left font-black text-sm hidden sm:block" style={{ color: '#F59E0B' }}>
                  سیستەمی بەڕێوەبردنی مارکێت
                </div>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                  <span className="text-[11px] block font-semibold" style={{ color: '#64748B' }}>
                    {getTranslation(lang, 'totalRevenue')}
                  </span>
                  <span className="text-base font-black font-mono mt-0.5 block" style={{ color: '#D97706' }}>
                    {formatCurrency(totalRevenue, currency, exchangeRate)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                  <span className="text-[11px] block font-semibold" style={{ color: '#64748B' }}>
                    {getTranslation(lang, 'totalProfit')}
                  </span>
                  <span className="text-base font-black font-mono mt-0.5 block" style={{ color: '#047857' }}>
                    {formatCurrency(netProfit, currency, exchangeRate)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                  <span className="text-[11px] block font-semibold" style={{ color: '#64748B' }}>
                    {getTranslation(lang, 'totalInvoices')}
                  </span>
                  <span className="text-base font-black font-mono mt-0.5 block" style={{ color: '#1E293B' }}>
                    {totalInvoicesCount} وەصڵ
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                  <span className="text-[11px] block font-semibold" style={{ color: '#64748B' }}>
                    کۆی قەرزی کڕیاران
                  </span>
                  <span className="text-base font-black font-mono mt-0.5 block" style={{ color: '#92400E' }}>
                    {formatCurrency(totalOutstandingDebt, currency, exchangeRate)}
                  </span>
                </div>
              </div>

              {/* Table 1: Period Breakdown */}
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <div className="px-4 py-2.5 font-bold text-xs border-b" style={{ backgroundColor: '#F1F5F9', color: '#1E293B', borderColor: '#E2E8F0' }}>
                  خشتەی شیکاری فرۆشتن و قازانج بەپێی بەروار
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="font-bold border-b" style={{ backgroundColor: '#F8FAFC', color: '#475569', borderColor: '#E2E8F0' }}>
                    <tr>
                      <th className="p-2.5">بەروار</th>
                      <th className="p-2.5">کۆی داهات</th>
                      <th className="p-2.5">قازانجی خاوێن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono" style={{ color: '#334155', borderColor: '#F1F5F9' }}>
                    {dailyChartData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center font-sans" style={{ color: '#94A3B8' }}>
                          هیچ فرۆشتنێک تۆمار نەکراوە بۆ ئەم ماوەیە.
                        </td>
                      </tr>
                    ) : (
                      dailyChartData.map((d, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-sans font-bold">{d.date}</td>
                          <td className="p-2.5 font-bold" style={{ color: '#B45309' }}>
                            {formatCurrency(d.sales, currency, exchangeRate)}
                          </td>
                          <td className="p-2.5 font-bold" style={{ color: '#047857' }}>
                            {formatCurrency(d.profit, currency, exchangeRate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table 2: Top Products */}
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <div className="px-4 py-2.5 font-bold text-xs border-b" style={{ backgroundColor: '#F1F5F9', color: '#1E293B', borderColor: '#E2E8F0' }}>
                  خشتەی پڕفرۆشترین کاڵاکانی ئەم ماوەیە
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="font-bold border-b" style={{ backgroundColor: '#F8FAFC', color: '#475569', borderColor: '#E2E8F0' }}>
                    <tr>
                      <th className="p-2.5">پلە</th>
                      <th className="p-2.5">ناوی کاڵا</th>
                      <th className="p-2.5">بڕی فرۆشراو</th>
                      <th className="p-2.5">کۆی داهات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ color: '#334155', borderColor: '#F1F5F9' }}>
                    {topProductsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center" style={{ color: '#94A3B8' }}>
                          هیچ کاڵایەک نەفڕۆشراوە.
                        </td>
                      </tr>
                    ) : (
                      topProductsList.map((item, idx) => (
                        <tr key={item.product.id}>
                          <td className="p-2.5 font-bold" style={{ color: '#D97706' }}>#{idx + 1}</td>
                          <td className="p-2.5 font-bold">{item.product.nameKu}</td>
                          <td className="p-2.5 font-mono">
                            {item.totalQty} {item.product.unit}
                          </td>
                          <td className="p-2.5 font-mono font-bold" style={{ color: '#B45309' }}>
                            {formatCurrency(item.totalRev, currency, exchangeRate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table 3: Full Invoices Log */}
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <div className="px-4 py-2.5 font-bold text-xs border-b flex justify-between items-center" style={{ backgroundColor: '#F1F5F9', color: '#1E293B', borderColor: '#E2E8F0' }}>
                  <span>تۆماری سەرجەم وەصڵەکانی فرۆشتنی ئەم ماوەیە</span>
                  <span className="text-[11px] font-semibold" style={{ color: '#D97706' }}>کۆی گشتی: {filteredInvoices.length} وەصڵ</span>
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="font-bold border-b" style={{ backgroundColor: '#F8FAFC', color: '#475569', borderColor: '#E2E8F0' }}>
                    <tr>
                      <th className="p-2.5">ژمارەی وەصڵ</th>
                      <th className="p-2.5">بەروار و کات</th>
                      <th className="p-2.5">کڕیار / جۆری دانان</th>
                      <th className="p-2.5">ژمارەی کاڵا</th>
                      <th className="p-2.5">کۆی گشتی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ color: '#334155', borderColor: '#F1F5F9' }}>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center" style={{ color: '#94A3B8' }}>
                          هیچ وەصڵێک تۆمار نەکراوە لەم ماوەیەدا.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="p-2.5 font-mono font-bold" style={{ color: '#D97706' }}>{inv.invoiceNumber}</td>
                          <td className="p-2.5 font-mono">{new Date(inv.createdAt).toLocaleString('ar-EG')}</td>
                          <td className="p-2.5 font-bold">
                            {inv.paymentType === 'cash' ? 'نەقد (کاش)' : `قەرز (${inv.customerName || 'نادیار'})`}
                          </td>
                          <td className="p-2.5 font-mono">{inv.items.reduce((sum, item) => sum + item.quantity, 0)} کاڵا</td>
                          <td className="p-2.5 font-mono font-bold" style={{ color: '#047857' }}>
                            {formatCurrency(inv.totalAmount, currency, exchangeRate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Printable Footer */}
              <div className="text-center text-[10px] pt-2 border-t" style={{ color: '#94A3B8', borderColor: '#E2E8F0' }}>
                سیستەمی بەڕێوەبردنی مارکێت • ڕاپۆرتی بڕواپێکراوی بەڕێوەبردن • بەرواری بەرهەمهێنان: {new Date().toLocaleString('ar-EG')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

