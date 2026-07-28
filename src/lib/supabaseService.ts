import { supabase } from './supabase';
import {
  Product,
  Category,
  Customer,
  CustomerTransaction,
  Supplier,
  SaleInvoice,
  StoreSettings,
  CartItem,
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
  nameKu: row.name_ku,
  nameEn: row.name_en,
  category: row.category,
  purchasePrice: Number(row.purchase_price || 0),
  sellingPrice: Number(row.selling_price || 0),
  discount: Number(row.discount || 0),
  stock: Number(row.stock || 0),
  lowStockAlert: Number(row.low_stock_alert || 10),
  unit: row.unit || 'دانە',
  imageUrl: row.image_url || undefined,
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
  nameKu: row.name_ku,
  nameEn: row.name_en,
  iconName: row.icon_name,
});

export const categoryToDb = (c: Category) => ({
  id: c.id,
  name_ku: c.nameKu,
  name_en: c.nameEn,
  icon_name: c.iconName,
});

export const dbToCustomer = (row: any): Customer => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  debtBalance: Number(row.debt_balance || 0),
  notes: row.notes || undefined,
  createdAt: row.created_at || new Date().toISOString(),
});

export const customerToDb = (c: Customer) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  debt_balance: c.debtBalance,
  notes: c.notes || null,
  created_at: c.createdAt,
});

export const dbToTransaction = (row: any): CustomerTransaction => ({
  id: row.id,
  customerId: row.customer_id,
  type: row.type,
  amount: Number(row.amount || 0),
  note: row.note || undefined,
  invoiceId: row.invoice_id || undefined,
  createdAt: row.created_at || new Date().toISOString(),
});

export const transactionToDb = (t: CustomerTransaction) => ({
  id: t.id,
  customer_id: t.customerId,
  type: t.type,
  amount: t.amount,
  note: t.note || null,
  invoice_id: t.invoiceId || null,
  created_at: t.createdAt,
});

export const dbToSupplier = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  company: row.company,
  debtToSupplier: Number(row.debt_to_supplier || 0),
  notes: row.notes || undefined,
});

export const supplierToDb = (s: Supplier) => ({
  id: s.id,
  name: s.name,
  phone: s.phone,
  company: s.company,
  debt_to_supplier: s.debtToSupplier,
  notes: s.notes || null,
});

export const dbToSettings = (row: any): StoreSettings => ({
  storeNameKu: row.store_name_ku || initialSettings.storeNameKu,
  storeNameEn: row.store_name_en || initialSettings.storeNameEn,
  phone: row.phone || initialSettings.phone,
  address: row.address || initialSettings.address,
  currency: (row.currency as any) || initialSettings.currency,
  exchangeRate: Number(row.exchange_rate || initialSettings.exchangeRate),
  receiptNoteKu: row.receipt_note_ku || initialSettings.receiptNoteKu,
  receiptNoteEn: row.receipt_note_en || initialSettings.receiptNoteEn,
});

export const settingsToDb = (s: StoreSettings) => ({
  id: 'default',
  store_name_ku: s.storeNameKu,
  store_name_en: s.storeNameEn,
  phone: s.phone,
  address: s.address,
  currency: s.currency,
  exchange_rate: s.exchangeRate,
  receipt_note_ku: s.receiptNoteKu,
  receipt_note_en: s.receiptNoteEn,
});

// Service Methods for App Integration
export const supabaseService = {
  // Check connection & seed initial data if DB is empty
  async initializeDatabase() {
    try {
      const { data: catData, error: catErr } = await supabase.from('categories').select('id');
      if (!catErr && (!catData || catData.length === 0)) {
        await supabase.from('categories').upsert(initialCategories.map(categoryToDb));
      }

      const { data: prodData, error: prodErr } = await supabase.from('products').select('id');
      if (!prodErr && (!prodData || prodData.length === 0)) {
        await supabase.from('products').upsert(initialProducts.map(productToDb));
      }

      const { data: custData, error: custErr } = await supabase.from('customers').select('id');
      if (!custErr && (!custData || custData.length === 0)) {
        await supabase.from('customers').upsert(initialCustomers.map(customerToDb));
      }

      const { data: txData, error: txErr } = await supabase.from('customer_transactions').select('id');
      if (!txErr && (!txData || txData.length === 0)) {
        await supabase.from('customer_transactions').upsert(initialTransactions.map(transactionToDb));
      }

      const { data: suppData, error: suppErr } = await supabase.from('suppliers').select('id');
      if (!suppErr && (!suppData || suppData.length === 0)) {
        await supabase.from('suppliers').upsert(initialSuppliers.map(supplierToDb));
      }

      const { data: settData, error: settErr } = await supabase.from('store_settings').select('id').eq('id', 'default');
      if (!settErr && (!settData || settData.length === 0)) {
        await supabase.from('store_settings').upsert(settingsToDb(initialSettings));
      }
    } catch (err) {
      console.warn('Supabase DB seed check note:', err);
    }
  },

  // STORE SETTINGS
  async getSettings(): Promise<StoreSettings> {
    try {
      const { data, error } = await supabase.from('store_settings').select('*').eq('id', 'default').single();
      if (error || !data) {
        const cached = localStorage.getItem('market_settings_cache');
        return cached ? JSON.parse(cached) : initialSettings;
      }
      const settings = dbToSettings(data);
      localStorage.setItem('market_settings_cache', JSON.stringify(settings));
      return settings;
    } catch {
      const cached = localStorage.getItem('market_settings_cache');
      return cached ? JSON.parse(cached) : initialSettings;
    }
  },

  async saveSettings(settings: StoreSettings): Promise<void> {
    try {
      const { error } = await supabase.from('store_settings').upsert(settingsToDb(settings));
      if (error) console.warn('Supabase store_settings save note:', error.message || error);
    } catch (err: any) {
      console.warn('Note on saveSettings:', err?.message || err);
    }
    localStorage.setItem('market_settings_cache', JSON.stringify(settings));
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error || !data) {
        const cached = localStorage.getItem('market_categories_cache');
        return cached ? JSON.parse(cached) : initialCategories;
      }
      if (data.length === 0) return initialCategories;
      const categories = data.map(dbToCategory);
      localStorage.setItem('market_categories_cache', JSON.stringify(categories));
      return categories;
    } catch {
      const cached = localStorage.getItem('market_categories_cache');
      return cached ? JSON.parse(cached) : initialCategories;
    }
  },

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error || !data) {
        const cached = localStorage.getItem('market_products_cache');
        return cached ? JSON.parse(cached) : initialProducts;
      }
      if (data.length === 0) return initialProducts;
      const products = data.map(dbToProduct);
      localStorage.setItem('market_products_cache', JSON.stringify(products));
      return products;
    } catch {
      const cached = localStorage.getItem('market_products_cache');
      return cached ? JSON.parse(cached) : initialProducts;
    }
  },

  async addProduct(product: Product): Promise<void> {
    const { error } = await supabase.from('products').upsert(productToDb(product));
    if (error) {
      console.warn('Supabase product save note:', error.message || error);
    }
  },

  async updateProduct(product: Product): Promise<void> {
    const { error } = await supabase.from('products').upsert(productToDb(product));
    if (error) {
      console.warn('Supabase product update note:', error.message || error);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.warn('Supabase product delete note:', error.message || error);
    }
  },

  async updateStock(productId: string, newStock: number): Promise<void> {
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    if (error) {
      console.warn('Supabase stock update note:', error.message || error);
    }
  },

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error || !data) {
        const cached = localStorage.getItem('market_customers_cache');
        return cached ? JSON.parse(cached) : initialCustomers;
      }
      if (data.length === 0) return initialCustomers;
      const customers = data.map(dbToCustomer);
      localStorage.setItem('market_customers_cache', JSON.stringify(customers));
      return customers;
    } catch {
      const cached = localStorage.getItem('market_customers_cache');
      return cached ? JSON.parse(cached) : initialCustomers;
    }
  },

  async addCustomer(customer: Customer): Promise<void> {
    const { error } = await supabase.from('customers').upsert(customerToDb(customer));
    if (error) {
      console.warn('Supabase customer save note:', error.message || error);
    }
  },

  async updateCustomer(customer: Customer): Promise<void> {
    const { error } = await supabase.from('customers').upsert(customerToDb(customer));
    if (error) {
      console.warn('Supabase customer update note:', error.message || error);
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    await supabase.from('customer_transactions').delete().eq('customer_id', id);
    await supabase.from('customers').delete().eq('id', id);
  },

  async updateCustomerDebt(customerId: string, newDebtBalance: number): Promise<void> {
    await supabase.from('customers').update({ debt_balance: newDebtBalance }).eq('id', customerId);
  },

  // TRANSACTIONS
  async getTransactions(): Promise<CustomerTransaction[]> {
    try {
      const { data, error } = await supabase.from('customer_transactions').select('*').order('created_at', { ascending: false });
      if (error || !data) {
        const cached = localStorage.getItem('market_transactions_cache');
        return cached ? JSON.parse(cached) : initialTransactions;
      }
      if (data.length === 0) return initialTransactions;
      const transactions = data.map(dbToTransaction);
      localStorage.setItem('market_transactions_cache', JSON.stringify(transactions));
      return transactions;
    } catch {
      const cached = localStorage.getItem('market_transactions_cache');
      return cached ? JSON.parse(cached) : initialTransactions;
    }
  },

  async addTransaction(tx: CustomerTransaction): Promise<void> {
    const { error } = await supabase.from('customer_transactions').upsert(transactionToDb(tx));
    if (error) {
      console.warn('Supabase transaction save note:', error.message || error);
    }
  },

  // SUPPLIERS
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error || !data) {
        const cached = localStorage.getItem('market_suppliers_cache');
        return cached ? JSON.parse(cached) : initialSuppliers;
      }
      if (data.length === 0) return initialSuppliers;
      const suppliers = data.map(dbToSupplier);
      localStorage.setItem('market_suppliers_cache', JSON.stringify(suppliers));
      return suppliers;
    } catch {
      const cached = localStorage.getItem('market_suppliers_cache');
      return cached ? JSON.parse(cached) : initialSuppliers;
    }
  },

  async addSupplier(supplier: Supplier): Promise<void> {
    const { error } = await supabase.from('suppliers').upsert(supplierToDb(supplier));
    if (error) {
      console.warn('Supabase supplier save note:', error.message || error);
    }
  },

  async updateSupplier(supplier: Supplier): Promise<void> {
    const { error } = await supabase.from('suppliers').upsert(supplierToDb(supplier));
    if (error) {
      console.warn('Supabase supplier update note:', error.message || error);
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    await supabase.from('suppliers').delete().eq('id', id);
  },

  // SALES & INVOICES
  async getInvoices(): Promise<SaleInvoice[]> {
    try {
      const { data: sales, error: salesErr } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (salesErr || !sales) {
        const cached = localStorage.getItem('market_invoices_cache');
        return cached ? JSON.parse(cached) : initialInvoices;
      }
      if (sales.length === 0) return [];

      const { data: items } = await supabase.from('sale_items').select('*');

      const invoices = sales.map((sale: any) => {
        const saleItemsRows = (items || []).filter((item: any) => item.sale_id === sale.id);
        const cartItems: CartItem[] = saleItemsRows.map((item: any) => ({
          product: {
            id: item.product_id || '',
            barcode: item.barcode || '',
            nameKu: item.product_name_ku || '',
            nameEn: item.product_name_en || '',
            category: 'grocery',
            purchasePrice: 0,
            sellingPrice: Number(item.price || 0),
            stock: 0,
            lowStockAlert: 5,
            unit: 'دانە',
          },
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          itemDiscount: Number(item.item_discount || 0),
          total: Number(item.total || 0),
        }));

        return {
          id: sale.id,
          invoiceNumber: sale.invoice_number,
          items: cartItems,
          subtotal: Number(sale.subtotal || 0),
          discount: Number(sale.discount || 0),
          totalAmount: Number(sale.total_amount || 0),
          paymentType: sale.payment_type || 'cash',
          customerId: sale.customer_id || undefined,
          customerName: sale.customer_name || undefined,
          createdAt: sale.created_at || new Date().toISOString(),
        };
      });

      localStorage.setItem('market_invoices_cache', JSON.stringify(invoices));
      return invoices;
    } catch {
      const cached = localStorage.getItem('market_invoices_cache');
      return cached ? JSON.parse(cached) : initialInvoices;
    }
  },

  async addInvoice(invoice: SaleInvoice): Promise<void> {
    const { error: saleErr } = await supabase.from('sales').insert({
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      total_amount: invoice.totalAmount,
      payment_type: invoice.paymentType,
      customer_id: invoice.customerId || null,
      customer_name: invoice.customerName || null,
      created_at: invoice.createdAt,
    });

    if (saleErr) {
      console.warn('Supabase sale invoice save note:', saleErr.message || saleErr);
      return;
    }

    if (invoice.items && invoice.items.length > 0) {
      const itemRows = invoice.items.map((item, index) => ({
        id: `${invoice.id}-item-${index}`,
        sale_id: invoice.id,
        product_id: item.product.id,
        product_name_ku: item.product.nameKu,
        product_name_en: item.product.nameEn,
        barcode: item.product.barcode,
        quantity: item.quantity,
        price: item.price,
        item_discount: item.itemDiscount || 0,
        total: item.total,
      }));

      const { error: itemsErr } = await supabase.from('sale_items').insert(itemRows);
      if (itemsErr) console.warn('Supabase sale items save note:', itemsErr.message || itemsErr);
    }
  },

  // COMPREHENSIVE SAVE ALL DATA
  async saveAllData(data: {
    products: Product[];
    categories: Category[];
    customers: Customer[];
    transactions: CustomerTransaction[];
    suppliers: Supplier[];
    invoices: SaleInvoice[];
    settings: StoreSettings;
  }): Promise<void> {
    // Save caches to localStorage immediately for guaranteed offline and PWA persistence
    try {
      localStorage.setItem('market_products_cache', JSON.stringify(data.products));
      localStorage.setItem('market_categories_cache', JSON.stringify(data.categories));
      localStorage.setItem('market_customers_cache', JSON.stringify(data.customers));
      localStorage.setItem('market_transactions_cache', JSON.stringify(data.transactions));
      localStorage.setItem('market_suppliers_cache', JSON.stringify(data.suppliers));
      localStorage.setItem('market_invoices_cache', JSON.stringify(data.invoices));
      localStorage.setItem('market_settings_cache', JSON.stringify(data.settings));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    // 1. Settings
    try {
      const { error: settErr } = await supabase.from('store_settings').upsert(settingsToDb(data.settings));
      if (settErr) console.warn('Supabase store_settings save note:', settErr.message);
    } catch (err: any) {
      console.warn('Note on store_settings save:', err?.message || err);
    }

    // 2. Categories
    try {
      if (data.categories && data.categories.length > 0) {
        const { error: catErr } = await supabase.from('categories').upsert(data.categories.map(categoryToDb));
        if (catErr) console.warn('Supabase categories save note:', catErr.message);
      }
    } catch (err: any) {
      console.warn('Note on categories save:', err?.message || err);
    }

    // 3. Products
    try {
      if (data.products && data.products.length > 0) {
        const { error: prodErr } = await supabase.from('products').upsert(data.products.map(productToDb));
        if (prodErr) console.warn('Supabase products save note:', prodErr.message);
      }
    } catch (err: any) {
      console.warn('Note on products save:', err?.message || err);
    }

    // 4. Suppliers
    try {
      if (data.suppliers && data.suppliers.length > 0) {
        const { error: suppErr } = await supabase.from('suppliers').upsert(data.suppliers.map(supplierToDb));
        if (suppErr) console.warn('Supabase suppliers save note:', suppErr.message);
      }
    } catch (err: any) {
      console.warn('Note on suppliers save:', err?.message || err);
    }

    // 5. Customers
    try {
      if (data.customers && data.customers.length > 0) {
        const { error: custErr } = await supabase.from('customers').upsert(data.customers.map(customerToDb));
        if (custErr) console.warn('Supabase customers save note:', custErr.message);
      }
    } catch (err: any) {
      console.warn('Note on customers save:', err?.message || err);
    }

    // 6. Transactions
    try {
      if (data.transactions && data.transactions.length > 0) {
        const { error: txErr } = await supabase.from('customer_transactions').upsert(data.transactions.map(transactionToDb));
        if (txErr) console.warn('Supabase transactions save note:', txErr.message);
      }
    } catch (err: any) {
      console.warn('Note on transactions save:', err?.message || err);
    }

    // 7. Invoices & Sale Items
    try {
      if (data.invoices && data.invoices.length > 0) {
        const saleRows = data.invoices.map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoiceNumber,
          subtotal: inv.subtotal,
          discount: inv.discount,
          total_amount: inv.totalAmount,
          payment_type: inv.paymentType,
          customer_id: inv.customerId || null,
          customer_name: inv.customerName || null,
          created_at: inv.createdAt,
        }));

        const { error: saleErr } = await supabase.from('sales').upsert(saleRows);
        if (saleErr) {
          console.warn('Supabase sales save note:', saleErr.message);
        } else {
          const itemRows: any[] = [];
          data.invoices.forEach((inv) => {
            if (inv.items && inv.items.length > 0) {
              inv.items.forEach((item, idx) => {
                itemRows.push({
                  id: `${inv.id}-item-${idx}`,
                  sale_id: inv.id,
                  product_id: item.product.id,
                  product_name_ku: item.product.nameKu,
                  product_name_en: item.product.nameEn,
                  barcode: item.product.barcode,
                  quantity: item.quantity,
                  price: item.price,
                  item_discount: item.itemDiscount || 0,
                  total: item.total,
                });
              });
            }
          });

          if (itemRows.length > 0) {
            const { error: itemsErr } = await supabase.from('sale_items').upsert(itemRows);
            if (itemsErr) console.warn('Supabase sale_items save note:', itemsErr.message);
          }
        }
      }
    } catch (err: any) {
      console.warn('Note on sales save:', err?.message || err);
    }
  },
};
