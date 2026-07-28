import React, { useState, useEffect } from 'react';
import { CheckCircle2, CloudCheck } from 'lucide-react';
import { 
  Language, 
  Currency, 
  Product, 
  Category, 
  Customer, 
  CustomerTransaction, 
  Supplier, 
  SaleInvoice, 
  StoreSettings, 
  CartItem 
} from './types';
import { 
  initialProducts, 
  initialCategories, 
  initialCustomers, 
  initialTransactions, 
  initialSuppliers, 
  initialSettings, 
  initialInvoices 
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { PosView } from './components/PosView';
import { InventoryView } from './components/InventoryView';
import { DebtsView } from './components/DebtsView';
import { ReportsView } from './components/ReportsView';
import { SuppliersView } from './components/SuppliersView';
import { AiAdvisorView } from './components/AiAdvisorView';
import { SettingsModal } from './components/SettingsModal';
import { ReceiptModal } from './components/ReceiptModal';
import { getTranslation } from './utils/translations';
import { supabaseService } from './lib/supabaseService';

export default function App() {
  // Core Settings
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('market_lang');
    return (saved as Language) || 'ku';
  });
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('market_currency');
    return (saved as Currency) || 'IQD';
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('market_active_tab');
    return saved || 'pos';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<SaleInvoice | null>(null);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // States initialized from defaults, then loaded from Supabase DB
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>(initialTransactions);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [invoices, setInvoices] = useState<SaleInvoice[]>(initialInvoices);

  // Fetch all data from Supabase on load
  useEffect(() => {
    async function loadSupabaseData() {
      setIsSyncing(true);
      try {
        await supabaseService.initializeDatabase();
        const [
          dbSettings,
          dbProducts,
          dbCategories,
          dbCustomers,
          dbTransactions,
          dbSuppliers,
          dbInvoices,
        ] = await Promise.all([
          supabaseService.getSettings(),
          supabaseService.getProducts(),
          supabaseService.getCategories(),
          supabaseService.getCustomers(),
          supabaseService.getTransactions(),
          supabaseService.getSuppliers(),
          supabaseService.getInvoices(),
        ]);

        if (dbSettings) setSettings(dbSettings);
        if (dbProducts) setProducts(dbProducts);
        if (dbCategories) setCategories(dbCategories);
        if (dbCustomers) setCustomers(dbCustomers);
        if (dbTransactions) setTransactions(dbTransactions);
        if (dbSuppliers) setSuppliers(dbSuppliers);
        if (dbInvoices) setInvoices(dbInvoices);
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      } finally {
        setIsSyncing(false);
      }
    }

    loadSupabaseData();
  }, []);

  // Save UI preferences to localStorage
  useEffect(() => {
    localStorage.setItem('market_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('market_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('market_active_tab', activeTab);
  }, [activeTab]);

  // Global manual save & JSON backup file export trigger
  const handleSaveAllData = async () => {
    setIsSyncing(true);
    try {
      await supabaseService.saveAllData({
        products,
        categories,
        customers,
        transactions,
        suppliers,
        invoices,
        settings,
      });

      const backupData = {
        app: 'MarketManagementSystem',
        exportDate: new Date().toISOString(),
        lang,
        currency,
        settings,
        products,
        categories,
        customers,
        transactions,
        suppliers,
        invoices,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `market-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setShowSaveToast(true);
      setTimeout(() => {
        setShowSaveToast(false);
      }, 4000);
    } catch (err: any) {
      console.error('Error saving data to Supabase:', err);
      alert(
        lang === 'ku'
          ? `هەڵە لە پاراستنی داتاکان لە داتابەیس: ${err?.message || 'تکایە هێڵی ئینتەرنێتەکەت بپشکنە'}`
          : `Error saving data to database: ${err?.message || 'Please check your internet connection'}`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Save settings handler
  const handleSaveSettings = async (newSettings: StoreSettings) => {
    setSettings(newSettings);
    try {
      await supabaseService.saveSettings(newSettings);
    } catch (err: any) {
      alert(
        lang === 'ku'
          ? `هەڵە لە خەزنکردنی ڕێکخستنەکان: ${err?.message || ''}`
          : `Error saving settings: ${err?.message || ''}`
      );
    }
  };

  // Restore backup from JSON file
  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed) {
            const restoredProducts = parsed.products || products;
            const restoredCategories = parsed.categories || categories;
            const restoredCustomers = parsed.customers || customers;
            const restoredTransactions = parsed.transactions || transactions;
            const restoredSuppliers = parsed.suppliers || suppliers;
            const restoredInvoices = parsed.invoices || invoices;
            const restoredSettings = parsed.settings || settings;

            setProducts(restoredProducts);
            setCategories(restoredCategories);
            setCustomers(restoredCustomers);
            setTransactions(restoredTransactions);
            setSuppliers(restoredSuppliers);
            setInvoices(restoredInvoices);
            setSettings(restoredSettings);

            if (parsed.lang) setLang(parsed.lang);
            if (parsed.currency) setCurrency(parsed.currency);

            setIsSyncing(true);
            try {
              await supabaseService.saveAllData({
                products: restoredProducts,
                categories: restoredCategories,
                customers: restoredCustomers,
                transactions: restoredTransactions,
                suppliers: restoredSuppliers,
                invoices: restoredInvoices,
                settings: restoredSettings,
              });
              alert(getTranslation(lang, 'dataRestoredSuccessfully'));
            } catch (err: any) {
              alert(
                lang === 'ku'
                  ? `داتاکان لەپەرگە هێنران بەڵام لە سۆپابەیس خەزن نەبوون: ${err?.message || ''}`
                  : `Data restored locally but failed to save to Supabase: ${err?.message || ''}`
              );
            } finally {
              setIsSyncing(false);
            }
          }
        } catch {
          alert(getTranslation(lang, 'invalidBackupFile'));
        }
      };
      e.target.value = '';
    }
  };

  // Inventory Handlers
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [product, ...prev]);
    supabaseService.addProduct(product);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    supabaseService.updateProduct(updatedProd);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    supabaseService.deleteProduct(id);
  };

  const handleRestockProduct = (id: string, additionalQty: number) => {
    let updatedProductStock = 0;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedProductStock = p.stock + additionalQty;
          return { ...p, stock: updatedProductStock };
        }
        return p;
      })
    );
    supabaseService.updateStock(id, updatedProductStock);
  };

  // Sale Checkout Handler
  const handleCompleteSale = (
    cartItems: CartItem[],
    subtotal: number,
    discount: number,
    totalAmount: number,
    paymentType: 'cash' | 'debt',
    customerId?: string,
    customerName?: string
  ): SaleInvoice => {
    const invCount = invoices.length + 1001;
    const newInvoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${invCount}`,
      items: cartItems,
      subtotal,
      discount,
      totalAmount,
      paymentType,
      customerId,
      customerName,
      createdAt: new Date().toISOString(),
    };

    // 1. Deduct Stock in State & Supabase DB
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const itemInCart = cartItems.find((ci) => ci.product.id === p.id);
        if (itemInCart) {
          const newStock = Math.max(0, p.stock - itemInCart.quantity);
          supabaseService.updateStock(p.id, newStock);
          return {
            ...p,
            stock: newStock,
          };
        }
        return p;
      })
    );

    // 2. Handle Customer Debt if paymentType === 'debt'
    if (paymentType === 'debt' && customerId) {
      let newDebtTotal = 0;
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) => {
          if (c.id === customerId) {
            newDebtTotal = c.debtBalance + totalAmount;
            return { ...c, debtBalance: newDebtTotal };
          }
          return c;
        })
      );
      supabaseService.updateCustomerDebt(customerId, newDebtTotal);

      const newTx: CustomerTransaction = {
        id: `tx-${Date.now()}`,
        customerId,
        type: 'debt_added',
        amount: totalAmount,
        note: `فرۆشتن بەپێی وەصڵی #${newInvoice.invoiceNumber}`,
        invoiceId: newInvoice.id,
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev]);
      supabaseService.addTransaction(newTx);
    }

    // 3. Save Invoice in State & Supabase DB
    setInvoices((prev) => [newInvoice, ...prev]);
    supabaseService.addInvoice(newInvoice);

    return newInvoice;
  };

  // Customer Handlers
  const handleAddCustomer = (name: string, phone: string, notes?: string) => {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name,
      phone,
      debtBalance: 0,
      notes,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    supabaseService.addCustomer(newCust);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
    supabaseService.updateCustomer(updatedCust);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setTransactions((prev) => prev.filter((t) => t.customerId !== id));
    supabaseService.deleteCustomer(id);
  };

  const handleRecordPayment = (customerId: string, amount: number, note?: string) => {
    let updatedDebt = 0;
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          updatedDebt = Math.max(0, c.debtBalance - amount);
          return { ...c, debtBalance: updatedDebt };
        }
        return c;
      })
    );
    supabaseService.updateCustomerDebt(customerId, updatedDebt);

    const newTx: CustomerTransaction = {
      id: `tx-${Date.now()}`,
      customerId,
      type: 'payment_made',
      amount,
      note: note || 'وەربگرتنەوەی پارەی قەرز',
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    supabaseService.addTransaction(newTx);
  };

  // Supplier Handlers
  const handleAddSupplier = (
    name: string,
    phone: string,
    company: string,
    debtToSupplier: number,
    notes?: string
  ) => {
    const newSupp: Supplier = {
      id: `supp-${Date.now()}`,
      name,
      phone,
      company,
      debtToSupplier,
      notes,
    };
    setSuppliers((prev) => [...prev, newSupp]);
    supabaseService.addSupplier(newSupp);
  };

  const handleUpdateSupplier = (updatedSupp: Supplier) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === updatedSupp.id ? updatedSupp : s))
    );
    supabaseService.updateSupplier(updatedSupp);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    supabaseService.deleteSupplier(id);
  };

  const handlePaySupplier = (id: string, amountPaid: number) => {
    let updatedSupp: Supplier | undefined;
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newDebt = Math.max(0, s.debtToSupplier - amountPaid);
          updatedSupp = { ...s, debtToSupplier: newDebt };
          return updatedSupp;
        }
        return s;
      })
    );
    if (updatedSupp) {
      supabaseService.updateSupplier(updatedSupp);
    }
  };


  const lowStockCount = products.filter((p) => p.stock <= p.lowStockAlert).length;

  return (
    <div
      dir={lang === 'ku' ? 'rtl' : 'ltr'}
      className="min-h-screen text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-white relative overflow-x-hidden"
    >
      {/* Ambient Apple Liquid Glow Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Toast Notification for Save All Data */}
      {showSaveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 liquid-glass-dark text-white border border-amber-400/40 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 space-x-reverse transition-all animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold tracking-wide">
            {getTranslation(lang, 'dataSavedSuccessfully')}
          </span>
        </div>
      )}

      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        settings={settings}
        openSettings={() => setIsSettingsOpen(true)}
        lowStockCount={lowStockCount}
        onSaveAll={handleSaveAllData}
        onRestoreData={handleRestoreData}
      />

      {/* Main Views Render */}
      <main className="pb-12">
        {activeTab === 'pos' && (
          <PosView
            products={products}
            categories={categories}
            customers={customers}
            lang={lang}
            currency={currency}
            exchangeRate={settings.exchangeRate}
            onCompleteSale={handleCompleteSale}
            onPrintInvoice={(inv) => setActiveReceiptInvoice(inv)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            categories={categories}
            lang={lang}
            currency={currency}
            exchangeRate={settings.exchangeRate}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRestockProduct={handleRestockProduct}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsView
            customers={customers}
            transactions={transactions}
            lang={lang}
            currency={currency}
            exchangeRate={settings.exchangeRate}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            invoices={invoices}
            products={products}
            categories={categories}
            customers={customers}
            lang={lang}
            currency={currency}
            exchangeRate={settings.exchangeRate}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            lang={lang}
            currency={currency}
            exchangeRate={settings.exchangeRate}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onPaySupplier={handlePaySupplier}
          />
        )}

        {activeTab === 'ai' && (
          <AiAdvisorView
            products={products}
            invoices={invoices}
            customers={customers}
            lang={lang}
            currency={currency}
            exchangeRate={settings.exchangeRate}
          />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        lang={lang}
        onSaveAllData={handleSaveAllData}
        onRestoreData={handleRestoreData}
      />

      <ReceiptModal
        invoice={activeReceiptInvoice}
        onClose={() => setActiveReceiptInvoice(null)}
        settings={settings}
        lang={lang}
        currency={currency}
        exchangeRate={settings.exchangeRate}
      />
    </div>
  );
}
