-- ============================================================
-- Supabase Schema for Supermarket Management System (مارکێت)
-- Execute this script in the Supabase SQL Editor
-- ============================================================

-- 1. Enable UUID Extension (Optional, using string IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_ku TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon_name TEXT NOT NULL
);

-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    barcode TEXT NOT NULL,
    name_ku TEXT NOT NULL,
    name_en TEXT NOT NULL,
    category TEXT NOT NULL,
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_alert INTEGER NOT NULL DEFAULT 10,
    unit TEXT NOT NULL DEFAULT 'دانە',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    debt_balance NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Customer Transactions Table
CREATE TABLE IF NOT EXISTS public.customer_transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'debt_added' | 'payment_made'
    amount NUMERIC NOT NULL DEFAULT 0,
    note TEXT,
    invoice_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT NOT NULL,
    debt_to_supplier NUMERIC NOT NULL DEFAULT 0,
    notes TEXT
);

-- 7. Create Sales Invoices Table
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_type TEXT NOT NULL, -- 'cash' | 'debt'
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Sale Items Table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id TEXT,
    product_name_ku TEXT,
    product_name_en TEXT,
    barcode TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0,
    item_discount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0
);

-- 9. Create Store Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name_ku TEXT NOT NULL,
    store_name_en TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IQD',
    exchange_rate NUMERIC NOT NULL DEFAULT 1530,
    receipt_note_ku TEXT,
    receipt_note_en TEXT
);

-- ============================================================
-- Disable Row Level Security (RLS) for anonymous full access
-- OR set public policies so anonymous client key works smoothly
-- ============================================================

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Initial Seed Data
-- ============================================================

INSERT INTO public.store_settings (id, store_name_ku, store_name_en, phone, address, currency, exchange_rate, receipt_note_ku, receipt_note_en)
VALUES (
    'default',
    'سوپەرمارکێتی هەولێر',
    'Erbil Central Supermarket',
    '0750 700 0000',
    'هەولێر - شەقامی ٦٠ مەتری - بەرامبەر پارکی شانەدەر',
    'IQD',
    1530,
    'سوپاس بۆ سەردانەکەتان! کاڵای فروۆشراو دەگەڕێندرێتەوە بە پێی مەرج.',
    'Thank you for shopping! Exchange valid within 3 days with receipt.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name_ku, name_en, icon_name) VALUES
('cat-grocery', 'خۆراک و وشکەواڵە', 'Grocery & Staples', 'ShoppingBag'),
('cat-beverage', 'خوارنەوەکان و ئاو', 'Beverages & Water', 'CupSoda'),
('cat-dairy', 'بەرهەمەکانی شیر و پەنیر', 'Dairy & Cheese', 'Milk'),
('cat-snacks', 'شیرینی، بسکویت و چپس', 'Snacks & Sweets', 'Cookie'),
('cat-cleaning', 'پاککەرەوەکان', 'Cleaning & Care', 'Sparkles'),
('cat-fresh', 'سەوزە و میوەی تازە', 'Fresh Produce', 'Apple')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, barcode, name_ku, name_en, category, purchase_price, selling_price, discount, stock, low_stock_alert, unit) VALUES
('prod-1', '869001001', 'چای ئالۆکۆزای (٥٠٠گ)', 'Alokozay Tea 500g', 'cat-grocery', 4000, 5250, 250, 45, 10, 'دانە'),
('prod-2', '869001002', 'برنجی مەحمود (٥ کیلۆ)', 'Mahmood Rice 5kg', 'cat-grocery', 11500, 13500, 0, 28, 8, 'دانە'),
('prod-3', '869001003', 'ڕۆنی زێر ١ لیتر', 'Zer Cooking Oil 1L', 'cat-grocery', 2200, 2750, 0, 60, 15, 'دانە'),
('prod-4', '869001004', 'شەکری سپی (١ کیلۆ)', 'White Sugar 1kg', 'cat-grocery', 1100, 1500, 0, 80, 20, 'کیلۆ'),
('prod-5', '869001005', 'پەنیری بووک ٥٠٠گ', 'Puck Cheese 500g', 'cat-dairy', 3200, 4000, 0, 22, 5, 'دانە'),
('prod-6', '869001006', 'ماستی پێنار ١ کیلۆ', 'Pinar Yogurt 1kg', 'cat-dairy', 2100, 2750, 0, 14, 6, 'دانە'),
('prod-7', '869001007', 'شیری تازەی کالی ١ لیتر', 'Kalleh Fresh Milk 1L', 'cat-dairy', 1250, 1750, 0, 4, 10, 'دانە'),
('prod-8', '869001008', 'پاکەتی ئاوی ڵایف (١٢ دانە ٥٠٠مل)', 'Life Water Pack (12x500ml)', 'cat-beverage', 1800, 2500, 0, 50, 12, 'پاکەت'),
('prod-9', '869001009', 'پێپسی قوتوو (٣٣٠مل)', 'Pepsi Can 330ml', 'cat-beverage', 350, 500, 0, 120, 30, 'دانە'),
('prod-10', '869001010', 'بسکویتی ئولکەر کەتیفە', 'Ulker Katkat Biscuit', 'cat-snacks', 250, 500, 0, 3, 15, 'دانە'),
('prod-11', '869001011', 'چپسی لەیز بڕی گەورە', 'Lays Chips Large', 'cat-snacks', 750, 1000, 0, 35, 10, 'دانە'),
('prod-12', '869001012', 'دەرمانی قاپشۆری فەیری ٧٥٠مل', 'Fairy Dishwashing Liquid 750ml', 'cat-cleaning', 2400, 3250, 0, 18, 5, 'دانە')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, name, phone, debt_balance, notes) VALUES
('cust-1', 'ئاراس ئەحمەد', '0750 123 4567', 42500, 'دوکانداری دراوسێ - پارە دەداتەوە سەرەتای مانگ'),
('cust-2', 'هۆشیار محەمەد کەرکووکی', '0770 987 6543', 18000, 'کڕیاری بەردەوام'),
('cust-3', 'مام کاکەمەند', '0750 444 3322', 0, 'قەرزی نییە')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.suppliers (id, name, phone, company, debt_to_supplier, notes) VALUES
('supp-1', 'کۆمپانیای زێر بۆ خۆراک', '0750 888 1122', 'Zer Group', 150000, 'دابینکەری ڕۆن و وشکەواڵە'),
('supp-2', 'کۆمپانیای ئالۆکۆزای کوردی', '0770 555 6677', 'Alokozay Kurdistan', 0, 'دابینکەری چا و بەرهەمەکان')
ON CONFLICT (id) DO NOTHING;
