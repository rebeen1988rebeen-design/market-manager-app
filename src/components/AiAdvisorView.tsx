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

  const handleRunAdvisor = async (customPrompt?: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    const storeSummary = {
      totalProductsCount: products.length,
      lowStockItems: lowStockItems.map((p) => ({
        nameKu: p.nameKu,
        nameEn: p.nameEn,
        stock: p.stock,
        lowLimit: p.lowStockAlert,
      })),
      totalSalesInvoices: invoices.length,
      totalRevenueIqd: totalRevenue,
      totalOutstandingCustomerDebtsIqd: totalDebts,
    };

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt || userPrompt,
          storeSummary,
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خەڵەتێک ڕوویدا لە پەیوەندیکردن بە AI.');
      }

      setAdviceResponse(data.advice);
      setUserPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'پەیوەندی بە سەرڤەرەوە پچڕا.');
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
