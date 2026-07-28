export type Currency = 'IQD' | 'USD';
export type Language = 'ku' | 'en';

export interface Product {
  id: string;
  barcode: string;
  nameKu: string;
  nameEn: string;
  category: string;
  purchasePrice: number; // In IQD
  sellingPrice: number;  // In IQD
  discount?: number;     // Product default discount in IQD
  stock: number;
  lowStockAlert: number;
  unit: string; // e.g., 'دانە', 'کیلۆ', 'پاکەت'
  imageUrl?: string;
}

export interface Category {
  id: string;
  nameKu: string;
  nameEn: string;
  iconName: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number; // Base selling price per unit
  itemDiscount?: number; // Per-unit discount amount in base currency/IQD
  total: number;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentType: 'cash' | 'debt';
  customerId?: string;
  customerName?: string;
  createdAt: string; // ISO string
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  debtBalance: number; // Total amount owed in IQD
  notes?: string;
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: 'debt_added' | 'payment_made';
  amount: number;
  note?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  debtToSupplier: number;
  notes?: string;
}

export interface StoreSettings {
  storeNameKu: string;
  storeNameEn: string;
  phone: string;
  address: string;
  currency: Currency;
  exchangeRate: number; // e.g., 1530 IQD per 1 USD (or 100$ = 153,000 IQD)
  receiptNoteKu: string;
  receiptNoteEn: string;
}
