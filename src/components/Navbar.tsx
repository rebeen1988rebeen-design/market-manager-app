import React, { useRef } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3, 
  Truck, 
  Bot, 
  Settings, 
  Globe, 
  DollarSign, 
  Store,
  Save,
  FolderInput
} from 'lucide-react';
import { Language, Currency, StoreSettings } from '../types';
import { getTranslation } from '../utils/translations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  settings: StoreSettings;
  openSettings: () => void;
  lowStockCount: number;
  onSaveAll?: () => void;
  onRestoreData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  currency,
  setCurrency,
  settings,
  openSettings,
  lowStockCount,
  onSaveAll,
  onRestoreData,
}) => {
  const isRtl = lang === 'ku';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'pos', labelKey: 'pos', icon: ShoppingBag },
    { id: 'inventory', labelKey: 'inventory', icon: Package, badge: lowStockCount },
    { id: 'suppliers', labelKey: 'suppliers', icon: Truck },
    { id: 'debts', labelKey: 'debts', icon: Users },
    { id: 'reports', labelKey: 'reports', icon: BarChart3 },
    { id: 'ai', labelKey: 'aiAdvisor', icon: Bot, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 text-slate-100 shadow-xl shadow-slate-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Store Info */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 border border-amber-300/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-extrabold text-lg leading-tight tracking-wide text-white">
                {isRtl ? settings.storeNameKu : settings.storeNameEn}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {getTranslation(lang, 'appSubTitle')}
              </p>
            </div>
          </div>

          {/* Navigation Links - Apple Liquid Floating Glass Bar */}
          <nav className="hidden lg:flex items-center space-x-1.5 space-x-reverse p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = getTranslation(lang, item.labelKey as any);

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-full text-xs font-bold transition-all relative cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 border border-amber-300/30'
                      : item.highlight
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{label}</span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="inline-flex items-center justify-center text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full ml-1 shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Controls: Language, Currency, Save All, Restore, Settings */}
          <div className="flex items-center space-x-2 space-x-reverse">
            {/* Global Save & Backup Button */}
            {onSaveAll && (
              <button
                onClick={onSaveAll}
                className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-md shadow-amber-500/20 border border-amber-300/20 active:scale-95 cursor-pointer"
                title={getTranslation(lang, 'saveAllData')}
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{getTranslation(lang, 'saveAllData')}</span>
              </button>
            )}

            {/* Hidden File Input for Restore */}
            {onRestoreData && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onRestoreData}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 space-x-reverse bg-white/10 hover:bg-white/15 text-slate-200 px-2.5 py-1.5 rounded-full text-xs font-bold border border-white/10 backdrop-blur-md transition cursor-pointer"
                  title={getTranslation(lang, 'restoreBackup')}
                >
                  <FolderInput className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">{getTranslation(lang, 'restoreBackup')}</span>
                </button>
              </>
            )}

            {/* Currency Switcher */}
            <button
              onClick={() => setCurrency(currency === 'IQD' ? 'USD' : 'IQD')}
              className="flex items-center space-x-1 space-x-reverse bg-white/10 hover:bg-white/15 text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 backdrop-blur-md transition cursor-pointer"
              title={getTranslation(lang, 'currencyToggle')}
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>{currency === 'IQD' ? 'د.ع' : '$'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'ku' ? 'en' : 'ku')}
              className="flex items-center space-x-1.5 space-x-reverse bg-white/10 hover:bg-white/15 text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 backdrop-blur-md transition cursor-pointer"
              title="گۆڕینی زمان"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ku' ? 'کوردی' : 'EN'}</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={openSettings}
              className="p-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-full border border-white/10 backdrop-blur-md transition cursor-pointer"
              title={getTranslation(lang, 'settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="lg:hidden flex items-center overflow-x-auto py-2 space-x-2 space-x-reverse scrollbar-none border-t border-white/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = getTranslation(lang, item.labelKey as any);

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 space-x-reverse px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-white text-slate-900 px-1.5 rounded-full text-[10px] font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

