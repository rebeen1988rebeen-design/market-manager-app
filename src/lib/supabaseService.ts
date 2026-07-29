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
      const dbRow = settingsToDb(settings);
      const { error } = await supabase.from('store_settings').upsert(dbRow);
      if (error) {
        console.warn('Supabase store_settings save note:', error.message);
        if (
          error.message.includes('receipt_note_en') ||
          error.message.includes('schema cache') ||
          error.message.includes('Could not find')
        ) {
          const { receipt_note_en, ...noNoteEn } = dbRow as any;
          const { error: err2 } = await supabase.from('store_settings').upsert(noNoteEn);
          if (err2) {
            const { receipt_note_ku, ...minimal } = noNoteEn as any;
            await supabase.from('store_settings').upsert(minimal);
          }
        }
      }
    } catch (err) {
      console.warn('Catch error in saveSettings:', err);
    }
    localStorage.setItem('market_settings_cache', JSON.stringify(settings));
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      const cachedRaw = localStorage.getItem('market_categories_cache');
      const cached: Category[] = cachedRaw ? JSON.parse(cachedRaw) : initialCategories;

      if (error || !data || data.length === 0) {
        return cached && cached.length > 0 ? cached : initialCategories;
      }
      const dbCategories = data.map(dbToCategory);
      const dbIds = new Set(dbCategories.map((c) => c.id));
      const merged = [...dbCategories];
      for (const c of cached) {
        if (!dbIds.has(c.id)) merged.push(c);
      }
      localStorage.setItem('market_categories_cache', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('Catch error in getCategories:', err);
      const cached = localStorage.getItem('market_categories_cache');
      return cached ? JSON.parse(cached) : initialCategories;
    }
  },

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from('products').select('*');
      const cachedRaw = localStorage.getItem('market_products_cache');
      const cached: Product[] = cachedRaw ? JSON.parse(cachedRaw) : initialProducts;

      if (error || !data || data.length === 0) {
        return cached && cached.length > 0 ? cached : initialProducts;
      }

      const dbProducts = data.map(dbToProduct);
      const dbIds = new Set(dbProducts.map((p) => p.id));
      const merged = [...dbProducts];
      for (const p of cached) {
        if (!dbIds.has(p.id)) merged.push(p);
      }

      localStorage.setItem('market_products_cache', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('Catch error in getProducts:', err);
      const cached = localStorage.getItem('market_products_cache');
      return cached ? JSON.parse(cached) : initialProducts;
    }
  },

  async addProduct(product: Product): Promise<void> {
    try {
      const dbRow = productToDb(product);
      const { error } = await supabase.from('products').upsert(dbRow);
      if (error) {
        console.warn('Supabase product save note:', error.message);
        if (error.message.includes('stock') || error.message.includes('schema cache')) {
          const { stock, ...noStock } = dbRow as any;
          await supabase.from('products').upsert(noStock);
        }
      }
    } catch (err) {
      console.warn('Catch error in addProduct:', err);
    }
    try {
      const cached = localStorage.getItem('market_products_cache');
      const list: Product[] = cached ? JSON.parse(cached) : [];
      const updated = [product, ...list.filter((p) => p.id !== product.id)];
      localStorage.setItem('market_products_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  },

  async updateProduct(product: Product): Promise<void> {
    try {
      const dbRow = productToDb(product);
      const { error } = await supabase.from('products').upsert(dbRow);
      if (error) {
        console.warn('Supabase product update note:', error.message);
        if (error.message.includes('stock') || error.message.includes('schema cache')) {
          const { stock, ...noStock } = dbRow as any;
          await supabase.from('products').upsert(noStock);
        }
      }
    } catch (err) {
      console.warn('Catch error in updateProduct:', err);
    }
    try {
      const cached = localStorage.getItem('market_products_cache');
      const list: Product[] = cached ? JSON.parse(cached) : [];
      const updated = list.map((p) => (p.id === product.id ? product : p));
      localStorage.setItem('market_products_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.warn('Supabase product delete note:', error.message);
      }
    } catch (err) {
      console.warn('Catch error in deleteProduct:', err);
    }
    try {
      const cached = localStorage.getItem('market_products_cache');
      const list: Product[] = cached ? JSON.parse(cached) : [];
      localStorage.setItem('market_products_cache', JSON.stringify(list.filter((p) => p.id !== id)));
    } catch (e) {
      console.warn(e);
    }
  },

  async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
      if (error) {
        console.warn('Supabase stock update note:', error.message);
      }
    } catch (err) {
      console.warn('Stock update catch:', err);
    }
    try {
      const cached = localStorage.getItem('market_products_cache');
      if (cached) {
        const list: Product[] = JSON.parse(cached);
        const updated = list.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
        localStorage.setItem('market_products_cache', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn(e);
    }
  },

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase.from('customers').select('*');
      const cachedRaw = localStorage.getItem('market_customers_cache');
      const cached: Customer[] = cachedRaw ? JSON.parse(cachedRaw) : initialCustomers;

      if (error || !data || data.length === 0) {
        return cached && cached.length > 0 ? cached : initialCustomers;
      }
      const dbCustomers = data.map(dbToCustomer);
      const dbIds = new Set(dbCustomers.map((c) => c.id));
      const merged = [...dbCustomers];
      for (const c of cached) {
        if (!dbIds.has(c.id)) merged.push(c);
      }
      localStorage.setItem('market_customers_cache', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('Catch error in getCustomers:', err);
      const cached = localStorage.getItem('market_customers_cache');
      return cached ? JSON.parse(cached) : initialCustomers;
    }
  },

  async addCustomer(customer: Customer): Promise<void> {
    const { error } = await supabase.from('customers').upsert(customerToDb(customer));
    if (error) {
      console.error('Supabase customer save error:', error.message);
    }
    try {
      const cached = localStorage.getItem('market_customers_cache');
      const list: Customer[] = cached ? JSON.parse(cached) : [];
      const updated = [customer, ...list.filter(c => c.id !== customer.id)];
      localStorage.setItem('market_customers_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  },

  async updateCustomer(customer: Customer): Promise<void> {
    const { error } = await supabase.from('customers').upsert(customerToDb(customer));
    if (error) {
      console.error('Supabase customer update error:', error.message);
    }
    try {
      const cached = localStorage.getItem('market_customers_cache');
      const list: Customer[] = cached ? JSON.parse(cached) : [];
      const updated = list.map(c => c.id === customer.id ? customer : c);
      localStorage.setItem('market_customers_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    await supabase.from('customer_transactions').delete().eq('customer_id', id);
    await supabase.from('customers').delete().eq('id', id);
    try {
      const cached = localStorage.getItem('market_customers_cache');
      const list: Customer[] = cached ? JSON.parse(cached) : [];
      localStorage.setItem('market_customers_cache', JSON.stringify(list.filter(c => c.id !== id)));
    } catch (e) {
      console.warn(e);
    }
  },

  async updateCustomerDebt(customerId: string, newDebtBalance: number): Promise<void> {
    await supabase.from('customers').update({ debt_balance: newDebtBalance }).eq('id', customerId);
    try {
      const cached = localStorage.getItem('market_customers_cache');
      if (cached) {
        const list: Customer[] = JSON.parse(cached);
        const updated = list.map(c => c.id === customerId ? { ...c, debtBalance: newDebtBalance } : c);
        localStorage.setItem('market_customers_cache', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn(e);
    }
  },

  // TRANSACTIONS
  async getTransactions(): Promise<CustomerTransaction[]> {
    try {
      const { data, error } = await supabase.from('customer_transactions').select('*');
      const cachedRaw = localStorage.getItem('market_transactions_cache');
      const cached: CustomerTransaction[] = cachedRaw ? JSON.parse(cachedRaw) : initialTransactions;

      if (error || !data || data.length === 0) {
        return cached && cached.length > 0 ? cached : initialTransactions;
      }
      const dbTransactions = data.map(dbToTransaction);
      const dbIds = new Set(dbTransactions.map((t) => t.id));
      const merged = [...dbTransactions];
      for (const t of cached) {
        if (!dbIds.has(t.id)) merged.push(t);
      }
      localStorage.setItem('market_transactions_cache', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('Catch error in getTransactions:', err);
      const cached = localStorage.getItem('market_transactions_cache');
      return cached ? JSON.parse(cached) : initialTransactions;
    }
  },

  async addTransaction(tx: CustomerTransaction): Promise<void> {
    const { error } = await supabase.from('customer_transactions').upsert(transactionToDb(tx));
    if (error) {
      console.error('Supabase transaction save error:', error.message);
    }
    try {
      const cached = localStorage.getItem('market_transactions_cache');
      const list: CustomerTransaction[] = cached ? JSON.parse(cached) : [];
      const updated = [tx, ...list.filter(t => t.id !== tx.id)];
      localStorage.setItem('market_transactions_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  },

  // SUPPLIERS
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      const cachedRaw = localStorage.getItem('market_suppliers_cache');
      const cached: Supplier[] = cachedRaw ? JSON.parse(cachedRaw) : initialSuppliers;

      if (error || !data || data.length === 0) {
        return cached && cached.length > 0 ? cached : initialSuppliers;
      }
      const dbSuppliers = data.map(dbToSupplier);
      const dbIds = new Set(dbSuppliers.map((s) => s.id));
      const merged = [...dbSuppliers];
      for (const s of cached) {
        if (!dbIds.has(s.id)) merged.push(s);
      }
      localStorage.setItem('market_suppliers_cache', JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('Catch error in getSuppliers:', err);
      const cached = localStorage.getItem('market_suppliers_cache');
      return cached ? JSON.parse(cached) : initialSuppliers;
    }
  },

  async addSupplier(supplier: Supplier): Promise<void> {
    try {
      const dbRow = supplierToDb(supplier);
      const { error } = await supabase.from('suppliers').upsert(dbRow);
      if (error) {
        console.warn('Supabase supplier save note:', error.message);
        if (error.message.includes('company') || error.message.includes('schema cache')) {
          const { company, ...noCompany } = dbRow as any;
          await supabase.from('suppliers').upsert(noCompany);
        }
      }
    } catch (err) {
      console.warn('Catch error in addSupplier:', err);
    }
    try {
      const cached = localStorage.getItem('market_suppliers_cache');
      const list: Supplier[] = cached ? JSON.parse(cached) : [];
      const updated = [supplier, ...list.filter(s => s.id !== supplier.id)];
      localStorage.setItem('market_suppliers_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  },

  async updateSupplier(supplier: Supplier): Promise<void> {
    try {
      const dbRow = supplierToDb(supplier);
      const { error } = await supabase.from('suppliers').upsert(dbRow);
      if (error) {
        console.warn('Supabase supplier update note:', error.message);
        if (error.message.includes('company') || error.message.includes('schema cache')) {
          const { company, ...noCompany } = dbRow as any;
          await supabase.from('suppliers').upsert(noCompany);
        }
      }
    } catch (err) {
      console.warn('Catch error in updateSupplier:', err);
    }
    try {
      const cached = localStorage.getItem('market_suppliers_cache');
      const list: Supplier[] = cached ? JSON.parse(cached) : [];
      const updated = list.map(s => s.id === supplier.id ? supplier : s);
      localStorage.setItem('market_suppliers_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    await supabase.from('suppliers').delete().eq('id', id);
    try {
      const cached = localStorage.getItem('market_suppliers_cache');
      const list: Supplier[] = cached ? JSON.parse(cached) : [];
      localStorage.setItem('market_suppliers_cache', JSON.stringify(list.filter(s => s.id !== id)));
    } catch (e) {
      console.warn(e);
    }
  },

  // SALES & INVOICES
  async getInvoices(): Promise<SaleInvoice[]> {
    try {
      const cachedRaw = localStorage.getItem('market_invoices_cache');
      const cached: SaleInvoice[] = cachedRaw ? JSON.parse(cachedRaw) : initialInvoices;

      const { data: sales, error: salesErr } = await supabase.from('sales').select('*');
      if (salesErr || !sales || sales.length === 0) {
        return cached && cached.length > 0 ? cached : initialInvoices;
      }
      if (sales.length > 0 && 'created_at' in sales[0]) {
        sales.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }

      const { data: items } = await supabase.from('sale_items').select('*');
      const { data: productsData } = await supabase.from('products').select('*');

      const productsMap = new Map<string, Product>();
      if (productsData && productsData.length > 0) {
        productsData.forEach((p) => {
          productsMap.set(p.id, dbToProduct(p));
        });
      }

      const dbInvoices: SaleInvoice[] = sales.map((sale: any) => {
        const saleItemsRows = (items || []).filter((item: any) => item.sale_id === sale.id);
        const cartItems: CartItem[] = saleItemsRows.map((item: any) => {
          const matchedProd = item.product_id ? productsMap.get(item.product_id) : undefined;
          return {
            product: {
              id: item.product_id || '',
              barcode: item.barcode || matchedProd?.barcode || '',
              nameKu: item.product_name_ku || matchedProd?.nameKu || '',
              nameEn: item.product_name_en || matchedProd?.nameEn || '',
              category: matchedProd?.category || 'grocery',
              purchasePrice: matchedProd?.purchasePrice || 0,
              sellingPrice: Number(item.price || matchedProd?.sellingPrice || 0),
              stock: matchedProd?.stock || 0,
              lowStockAlert: matchedProd?.lowStockAlert || 5,
              unit: matchedProd?.unit || 'دانە',
            },
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            itemDiscount: Number(item.item_discount || 0),
            total: Number(item.total || 0),
          };
        });

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

      const dbIds = new Set(dbInvoices.map((inv) => inv.id));
      const merged = [...dbInvoices];
      for (const inv of cached) {
        if (!dbIds.has(inv.id)) merged.push(inv);
      }

      localStorage.setItem('market_invoices_cache', JSON.stringify(merged));
      return merged;
    } catch {
      const cached = localStorage.getItem('market_invoices_cache');
      return cached ? JSON.parse(cached) : initialInvoices;
    }
  },

  async addInvoice(invoice: SaleInvoice): Promise<void> {
    try {
      const saleRow = {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        total_amount: invoice.totalAmount,
        payment_type: invoice.paymentType,
        customer_id: invoice.customerId || null,
        customer_name: invoice.customerName || null,
        created_at: invoice.createdAt,
      };

      const { error: saleErr } = await supabase.from('sales').insert(saleRow);

      if (saleErr) {
        console.warn('Supabase sale invoice save note:', saleErr.message);
        if (saleErr.message.includes('discount') || saleErr.message.includes('schema cache')) {
          const { discount, ...noDiscount } = saleRow as any;
          await supabase.from('sales').insert(noDiscount);
        }
      }
    } catch (err) {
      console.warn('Catch error in addInvoice sale insert:', err);
    }

    try {
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
        if (itemsErr) {
          console.warn('Supabase sale items save note:', itemsErr.message);
          if (itemsErr.message.includes('barcode') || itemsErr.message.includes('schema cache')) {
            const noBarcodeRows = itemRows.map(({ barcode, ...rest }) => rest);
            await supabase.from('sale_items').insert(noBarcodeRows);
          }
        }
      }
    } catch (err) {
      console.warn('Catch error in addInvoice sale_items insert:', err);
    }

    try {
      const cached = localStorage.getItem('market_invoices_cache');
      const list: SaleInvoice[] = cached ? JSON.parse(cached) : [];
      const updated = [invoice, ...list.filter((i) => i.id !== invoice.id)];
      localStorage.setItem('market_invoices_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
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
    const saveErrors: string[] = [];

    // Save caches to localStorage immediately for offline backup
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
    if (data.settings) {
      try {
        const dbRow = settingsToDb(data.settings);
        const { error } = await supabase.from('store_settings').upsert(dbRow);
        if (error) {
          if (
            error.message.includes('receipt_note_en') ||
            error.message.includes('schema cache') ||
            error.message.includes('Could not find')
          ) {
            const { receipt_note_en, ...noNoteEn } = dbRow as any;
            await supabase.from('store_settings').upsert(noNoteEn);
          } else if (!error.message.includes('schema cache')) {
            saveErrors.push(`Store Settings: ${error.message}`);
          }
        }
      } catch (e) {
        console.warn('saveAllData settings error:', e);
      }
    }

    // 2. Categories
    if (data.categories && data.categories.length > 0) {
      const { error } = await supabase.from('categories').upsert(data.categories.map(categoryToDb));
      if (error) saveErrors.push(`Categories: ${error.message}`);
    }

    // 3. Products
    if (data.products && data.products.length > 0) {
      const { error } = await supabase.from('products').upsert(data.products.map(productToDb));
      if (error) saveErrors.push(`Products: ${error.message}`);
    }

    // 4. Suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      const { error } = await supabase.from('suppliers').upsert(data.suppliers.map(supplierToDb));
      if (error) saveErrors.push(`Suppliers: ${error.message}`);
    }

    // 5. Customers
    if (data.customers && data.customers.length > 0) {
      const { error } = await supabase.from('customers').upsert(data.customers.map(customerToDb));
      if (error) saveErrors.push(`Customers: ${error.message}`);
    }

    // 6. Transactions
    if (data.transactions && data.transactions.length > 0) {
      const { error } = await supabase.from('customer_transactions').upsert(data.transactions.map(transactionToDb));
      if (error) saveErrors.push(`Transactions: ${error.message}`);
    }

    // 7. Invoices & Sale Items
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
        saveErrors.push(`Sales Invoices: ${saleErr.message}`);
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
          if (itemsErr) saveErrors.push(`Sale Items: ${itemsErr.message}`);
        }
      }
    }

    const fatalErrors = saveErrors.filter(
      (msg) =>
        !msg.toLowerCase().includes('schema cache') &&
        !msg.toLowerCase().includes('could not find the') &&
        !msg.toLowerCase().includes('column')
    );

    if (fatalErrors.length > 0) {
      throw new Error(`سۆپابەیس: هەڵە ڕوویدا لە پاراستنی داتاکان:\n${fatalErrors.join('\n')}`);
    }
  },
};
