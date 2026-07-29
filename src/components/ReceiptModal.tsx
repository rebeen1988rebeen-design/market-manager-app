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

        {/* Printable Thermal Receipt Container */}
        <div
          ref={receiptRef}
          dir="rtl"
          className="printable-receipt flex-1 overflow-y-auto p-5 bg-[#F9F7F2] border border-dashed border-slate-300 rounded-xl font-sans text-slate-900 text-xs space-y-4 print:p-0 print:border-none print:bg-white print:text-black"
        >
          
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-slate-400 border-dashed">
            <Store className="w-7 h-7 mx-auto text-[#D97706]" />
            <h2 className="font-extrabold text-base text-slate-900 font-serif">
              {lang === 'ku' ? settings.storeNameKu : settings.storeNameEn}
            </h2>
            {settings.address && (
              <p className="text-[11px] text-slate-600 font-medium">{settings.address}</p>
            )}
            {settings.phone && (
              <p className="text-[11px] text-slate-600 font-medium font-mono" dir="ltr">
                تەلەفۆن: {settings.phone}
              </p>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="space-y-1.5 text-[11px] pb-2 border-b border-slate-300 border-dashed">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">{getTranslation(lang, 'receiptNo')}:</span>
              <span className="font-extrabold font-mono text-slate-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold">{getTranslation(lang, 'date')}:</span>
              <span className="font-medium font-mono">{formatDate(invoice.createdAt, lang)}</span>
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

          {/* Items Table */}
          <div className="space-y-2 py-1 border-b border-slate-300 border-dashed">
            <div className="flex justify-between font-extrabold text-[11px] text-slate-700 bg-slate-200/60 p-1.5 rounded-md">
              <span className="flex-1 text-right">ناوی کاڵا</span>
              <span className="w-20 text-center">بڕ × نرخ</span>
              <span className="w-20 text-left">کۆی گشتی</span>
            </div>

            {invoice.items.map((item, idx) => {
              const itemDiscount = item.itemDiscount || 0;
              const effectivePrice = Math.max(0, item.price - itemDiscount);
              const isItemDiscounted = itemDiscount > 0;

              return (
                <div key={idx} className="flex justify-between items-center text-[11px] py-0.5 border-b border-slate-100 last:border-none">
                  <div className="flex-1 pr-1 font-bold text-slate-900">
                    <div>{lang === 'ku' ? item.product.nameKu : item.product.nameEn}</div>
                    {isItemDiscounted && (
                      <div className="text-[9px] text-amber-700 font-semibold">
                        {lang === 'ku' ? 'داشکاندنی کاڵا:' : 'Item Discount:'} -{formatCurrency(itemDiscount, currency, exchangeRate)}
                      </div>
                    )}
                  </div>
                  <div className="w-20 text-center font-mono text-slate-700">
                    {item.quantity} × {formatCurrency(effectivePrice, currency, exchangeRate)}
                  </div>
                  <div className="w-20 text-left font-mono font-bold text-slate-900">
                    {formatCurrency(item.total, currency, exchangeRate)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex justify-between text-slate-700 font-medium">
              <span>{getTranslation(lang, 'subtotal')}:</span>
              <span className="font-mono font-bold">{formatCurrency(invoice.subtotal, currency, exchangeRate)}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>{getTranslation(lang, 'discount')}:</span>
                <span className="font-mono">-{formatCurrency(invoice.discount, currency, exchangeRate)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black pt-2 border-t-2 border-slate-900 text-slate-900">
              <span>{getTranslation(lang, 'total')}:</span>
              <span className="font-mono text-amber-700">{formatCurrency(invoice.totalAmount, currency, exchangeRate)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t border-slate-300 border-dashed text-[11px] text-slate-600 space-y-1">
            <p className="font-medium">{lang === 'ku' ? settings.receiptNoteKu : settings.receiptNoteEn}</p>
            <p className="font-bold text-slate-800">{getTranslation(lang, 'thanksMessage')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
