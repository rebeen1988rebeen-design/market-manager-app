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
      // 1. Check categories
      const { data: catData, error: catErr } = await supabase.from('categories').select('*');
      if (!catErr && (!catData || catData.length === 0)) {
        await supabase.from('categories').insert(initialCategories.map(categoryToDb));
      }

      // 2. Check products
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
      if (!prodErr && (!prodData || prodData.length === 0)) {
        await supabase.from('products').insert(initialProducts.map(productToDb));
      }

      // 3. Check customers
      const { data: custData, error: custErr } = await supabase.from('customers').select('*');
      if (!custErr && (!custData || custData.length === 0)) {
        await supabase.from('customers').insert(initialCustomers.map(customerToDb));
      }

      // 4. Check transactions
      const { data: txData, error: txErr } = await supabase.from('customer_transactions').select('*');
      if (!txErr && (!txData || txData.length === 0)) {
        await supabase.from('customer_transactions').insert(initialTransactions.map(transactionToDb));
      }

      // 5. Check suppliers
      const { data: suppData, error: suppErr } = await supabase.from('suppliers').select('*');
      if (!suppErr && (!suppData || suppData.length === 0)) {
        await supabase.from('suppliers').insert(initialSuppliers.map(supplierToDb));
      }

      // 6. Check settings
      const { data: settData, error: settErr } = await supabase.from('store_settings').select('*').eq('id', 'default');
      if (!settErr && (!settData || settData.length === 0)) {
        await supabase.from('store_settings').insert(settingsToDb(initialSettings));
      }
    } catch (err) {
      console.warn('Supabase DB seed check note:', err);
    }
  },

  // STORE SETTINGS
  async getSettings(): Promise<StoreSettings> {
    try {
      const { data, error } = await supabase.from('store_settings').select('*').eq('id', 'default').single();
      if (error || !data) return initialSettings;
      return dbToSettings(data);
    } catch {
      return initialSettings;
    }
  },

  async saveSettings(settings: StoreSettings): Promise<void> {
    try {
      await supabase.from('store_settings').upsert(settingsToDb(settings));
    } catch (err) {
      console.error('Failed to save settings to Supabase:', err);
    }
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error || !data || data.length === 0) return initialCategories;
      return data.map(dbToCategory);
    } catch {
      return initialCategories;
    }
  },

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return initialProducts;
      return data.map(dbToProduct);
    } catch {
      return initialProducts;
    }
  },

  async addProduct(product: Product): Promise<void> {
    try {
      const { error } = await supabase.from('products').upsert(productToDb(product));
      if (error) {
        console.warn('Supabase product save notice:', error.message || error);
      }
    } catch (err: any) {
      console.warn('Note on adding product to Supabase:', err?.message || err);
    }
  },

  async updateProduct(product: Product): Promise<void> {
    try {
      const { error } = await supabase.from('products').upsert(productToDb(product));
      if (error) console.warn('Supabase product update notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on updating product in Supabase:', err?.message || err);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.warn('Supabase product delete notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on deleting product from Supabase:', err?.message || err);
    }
  },

  async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
      if (error) console.warn('Supabase stock update notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on updating stock in Supabase:', err?.message || err);
    }
  },

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return initialCustomers;
      return data.map(dbToCustomer);
    } catch {
      return initialCustomers;
    }
  },

  async addCustomer(customer: Customer): Promise<void> {
    try {
      const { error } = await supabase.from('customers').upsert(customerToDb(customer));
      if (error) console.warn('Supabase customer save notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on adding customer to Supabase:', err?.message || err);
    }
  },

  async updateCustomer(customer: Customer): Promise<void> {
    try {
      const { error } = await supabase.from('customers').upsert(customerToDb(customer));
      if (error) console.warn('Supabase customer update notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on updating customer in Supabase:', err?.message || err);
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    try {
      await supabase.from('customer_transactions').delete().eq('customer_id', id);
      await supabase.from('customers').delete().eq('id', id);
    } catch (err: any) {
      console.warn('Note on deleting customer from Supabase:', err?.message || err);
    }
  },

  async updateCustomerDebt(customerId: string, newDebtBalance: number): Promise<void> {
    try {
      await supabase.from('customers').update({ debt_balance: newDebtBalance }).eq('id', customerId);
    } catch (err: any) {
      console.warn('Note on updating customer debt in Supabase:', err?.message || err);
    }
  },

  // TRANSACTIONS
  async getTransactions(): Promise<CustomerTransaction[]> {
    try {
      const { data, error } = await supabase.from('customer_transactions').select('*').order('created_at', { ascending: false });
      if (error || !data || data.length === 0) return initialTransactions;
      return data.map(dbToTransaction);
    } catch {
      return initialTransactions;
    }
  },

  async addTransaction(tx: CustomerTransaction): Promise<void> {
    try {
      const { error } = await supabase.from('customer_transactions').upsert(transactionToDb(tx));
      if (error) console.warn('Supabase transaction save notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on adding transaction to Supabase:', err?.message || err);
    }
  },

  // SUPPLIERS
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error || !data || data.length === 0) return initialSuppliers;
      return data.map(dbToSupplier);
    } catch {
      return initialSuppliers;
    }
  },

  async addSupplier(supplier: Supplier): Promise<void> {
    try {
      const { error } = await supabase.from('suppliers').upsert(supplierToDb(supplier));
      if (error) console.warn('Supabase supplier save notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on adding supplier to Supabase:', err?.message || err);
    }
  },

  async updateSupplier(supplier: Supplier): Promise<void> {
    try {
      const { error } = await supabase.from('suppliers').upsert(supplierToDb(supplier));
      if (error) console.warn('Supabase supplier update notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on updating supplier in Supabase:', err?.message || err);
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) console.warn('Supabase supplier delete notice:', error.message || error);
    } catch (err: any) {
      console.warn('Note on deleting supplier from Supabase:', err?.message || err);
    }
  },

  // SALES & INVOICES
  async getInvoices(): Promise<SaleInvoice[]> {
    try {
      const { data: sales, error: salesErr } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (salesErr || !sales || sales.length === 0) return initialInvoices;

      const { data: items, error: itemsErr } = await supabase.from('sale_items').select('*');

      return sales.map((sale: any) => {
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
    } catch {
      return initialInvoices;
    }
  },

  async addInvoice(invoice: SaleInvoice): Promise<void> {
    try {
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
        console.warn('Supabase sale invoice save notice:', saleErr.message || saleErr);
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
        if (itemsErr) console.warn('Supabase sale items save notice:', itemsErr.message || itemsErr);
      }
    } catch (err: any) {
      console.warn('Note on adding sale invoice to Supabase:', err?.message || err);
    }
  },
};
