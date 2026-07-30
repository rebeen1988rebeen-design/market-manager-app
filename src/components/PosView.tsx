import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  User, 
  CreditCard, 
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Tag,
  Camera,
  Volume2,
  X
} from 'lucide-react';
import { Product, Category, CartItem, Customer, SaleInvoice, Language, Currency } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency, normalizeDigits } from '../utils/formatters';
import { playBarcodeBeep, playErrorBeep } from '../utils/audio';
import { CameraScannerModal } from './CameraScannerModal';

interface PosViewProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  lang: Language;
  currency: Currency;
  exchangeRate: number;
  onCompleteSale: (
    items: CartItem[],
    subtotal: number,
    discount: number,
    totalAmount: number,
    paymentType: 'cash' | 'debt',
    customerId?: string,
    customerName?: string
  ) => SaleInvoice;
  onPrintInvoice: (invoice: SaleInvoice) => void;
  onUpdateProduct?: (product: Product) => void;
  onRecordPayment?: (customerId: string, amount: number, note?: string) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  categories,
  customers,
  lang,
  currency,
  exchangeRate,
  onCompleteSale,
  onPrintInvoice,
  onUpdateProduct,
  onRecordPayment,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [receivedCash, setReceivedCash] = useState<number | ''>('');
  const [activeItemDiscountId, setActiveItemDiscountId] = useState<string | null>(null);
  const [recentCompletedInvoice, setRecentCompletedInvoice] = useState<SaleInvoice | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isQuickPaymentModalOpen, setIsQuickPaymentModalOpen] = useState<boolean>(false);
  const [payCustomerId, setPayCustomerId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payNote, setPayNote] = useState<string>('');
  
  // Product camera photo state
  const [photoProduct, setPhotoProduct] = useState<Product | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const photoVideoRef = useRef<HTMLVideoElement | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const openPhotoModal = (product: Product) => {
    setPhotoProduct(product);
    setCapturedImage(null);
    setCameraError(null);
    setIsCameraActive(true);
    startLiveCamera();
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (photoVideoRef.current) {
        photoVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        lang === 'ku'
          ? 'نەتوانرا دەستگەیشتن بە کامێرا پەیدابکرێت. تکایە ڕێگەپێدان بدە یان وێنەیەک لە گەلەری هەڵبژێرە.'
          : 'Could not access camera. Please check permissions or upload an image.'
      );
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && mediaStreamRef.current && photoVideoRef.current) {
      photoVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isCameraActive, photoProduct, capturedImage]);

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!photoVideoRef.current) return;
    const video = photoVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopLiveCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedImage(event.target.result as string);
          stopLiveCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProductPhoto = () => {
    if (photoProduct && onUpdateProduct) {
      onUpdateProduct({
        ...photoProduct,
        imageUrl: capturedImage || undefined,
      });
      showScanToast(
        lang === 'ku' ? 'وێنەی کاڵاکە بەسەرکەوتوویی خەزنکرا!' : 'Product photo saved successfully!',
        'success'
      );
    }
    closePhotoModal();
  };

  const closePhotoModal = () => {
    stopLiveCamera();
    setPhotoProduct(null);
    setCapturedImage(null);
  };
  
  // Scan feedback toast banner
  const [scanToast, setScanToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showScanToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setScanToast({ msg, type });
    setTimeout(() => {
      setScanToast(null);
    }, 3000);
  };
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Auto focus barcode input & Global hardware scanner listener
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Hardware USB/Bluetooth Barcode Scanner global listener
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Don't capture if user is typing in a modal or input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) &&
        target !== searchInputRef.current
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Hardware barcode scanners type characters in < 50ms gaps
      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = normalizeDigits(barcodeBufferRef.current).trim().toLowerCase();
          barcodeBufferRef.current = '';
          processBarcodeScan(scannedCode);
        }
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 80) {
          // Reset buffer if delay between keystrokes is too long
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [products]);

  // Process barcode scan string from camera or USB scanner
  const processBarcodeScan = (scannedCode: string) => {
    const normCode = normalizeDigits(scannedCode).trim().toLowerCase();
    if (!normCode) return;

    const hit = products.find(
      (p) => normalizeDigits(p.barcode).trim().toLowerCase() === normCode
    );

    if (hit) {
      addToCart(hit);
      setSearchQuery('');
    } else {
      playErrorBeep();
      showScanToast(
        lang === 'ku'
          ? `⚠️ هیچ کاڵایەک نەدۆزرایەوە بە بارکۆدی (${normCode})`
          : `⚠️ No product found with barcode (${normCode})`,
        'error'
      );
    }
  };

  // Filter products by search query or category
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const query = normalizeDigits(searchQuery).toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesNameKu = p.nameKu.toLowerCase().includes(query);
    const matchesNameEn = p.nameEn.toLowerCase().includes(query);
    const matchesBarcode = normalizeDigits(p.barcode).toLowerCase().includes(query);

    // If query is a numeric barcode search, bypass category restriction so products in other categories can be found!
    const isBarcodeQuery = /^\d+$/.test(query);

    return (isBarcodeQuery || matchesCategory) && (matchesNameKu || matchesNameEn || matchesBarcode);
  });

  // Handle barcode input change with instant auto-add
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const val = normalizeDigits(rawVal);
    setSearchQuery(val);

    const normVal = val.trim().toLowerCase();
    if (!normVal) return;

    // Check if exact barcode matches any product across all categories
    const exactHit = products.find(
      (p) => normalizeDigits(p.barcode).trim().toLowerCase() === normVal
    );

    if (exactHit) {
      // Check if there are any other products whose barcode starts with normVal but is longer
      const hasLongerMatches = products.some((p) => {
        const bc = normalizeDigits(p.barcode).trim().toLowerCase();
        return bc !== normVal && bc.startsWith(normVal);
      });

      // If no longer matches exist, this is a complete exact barcode scan/entry!
      if (!hasLongerMatches) {
        const added = addToCart(exactHit);
        if (added) {
          setTimeout(() => {
            setSearchQuery('');
          }, 50);
        }
      }
    }
  };

  // Handle Enter key for Barcode Scanners or Manual Submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const normVal = normalizeDigits(searchQuery).trim().toLowerCase();
      if (!normVal) return;

      // 1. Try exact barcode match across all products
      const barcodeHit = products.find(
        (p) => normalizeDigits(p.barcode).trim().toLowerCase() === normVal
      );
      if (barcodeHit) {
        addToCart(barcodeHit);
        setSearchQuery('');
        return;
      }

      // 2. If filtered list has exactly 1 item, add it
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
        return;
      }

      // 3. Try partial barcode match
      const partialHit = products.find(
        (p) => normalizeDigits(p.barcode).trim().toLowerCase().includes(normVal)
      );
      if (partialHit) {
        addToCart(partialHit);
        setSearchQuery('');
        return;
      }

      // 4. If no product matched
      playErrorBeep();
      showScanToast(
        lang === 'ku'
          ? `⚠️ هیچ کاڵایەک نەدۆزرایەوە بە بارکۆدی (${normVal})`
          : `⚠️ No product found with barcode (${normVal})`,
        'error'
      );
    }
  };

  const addToCart = (product: Product): boolean => {
    if (product.stock <= 0) {
      playErrorBeep();
      showScanToast(
        lang === 'ku'
          ? `❌ کاڵای "${product.nameKu}" لە کۆگادا نەماوە!`
          : `❌ "${product.nameEn}" is out of stock!`,
        'error'
      );
      return false;
    }

    let addedSuccessfully = true;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          playErrorBeep();
          showScanToast(
            lang === 'ku'
              ? `⚠️ بڕی داواکراو زۆرترە لە هەبووی کۆگا!`
              : `⚠️ Maximum stock limit reached!`,
            'error'
          );
          addedSuccessfully = false;
          return prevCart; // Exceed stock limit
        }
        return prevCart.map((item) => {
          if (item.product.id === product.id) {
            const effectivePrice = item.price - (item.itemDiscount || 0);
            return {
              ...item,
              quantity: item.quantity + 1,
              total: (item.quantity + 1) * effectivePrice,
            };
          }
          return item;
        });
      } else {
        const defaultDiscount = product.discount && product.discount > 0 ? product.discount : 0;
        const effectivePrice = Math.max(0, product.sellingPrice - defaultDiscount);
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            price: product.sellingPrice,
            itemDiscount: defaultDiscount,
            total: effectivePrice,
          },
        ];
      }
    });

    if (addedSuccessfully) {
      playBarcodeBeep();
      showScanToast(
        lang === 'ku'
          ? `✓ "${product.nameKu}" بە سەرکەوتوویی زیادکرا بۆ سەبەتە`
          : `✓ "${product.nameEn}" added to cart`,
        'success'
      );
    }

    return addedSuccessfully;
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const qty = Math.min(newQty, item.product.stock);
          const effectivePrice = item.price - (item.itemDiscount || 0);
          return {
            ...item,
            quantity: qty,
            total: qty * effectivePrice,
          };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (productId: string, discountPerUnit: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const clampedDiscount = Math.min(item.price, Math.max(0, discountPerUnit));
          const effectivePrice = item.price - clampedDiscount;
          return {
            ...item,
            itemDiscount: clampedDiscount,
            total: effectivePrice * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const updateItemPriceDirect = (productId: string, newUnitPrice: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const validPrice = Math.max(0, newUnitPrice);
          const discount = Math.max(0, item.price - validPrice);
          return {
            ...item,
            itemDiscount: discount,
            total: validPrice * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const numReceivedCash = typeof receivedCash === 'number' ? receivedCash : 0;
  const changeReturn = numReceivedCash > 0 ? Math.max(0, numReceivedCash - finalTotal) : 0;
  const cashShortage = (numReceivedCash > 0 && numReceivedCash < finalTotal) ? finalTotal - numReceivedCash : 0;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentType === 'debt' && !selectedCustomerId) {
      alert(lang === 'ku' ? 'تکایە کڕیارێک هەڵبژێرە بۆ فرۆشتن لەسەر قەرز!' : 'Please select a customer for debt payment!');
      return;
    }

    const customerObj = customers.find((c) => c.id === selectedCustomerId);

    const invoice = onCompleteSale(
      cart,
      subtotal,
      discountAmount,
      finalTotal,
      paymentType,
      selectedCustomerId,
      customerObj?.name,
      paymentType === 'cash' && numReceivedCash > 0 ? numReceivedCash : undefined,
      paymentType === 'cash' && numReceivedCash > 0 ? changeReturn : undefined
    );

    setRecentCompletedInvoice(invoice);
    setCart([]);
    setDiscountPercent(0);
    setReceivedCash('');
    setSelectedCustomerId('');
    setPaymentType('cash');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Left / Main Section: Products & Quick POS Grid (8 Cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-5">
        
        {/* Scan feedback toast banner */}
        {scanToast && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 space-x-reverse transition-all animate-bounce ${
              scanToast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{scanToast.msg}</span>
          </div>
        )}

        {/* Search Bar & Barcode Scanner Simulation */}
        <div className="liquid-glass p-4 rounded-3xl shadow-xl shadow-slate-900/5 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder={getTranslation(lang, 'barcodeSearch')}
                className="w-full pr-11 pl-4 py-2.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition shadow-inner"
              />
            </div>
            
            <button
              type="button"
              onClick={() => {
                const e = { key: 'Enter', preventDefault: () => {} } as any;
                handleKeyDown(e);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95 shrink-0 cursor-pointer border border-emerald-400/20"
            >
              {lang === 'ku' ? 'زیادکردن (Enter)' : 'Add'}
            </button>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-700 bg-emerald-50/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-200/80 shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Barcode className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">{lang === 'ku' ? 'ئامادەی بەکارهێنانی بارکۆد' : 'Ready for Barcode'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-amber-500 via-amber-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer border border-amber-300/30 shrink-0"
              title={lang === 'ku' ? 'خوێندنەوەی بارکۆد بە کامێرا' : 'Scan barcode using camera'}
            >
              <Camera className="w-4 h-4" />
              <span>{lang === 'ku' ? 'سکێنەر' : 'Camera'}</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 border border-slate-700'
                : 'bg-white/70 backdrop-blur-md text-slate-700 hover:bg-white border border-white/80 shadow-xs'
            }`}
          >
            {getTranslation(lang, 'allCategories')}
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/20 border border-emerald-400/30'
                    : 'bg-white/70 backdrop-blur-md text-slate-700 hover:bg-white border border-white/80 shadow-xs'
                }`}
              >
                {lang === 'ku' ? cat.nameKu : cat.nameEn}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-12 text-center border border-white/80 text-slate-500">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">
              {lang === 'ku' ? 'هیچ کاڵایەک نەدۆزرایەوە!' : 'No products found!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock > 0 && product.stock <= product.lowStockAlert;

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`liquid-card rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isOut
                      ? 'opacity-50 border-slate-200 cursor-not-allowed bg-slate-50/50'
                      : 'border-white/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10'
                  }`}
                >
                  {/* Low/Out Stock/Discount Badges */}
                  {isOut ? (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-xs">
                      {getTranslation(lang, 'outOfStock')}
                    </span>
                  ) : isLow ? (
                    <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-xs">
                      {getTranslation(lang, 'lowStock')} ({product.stock})
                    </span>
                  ) : product.discount && product.discount > 0 ? (
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-xs flex items-center gap-1 border border-amber-300/30">
                      <Tag className="w-2.5 h-2.5" />
                      <span>-{formatCurrency(product.discount, currency, exchangeRate)}</span>
                    </span>
                  ) : null}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPhotoModal(product);
                        }}
                        className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100/90 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition border border-slate-200/80 overflow-hidden shrink-0 shadow-2xs cursor-pointer group/cam"
                        title={lang === 'ku' ? 'گرتنی وێنەی کاڵا بە کامێرا' : 'Take product photo'}
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.nameKu}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Camera className="w-4 h-4 text-slate-600 group-hover/cam:scale-110 transition" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cam:opacity-100 flex items-center justify-center transition">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>

                      <span className="text-[10px] font-mono text-slate-400">
                        #{product.barcode}
                      </span>
                    </div>

                    {product.imageUrl && (
                      <div className="mb-2 w-full h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner">
                        <img
                          src={product.imageUrl}
                          alt={product.nameKu}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}

                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug mb-2">
                      {lang === 'ku' ? product.nameKu : product.nameEn}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between mt-2">
                    <div>
                      {product.discount && product.discount > 0 ? (
                        <div>
                          <span className="text-[10px] line-through text-slate-400 font-medium block -mb-0.5">
                            {formatCurrency(product.sellingPrice, currency, exchangeRate)}
                          </span>
                          <span className="font-extrabold text-amber-700 text-sm">
                            {formatCurrency(product.sellingPrice - product.discount, currency, exchangeRate)}
                          </span>
                        </div>
                      ) : (
                        <div className="font-extrabold text-emerald-600 text-sm">
                          {formatCurrency(product.sellingPrice, currency, exchangeRate)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={isOut}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1 ${
                        isOut
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-100/90 text-emerald-800 hover:bg-emerald-600 hover:text-white group-hover:bg-emerald-600 group-hover:text-white cursor-pointer border border-emerald-300/50'
                      }`}
                      title={lang === 'ku' ? `زیادکردن (${product.unit})` : `Add (${product.unit})`}
                    >
                      <span>{product.unit}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right / Cart Panel (4-5 Cols) */}
      <div className="lg:col-span-5 xl:col-span-4 liquid-glass rounded-3xl shadow-xl shadow-slate-900/5 flex flex-col h-[calc(100vh-100px)] sticky top-20 border border-white/80">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-white/60 flex items-center justify-between bg-white/40 backdrop-blur-md rounded-t-3xl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-base">
              {getTranslation(lang, 'cart')}
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)} {getTranslation(lang, 'itemCount')}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition"
            >
              {getTranslation(lang, 'clearCart')}
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-200" />
              <p className="text-xs font-medium max-w-[200px]">
                {getTranslation(lang, 'emptyCart')}
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const itemDiscount = item.itemDiscount || 0;
              const effectiveUnitPrice = Math.max(0, item.price - itemDiscount);
              const isDiscounted = itemDiscount > 0;
              const isDiscountOpen = activeItemDiscountId === item.product.id;

              return (
                <div key={item.product.id} className="pt-3 first:pt-0 space-y-2 border-b border-slate-100 pb-3 last:border-none">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {lang === 'ku' ? item.product.nameKu : item.product.nameEn}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                        {isDiscounted ? (
                          <>
                            <span className="line-through text-slate-400">
                              {formatCurrency(item.price, currency, exchangeRate)}
                            </span>
                            <span className="font-bold text-amber-700">
                              {formatCurrency(effectiveUnitPrice, currency, exchangeRate)}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            {formatCurrency(item.price, currency, exchangeRate)}
                          </span>
                        )}
                        <span className="text-slate-400">× {item.quantity}</span>
                      </div>
                    </div>

                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center space-x-1 space-x-reverse bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-6 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold text-xs shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal & Action Buttons */}
                    <div className="text-right min-w-[75px]">
                      <p className="font-bold text-xs text-slate-800">
                        {formatCurrency(item.total, currency, exchangeRate)}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => setActiveItemDiscountId(isDiscountOpen ? null : item.product.id)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                            isDiscounted || isDiscountOpen
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                          title={lang === 'ku' ? 'دەستکاری داشکاندنی کاڵا' : 'Item discount'}
                        >
                          <Tag className="w-3 h-3" />
                          <span>{isDiscounted ? `-${formatCurrency(itemDiscount, currency, exchangeRate)}` : (lang === 'ku' ? 'داشکاندن' : 'Discount')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-500 transition"
                          title={lang === 'ku' ? 'سڕینەوە' : 'Remove'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Item Discount & Price Editing Panel */}
                  {isDiscountOpen && (
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 text-xs space-y-2 mt-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span>{lang === 'ku' ? 'داشکاندنی سەر ئەم کاڵایە:' : 'Item Discount Settings:'}</span>
                        {isDiscounted && (
                          <button
                            type="button"
                            onClick={() => updateItemDiscount(item.product.id, 0)}
                            className="text-rose-600 hover:underline text-[10px] font-bold"
                          >
                            {lang === 'ku' ? 'لابردنی داشکاندن' : 'Clear Discount'}
                          </button>
                        )}
                      </div>

                      {/* Preset Percentages */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-amber-800 font-medium">{lang === 'ku' ? 'ڕێژە:' : 'Percent:'}</span>
                        {[0, 5, 10, 15, 20, 25, 50].map((pct) => {
                          const discVal = Math.round((item.price * pct) / 100);
                          const isActivePct = Math.abs(discVal - itemDiscount) < 2 && pct > 0;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => updateItemDiscount(item.product.id, discVal)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                isActivePct || (pct === 0 && itemDiscount === 0)
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              {pct}%
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Discount Amount or Direct Price Edit */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-amber-900 block mb-0.5">
                            {lang === 'ku' ? 'بڕی داشکاندن (تک/دانە)' : 'Discount Amount'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.price}
                            value={itemDiscount || ''}
                            onChange={(e) => updateItemDiscount(item.product.id, Number(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-amber-900 block mb-0.5">
                            {lang === 'ku' ? 'نرخی نوێی فرۆشتن' : 'New Unit Price'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={effectiveUnitPrice}
                            onChange={(e) => updateItemPriceDirect(item.product.id, Number(e.target.value) || 0)}
                            className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Cart Checkout Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-3">
          
          {/* Payment Type Selection (Cash vs Debt) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentType('cash')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 space-x-reverse border transition ${
                paymentType === 'cash'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{getTranslation(lang, 'cashPayment')}</span>
            </button>

            <button
              onClick={() => setPaymentType('debt')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 space-x-reverse border transition ${
                paymentType === 'debt'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{getTranslation(lang, 'debtPayment')}</span>
            </button>
          </div>

          {/* Customer Dropdown if Debt */}
          {paymentType === 'debt' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-amber-800 flex items-center space-x-1 space-x-reverse">
                <User className="w-3.5 h-3.5" />
                <span>{getTranslation(lang, 'selectCustomer')}</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- {getTranslation(lang, 'selectCustomer')} --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {getTranslation(lang, 'debtBalance')}: {formatCurrency(c.debtBalance, currency, exchangeRate)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Discount Field */}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span className="font-semibold">{getTranslation(lang, 'discount')} (%):</span>
            <div className="flex items-center space-x-1 space-x-reverse">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    discountPercent === pct
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{getTranslation(lang, 'subtotal')}:</span>
              <span>{formatCurrency(subtotal, currency, exchangeRate)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 font-semibold">
                <span>{getTranslation(lang, 'discount')} ({discountPercent}%):</span>
                <span>-{formatCurrency(discountAmount, currency, exchangeRate)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
              <span>{getTranslation(lang, 'total')}:</span>
              <span className="text-emerald-600">{formatCurrency(finalTotal, currency, exchangeRate)}</span>
            </div>
          </div>

          {/* Cash Received and Change Return Section */}
          {paymentType === 'cash' && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  {lang === 'ku' ? 'پارەی وەرگیراو لە کڕیار:' : 'Cash Received:'}
                </span>
                <div className="relative w-36">
                  <input
                    type="number"
                    min="0"
                    value={receivedCash}
                    onChange={(e) => setReceivedCash(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex items-center gap-1 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setReceivedCash(finalTotal)}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  {lang === 'ku' ? 'تەواو' : 'Exact'}
                </button>
                {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReceivedCash(preset)}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Change Return Banner */}
              {numReceivedCash > 0 && (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                  numReceivedCash >= finalTotal
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <span>
                    {numReceivedCash >= finalTotal
                      ? (lang === 'ku' ? 'باقی (گەڕاوە بۆ کڕیار):' : 'Change Return:')
                      : (lang === 'ku' ? 'پارەی کەمی هێناوە:' : 'Remaining Due:')}
                  </span>
                  <span className="font-mono text-sm font-extrabold">
                    {numReceivedCash >= finalTotal
                      ? formatCurrency(changeReturn, currency, exchangeRate)
                      : formatCurrency(cashShortage, currency, exchangeRate)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 space-x-reverse shadow-md transition ${
              cart.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : paymentType === 'debt'
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{getTranslation(lang, 'completeSale')}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Modal / Recent Invoice trigger */}
      {recentCompletedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {getTranslation(lang, 'saleSuccess')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                #{recentCompletedInvoice.invoiceNumber} • {formatCurrency(recentCompletedInvoice.totalAmount, currency, exchangeRate)}
              </p>

              {recentCompletedInvoice.changeAmount !== undefined && recentCompletedInvoice.changeAmount >= 0 && (
                <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold text-xs flex justify-between items-center">
                  <span>{lang === 'ku' ? 'باقی (گەڕاوە بۆ کڕیار):' : 'Change Return:'}</span>
                  <span className="font-mono text-sm font-extrabold">{formatCurrency(recentCompletedInvoice.changeAmount, currency, exchangeRate)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onPrintInvoice(recentCompletedInvoice);
                  setRecentCompletedInvoice(null);
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 space-x-reverse"
              >
                <Printer className="w-4 h-4" />
                <span>{getTranslation(lang, 'printReceipt')}</span>
              </button>

              <button
                onClick={() => setRecentCompletedInvoice(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                {getTranslation(lang, 'close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScan={processBarcodeScan}
        lang={lang}
      />

      {/* Product Camera / Photo Modal */}
      {photoProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {lang === 'ku' ? 'گرتنی وێنەی کاڵا' : 'Take Product Photo'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lang === 'ku' ? photoProduct.nameKu : photoProduct.nameEn}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePhotoModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/60 hover:bg-white rounded-xl cursor-pointer transition border border-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display Video, Captured Photo or Placeholder */}
            <div className="space-y-3">
              {capturedImage ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                  <img src={capturedImage} alt="Product Preview" className="w-full h-full object-cover" />
                </div>
              ) : isCameraActive ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black border border-slate-200">
                  <video ref={photoVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
              ) : photoProduct.imageUrl ? (
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                  <img src={photoProduct.imageUrl} alt="Product Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-56 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center text-slate-500">
                  <Camera className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold">
                    {lang === 'ku' ? 'وێنەیەک بە کامێرا بگرە یان لە گەلەری هەڵبژێرە' : 'Take a live photo or choose an image'}
                  </p>
                </div>
              )}

              {cameraError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {cameraError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!isCameraActive && (
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{lang === 'ku' ? 'دوبارە ڕاگەیاندنی کامێرا' : 'Start Camera'}</span>
                  </button>
                )}

                {isCameraActive && (
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{lang === 'ku' ? 'گرتنی وێنە' : 'Snap Photo'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{lang === 'ku' ? 'هەڵبژاردنی وێنە' : 'Upload Image'}</span>
                </button>

                <input
                  ref={photoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
              {capturedImage && (
                <button
                  type="button"
                  onClick={() => setCapturedImage(null)}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
                >
                  {lang === 'ku' ? 'سڕینەوەی وێنە' : 'Clear Photo'}
                </button>
              )}
              <button
                type="button"
                onClick={closePhotoModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {getTranslation(lang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={saveProductPhoto}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                {getTranslation(lang, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment / Debt Repayment Modal in POS */}
      {isQuickPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {lang === 'ku' ? 'دانەوە و وەرگرتنی پارەی قەرز' : 'Debt Payment Collection'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lang === 'ku' ? 'تۆمارکردنی پارەی وەرگیراو لە کڕیار' : 'Record received debt payment'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/60 hover:bg-white rounded-xl cursor-pointer transition border border-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Customer Select */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ku' ? 'هەڵبژاردنی کڕیار:' : 'Select Customer:'}
                </label>
                <select
                  value={payCustomerId}
                  onChange={(e) => setPayCustomerId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- {lang === 'ku' ? 'کڕیارێک هەڵبژێرە' : 'Select Customer'} --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {lang === 'ku' ? 'قەرز' : 'Debt'}: {formatCurrency(c.debtBalance, currency, exchangeRate)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Customer Current Balance */}
              {payCustomerId && (
                <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-center justify-between text-amber-900 font-bold">
                  <span>{lang === 'ku' ? 'کۆی قەرزی هەنووکەیی:' : 'Current Debt Balance:'}</span>
                  <span className="font-mono text-sm text-amber-700">
                    {formatCurrency(
                      customers.find((c) => c.id === payCustomerId)?.debtBalance || 0,
                      currency,
                      exchangeRate
                    )}
                  </span>
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ku' ? 'بڕی پارەی وەرگیراو:' : 'Payment Amount:'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || '')}
                  placeholder={lang === 'ku' ? 'بڕی پارە بە د.ع بنووسە' : 'Enter payment amount'}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {lang === 'ku' ? 'تێبینی / ژمارەی وەصڵ (ئارەزوومەندانه):' : 'Note (Optional):'}
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder={lang === 'ku' ? 'نموونە: وەرگرتنی قەرزی مانگی ڕابردوو' : 'Note or receipt reference'}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsQuickPaymentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {getTranslation(lang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!payCustomerId) {
                    alert(lang === 'ku' ? 'تکایە کڕیارێک هەڵبژێرە' : 'Please select a customer');
                    return;
                  }
                  if (!payAmount || Number(payAmount) <= 0) {
                    alert(lang === 'ku' ? 'تکایە بڕی پارەی دروست بنووسە' : 'Please enter a valid amount');
                    return;
                  }
                  if (onRecordPayment) {
                    onRecordPayment(payCustomerId, Number(payAmount), payNote);
                    showScanToast(
                      lang === 'ku' ? 'پارەی وەرگیراو بە سەرکەوتوویی تۆمارکرا!' : 'Payment recorded successfully!',
                      'success'
                    );
                  }
                  setIsQuickPaymentModalOpen(false);
                  setPayCustomerId('');
                  setPayAmount('');
                  setPayNote('');
                }}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                {lang === 'ku' ? 'تۆمارکردنی پارە' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
