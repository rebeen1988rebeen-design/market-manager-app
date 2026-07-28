import React, { useState } from 'react';
import { 
  Users, 
  UserPlus,
  Plus, 
  Search, 
  DollarSign, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  X,
  CreditCard,
  Edit3,
  Trash2
} from 'lucide-react';
import { Customer, CustomerTransaction, Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DebtsViewProps {
  customers: Customer[];
  transactions: CustomerTransaction[];
  lang: Language;
  currency: Currency;
  exchangeRate: number;
  onAddCustomer: (name: string, phone: string, notes?: string) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onRecordPayment: (customerId: string, amount: number, note?: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  customers,
  transactions,
  lang,
  currency,
  exchangeRate,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onRecordPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers[0]?.id || null
  );

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustDebt, setEditCustDebt] = useState<number>(0);
  const [editCustNotes, setEditCustNotes] = useState('');

  // Delete Customer Confirmation Modal State
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(10000);
  const [paymentNote, setPaymentNote] = useState<string>('دانەوەی قەرز');

  const totalMarketDebt = customers.reduce((acc, c) => acc + c.debtBalance, 0);

  const filteredCustomers = customers.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    return c.name.toLowerCase().includes(query) || c.phone.includes(query);
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedCustomerTransactions = transactions.filter(
    (t) => t.customerId === selectedCustomerId
  );

  const handleOpenEditCustomer = (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(cust);
    setEditCustName(cust.name);
    setEditCustPhone(cust.phone);
    setEditCustDebt(cust.debtBalance);
    setEditCustNotes(cust.notes || '');
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editCustName.trim()) return;
    onUpdateCustomer({
      ...editingCustomer,
      name: editCustName,
      phone: editCustPhone,
      debtBalance: Number(editCustDebt) || 0,
      notes: editCustNotes,
    });
    setEditingCustomer(null);
  };

  const handleOpenDeleteCustomer = (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingCustomer(cust);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!deletingCustomer) return;
    onDeleteCustomer(deletingCustomer.id);
    if (selectedCustomerId === deletingCustomer.id) {
      setSelectedCustomerId(null);
    }
    setDeletingCustomer(null);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    onAddCustomer(newCustName, newCustPhone, newCustNotes);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustNotes('');
    setIsAddCustomerOpen(false);
  };

  const handleConfirmPayment = () => {
    if (paymentCustomer && paymentAmount > 0) {
      onRecordPayment(paymentCustomer.id, paymentAmount, paymentNote);
      setPaymentCustomer(null);
      setPaymentAmount(10000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner & Total Debt Indicator - Apple Liquid Glass Style */}
      <div className="liquid-glass rounded-3xl p-6 shadow-xl shadow-slate-900/5 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/80">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-500/30 border border-amber-300/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{getTranslation(lang, 'debts')}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {lang === 'ku' ? 'تۆمار و بەڕێوەبردنی قەرزی کڕیاران و دانەوەی پارە' : 'Track customer debt balances and payments'}
            </p>
          </div>
        </div>

        {/* Total Debt Card */}
        <div className="bg-white/60 backdrop-blur-md border border-white/80 px-6 py-3 rounded-2xl text-center md:text-right shadow-inner">
          <span className="text-xs font-semibold text-slate-500 block">
            {getTranslation(lang, 'totalMarketDebt')}
          </span>
          <span className="text-2xl font-black text-amber-600 font-mono">
            {formatCurrency(totalMarketDebt, currency, exchangeRate)}
          </span>
        </div>
      </div>

      {/* Main Grid: Left Customers List, Right Customer Transaction Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Customers List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="liquid-glass p-4 rounded-3xl border border-white/80 shadow-xl shadow-slate-900/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 space-x-reverse">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ku' ? 'لیستی کڕیاران' : 'Customer List'}</span>
              </h3>

              <button
                onClick={() => setIsAddCustomerOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center space-x-1 space-x-reverse transition shadow-md shadow-emerald-600/20 border border-emerald-400/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{getTranslation(lang, 'addCustomer')}</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation(lang, 'search')}
                className="w-full pr-9 pl-3 py-2 bg-white/60 border border-white/80 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
              />
            </div>
          </div>

          {/* Customers Cards */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="liquid-glass rounded-3xl p-8 text-center text-slate-400 text-xs border border-white/80">
                {getTranslation(lang, 'noCustomers')}
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                const hasDebt = cust.debtBalance > 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-600 text-white border-amber-300/40 shadow-lg shadow-amber-500/25'
                        : 'liquid-card border-white/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {cust.name}
                        </h4>
                        <p className={`text-xs flex items-center space-x-1 space-x-reverse mt-1 ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                          <Phone className="w-3 h-3" />
                          <span>{cust.phone || (lang === 'ku' ? 'ژمارە نییە' : 'No phone')}</span>
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center space-x-1 space-x-reverse mb-1">
                          {/* Edit Button */}
                          <button
                            onClick={(e) => handleOpenEditCustomer(cust, e)}
                            className={`p-1.5 rounded-lg transition ${
                              isSelected
                                ? 'text-white/90 hover:text-white hover:bg-white/20'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                            }`}
                            title={getTranslation(lang, 'editCustomer')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleOpenDeleteCustomer(cust, e)}
                            className={`p-1.5 rounded-lg transition ${
                              isSelected
                                ? 'text-rose-200 hover:text-white hover:bg-rose-500/30'
                                : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title={getTranslation(lang, 'deleteCustomer')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className={`text-xs font-bold block ${hasDebt ? (isSelected ? 'text-white font-black' : 'text-amber-600') : (isSelected ? 'text-amber-100' : 'text-emerald-600')}`}>
                          {formatCurrency(cust.debtBalance, currency, exchangeRate)}
                        </span>
                        
                        {hasDebt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentCustomer(cust);
                              setPaymentAmount(Math.min(cust.debtBalance, 25000));
                            }}
                            className={`mt-1.5 px-2.5 py-1 font-bold text-[10px] rounded-xl shadow-xs transition active:scale-95 ${
                              isSelected
                                ? 'bg-white text-amber-700 hover:bg-amber-50 shadow-md'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs'
                            }`}
                          >
                            {getTranslation(lang, 'recordPayment')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Transaction History for Selected Customer (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="liquid-glass rounded-3xl border border-white/80 shadow-xl shadow-slate-900/5 p-5 space-y-5">
              
              {/* Selected Customer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/60 gap-3">
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
                    <button
                      onClick={(e) => handleOpenEditCustomer(selectedCustomer, e)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-white/80 rounded-xl transition cursor-pointer"
                      title={getTranslation(lang, 'editCustomer')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleOpenDeleteCustomer(selectedCustomer, e)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition cursor-pointer"
                      title={getTranslation(lang, 'deleteCustomer')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center space-x-2 space-x-reverse mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedCustomer.phone || (lang === 'ku' ? 'ژمارە نییە' : 'No phone')}</span>
                    {selectedCustomer.notes && <span>• {selectedCustomer.notes}</span>}
                  </p>
                </div>

                <div className="bg-white/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/80 text-right shadow-inner">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    {getTranslation(lang, 'debtBalance')}
                  </span>
                  <span className="text-lg font-black text-amber-600 font-mono">
                    {formatCurrency(selectedCustomer.debtBalance, currency, exchangeRate)}
                  </span>
                </div>
              </div>

              {/* Transactions History Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5 space-x-reverse">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{getTranslation(lang, 'debtHistory')}</span>
                </h4>

                {selectedCustomer.debtBalance > 0 && (
                  <button
                    onClick={() => {
                      setPaymentCustomer(selectedCustomer);
                      setPaymentAmount(Math.min(selectedCustomer.debtBalance, 25000));
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-2xl transition shadow-md shadow-emerald-600/20 border border-emerald-400/20 active:scale-95 flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>{getTranslation(lang, 'recordPayment')}</span>
                  </button>
                )}
              </div>

              {/* Transactions List */}
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                {selectedCustomerTransactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs bg-white/50 backdrop-blur-md rounded-2xl border border-white/80">
                    {lang === 'ku' ? 'هیچ جوڵەیەکی قەرز یان دانەوە تۆمار نەکراوە.' : 'No debt activity logged for this customer.'}
                  </div>
                ) : (
                  selectedCustomerTransactions.map((tx) => {
                    const isAdded = tx.type === 'debt_added';

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md flex items-center justify-between shadow-xs hover:bg-white/80 transition"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                              isAdded
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isAdded ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-slate-800 text-xs">
                              {isAdded
                                ? (lang === 'ku' ? 'زیادبوونی قەرز (کڕینی کاڵا)' : 'Debt Added (Purchase)')
                                : (lang === 'ku' ? 'دانەوەی قەرز (وەربگرتنەوە)' : 'Payment Received')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {formatDate(tx.createdAt, lang)} {tx.note && `• ${tx.note}`}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`font-mono font-extrabold text-xs ${
                            isAdded ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {isAdded ? '+' : '-'}{formatCurrency(tx.amount, currency, exchangeRate)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="liquid-glass rounded-3xl border border-white/80 p-12 text-center text-slate-400 text-xs">
              {lang === 'ku' ? 'تکایە کڕیارێک لە لیستی دەستەچەپ هەڵبژێرە.' : 'Select a customer from the left list.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Customer */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {getTranslation(lang, 'addCustomer')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/60 hover:bg-white rounded-xl cursor-pointer transition border border-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'customerName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  placeholder="ناوی تەواوی کڕیار"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'phone')}
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  placeholder="0750 XXX XXXX"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'note')}
                </label>
                <input
                  type="text"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full bg-white/70 border border-white/90 rounded-2xl px-3.5 py-2 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                  placeholder="تێبینی بۆ نموونە: شۆفێری تاكسی"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 space-x-reverse border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
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

      {/* Modal: Record Payment */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                {getTranslation(lang, 'recordPayment')}
              </h3>
              <p className="text-xs font-bold text-slate-700">{paymentCustomer.name}</p>
              <p className="text-xs text-amber-600 font-bold">
                {getTranslation(lang, 'debtBalance')}: {formatCurrency(paymentCustomer.debtBalance, currency, exchangeRate)}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'paymentAmount')} (د.ع)
                </label>
                <input
                  type="number"
                  min="500"
                  max={paymentCustomer.debtBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-center text-lg font-bold bg-white/60 border border-white/80 rounded-2xl py-2 text-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-inner"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'note')}
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
              >
                {getTranslation(lang, 'save')}
              </button>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="py-2.5 px-4 bg-white/80 hover:bg-white text-slate-700 rounded-2xl text-xs font-bold transition border border-slate-200 cursor-pointer"
              >
                {getTranslation(lang, 'cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Customer */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 space-x-reverse">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>{getTranslation(lang, 'editCustomer')}</span>
              </h3>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-xl hover:bg-white/60 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'customerName')} *
                </label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'phone')}
                </label>
                <input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'debtBalance')} (د.ع)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editCustDebt}
                  onChange={(e) => setEditCustDebt(Number(e.target.value))}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-3.5 py-2 text-slate-800 font-bold font-mono focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  {getTranslation(lang, 'note')}
                </label>
                <input
                  type="text"
                  value={editCustNotes}
                  onChange={(e) => setEditCustNotes(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-2xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 space-x-reverse border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 bg-white/80 text-slate-600 hover:bg-white rounded-xl font-bold cursor-pointer transition border border-slate-200"
                >
                  {getTranslation(lang, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                >
                  {getTranslation(lang, 'save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Customer Confirmation */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-white/80 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{getTranslation(lang, 'deleteCustomer')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {getTranslation(lang, 'confirmDeleteCustomer')}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-2 bg-white/80 py-1.5 px-3 rounded-xl inline-block border border-slate-200">
                {deletingCustomer.name}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmDeleteCustomer}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-md shadow-rose-600/20"
              >
                {getTranslation(lang, 'delete')}
              </button>
              <button
                onClick={() => setDeletingCustomer(null)}
                className="py-2.5 px-4 bg-white/80 hover:bg-white text-slate-700 rounded-2xl text-xs font-bold transition border border-slate-200 cursor-pointer"
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
