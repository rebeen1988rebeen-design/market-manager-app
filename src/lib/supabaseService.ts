import {
  Product,
  Category,
  Customer,
  CustomerTransaction,
  Supplier,
  SaleInvoice,
  StoreSettings,
} from '../types';
import {
  initialCategories,
  initialProducts,
  initialCustomers,
  initialTransactions,
  initialSuppliers,
  initialSettings,
  initialInvoices,
} from '../data/initialData';

// Helper to convert snake_case DB objects to camelCase frontend models
export const dbToProduct = (row: any): Product => ({
  id: row.id,
  barcode: row.barcode,
  nameKu: row.name_ku || row.nameKu,
  nameEn: row.name_en || row.nameEn,
  category: row.category,
  purchasePrice: Number(row.purchase_price || row.purchasePrice || 0),
  sellingPrice: Number(row.selling_price || row.sellingPrice || 0),
  discount: Number(row.discount || 0),
  stock: Number(row.stock || 0),
  lowStockAlert: Number(row.low_stock_alert || row.lowStockAlert || 10),
  unit: row.unit || 'دانە',
  imageUrl: row.image_url || row.imageUrl || undefined,
});

export const productToDb = (p: Product) => ({
  id: p.id,
  barcode: p.barcode,
  name_ku: p.nameKu,
  name_en: p.nameEn,
  category: p.category,
  purchase_price: p.purchasePrice,
  selling_price: p.sellingPrice,
  discount: p.discount || 0,
  stock: p.stock,
  low_stock_alert: p.lowStockAlert,
  unit: p.unit,
  image_url: p.imageUrl || null,
});

export const dbToCategory = (row: any): Category => ({
  id: row.id,
  nameKu: row.name_ku || row.nameKu,
  nameEn: row.name_en || row.nameEn,
  iconName: row.icon_name || row.iconName,
});

export const categoryToDb = (c: Category) => ({
  id: c.id,
  name_ku: c.nameKu,
  name_en: c.nameEn,
  icon_name: c.iconName,
});

export const customerToDb = (c: Customer) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  notes: c.notes || null,
  debt_balance: c.debtBalance,
  created_at: c.createdAt,
});

export const transactionToDb = (t: CustomerTransaction) => ({
  id: t.id,
  customer_id: t.customerId,
  type: t.type,
  amount: t.amount,
  note: t.note || null,
  created_at: t.createdAt,
});

export const supplierToDb = (s: Supplier) => ({
  id: s.id,
  name: s.name,
  company: s.company || null,
  phone: s.phone,
  debt_to_supplier: s.debtToSupplier,
  notes: s.notes || null,
});

export const settingsToDb = (s: StoreSettings) => ({
  id: 'default',
  store_name_ku: s.storeNameKu,
  store_name_en: s.storeNameEn,
  phone: s.phone || null,
  address: s.address || null,
  currency: s.currency,
  exchange_rate: s.exchangeRate,
  receipt_note_ku: s.receiptNoteKu,
  receipt_note_en: s.receiptNoteEn,
});

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('LocalStorage save warning:', err);
  }
}

// 100% Offline Local Device Storage PWA Service
// Each device running this PWA is strictly independent and never connected to or synced with any other device.
export const supabaseService = {
  // Ensure initial offline local storage is initialized on this device
  async initializeDatabase() {
    try {
      if (!localStorage.getItem('market_categories_cache')) {
        setLocal('market_categories_cache', initialCategories);
      }
      if (!localStorage.getItem('market_products_cache')) {
        setLocal('market_products_cache', initialProducts);
      }
      if (!localStorage.getItem('market_customers_cache')) {
        setLocal('market_customers_cache', initialCustomers);
      }
      if (!localStorage.getItem('market_transactions_cache')) {
        setLocal('market_transactions_cache', initialTransactions);
      }
      if (!localStorage.getItem('market_suppliers_cache')) {
        setLocal('market_suppliers_cache', initialSuppliers);
      }
      if (!localStorage.getItem('market_invoices_cache')) {
        setLocal('market_invoices_cache', initialInvoices);
      }
      if (!localStorage.getItem('market_settings_cache')) {
        setLocal('market_settings_cache', initialSettings);
      }
    } catch (err) {
      console.warn('Local storage initialization note:', err);
    }
  },

  // STORE SETTINGS
  async getSettings(): Promise<StoreSettings> {
    return getLocal<StoreSettings>('market_settings_cache', initialSettings);
  },

  async saveSettings(settings: StoreSettings): Promise<void> {
    setLocal('market_settings_cache', settings);
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    return getLocal<Category[]>('market_categories_cache', initialCategories);
  },

  async addCategory(category: Category): Promise<void> {
    const list = getLocal<Category[]>('market_categories_cache', initialCategories);
    if (!list.some((c) => c.id === category.id)) {
      setLocal('market_categories_cache', [...list, category]);
    }
  },

  async updateCategory(category: Category): Promise<void> {
    const list = getLocal<Category[]>('market_categories_cache', initialCategories);
    const updated = list.map((c) => (c.id === category.id ? category : c));
    setLocal('market_categories_cache', updated);
  },

  async deleteCategory(id: string): Promise<void> {
    const list = getLocal<Category[]>('market_categories_cache', initialCategories);
    setLocal('market_categories_cache', list.filter((c) => c.id !== id));
  },

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    return getLocal<Product[]>('market_products_cache', initialProducts);
  },

  async addProduct(product: Product): Promise<void> {
    const list = getLocal<Product[]>('market_products_cache', initialProducts);
    if (!list.some((p) => p.id === product.id)) {
      setLocal('market_products_cache', [...list, product]);
    }
  },

  async updateProduct(product: Product): Promise<void> {
    const list = getLocal<Product[]>('market_products_cache', initialProducts);
    const updated = list.map((p) => (p.id === product.id ? product : p));
    setLocal('market_products_cache', updated);
  },

  async deleteProduct(id: string): Promise<void> {
    const list = getLocal<Product[]>('market_products_cache', initialProducts);
    setLocal('market_products_cache', list.filter((p) => p.id !== id));
  },

  async updateStock(productId: string, newStock: number): Promise<void> {
    const list = getLocal<Product[]>('market_products_cache', initialProducts);
    const updated = list.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
    setLocal('market_products_cache', updated);
  },

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    return getLocal<Customer[]>('market_customers_cache', initialCustomers);
  },

  async addCustomer(customer: Customer): Promise<void> {
    const list = getLocal<Customer[]>('market_customers_cache', initialCustomers);
    if (!list.some((c) => c.id === customer.id)) {
      setLocal('market_customers_cache', [...list, customer]);
    }
  },

  async updateCustomer(customer: Customer): Promise<void> {
    const list = getLocal<Customer[]>('market_customers_cache', initialCustomers);
    const updated = list.map((c) => (c.id === customer.id ? customer : c));
    setLocal('market_customers_cache', updated);
  },

  async deleteCustomer(id: string): Promise<void> {
    const list = getLocal<Customer[]>('market_customers_cache', initialCustomers);
    setLocal('market_customers_cache', list.filter((c) => c.id !== id));
    const txList = getLocal<CustomerTransaction[]>('market_transactions_cache', initialTransactions);
    setLocal('market_transactions_cache', txList.filter((tx) => tx.customerId !== id));
  },

  async updateCustomerDebt(customerId: string, newDebtBalance: number): Promise<void> {
    const list = getLocal<Customer[]>('market_customers_cache', initialCustomers);
    const updated = list.map((c) => (c.id === customerId ? { ...c, debtBalance: newDebtBalance } : c));
    setLocal('market_customers_cache', updated);
  },

  // TRANSACTIONS
  async getTransactions(): Promise<CustomerTransaction[]> {
    return getLocal<CustomerTransaction[]>('market_transactions_cache', initialTransactions);
  },

  async addTransaction(tx: CustomerTransaction): Promise<void> {
    const list = getLocal<CustomerTransaction[]>('market_transactions_cache', initialTransactions);
    setLocal('market_transactions_cache', [...list, tx]);
  },

  // SUPPLIERS
  async getSuppliers(): Promise<Supplier[]> {
    return getLocal<Supplier[]>('market_suppliers_cache', initialSuppliers);
  },

  async addSupplier(supplier: Supplier): Promise<void> {
    const list = getLocal<Supplier[]>('market_suppliers_cache', initialSuppliers);
    if (!list.some((s) => s.id === supplier.id)) {
      setLocal('market_suppliers_cache', [...list, supplier]);
    }
  },

  async updateSupplier(supplier: Supplier): Promise<void> {
    const list = getLocal<Supplier[]>('market_suppliers_cache', initialSuppliers);
    const updated = list.map((s) => (s.id === supplier.id ? supplier : s));
    setLocal('market_suppliers_cache', updated);
  },

  async deleteSupplier(id: string): Promise<void> {
    const list = getLocal<Supplier[]>('market_suppliers_cache', initialSuppliers);
    setLocal('market_suppliers_cache', list.filter((s) => s.id !== id));
  },

  // INVOICES
  async getInvoices(): Promise<SaleInvoice[]> {
    return getLocal<SaleInvoice[]>('market_invoices_cache', initialInvoices);
  },

  async addInvoice(invoice: SaleInvoice): Promise<void> {
    const list = getLocal<SaleInvoice[]>('market_invoices_cache', initialInvoices);
    const updated = [invoice, ...list.filter((i) => i.id !== invoice.id)];
    setLocal('market_invoices_cache', updated);
  },

  // SAVE ALL DATA (LOCAL PWA ONLY)
  async saveAllData(data: {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    transactions: CustomerTransaction[];
    suppliers: Supplier[];
    invoices: SaleInvoice[];
    settings: StoreSettings;
  }): Promise<void> {
    setLocal('market_products_cache', data.products);
    setLocal('market_categories_cache', data.categories);
    setLocal('market_customers_cache', data.customers);
    setLocal('market_transactions_cache', data.transactions);
    setLocal('market_suppliers_cache', data.suppliers);
    setLocal('market_invoices_cache', data.invoices);
    setLocal('market_settings_cache', data.settings);
  },
};
