import React, { useState } from 'react';
import { Truck, Plus, Phone, Building2, Search, X, Edit3, Trash2 } from 'lucide-react';
import { Supplier, Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';

interface SuppliersViewProps {
  suppliers: Supplier[];
  lang: Language;
  currency: Currency;
  exchangeRate: number;
  onAddSupplier: (name: string, phone: string, company: string, debtToSupplier: number, notes?: string) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onPaySupplier: (id: string, amountPaid: number) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  lang,
  currency,
  exchangeRate,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onPaySupplier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [debtToSupplier, setDebtToSupplier] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Delete Confirm Modal State
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Payment Modal State
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(25000);

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || (s.company && s.company.toLowerCase().includes(q));
  });

  const totalDebtToSuppliers = suppliers.reduce((acc, s) => acc + s.debtToSupplier, 0);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setCompany('');
    setDebtToSupplier(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supp: Supplier) => {
    setEditingSupplier(supp);
    setName(supp.name);
    setPhone(supp.phone);
    setCompany(supp.company);
    setDebtToSupplier(supp.debtToSupplier);
    setNotes(supp.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        name,
        phone,
        company,
        debtToSupplier,
        notes,
      });
    } else {
      onAddSupplier(name, phone, company, debtToSupplier, notes);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    const confirmMsg = `${getTranslation(lang, 'confirmDeleteSupplier')} (${name})`;
    if (window.confirm(confirmMsg)) {
      onDeleteSupplier(id);
    }
  };

  const handleConfirmPay = () => {
    if (payingSupplier && payAmount > 0) {
      onPaySupplier(payingSupplier.id, payAmount);
      setPayingSupplier(null);
      setPayAmount(25000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="liquid-glass p-5 rounded-3xl border border-white/80 shadow-xl shadow-slate-900/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 border border-amber-300/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{getTranslation(lang, 'suppliers')}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {lang === 'ku' ? 'بەڕێوەبردن، دەستکاریکردن و دانەوەی قەرزی دابینکەران' : 'Manage, edit and clear supplier accounts'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="text-right px-4 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl shadow-inner">
            <span className="text-[10px] text-slate-500 font-bold block">{getTranslation(lang, 'debtToSupplier')}</span>
            <span className="text-sm font-black text-rose-600 font-mono">
              {formatCurrency(totalDebtToSuppliers, currency, exchangeRate)}
            </span>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer border border-amber-300/30"
          >
            <Plus className="w-4 h-4" />
            <span>{getTranslation(lang, 'addSupplier')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={getTranslation(lang, 'search')}
          className="w-full pr-9 pl-3 py-2 bg-white/90 border border-[#1A1A1A]/10 rounded-full text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
        />
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full p-8 text-center text-[#1A1A1A]/40 text-xs bg-white/80 rounded-[24px] border border-[#1A1A1A]/10">
            {lang === 'ku' ? 'هیچ دابینکەرێک نەکڕدراوە.' : 'No suppliers found.'}
          </div>
        ) : (
          filteredSuppliers.map((supp) => (
            <div
              key={supp.id}
              className="bg-white/90 rounded-[24px] p-5 border border-[#1A1A1A]/10 shadow-xs space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#1A1A1A] text-sm">{supp.name}</h3>
                  <p className="text-xs text-[#1A1A1A]/60 flex items-center space-x-1 space-x-reverse mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>{supp.company || (lang === 'ku' ? 'کۆمپانیا' : 'Company')}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1 space-x-reverse">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEditModal(supp)}
                    className="p-1.5 text-[#1A1A1A]/60 hover:text-[#D97706] bg-[#F9F7F2] hover:bg-[#D97706]/10 rounded-xl transition"
                    title={getTranslation(lang, 'editSupplier')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeletingSupplier(supp)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                    title={getTranslation(lang, 'deleteSupplier')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {supp.phone && (
                <div className="inline-flex items-center text-xs font-mono font-semibold bg-[#F9F7F2] text-[#1A1A1A]/80 px-3 py-1 rounded-full border border-[#1A1A1A]/5">
                  <Phone className="w-3 h-3 ml-1 text-[#D97706]" />
                  {supp.phone}
                </div>
              )}

              {supp.notes && (
                <p className="text-[11px] text-[#1A1A1A]/60 italic bg-[#F9F7F2]/60 p-2 rounded-xl">
                  "{supp.notes}"
                </p>
              )}

              <div className="pt-3 border-t border-[#1A1A1A]/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#1A1A1A]/50 font-bold block">
                    {getTranslation(lang, 'debtToSupplier')}
                  </span>
                  <span className="text-sm font-black text-rose-700 font-mono">
                    {formatCurrency(supp.debtToSupplier, currency, exchangeRate)}
                  </span>
                </div>

                {supp.debtToSupplier > 0 && (
                  <button
                    onClick={() => {
                      setPayingSupplier(supp);
                      setPayAmount(Math.min(supp.debtToSupplier, 50000));
                    }}
                    className="px-3.5 py-1.5 bg-rose-100 text-rose-800 hover:bg-rose-600 hover:text-white rounded-full text-xs font-bold transition-all shadow-2xs"
                  >
                    {lang === 'ku' ? 'دانەوەی قەرز' : 'Pay Supplier'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add/Edit Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingSupplier
                    ? getTranslation(lang, 'editSupplier')
                    : getTranslation(lang, 'addSupplier')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/60 hover:bg-white rounded-xl cursor-pointer transition border border-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'supplierName')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {lang === 'ku' ? 'کۆمپانیا' : 'Company'}
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    {getTranslation(lang, 'phone')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'debtToSupplier')} (د.ع)
                </label>
                <input
                  type="number"
                  min="0"
                  value={debtToSupplier}
                  onChange={(e) => setDebtToSupplier(Number(e.target.value))}
                  className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {lang === 'ku' ? 'تێبینی' : 'Notes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 space-x-reverse border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/80 text-slate-700 hover:bg-white rounded-xl font-bold cursor-pointer transition border border-slate-200/80"
                >
                  {getTranslation(lang, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold transition shadow-md shadow-amber-500/20 border border-amber-300/30 cursor-pointer active:scale-95"
                >
                  {getTranslation(lang, 'save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Supplier */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F7F2] rounded-[24px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#1A1A1A]/10 text-center">
            <h3 className="font-bold text-[#1A1A1A] text-base">{payingSupplier.name}</h3>
            <p className="text-xs text-rose-700 font-bold">
              {getTranslation(lang, 'debtToSupplier')}: {formatCurrency(payingSupplier.debtToSupplier, currency, exchangeRate)}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A1A1A] block">
                {lang === 'ku' ? 'بڕی دانەوە (د.ع):' : 'Payment Amount:'}
              </label>
              <input
                type="number"
                min="1000"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full text-center text-lg font-bold bg-white border border-[#1A1A1A]/10 rounded-xl py-2 text-rose-700 focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmPay}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-xs font-bold"
              >
                {getTranslation(lang, 'save')}
              </button>
              <button
                onClick={() => setPayingSupplier(null)}
                className="py-2.5 px-4 bg-[#EAE7DF] text-[#1A1A1A] rounded-full text-xs font-bold"
              >
                {getTranslation(lang, 'cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Supplier Confirmation */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F9F7F2] rounded-[24px] max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#1A1A1A]/10 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A1A] text-base">{getTranslation(lang, 'deleteSupplier')}</h3>
              <p className="text-xs text-[#1A1A1A]/70 mt-1">
                {getTranslation(lang, 'confirmDeleteSupplier')}
              </p>
              <p className="text-sm font-bold text-[#1A1A1A] mt-2 bg-[#EAE7DF] py-1.5 px-3 rounded-xl inline-block">
                {deletingSupplier.name} ({deletingSupplier.company || 'کۆمپانیا'})
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onDeleteSupplier(deletingSupplier.id);
                  setDeletingSupplier(null);
                }}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-full text-xs font-bold transition active:scale-95"
              >
                {getTranslation(lang, 'delete')}
              </button>
              <button
                onClick={() => setDeletingSupplier(null)}
                className="py-2.5 px-4 bg-[#EAE7DF] text-[#1A1A1A] rounded-full text-xs font-bold transition"
              >
                {getTranslation(lang, 'cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
