import React, { useState } from 'react';
import { Bot, Sparkles, Send, Loader2, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Product, SaleInvoice, Customer, Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';

interface AiAdvisorViewProps {
  products: Product[];
  invoices: SaleInvoice[];
  customers: Customer[];
  lang: Language;
  currency: Currency;
  exchangeRate: number;
}

export const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({
  products,
  invoices,
  customers,
  lang,
  currency,
  exchangeRate,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [adviceResponse, setAdviceResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lowStockItems = products.filter((p) => p.stock <= p.lowStockAlert);
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalDebts = customers.reduce((acc, c) => acc + c.debtBalance, 0);

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));
  let totalCost = 0;
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const liveProd = productMap.get(item.product.id);
      const purchasePrice = (item.product.purchasePrice && item.product.purchasePrice > 0)
        ? item.product.purchasePrice
        : (liveProd?.purchasePrice || 0);
      totalCost += purchasePrice * item.quantity;
    });
  });
  const totalNetProfit = Math.max(0, totalRevenue - totalCost);

  const handleRunAdvisor = async (customPrompt?: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    const activePrompt = customPrompt || userPrompt;

    const storeSummary = {
      totalProductsCount: products.length,
      lowStockCount: lowStockItems.length,
      lowStockItemsList: lowStockItems.map((p) => ({
        nameKu: p.nameKu,
        nameEn: p.nameEn,
        stock: p.stock,
        lowLimit: p.lowStockAlert,
      })),
      totalSalesInvoices: invoices.length,
      totalRevenueIqd: totalRevenue,
      estimatedNetProfitIqd: totalNetProfit,
      totalOutstandingCustomerDebtsIqd: totalDebts,
      totalCustomersCount: customers.length,
    };

    // Client-side rule-based intelligence generator (Works 100% in PWA & Offline mode)
    const generateClientSmartAnalysis = () => {
      const lowCount = lowStockItems.length;
      const formattedRevenue = totalRevenue.toLocaleString('en-US');
      const formattedDebts = totalDebts.toLocaleString('en-US');
      const formattedProfit = totalNetProfit.toLocaleString('en-US');

      if (lang === 'ku') {
        let text = `✨ **شیکاری ژیرانەی گشتی بۆ مارکێت و کۆگا (PWA / AI Advisor)**\n\n`;

        text += `📦 **دۆخی کۆگا و کاڵاکان:**\n`;
        text += `- کۆی گشتی جۆری کاڵاکان: **${products.length}** کاڵا\n`;
        if (lowCount > 0) {
          text += `- ⚠️ **ئاگاداری دابینکردن:** **${lowCount}** کاڵا نزیکن لە تەواوبوون. پێویستە خێرا داواکاری بنێریت:\n`;
          lowStockItems.slice(0, 8).forEach((item: any) => {
            text += `  • **${item.nameKu || item.nameEn || 'کاڵا'}** (بڕی ماوە: ${item.stock} - ئاستی زەنگ: ${item.lowStockAlert})\n`;
          });
          if (lowCount > 8) {
            text += `  • و ${lowCount - 8} کاڵای تر...\n`;
          }
        } else {
          text += `- ✅ دۆخی بڕی کاڵاکان لە کۆگا زۆر باشە و هیچ کاڵایەک کەم نەبووەتەوە.\n`;
        }

        text += `\n💰 **دۆخی فرۆشتن و دارایی:**\n`;
        text += `- ژمارەی فاکتۆرەکان: **${invoices.length}** وەصڵی فرۆشتن\n`;
        text += `- کۆی داهات: **${formattedRevenue} د.ع**\n`;
        text += `- قازانجی خاوێنی خەمڵێنراو: **${formattedProfit} د.ع**\n`;

        text += `\n👥 **قەرز و کڕیاران:**\n`;
        text += `- کۆی قەرزی کڕیاران: **${formattedDebts} د.ع**\n`;

        if (totalDebts > totalRevenue * 0.3 && totalRevenue > 0) {
          text += `- ⚠️ **ئامۆژگاری دارایی:** ڕێژەی قەرزەکان بەرزە لە بەراورد بە داهات. پێشنیار دەکەین لە بەشی (قەرزەکان) بەدواداچوون بۆ کۆکردنەوەی قەرزی کڕیاران بکەیت.\n`;
        } else {
          text += `- 👍 ئاستی قەرزەکانی کڕیاران لە ئاستێکی گونجاو و تەندروستدایە.\n`;
        }

        if (activePrompt && activePrompt.trim()) {
          text += `\n💡 **پێشنیار بۆ داواکارییەکەت ("${activePrompt}"):**\n`;
          text += `بەپێی داتاکانی سوپەرمارکەتەکەت، زووتر داواکردنەوەی کاڵا کەمبووەکان و وەرگرتنەوەی قەرزە درێژخایەنەکان باشترین هەنگاوە بۆ زیادکردنی نەختینە و بەرزکردنەوەی قازانج.`;
        } else {
          text += `\n🚀 **ڕاسپاردە سەرەکییەکان بۆ بەرزکردنەوەی قازانج:**\n`;
          text += `1. **دابینکردنی خێرا:** داواکاری بۆ کاڵا پڕفڕۆشە کەمبووەکان دەستبەجێ بنێرە.\n`;
          text += `2. **کۆکردنەوەی قەرز:** لە بەشی (فرۆشتن / قەرزەکان) بڕی پارەی وەرگیراو تۆمار بکە.\n`;
          text += `3. **پێشنیاری داشکاندن:** بەکارهێنانی داشکاندن بۆ ئەو کاڵایانەی زۆر نەفرۆشراون.`;
        }

        return text;
      } else {
        let text = `✨ **Smart Store & Inventory Analysis Report (PWA Ready)**\n\n`;
        text += `📦 **Inventory Overview:**\n`;
        text += `- Total Product Types: **${products.length}**\n`;
        if (lowCount > 0) {
          text += `- ⚠️ **Low Stock Alert:** **${lowCount}** products need reordering soon.\n`;
        } else {
          text += `- ✅ All stock levels are healthy.\n`;
        }
        text += `\n💰 **Sales & Financials:**\n`;
        text += `- Total Invoices: **${invoices.length}**\n`;
        text += `- Total Revenue: **${formattedRevenue} IQD**\n`;
        text += `- Total Customer Debts: **${formattedDebts} IQD**\n`;
        return text;
      }
    };

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          storeSummary,
          language: lang,
        }),
      });

      if (!res.ok) {
        setAdviceResponse(generateClientSmartAnalysis());
      } else {
        const data = await res.json();
        setAdviceResponse(data.advice || generateClientSmartAnalysis());
      }
      setUserPrompt('');
    } catch (err: any) {
      console.warn('Backend endpoint unavailable in PWA mode, using smart client-side analysis:', err);
      setAdviceResponse(generateClientSmartAnalysis());
      setUserPrompt('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="liquid-glass p-6 rounded-3xl border border-white/80 shadow-xl shadow-slate-900/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30 border border-emerald-300/30">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {getTranslation(lang, 'aiAdvisorTitle')}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-md">
              {getTranslation(lang, 'aiAdvisorSub')}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleRunAdvisor()}
          disabled={isLoading}
          className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs px-5 py-3 rounded-2xl flex items-center space-x-2 space-x-reverse shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50 border border-emerald-400/20"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
          <span>{getTranslation(lang, 'analyzeMarket')}</span>
        </button>
      </div>

      {/* Overview Cards for AI Context */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold border border-amber-300/30 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">
              {lang === 'ku' ? 'کاڵا کەمبووەکان' : 'Low Stock Items'}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {lowStockItems.length} {getTranslation(lang, 'itemCount')}
            </span>
          </div>
        </div>

        <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold border border-emerald-300/30 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">
              {getTranslation(lang, 'totalRevenue')}
            </span>
            <span className="text-base font-extrabold text-emerald-600 font-mono">
              {formatCurrency(totalRevenue, currency, exchangeRate)}
            </span>
          </div>
        </div>

        <div className="liquid-glass rounded-3xl p-5 border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-600 flex items-center justify-center font-bold border border-sky-300/30 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">
              {lang === 'ku' ? 'کۆی کاڵاکانی کۆگا' : 'Total Inventory Items'}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              {products.length} {getTranslation(lang, 'itemCount')}
            </span>
          </div>
        </div>
      </div>

      {/* Advice Display Area */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-300/40 rounded-2xl text-rose-700 text-xs font-semibold backdrop-blur-md">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="liquid-glass rounded-3xl border border-white/80 p-12 text-center space-y-3 shadow-xl shadow-slate-900/5">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-slate-700">
            {getTranslation(lang, 'aiAnalyzing')}
          </p>
        </div>
      ) : adviceResponse ? (
        <div className="liquid-glass rounded-3xl border border-white/80 p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse pb-3 border-b border-slate-200/60">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {lang === 'ku' ? 'ڕاسپاردە و شیکاری ژیری دەستکرد (Gemini)' : 'Gemini AI Insights & Recommendations'}
            </h3>
          </div>

          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
            {adviceResponse}
          </div>
        </div>
      ) : (
        <div className="liquid-glass rounded-3xl border border-white/80 p-10 text-center text-slate-500 text-xs space-y-3 shadow-xl shadow-slate-900/5">
          <Bot className="w-12 h-12 text-slate-400/80 mx-auto" />
          <p className="max-w-md mx-auto text-slate-600 font-medium">
            {lang === 'ku'
              ? 'دگمەی "شیکاریکردنی دۆخی مارکێت" دابگرە بۆ دەستکەوتنی ئامۆژگاری ژیرانە بۆ بازاڕەکەت یان پرسیارێک بنووسە لە خوارەوە.'
              : 'Click "Analyze Market Data" to get smart inventory and revenue recommendations, or type a custom question below.'}
          </p>
        </div>
      )}

      {/* Interactive Prompt Form */}
      <div className="liquid-glass p-2.5 rounded-3xl border border-white/80 shadow-xl shadow-slate-900/5 flex items-center space-x-2 space-x-reverse">
        <input
          type="text"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && userPrompt.trim() && handleRunAdvisor(userPrompt)}
          placeholder={getTranslation(lang, 'aiPromptPlaceholder')}
          className="flex-1 bg-white/60 border border-white/80 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition shadow-inner font-medium placeholder:text-slate-400"
        />

        <button
          onClick={() => userPrompt.trim() && handleRunAdvisor(userPrompt)}
          disabled={isLoading || !userPrompt.trim()}
          className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white p-3 rounded-2xl transition shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 cursor-pointer border border-emerald-400/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
