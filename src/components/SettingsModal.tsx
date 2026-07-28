import React, { useState, useRef } from 'react';
import { X, Settings, Store, DollarSign, Phone, MapPin, FileText, Check, Save, FolderInput, Database, FileCode } from 'lucide-react';
import { StoreSettings, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { exportToSingleHtmlFile } from '../utils/singleHtmlExporter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
  lang: Language;
  onSaveAllData?: () => void;
  onRestoreData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  lang,
  onSaveAllData,
  onRestoreData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 space-x-reverse">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>{getTranslation(lang, 'settings')}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 mb-1 block">
                {lang === 'ku' ? 'ناوی مارکێت (کوردی)' : 'Store Name (Kurdish)'}
              </label>
              <input
                type="text"
                required
                value={formData.storeNameKu}
                onChange={(e) => setFormData({ ...formData, storeNameKu: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">
                {lang === 'ku' ? 'ناوی مارکێت (ئینگلیزی)' : 'Store Name (English)'}
              </label>
              <input
                type="text"
                value={formData.storeNameEn}
                onChange={(e) => setFormData({ ...formData, storeNameEn: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 mb-1 block">
                {getTranslation(lang, 'phone')}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">
                {getTranslation(lang, 'exchangeRateLabel')}
              </label>
              <input
                type="number"
                min="1000"
                step="10"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {lang === 'ku' ? `١٠٠ دۆلار = ${(formData.exchangeRate * 100).toLocaleString()} دینار` : `$100 = ${(formData.exchangeRate * 100).toLocaleString()} IQD`}
              </span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 mb-1 block">
              {lang === 'ku' ? 'ناونیشانی مارکێت' : 'Store Address'}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 mb-1 block">
              {lang === 'ku' ? 'پەیامی ژێر وەصڵ (کوردی)' : 'Receipt Footer Note (Kurdish)'}
            </label>
            <input
              type="text"
              value={formData.receiptNoteKu}
              onChange={(e) => setFormData({ ...formData, receiptNoteKu: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>

          {/* Backup & Data Management Section */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Database className="w-4 h-4 text-[#D97706]" />
              <span>{lang === 'ku' ? 'خەزنکردن و پاراستنی داتاکان' : 'Backup & Data Persistence'}</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {lang === 'ku' 
                ? 'بە کلیک لەسەر "خەزنکردنی گشتی"، گشت بەرهەم، فرۆشتن، کڕیار و دابینکەرەکان ئۆتۆماتیکی پاشەکەوت دەبن و فایلی یەدەگی JSON دادەبەزێت بۆ بەکارهێنان لە هەر ئامێرێکدا.'
                : 'Save all market records to local storage & download a full JSON backup file.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onSaveAllData && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveAllData();
                  }}
                  className="px-3.5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{getTranslation(lang, 'saveAllData')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => exportToSingleHtmlFile()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs shadow-xs"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-200" />
                <span>{lang === 'ku' ? 'داگرتنی فایلی HTML' : 'Download HTML File'}</span>
              </button>

              {onRestoreData && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      onRestoreData(e);
                      onClose();
                    }}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
                  >
                    <FolderInput className="w-3.5 h-3.5 text-amber-400" />
                    <span>{getTranslation(lang, 'restoreBackup')}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex justify-end space-x-2 space-x-reverse border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer"
            >
              {getTranslation(lang, 'cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 space-x-reverse cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{getTranslation(lang, 'save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
