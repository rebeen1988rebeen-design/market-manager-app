import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
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

export default function App() {
  // Core Settings (Loaded from LocalStorage)
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

  // Persistent States from LocalStorage or Defaults
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('market_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('market_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('market_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('market_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [transactions, setTransactions] = useState<CustomerTransaction[]>(() => {
    const saved = localStorage.getItem('market_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('market_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => {
    const saved = localStorage.getItem('market_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  // Auto-save on window exit / refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('market_products', JSON.stringify(products));
      localStorage.setItem('market_categories', JSON.stringify(categories));
      localStorage.setItem('market_customers', JSON.stringify(customers));
      localStorage.setItem('market_transactions', JSON.stringify(transactions));
      localStorage.setItem('market_suppliers', JSON.stringify(suppliers));
      localStorage.setItem('market_invoices', JSON.stringify(invoices));
      localStorage.setItem('market_settings', JSON.stringify(settings));
      localStorage.setItem('market_lang', lang);
      localStorage.setItem('market_currency', currency);
      localStorage.setItem('market_active_tab', activeTab);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [products, categories, customers, transactions, suppliers, invoices, settings, lang, currency, activeTab]);

  // Save state to LocalStorage on changes so session tab & choices persist
  useEffect(() => {
    localStorage.setItem('market_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('market_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('market_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('market_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('market_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('market_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('market_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('market_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('market_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('market_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Global manual save & JSON backup file export trigger
  const handleSaveAllData = () => {
    // 1. Save all data to browser LocalStorage
    localStorage.setItem('market_products', JSON.stringify(products));
    localStorage.setItem('market_categories', JSON.stringify(categories));
    localStorage.setItem('market_customers', JSON.stringify(customers));
    localStorage.setItem('market_transactions', JSON.stringify(transactions));
    localStorage.setItem('market_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('market_invoices', JSON.stringify(invoices));
    localStorage.setItem('market_settings', JSON.stringify(settings));
    localStorage.setItem('market_lang', lang);
    localStorage.setItem('market_currency', currency);
    localStorage.setItem('market_active_tab', activeTab);

    // 2. Export full backup as downloadable .json file for safe offline storage
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
  };

  // Restore backup from JSON file
  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed) {
            if (parsed.products) {
              setProducts(parsed.products);
              localStorage.setItem('market_products', JSON.stringify(parsed.products));
            }
            if (parsed.categories) {
              setCategories(parsed.categories);
              localStorage.setItem('market_categories', JSON.stringify(parsed.categories));
            }
            if (parsed.customers) {
              setCustomers(parsed.customers);
              localStorage.setItem('market_customers', JSON.stringify(parsed.customers));
            }
            if (parsed.transactions) {
              setTransactions(parsed.transactions);
              localStorage.setItem('market_transactions', JSON.stringify(parsed.transactions));
            }
            if (parsed.suppliers) {
              setSuppliers(parsed.suppliers);
              localStorage.setItem('market_suppliers', JSON.stringify(parsed.suppliers));
            }
            if (parsed.invoices) {
              setInvoices(parsed.invoices);
              localStorage.setItem('market_invoices', JSON.stringify(parsed.invoices));
            }
            if (parsed.settings) {
              setSettings(parsed.settings);
              localStorage.setItem('market_settings', JSON.stringify(parsed.settings));
            }
            if (parsed.lang) {
              setLang(parsed.lang);
              localStorage.setItem('market_lang', parsed.lang);
            }
            if (parsed.currency) {
              setCurrency(parsed.currency);
              localStorage.setItem('market_currency', parsed.currency);
            }

            alert(getTranslation(lang, 'dataRestoredSuccessfully'));
          }
        } catch (err) {
          alert(getTranslation(lang, 'invalidBackupFile'));
        }
      };
      // Reset input value so same file can be reselected if needed
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
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRestockProduct = (id: string, additionalQty: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: p.stock + additionalQty } : p))
    );
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

    // 1. Deduct Stock
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const itemInCart = cartItems.find((ci) => ci.product.id === p.id);
        if (itemInCart) {
          return {
            ...p,
            stock: Math.max(0, p.stock - itemInCart.quantity),
          };
        }
        return p;
      })
    );

    // 2. Handle Customer Debt if paymentType === 'debt'
    if (paymentType === 'debt' && customerId) {
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c.id === customerId
            ? { ...c, debtBalance: c.debtBalance + totalAmount }
            : c
        )
      );

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
    }

    // 3. Save Invoice
    setInvoices((prev) => [newInvoice, ...prev]);

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
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setTransactions((prev) => prev.filter((t) => t.customerId !== id));
  };

  const handleRecordPayment = (customerId: string, amount: number, note?: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, debtBalance: Math.max(0, c.debtBalance - amount) }
          : c
      )
    );

    const newTx: CustomerTransaction = {
      id: `tx-${Date.now()}`,
      customerId,
      type: 'payment_made',
      amount,
      note: note || 'وەربگرتنەوەی پارەی قەرز',
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
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
  };

  const handleUpdateSupplier = (updatedSupp: Supplier) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === updatedSupp.id ? updatedSupp : s))
    );
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePaySupplier = (id: string, amountPaid: number) => {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, debtToSupplier: Math.max(0, s.debtToSupplier - amountPaid) } : s
      )
    );
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
        onSaveSettings={setSettings}
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
