// Utility to bundle and export the entire app into a single downloadable HTML file

export const exportToSingleHtmlFile = () => {
  // Read current local storage or fallback defaults
  const currentProducts = localStorage.getItem('market_products') || '[]';
  const currentCategories = localStorage.getItem('market_categories') || '[]';
  const currentCustomers = localStorage.getItem('market_customers') || '[]';
  const currentTransactions = localStorage.getItem('market_transactions') || '[]';
  const currentSuppliers = localStorage.getItem('market_suppliers') || '[]';
  const currentInvoices = localStorage.getItem('market_invoices') || '[]';
  const currentSettings = localStorage.getItem('market_settings') || '{}';
  const currentLang = localStorage.getItem('market_lang') || '"ku"';
  const currentCurrency = localStorage.getItem('market_currency') || '"IQD"';

  const htmlContent = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>سیستەمی بەڕێوەبردنی مارکێت | Market Manager System</title>
  <meta name="description" content="سیستەمێکی پێشکەوتووی بەڕێوەبردنی مارکێت و سوپەرمارکێت، بەشەکانی فرۆشتن (POS)، کۆگا، قەرزەکان، ڕاپۆرت و قازانج بە زمانی کوردی." />
  <meta name="theme-color" content="#d97706" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Vazirmatn', 'Plus Jakarta Sans', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Vazirmatn', 'Plus Jakarta Sans', sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    .liquid-glass {
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  </style>

  <!-- React, ReactDOM, Babel CDN -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-white">

  <!-- Seed Current Data into LocalStorage if not present -->
  <script>
    try {
      if (!localStorage.getItem('market_products')) {
        localStorage.setItem('market_products', JSON.stringify(${currentProducts}));
      }
      if (!localStorage.getItem('market_categories')) {
        localStorage.setItem('market_categories', JSON.stringify(${currentCategories}));
      }
      if (!localStorage.getItem('market_customers')) {
        localStorage.setItem('market_customers', JSON.stringify(${currentCustomers}));
      }
      if (!localStorage.getItem('market_transactions')) {
        localStorage.setItem('market_transactions', JSON.stringify(${currentTransactions}));
      }
      if (!localStorage.getItem('market_suppliers')) {
        localStorage.setItem('market_suppliers', JSON.stringify(${currentSuppliers}));
      }
      if (!localStorage.getItem('market_invoices')) {
        localStorage.setItem('market_invoices', JSON.stringify(${currentInvoices}));
      }
      if (!localStorage.getItem('market_settings')) {
        localStorage.setItem('market_settings', JSON.stringify(${currentSettings}));
      }
      if (!localStorage.getItem('market_lang')) {
        localStorage.setItem('market_lang', JSON.stringify(${currentLang}));
      }
      if (!localStorage.getItem('market_currency')) {
        localStorage.setItem('market_currency', JSON.stringify(${currentCurrency}));
      }
    } catch(e) {
      console.warn('Storage init error:', e);
    }
  </script>

  <div id="root"></div>

  <!-- Full App Embedded Bundle Script -->
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo } = React;

    // Translation Dictionary
    const translations = {
      ku: {
        pos: 'فرۆشتن (POS)',
        inventory: 'کۆگا',
        customers: 'قەرزەکان',
        reports: 'ڕاپۆرت و قازانج',
        aiAdvisor: 'ژیری دەستکرد',
        suppliers: 'دابینکەران',
        settings: 'ڕێکخستنەکان',
        searchProduct: 'گەڕان بۆ کاڵا یان بارکۆد...',
        allCategories: 'هەموو بەشەکان',
        cart: 'سەبەتەی کڕین',
        clearCart: 'سڕینەوە',
        checkout: 'تەواوکردنی فرۆشتن',
        total: 'کۆی گشتی',
        discount: 'داشکاندن',
        finalTotal: 'کۆی کۆتایی',
        customer: 'کڕیار',
        cashCustomer: 'کڕیاری نەقد (موفەرەد)',
        addProduct: 'زیادکردنی کاڵا',
        barcode: 'بارکۆد',
        productNameKu: 'ناوی کاڵا (کوردی)',
        productNameEn: 'ناوی کاڵا (ئینگلیزی)',
        purchasePrice: 'نرخی کڕین',
        salePrice: 'نرخی فرۆشتن',
        quantity: 'بڕی جوملە/کۆگا',
        unit: 'یەکە (دانە/کیلۆ)',
        save: 'پاشەکەوتکردن',
        cancel: 'پاشگەزبوونەوە',
        actions: 'کردارەکان',
        edit: 'دەستکاری',
        delete: 'سڕینەوە',
        customerName: 'ناوی کڕیار',
        phone: 'ژمارەی مۆبایل',
        debt: 'بڕی قەرز',
        payDebt: 'دانی قەرز',
        totalRevenue: 'کۆی داهات',
        totalProfit: 'قازانجی خاوێن',
        totalInvoices: 'ژمارەی وەصڵەکان',
        totalMarketDebt: 'کۆی قەرزەکانی مارکێت',
        storeName: 'ناوی مارکێت',
        exchangeRate: 'نرخی گۆڕینەوە ($100 بە دینار)',
        saveSettings: 'خەزنکردنی ڕێکخستنەکان',
        exportBackup: 'داگرتنی بکئەپ (JSON)',
        restoreBackup: 'گەڕاندنەوەی بکئەپ',
        receipt: 'وەصڵی فرۆشتن',
        date: 'بەروار',
        thankYou: 'سوپاس بۆ سەردانەکەت!'
      },
      en: {
        pos: 'POS / Sales',
        inventory: 'Inventory',
        customers: 'Debts & Clients',
        reports: 'Reports & Profit',
        aiAdvisor: 'AI Advisor',
        suppliers: 'Suppliers',
        settings: 'Settings',
        searchProduct: 'Search product or barcode...',
        allCategories: 'All Categories',
        cart: 'Shopping Cart',
        clearCart: 'Clear Cart',
        checkout: 'Checkout & Pay',
        total: 'Subtotal',
        discount: 'Discount',
        finalTotal: 'Final Total',
        customer: 'Customer',
        cashCustomer: 'Cash Customer',
        addProduct: 'Add Product',
        barcode: 'Barcode',
        productNameKu: 'Product Name (Kurdish)',
        productNameEn: 'Product Name (English)',
        purchasePrice: 'Purchase Price',
        salePrice: 'Sale Price',
        quantity: 'Quantity',
        unit: 'Unit',
        save: 'Save',
        cancel: 'Cancel',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        customerName: 'Customer Name',
        phone: 'Phone Number',
        debt: 'Debt Amount',
        payDebt: 'Pay Debt',
        totalRevenue: 'Total Revenue',
        totalProfit: 'Net Profit',
        totalInvoices: 'Total Invoices',
        totalMarketDebt: 'Total Market Debt',
        storeName: 'Store Name',
        exchangeRate: 'Exchange Rate ($100 to IQD)',
        saveSettings: 'Save Settings',
        exportBackup: 'Export Backup (JSON)',
        restoreBackup: 'Restore Backup',
        receipt: 'Sales Receipt',
        date: 'Date',
        thankYou: 'Thank you for your visit!'
      }
    };

    function formatCurrency(amount, currency = 'IQD', exchangeRate = 150000) {
      if (currency === 'USD') {
        const usdVal = amount / (exchangeRate / 100);
        return '$' + usdVal.toFixed(2);
      }
      return new Intl.NumberFormat('en-US').format(Math.round(amount)) + ' د.ع';
    }

    // MAIN APP COMPONENT
    function MarketApp() {
      // States
      const [lang, setLang] = useState(() => JSON.parse(localStorage.getItem('market_lang') || '"ku"'));
      const [currency, setCurrency] = useState(() => JSON.parse(localStorage.getItem('market_currency') || '"IQD"'));
      const [activeTab, setActiveTab] = useState('pos');

      const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('market_products') || '[]'));
      const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('market_categories') || '[]'));
      const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem('market_customers') || '[]'));
      const [invoices, setInvoices] = useState(() => JSON.parse(localStorage.getItem('market_invoices') || '[]'));
      const [suppliers, setSuppliers] = useState(() => JSON.parse(localStorage.getItem('market_suppliers') || '[]'));
      const [storeSettings, setStoreSettings] = useState(() => JSON.parse(localStorage.getItem('market_settings') || '{"storeName":"مارکێتەکەم","phone":"0750 123 4567","address":"سلێمانی - شەقامی سەرەکی","exchangeRate":150000,"receiptFooter":"سوپاس بۆ سەردانەکەت!"}'));

      const [cart, setCart] = useState([]);
      const [searchQuery, setSearchQuery] = useState('');
      const [selectedCategory, setSelectedCategory] = useState('all');
      const [selectedCustomer, setSelectedCustomer] = useState('cash');
      const [discount, setDiscount] = useState(0);

      // Save State Helpers
      useEffect(() => { localStorage.setItem('market_lang', JSON.stringify(lang)); }, [lang]);
      useEffect(() => { localStorage.setItem('market_currency', JSON.stringify(currency)); }, [currency]);
      useEffect(() => { localStorage.setItem('market_products', JSON.stringify(products)); }, [products]);
      useEffect(() => { localStorage.setItem('market_customers', JSON.stringify(customers)); }, [customers]);
      useEffect(() => { localStorage.setItem('market_invoices', JSON.stringify(invoices)); }, [invoices]);
      useEffect(() => { localStorage.setItem('market_settings', JSON.stringify(storeSettings)); }, [storeSettings]);

      const t = translations[lang] || translations.ku;

      // Cart Operations
      const addToCart = (product) => {
        if (product.stock <= 0) {
          alert(lang === 'ku' ? 'ئەم کاڵایە لە کۆگا نه‌ماوه‌!' : 'Product out of stock!');
          return;
        }
        setCart(prev => {
          const existing = prev.find(item => item.product.id === product.id);
          if (existing) {
            if (existing.quantity >= product.stock) {
              alert(lang === 'ku' ? 'بڕی داواکراو زیاترە لە بڕی بەردەست لە کۆگا!' : 'Quantity exceeds available stock!');
              return prev;
            }
            return prev.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prev, { product, quantity: 1 }];
        });
      };

      const updateCartQty = (productId, delta) => {
        setCart(prev =>
          prev.map(item => {
            if (item.product.id === productId) {
              const newQty = item.quantity + delta;
              if (newQty <= 0) return null;
              if (newQty > item.product.stock) return item;
              return { ...item, quantity: newQty };
            }
            return item;
          }).filter(Boolean)
        );
      };

      const cartSubtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
      }, [cart]);

      const cartTotal = useMemo(() => {
        return Math.max(0, cartSubtotal - discount);
      }, [cartSubtotal, discount]);

      // Complete Checkout
      const handleCompleteSale = (isDebt = false) => {
        if (cart.length === 0) return;

        const newInvoice = {
          id: 'INV-' + Date.now().toString().slice(-6),
          date: new Date().toISOString(),
          items: [...cart],
          subtotal: cartSubtotal,
          discount: discount,
          total: cartTotal,
          customerId: selectedCustomer,
          isDebt: isDebt
        };

        // Update Products Stock
        setProducts(prev =>
          prev.map(p => {
            const cartItem = cart.find(ci => ci.product.id === p.id);
            if (cartItem) {
              return { ...p, stock: p.stock - cartItem.quantity };
            }
            return p;
          })
        );

        // If debt, update customer balance
        if (isDebt && selectedCustomer !== 'cash') {
          setCustomers(prev =>
            prev.map(c =>
              c.id === selectedCustomer
                ? { ...c, totalDebt: c.totalDebt + cartTotal }
                : c
            )
          );
        }

        setInvoices(prev => [newInvoice, ...prev]);
        setCart([]);
        setDiscount(0);

        alert(lang === 'ku' ? 'فرۆشتن بە سەرکەوتوویی ئەنجامدرا!' : 'Sale completed successfully!');
      };

      // Filtered Products for POS
      const filteredProducts = useMemo(() => {
        return products.filter(p => {
          const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
          const matchSearch =
            (p.nameKu || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.nameEn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode || '').includes(searchQuery);
          return matchCat && matchSearch;
        });
      }, [products, selectedCategory, searchQuery]);

      // Financial Reports Calculations
      const totalRevenue = useMemo(() => invoices.reduce((s, i) => s + i.total, 0), [invoices]);
      const totalProfit = useMemo(() => {
        return invoices.reduce((sum, inv) => {
          const invProfit = inv.items.reduce((iSum, ci) => {
            const cost = ci.product.costPrice || (ci.product.salePrice * 0.7);
            return iSum + ((ci.product.salePrice - cost) * ci.quantity);
          }, 0);
          return sum + (invProfit - (inv.discount || 0));
        }, 0);
      }, [invoices]);
      const totalMarketDebt = useMemo(() => customers.reduce((s, c) => s + (c.totalDebt || 0), 0), [customers]);

      return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
          
          {/* TOP NAVBAR */}
          <header className="liquid-glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-500/20 border border-amber-300/30">
                🛒
              </div>
              <div>
                <h1 className="font-black text-base text-white tracking-wide">{storeSettings.storeName || 'مارکێتەکەم'}</h1>
                <p className="text-[10px] text-amber-400 font-mono font-semibold">Single File Standalone System</p>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <nav className="hidden md:flex items-center space-x-1 space-x-reverse bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
              {[
                { id: 'pos', label: t.pos, icon: '🏷️' },
                { id: 'inventory', label: t.inventory, icon: '📦' },
                { id: 'customers', label: t.customers, icon: '👥' },
                { id: 'reports', label: t.reports, icon: '📊' },
                { id: 'ai', label: t.aiAdvisor, icon: '✨' },
                { id: 'settings', label: t.settings, icon: '⚙️' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={"px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse cursor-pointer " + (isActive ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50")}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* CONTROLS */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setCurrency(c => c === 'IQD' ? 'USD' : 'IQD')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
              >
                {currency}
              </button>
              <button
                onClick={() => setLang(l => l === 'ku' ? 'en' : 'ku')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
              >
                {lang === 'ku' ? 'English' : 'کوردی'}
              </button>
            </div>
          </header>

          {/* MOBILE TAB NAV */}
          <div className="md:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-2 overflow-x-auto text-xs font-bold">
            {[
              { id: 'pos', label: t.pos },
              { id: 'inventory', label: t.inventory },
              { id: 'customers', label: t.customers },
              { id: 'reports', label: t.reports },
              { id: 'ai', label: t.aiAdvisor },
              { id: 'settings', label: t.settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={"px-3 py-1.5 rounded-xl whitespace-nowrap " + (activeTab === tab.id ? 'bg-amber-500 text-white' : 'text-slate-400')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            
            {/* 1. POS / SALES VIEW */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Product Catalog Column */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Search & Categories */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder={t.searchProduct}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="all">{t.allCategories}</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{lang === 'ku' ? c.nameKu : c.nameEn}</option>
                      ))}
                    </select>
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                        هیچ کاڵایەک نەدۆزرایەوە
                      </div>
                    ) : (
                      filteredProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 p-3 rounded-2xl cursor-pointer transition flex flex-col justify-between space-y-2 group"
                        >
                          <div>
                            <span className="text-[10px] font-mono font-semibold text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              {p.barcode}
                            </span>
                            <h3 className="font-bold text-xs text-white mt-1 line-clamp-2">
                              {lang === 'ku' ? p.nameKu : p.nameEn}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                            <span className="font-black text-amber-400 font-mono text-sm">
                              {formatCurrency(p.salePrice, currency, storeSettings.exchangeRate)}
                            </span>
                            <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (p.stock > 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400')}>
                              {p.stock} {p.unit}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cart Column */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-2xl h-[calc(100vh-140px)] sticky top-20">
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h2 className="font-black text-sm text-white flex items-center space-x-2 space-x-reverse">
                        <span>🛒</span>
                        <span>{t.cart}</span>
                      </h2>
                      {cart.length > 0 && (
                        <button
                          onClick={() => setCart([])}
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer"
                        >
                          {t.clearCart}
                        </button>
                      )}
                    </div>

                    {/* Cart Items */}
                    {cart.length === 0 ? (
                      <div className="py-20 text-center text-slate-500 text-xs">
                        سەبەتەی کڕین بەتاڵە
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cart.map(item => (
                          <div key={item.product.id} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                            <div className="flex-1 pr-2">
                              <h4 className="font-bold text-xs text-white">{lang === 'ku' ? item.product.nameKu : item.product.nameEn}</h4>
                              <span className="text-[11px] text-amber-400 font-mono">
                                {formatCurrency(item.product.salePrice, currency, storeSettings.exchangeRate)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={() => updateCartQty(item.product.id, -1)}
                                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold text-xs"
                              >-</button>
                              <span className="font-mono font-bold text-xs px-1 text-white">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQty(item.product.id, 1)}
                                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold text-xs"
                              >+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary & Checkout */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{t.total}:</span>
                      <span className="font-mono text-white font-bold">{formatCurrency(cartSubtotal, currency, storeSettings.exchangeRate)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{t.discount}:</span>
                      <input
                        type="number"
                        value={discount}
                        onChange={e => setDiscount(Number(e.target.value) || 0)}
                        className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-right text-xs font-mono text-amber-400"
                      />
                    </div>

                    <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                      <span>{t.finalTotal}:</span>
                      <span className="font-mono text-amber-400 text-lg">{formatCurrency(cartTotal, currency, storeSettings.exchangeRate)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        disabled={cart.length === 0}
                        onClick={() => handleCompleteSale(false)}
                        className="py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-40 text-white font-bold rounded-2xl text-xs transition shadow-lg cursor-pointer"
                      >
                        💵 فرۆشتنی نەقد
                      </button>
                      <button
                        disabled={cart.length === 0}
                        onClick={() => {
                          if (selectedCustomer === 'cash') {
                            alert('تکایە پێشتر کڕیارێک هەڵبژێرە بۆ تۆمارکردنی قەرز!');
                            return;
                          }
                          handleCompleteSale(true);
                        }}
                        className="py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-40 text-white font-bold rounded-2xl text-xs transition shadow-lg cursor-pointer"
                      >
                        📝 تۆمارکردنی قەرز
                      </button>
                    </div>

                    {/* Customer Selection */}
                    <div className="pt-1">
                      <select
                        value={selectedCustomer}
                        onChange={e => setSelectedCustomer(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                      >
                        <option value="cash">{t.cashCustomer}</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone || 'no phone'})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. INVENTORY / PRODUCTS VIEW */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-900 p-5 rounded-3xl border border-slate-800">
                  <div>
                    <h2 className="text-lg font-black text-white">{t.inventory}</h2>
                    <p className="text-xs text-slate-400">بەڕێوەبردنی کاڵاکان، کەمکردن و زیادکردنی کۆگا</p>
                  </div>
                  <button
                    onClick={() => {
                      const nameKu = prompt('ناوی کاڵا (کوردی):');
                      if (!nameKu) return;
                      const salePrice = Number(prompt('نرخی فرۆشتن:')) || 0;
                      const stock = Number(prompt('بڕ لە کۆگا:')) || 10;
                      const newProd = {
                        id: 'P-' + Date.now(),
                        barcode: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
                        nameKu,
                        nameEn: nameKu,
                        costPrice: salePrice * 0.7,
                        salePrice,
                        stock,
                        unit: 'دانە',
                        categoryId: categories[0]?.id || 'cat-1'
                      };
                      setProducts(prev => [newProd, ...prev]);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-2xl font-bold text-xs cursor-pointer shadow-md"
                  >
                    + {t.addProduct}
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-mono">
                        <tr>
                          <th className="p-4">{t.barcode}</th>
                          <th className="p-4">{t.productNameKu}</th>
                          <th className="p-4">{t.purchasePrice}</th>
                          <th className="p-4">{t.salePrice}</th>
                          <th className="p-4">{t.quantity}</th>
                          <th className="p-4 text-center">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-800/50 transition">
                            <td className="p-4 font-mono text-amber-400">{p.barcode}</td>
                            <td className="p-4 font-bold text-white">{p.nameKu}</td>
                            <td className="p-4 font-mono text-slate-400">{formatCurrency(p.costPrice || 0, currency, storeSettings.exchangeRate)}</td>
                            <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(p.salePrice, currency, storeSettings.exchangeRate)}</td>
                            <td className="p-4 font-bold">{p.stock} {p.unit}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))}
                                className="text-rose-400 hover:text-rose-300 font-bold px-2 py-1"
                              >
                                {t.delete}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CUSTOMERS & DEBTS VIEW */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-900 p-5 rounded-3xl border border-slate-800">
                  <div>
                    <h2 className="text-lg font-black text-white">{t.customers}</h2>
                    <p className="text-xs text-slate-400">تۆمار و بەڕێوەبردنی قەرزی کڕیاران</p>
                  </div>
                  <button
                    onClick={() => {
                      const name = prompt('ناوی کڕیار:');
                      if (!name) return;
                      const phone = prompt('ژمارەی مۆبایل:') || '';
                      const newCust = { id: 'C-' + Date.now(), name, phone, totalDebt: 0 };
                      setCustomers(prev => [...prev, newCust]);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-2xl font-bold text-xs cursor-pointer"
                  >
                    + زیادکردنی کڕیار
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map(c => (
                    <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white text-sm">{c.name}</h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{c.phone || 'بێ ژمارە'}</p>
                        </div>
                        <span className="font-black font-mono text-amber-400 text-sm">
                          {formatCurrency(c.totalDebt || 0, currency, storeSettings.exchangeRate)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between">
                        <button
                          onClick={() => {
                            const pay = Number(prompt('بڕی دانەوەی قەرز:')) || 0;
                            if (pay <= 0) return;
                            setCustomers(prev =>
                              prev.map(x => x.id === c.id ? { ...x, totalDebt: Math.max(0, x.totalDebt - pay) } : x)
                            );
                          }}
                          className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          {t.payDebt}
                        </button>
                        <button
                          onClick={() => setCustomers(prev => prev.filter(x => x.id !== c.id))}
                          className="text-rose-400 text-xs font-bold"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. REPORTS & PROFIT VIEW */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                    <span className="text-xs text-slate-400 font-bold block">{t.totalRevenue}</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">{formatCurrency(totalRevenue, currency, storeSettings.exchangeRate)}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                    <span className="text-xs text-slate-400 font-bold block">{t.totalProfit}</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{formatCurrency(totalProfit, currency, storeSettings.exchangeRate)}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                    <span className="text-xs text-slate-400 font-bold block">{t.totalMarketDebt}</span>
                    <span className="text-2xl font-black text-rose-400 font-mono">{formatCurrency(totalMarketDebt, currency, storeSettings.exchangeRate)}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <h3 className="font-bold text-white text-sm">لیستی دوایین وەصڵەکان</h3>
                  <div className="space-y-2">
                    {invoices.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">هیچ وەصڵێک فرۆش نەکراوە</p>
                    ) : (
                      invoices.slice(0, 10).map(inv => (
                        <div key={inv.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono text-amber-400 font-bold">{inv.id}</span>
                            <span className="text-slate-400 mr-3">{new Date(inv.date).toLocaleTimeString('ku')}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">{formatCurrency(inv.total, currency, storeSettings.exchangeRate)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. AI ADVISOR VIEW */}
            {activeTab === 'ai' && (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto text-3xl font-extrabold border border-emerald-500/30">
                  ✨
                </div>
                <h2 className="text-xl font-black text-white">{t.aiAdvisor}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  شیکاری ژیرانەی فرۆشتن و کۆگا بۆ مارکێتەکەت. ئەم بەشە کاڵا بێ بازاڕەکان و کەمبووەکان دەستنیشان دەکات.
                </p>
                <div className="p-4 bg-slate-950 rounded-2xl text-right text-xs text-amber-300 font-mono space-y-2">
                  <p>• کاڵا کەمبووەکان: {products.filter(p => p.stock <= 5).length} دانە</p>
                  <p>• کۆی فرۆش لە وەصڵەکان: {invoices.length} فۆرم</p>
                  <p>• ڕاسپاردە: داواکردنی ڕاستەوخۆی کاڵا سەرەکییەکان بۆ ڕێگریکردن لە تەواوبوونی کۆگا.</p>
                </div>
              </div>
            )}

            {/* 6. SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-xl mx-auto space-y-4">
                <h2 className="text-base font-black text-white pb-3 border-b border-slate-800">{t.settings}</h2>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">{t.storeName}</label>
                    <input
                      type="text"
                      value={storeSettings.storeName}
                      onChange={e => setStoreSettings(s => ({ ...s, storeName: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.exchangeRate}</label>
                    <input
                      type="number"
                      value={storeSettings.exchangeRate}
                      onChange={e => setStoreSettings(s => ({ ...s, exchangeRate: Number(e.target.value) || 150000 }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-amber-400"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => {
                        const fullBackup = {
                          products, categories, customers, invoices, suppliers, storeSettings,
                          exportedAt: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'Market_Manager_Backup.json';
                        a.click();
                      }}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
                    >
                      {t.exportBackup}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>

          {/* FOOTER */}
          <footer className="py-4 text-center text-[11px] text-slate-600 border-t border-slate-900">
            {storeSettings.storeName} — Standalone Market Management System
          </footer>

        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<MarketApp />);
  </script>
</body>
</html>`;

  // Trigger file download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Market_Manager_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
