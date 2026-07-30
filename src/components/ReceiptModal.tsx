import React, { useRef, useState } from 'react';
import { X, Printer, Download, Store, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SaleInvoice, StoreSettings, Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency, formatDate } from '../utils/formatters';
import { downloadOrShareFile } from '../utils/fileDownloader';

interface ReceiptModalProps {
  invoice: SaleInvoice | null;
  onClose: () => void;
  settings: StoreSettings;
  lang: Language;
  currency: Currency;
  exchangeRate: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  onClose,
  settings,
  lang,
  currency,
  exchangeRate,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);

  if (!invoice) return null;

  const handleExportPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);

    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((style) => {
            if (style.textContent) {
              style.textContent = style.textContent
                .replace(/oklch\([^\)]*\)/gi, '#1e293b')
                .replace(/oklab\([^\)]*\)/gi, '#1e293b')
                .replace(/color\([^\)]*\)/gi, '#1e293b')
                .replace(/color-mix\([^\)]*\)/gi, '#1e293b')
                .replace(/light-dark\([^\)]*\)/gi, '#1e293b')
                .replace(/(oklch|oklab|color-mix)\s*\([^;\}]+/gi, '#1e293b');
            }
          });

          const target = clonedDoc.querySelector('.printable-receipt') as HTMLElement;
          if (target) {
            target.style.width = '350px';
            target.style.maxHeight = 'none';
            target.style.height = 'auto';
            target.style.overflow = 'visible';
            target.style.backgroundColor = '#ffffff';
            target.style.color = '#000000';
            target.style.padding = '16px';
            target.style.borderRadius = '0px';
            target.style.border = 'none';
            target.style.boxShadow = 'none';
          }

          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((node) => {
            const el = node as HTMLElement;
            const styleAttr = el.getAttribute?.('style');
            if (styleAttr) {
              el.setAttribute(
                'style',
                styleAttr
                  .replace(/oklch\([^\)]*\)/gi, '#1e293b')
                  .replace(/oklab\([^\)]*\)/gi, '#1e293b')
                  .replace(/color\([^\)]*\)/gi, '#1e293b')
                  .replace(/color-mix\([^\)]*\)/gi, '#1e293b')
                  .replace(/light-dark\([^\)]*\)/gi, '#1e293b')
                  .replace(/(oklch|oklab|color-mix)\s*\([^;\}]+/gi, '#1e293b')
              );
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80; // 80mm thermal paper standard width
      const pdfHeight = Math.max(100, (canvas.height * pdfWidth) / canvas.width);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const pdfBlob = pdf.output('blob');
      const fileName = `wesl-${invoice.invoiceNumber}.pdf`;

      await downloadOrShareFile({
        fileBits: [pdfBlob],
        fileName,
        mimeType: 'application/pdf',
        title: `وەصڵی فرۆشتن #${invoice.invoiceNumber}`,
        text: `وەصڵی فرۆشتن #${invoice.invoiceNumber} - ${settings.storeNameKu}`,
      });

    } catch (err) {
      console.error('Failed to export PDF receipt:', err);
      try {
        window.print();
      } catch (printErr) {
        console.error('Print fallback failed:', printErr);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Green button 80mm Thermal Receipt Print handler
  const handlePrint80mm = async () => {
    setIsPrinting(true);
    try {
      const isStandalone =
        typeof window !== 'undefined' &&
        ((window.navigator as any).standalone === true ||
          window.matchMedia('(display-mode: standalone)').matches);

      if (isStandalone) {
        // In iOS PWA standalone mode, window.print() is disabled by Safari.
        // Export PDF with Web Share API so native Share Sheet opens with Print option!
        await handleExportPDF();
        return;
      }

      if (typeof window !== 'undefined' && window.print) {
        window.print();
      } else {
        await handleExportPDF();
      }
    } catch (e) {
      console.error('Print failed, falling back to PDF:', e);
      await handleExportPDF();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="printable-receipt-parent fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="printable-receipt-parent liquid-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80 max-h-[90vh] flex flex-col">
        
        {/* Actions bar (hidden during print) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 print:hidden">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 space-x-reverse">
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>{getTranslation(lang, 'receiptTitle')}</span>
          </h3>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse cursor-pointer transition shadow-md shadow-amber-500/20 disabled:opacity-50 border border-amber-300/30 active:scale-95"
              title={lang === 'ku' ? 'دابەزاندنی وەصڵ بە فایلی PDF' : 'Download Receipt as PDF'}
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {isExporting
                  ? (lang === 'ku' ? 'دروستکردنی PDF...' : 'Generating PDF...')
                  : (lang === 'ku' ? 'دابەزاندنی PDF' : 'Download PDF')}
              </span>
            </button>

            <button
              onClick={handlePrint80mm}
              disabled={isPrinting}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse cursor-pointer transition shadow-md shadow-emerald-600/20 disabled:opacity-50 border border-emerald-400/30 active:scale-95"
              title={lang === 'ku' ? 'چاپکردنی ڕاستەوخۆ (80mm)' : 'Direct Print (80mm)'}
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>
                {isPrinting
                  ? (lang === 'ku' ? 'ئامادەکردن...' : 'Preparing...')
                  : (lang === 'ku' ? 'چاپکردن (Print)' : 'Print')}
              </span>
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-xl hover:bg-white/60 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal / Compact Report Receipt Container */}
        <div
          ref={receiptRef}
          dir="rtl"
          className="printable-receipt flex-1 overflow-y-auto p-4 bg-white border border-slate-200 rounded-2xl font-sans text-slate-900 text-xs space-y-3.5 print:p-0 print:border-none print:bg-white print:text-black shadow-sm"
        >
          {/* Executive Store Header Banner */}
          <div className="text-center p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 mb-0.5">
              <Store className="w-4 h-4 text-[#D97706]" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900">
              {lang === 'ku' ? settings.storeNameKu : settings.storeNameEn}
            </h2>
            {settings.address && (
              <p className="text-[10px] text-slate-600 font-medium">{settings.address}</p>
            )}
            {settings.phone && (
              <p className="text-[10px] text-slate-600 font-medium font-mono" dir="ltr">
                {settings.phone}
              </p>
            )}
            <div className="pt-1.5 mt-1 border-t border-slate-200/80">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-200/80 text-slate-800 text-[10px] font-bold">
                {lang === 'ku' ? 'وەصڵی فەرمی فرۆشتن' : 'Official Sales Invoice'}
              </span>
            </div>
          </div>

          {/* Invoice Metadata Grid Card */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
              <span className="text-slate-600 font-semibold">{getTranslation(lang, 'receiptNo')}:</span>
              <span className="font-extrabold font-mono text-[#D97706] text-xs">#{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
              <span className="text-slate-600 font-semibold">{getTranslation(lang, 'date')}:</span>
              <span className="font-medium font-mono text-slate-800">{formatDate(invoice.createdAt, lang)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">{getTranslation(lang, 'customerType')}:</span>
              <span className="font-bold text-slate-900">
                {invoice.paymentType === 'cash'
                  ? getTranslation(lang, 'cashPayment')
                  : `${getTranslation(lang, 'debtPayment')} (${invoice.customerName || 'نادیار'})`}
              </span>
            </div>
          </div>

          {/* Items Table - Report Style */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-right text-[11px]">
              <thead className="font-bold border-b border-slate-200 bg-slate-100/80 text-slate-800">
                <tr>
                  <th className="p-2 w-7 text-center">#</th>
                  <th className="p-2 text-right">ناوی کاڵا</th>
                  <th className="p-2 text-center">بڕ × نرخ</th>
                  <th className="p-2 text-left">کۆی گشتی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoice.items.map((item, idx) => {
                  const itemDiscount = item.itemDiscount || 0;
                  const effectivePrice = Math.max(0, item.price - itemDiscount);
                  const isItemDiscounted = itemDiscount > 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center font-mono font-bold text-slate-400 text-[10px]">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-900">
                        <div>{lang === 'ku' ? item.product.nameKu : item.product.nameEn}</div>
                        {isItemDiscounted && (
                          <div className="text-[9px] text-amber-700 font-medium">
                            {lang === 'ku' ? 'داشکاندن:' : 'Discount:'} -{formatCurrency(itemDiscount, currency, exchangeRate)}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-700 whitespace-nowrap text-[10px]">
                        {item.quantity} × {formatCurrency(effectivePrice, currency, exchangeRate)}
                      </td>
                      <td className="p-2 text-left font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.total, currency, exchangeRate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Financial Breakdown Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>{getTranslation(lang, 'subtotal')}:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.subtotal, currency, exchangeRate)}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>{getTranslation(lang, 'discount')}:</span>
                <span className="font-mono">-{formatCurrency(invoice.discount, currency, exchangeRate)}</span>
              </div>
            )}

            {/* Main Net Total Banner */}
            <div className="flex justify-between items-center text-xs font-black p-2 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-950 my-1">
              <span>{getTranslation(lang, 'total')}:</span>
              <span className="font-mono text-sm font-extrabold text-[#B45309]">
                {formatCurrency(invoice.totalAmount, currency, exchangeRate)}
              </span>
            </div>

            {invoice.paidAmount !== undefined && invoice.paidAmount > 0 && (
              <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-200">
                <span>{lang === 'ku' ? 'پارەی وەرگیراو لە کڕیار:' : 'Cash Received:'}</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.paidAmount, currency, exchangeRate)}</span>
              </div>
            )}

            {invoice.changeAmount !== undefined && (
              <div className="flex justify-between items-center text-xs font-extrabold p-2 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-950 mt-1">
                <span>{lang === 'ku' ? 'باقی (گەڕاوە بۆ کڕیار):' : 'Change Return:'}</span>
                <span className="font-mono text-sm font-extrabold text-[#047857]">
                  {formatCurrency(invoice.changeAmount, currency, exchangeRate)}
                </span>
              </div>
            )}
          </div>

          {/* Report Style Footer Note */}
          <div className="text-center pt-2.5 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
            <p className="font-medium text-slate-700">{lang === 'ku' ? settings.receiptNoteKu : settings.receiptNoteEn}</p>
            <p className="font-bold text-slate-900">{getTranslation(lang, 'thanksMessage')}</p>
            <p className="text-[9px] text-slate-400 pt-1">
              سیستەمی بەڕێوەبردنی مارکێت • ڕاپۆرتی فەرمی فرۆشتن
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
