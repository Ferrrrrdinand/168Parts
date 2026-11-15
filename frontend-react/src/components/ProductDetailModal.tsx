import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Truck, ShoppingCart, X, Heart, Share2, Play } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { formatRupiah } from '../api';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variation?: string, price?: number) => void;
  onBuyNow: (product: Product, quantity: number, variation?: string, price?: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favoriteCount, setFavoriteCount] = useState<number>(189);
  const [activeMediaThumb, setActiveMediaThumb] = useState<string>('video');

  // Reset state when a new product is opened
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setIsFavorite(false);
      setFavoriteCount(product.favoriteCount || 189);
      setActiveMediaThumb('video');

      const vars = extractVariants(product);
      // If all variants have the exact same price, pre-select the first one. Otherwise keep null so range shows
      const prices = vars.map(v => v.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max && vars.length > 0) {
        setSelectedVariant(vars[0]);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Normalisasi & Ekstraksi Variasi Produk
  const variants = extractVariants(product);
  const variantPrices = variants.map(v => v.price || product.price);
  const minPrice = Math.min(...variantPrices);
  const maxPrice = Math.max(...variantPrices);
  const hasPriceRange = minPrice !== maxPrice;

  // Tentukan teks harga saat ini
  let displayPrice = '';
  if (selectedVariant) {
    displayPrice = formatRupiah(selectedVariant.price);
  } else if (hasPriceRange) {
    displayPrice = `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
  } else {
    displayPrice = formatRupiah(variants[0]?.price || product.price);
  }

  // Tentukan harga coret
  const displayOriginalPrice = selectedVariant?.originalPrice
    ? formatRupiah(selectedVariant.originalPrice)
    : (product.originalPrice ? formatRupiah(product.originalPrice) : null);

  // Label Variasi (Warna, Model HP, Ukuran)
  let variantLabel = 'Pilihan Varian';
  const allVarNames = variants.map(v => v.name.toUpperCase()).join(' ');
  if (allVarNames.includes('HITAM') || allVarNames.includes('PUTIH') || allVarNames.includes('TRANSPARAN') || allVarNames.includes('BIRU') || allVarNames.includes('MERAH') || allVarNames.includes('KUNING')) {
    variantLabel = 'Warna';
  } else if (allVarNames.includes('ML') || allVarNames.includes('CM') || allVarNames.includes('MM') || allVarNames.includes('GR')) {
    variantLabel = 'Ukuran';
  } else if (allVarNames.includes('SAMSUNG') || allVarNames.includes('IPHONE') || allVarNames.includes('XIAOMI') || allVarNames.includes('OPPO')) {
    variantLabel = 'Model HP';
  }

  const currentStock = selectedVariant?.stock || product.stock || 49;

  const handleQtyChange = (delta: number) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > currentStock) return currentStock;
      return next;
    });
  };

  const handleAddToCartClick = () => {
    if (!selectedVariant && variants.length > 1 && hasPriceRange) {
      alert(`Silakan pilih ${variantLabel} produk terlebih dahulu.`);
      return;
    }
    const varName = selectedVariant?.name || variants[0]?.name || 'STANDAR ORIGINAL';
    const finalPrice = selectedVariant?.price || variants[0]?.price || product.price;
    onAddToCart(product, quantity, varName, finalPrice);
  };

  const handleBuyNowClick = () => {
    if (!selectedVariant && variants.length > 1 && hasPriceRange) {
      alert(`Silakan pilih ${variantLabel} produk terlebih dahulu.`);
      return;
    }
    const varName = selectedVariant?.name || variants[0]?.name || 'STANDAR ORIGINAL';
    const finalPrice = selectedVariant?.price || variants[0]?.price || product.price;
    onBuyNow(product, quantity, varName, finalPrice);
    onClose();
  };

  const toggleFavorite = () => {
    setIsFavorite(prev => {
      const next = !prev;
      setFavoriteCount(c => next ? c + 1 : c - 1);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto relative text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shopee Breadcrumb Bar */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <span className="text-blue-600 hover:underline cursor-pointer" onClick={onClose}>Shopee</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-blue-600 hover:underline cursor-pointer">Handphone & Aksesoris</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-blue-600 hover:underline cursor-pointer">{product.category || 'Handphone & Aksesoris Lainnya'}</span>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-700 font-semibold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Content Layout (Kiri: Preview, Kanan: Info) */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Kolom Kiri: Galeri Foto & Video Preview */}
          <div className="md:col-span-5 flex flex-col">
            <div className="aspect-square w-full rounded-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center text-white relative overflow-hidden p-6 text-center shadow-inner border border-slate-200">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/80 flex items-center justify-center mb-3 backdrop-blur-sm shadow-lg group cursor-pointer hover:scale-105 transition">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-1">Pesan sekarang sebelum kehabisan!!</h4>
                  <p className="text-[11px] text-slate-300 leading-tight max-w-[220px]">
                    100% Produk Baru Grade Original • QC Passed Teknisi Surabaya
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 bg-rose-500/30 border border-rose-400/50 text-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    🛡️ Garansi Tes 7 Hari 168 Parts
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Strip (Persis Screenshot Shopee) */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveMediaThumb('video')}
                className={`w-14 h-14 rounded border-2 flex flex-col items-center justify-center bg-slate-900 text-white shrink-0 relative transition ${
                  activeMediaThumb === 'video' ? 'border-[#ee4d2d]' : 'border-transparent'
                }`}
              >
                <Play className="w-5 h-5 fill-white text-white" />
                <span className="text-[8px] font-bold mt-0.5">Video</span>
              </button>

              {variants.map((v) => {
                const isActive = activeMediaThumb === v.name || selectedVariant?.name === v.name;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => {
                      setActiveMediaThumb(v.name);
                      setSelectedVariant(v);
                    }}
                    className={`w-14 h-14 rounded border-2 flex flex-col items-center justify-center bg-slate-50 shrink-0 relative p-1 transition ${
                      isActive ? 'border-[#ee4d2d] bg-rose-50/50' : 'border-slate-200'
                    }`}
                  >
                    {renderSwatch(v, 'w-5 h-5')}
                    <span className="text-[8px] font-semibold text-slate-700 truncate w-full text-center mt-1">
                      {v.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Share & Favorit Row */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Share:</span>
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center cursor-pointer">f</span>
                <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center cursor-pointer">⚡</span>
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center cursor-pointer">P</span>
                <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center cursor-pointer">𝕏</span>
              </div>
              <button
                type="button"
                onClick={toggleFavorite}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 transition cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`} />
                <span>Favorit ({favoriteCount})</span>
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Detail & Form Pembelian */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              {/* Star Badge & Heading */}
              <div className="flex items-start gap-2 mb-2">
                <span className="bg-[#ee4d2d] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 mt-0.5 shadow-xs">
                  Star
                </span>
                <h1 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Rating, Penilaian & Terjual (Persis Screenshot Shopee) */}
              <div className="flex items-center gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-1 text-[#ee4d2d] font-bold">
                  <span className="border-b border-[#ee4d2d]">{product.rating || '4.9'}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#ee4d2d] text-[#ee4d2d]" />
                    ))}
                  </div>
                </div>
                <span className="text-slate-200">|</span>
                <div>
                  <strong className="text-slate-800 font-bold border-b border-slate-700">{product.reviewCount || 672}</strong> Penilaian
                </div>
                <span className="text-slate-200">|</span>
                <div>
                  <strong className="text-slate-800 font-bold">{product.soldCount ? `${(product.soldCount / 1000).toFixed(0)}RB+` : '2RB+'}</strong> Terjual
                </div>
              </div>

              {/* Shopee Price Banner */}
              <div className="bg-[#fafafa] p-4 rounded-sm flex items-baseline gap-3 mb-4">
                {displayOriginalPrice && (
                  <span className="text-xs sm:text-sm text-slate-400 line-through">
                    {displayOriginalPrice}
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-bold text-[#ee4d2d]">
                  {displayPrice}
                </span>
                {product.discountPercent && product.discountPercent > 0 && (
                  <span className="bg-[#ee4d2d] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                    {product.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Field: Pengiriman */}
              <div className="grid grid-cols-12 gap-2 text-xs mb-3.5 items-start">
                <div className="col-span-3 text-slate-400 font-medium">Pengiriman</div>
                <div className="col-span-9 space-y-1">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Besok (Pesan sebelum 09:00)</span>
                    <span className="text-slate-400 text-[10px]">&rsaquo;</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dapatkan Voucher s/d Rp10.000 jika pesanan terlambat
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Ongkos Kirim: <strong className="text-emerald-700 font-bold">Rp0 (Gratis Ongkir 168 Parts)</strong>
                  </div>
                </div>
              </div>

              {/* Field: Jaminan Shopee */}
              <div className="grid grid-cols-12 gap-2 text-xs mb-4 items-center">
                <div className="col-span-3 text-slate-400 font-medium">Jaminan Shopee</div>
                <div className="col-span-9 flex items-center gap-1.5 text-slate-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#ee4d2d]" />
                  <span>Bebas Pengembalian / Garansi Resmi 168 Parts</span>
                  <span className="text-slate-400 text-[10px]">▾</span>
                </div>
              </div>

              {/* Field: Varian / Warna (PERSIS SHOPEE SCREENSHOT) */}
              <div className="grid grid-cols-12 gap-2 text-xs mb-4 items-start">
                <div className="col-span-3 text-slate-400 font-medium pt-1.5">{variantLabel}</div>
                <div className="col-span-9 flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.name === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-sm border text-xs font-medium flex items-center gap-2 relative transition cursor-pointer ${
                          isSelected
                            ? 'border-[#ee4d2d] text-[#ee4d2d] bg-[#fff5f7]'
                            : 'border-slate-300 text-slate-700 hover:border-[#ee4d2d] bg-white'
                        }`}
                      >
                        {renderSwatch(v, 'w-4 h-4')}
                        <span>{v.name}</span>
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#ee4d2d] text-white text-[8px] flex items-center justify-center rounded-tl-xs font-bold leading-none">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field: Kuantitas */}
              <div className="grid grid-cols-12 gap-2 text-xs mb-6 items-center">
                <div className="col-span-3 text-slate-400 font-medium">Kuantitas</div>
                <div className="col-span-9 flex items-center gap-3">
                  <div className="inline-flex items-center border border-slate-300 rounded-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(-1)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 transition"
                    >
                      &minus;
                    </button>
                    <input
                      type="text"
                      readOnly
                      value={quantity}
                      className="w-10 h-8 text-center text-xs font-bold text-slate-800 border-x border-slate-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(1)}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-600 transition"
                    >
                      &plus;
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    Tersedia {currentStock}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Shopee CTA */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAddToCartClick}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#ffefe9] border border-[#ee4d2d] text-[#ee4d2d] rounded-sm text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#ffe4db] transition shadow-xs cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Masukkan Keranjang</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNowClick}
                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-[#ee4d2d] to-[#f05a3c] text-white rounded-sm text-sm font-bold hover:brightness-105 transition shadow-sm cursor-pointer"
              >
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* Spesifikasi & Deskripsi Produk (Shopee Bottom Section) */}
        <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-100">
          <div className="bg-white rounded-md p-4 sm:p-5 shadow-xs border border-slate-100 mb-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              SPESIFIKASI PRODUK
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex gap-2">
                <span className="text-slate-400 w-28 shrink-0">Kategori</span>
                <span className="text-slate-800 font-medium">Shopee &gt; Handphone & Aksesoris &gt; {product.category}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-28 shrink-0">Merek / Brand</span>
                <span className="text-slate-800 font-medium">{product.name.toUpperCase().includes('LANRUI') ? 'LanRui Official' : '168 Parts Certified'}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-28 shrink-0">Kondisi</span>
                <span className="text-slate-800 font-medium">Baru (100% Brand New Grade Original)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-28 shrink-0">Masa Garansi</span>
                <span className="text-slate-800 font-medium">Garansi Tes 7 Hari (Segel Utuh)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-28 shrink-0">Dikirim Dari</span>
                <span className="text-slate-800 font-medium">Kota Surabaya, Jawa Timur, Indonesia</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-28 shrink-0">Stok Gudang</span>
                <span className="text-slate-800 font-medium">{currentStock} unit ready</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md p-4 sm:p-5 shadow-xs border border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              DESKRIPSI PRODUK
            </h3>
            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || 'Produk kualitas terbaik dengan jaminan original dan garansi terpercaya di 168 Parts Surabaya.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper ekstraksi swatch warna
function renderSwatch(v: ProductVariant, className = 'w-4 h-4') {
  if (v.swatchType === 'transparan') {
    return (
      <span
        className={`${className} rounded-xs border border-slate-300 shrink-0`}
        style={{
          background: 'repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 3px, #ffffff 3px, #ffffff 6px)'
        }}
        title="Transparan"
      />
    );
  }
  if (v.colorCode) {
    return (
      <span
        className={`${className} rounded-xs shrink-0 ${v.swatchType === 'white' ? 'border border-slate-300' : ''}`}
        style={{ backgroundColor: v.colorCode }}
        title={v.name}
      />
    );
  }
  return <span className="text-xs">📦</span>;
}

// Helper ekstraksi variasi cerdas
function extractVariants(product: Product): ProductVariant[] {
  if (Array.isArray(product.variants) && product.variants.length > 1) {
    return product.variants.map(v => {
      const vName = v.name || 'STANDAR';
      const upper = vName.toUpperCase();
      let colorCode: string | null = null;
      let swatchType: 'dark' | 'white' | 'transparan' | null = null;
      if (upper.includes('HITAM') || upper.includes('BLACK')) {
        colorCode = '#18181b';
        swatchType = 'dark';
      } else if (upper.includes('TRANSPARAN') || upper.includes('TRANSPARANT') || upper.includes('BENING') || upper.includes('CLEAR')) {
        colorCode = '#e2e8f0';
        swatchType = 'transparan';
      } else if (upper.includes('PUTIH') || upper.includes('WHITE')) {
        colorCode = '#ffffff';
        swatchType = 'white';
      } else if (upper.includes('BIRU') || upper.includes('BLUE')) {
        colorCode = '#2563eb';
      } else if (upper.includes('MERAH') || upper.includes('RED')) {
        colorCode = '#dc2626';
      } else if (upper.includes('KUNING') || upper.includes('YELLOW')) {
        colorCode = '#eab308';
      } else if (upper.includes('HIJAU') || upper.includes('GREEN')) {
        colorCode = '#16a34a';
      } else if (upper.includes('GOLD')) {
        colorCode = '#d97706';
      }
      return {
        name: vName,
        price: Number(v.price) || product.price,
        originalPrice: v.originalPrice || Math.round((Number(v.price) || product.price) * 1.25),
        stock: Number(v.stock) || 49,
        colorCode,
        swatchType
      };
    });
  }

  const nameUpper = (product.name || '').toUpperCase();
  const basePrice = Number(product.price) || 0;
  const origPrice = product.originalPrice || Math.round(basePrice * 1.25);

  // Khusus LanRui I9 (persis screenshot Shopee)
  if (nameUpper.includes('LANRUI') && nameUpper.includes('I9')) {
    return [
      {
        name: 'LANRUI HITAM',
        price: 25000,
        originalPrice: 35000,
        stock: 49,
        colorCode: '#18181b',
        swatchType: 'dark'
      },
      {
        name: 'LANRUI TRANSPARANT',
        price: 31000,
        originalPrice: 42000,
        stock: 49,
        colorCode: '#e2e8f0',
        swatchType: 'transparan'
      }
    ];
  }

  // Deteksi varian warna dari judul produk
  const colors = [
    { key: 'HITAM', name: 'HITAM', colorCode: '#18181b', swatchType: 'dark' as const },
    { key: 'BLACK', name: 'BLACK', colorCode: '#18181b', swatchType: 'dark' as const },
    { key: 'TRANSPARAN', name: 'TRANSPARANT', colorCode: '#e2e8f0', swatchType: 'transparan' as const },
    { key: 'TRANSPARANT', name: 'TRANSPARANT', colorCode: '#e2e8f0', swatchType: 'transparan' as const },
    { key: 'BENING', name: 'BENING', colorCode: '#e2e8f0', swatchType: 'transparan' as const },
    { key: 'CLEAR', name: 'CLEAR', colorCode: '#e2e8f0', swatchType: 'transparan' as const },
    { key: 'PUTIH', name: 'PUTIH', colorCode: '#ffffff', swatchType: 'white' as const },
    { key: 'WHITE', name: 'WHITE', colorCode: '#ffffff', swatchType: 'white' as const },
    { key: 'BIRU', name: 'BIRU', colorCode: '#2563eb' },
    { key: 'BLUE', name: 'BLUE', colorCode: '#2563eb' },
    { key: 'MERAH', name: 'MERAH', colorCode: '#dc2626' },
    { key: 'RED', name: 'RED', colorCode: '#dc2626' },
    { key: 'HIJAU', name: 'HIJAU', colorCode: '#16a34a' },
    { key: 'GREEN', name: 'GREEN', colorCode: '#16a34a' },
    { key: 'KUNING', name: 'KUNING', colorCode: '#eab308' },
    { key: 'GOLD', name: 'GOLD', colorCode: '#d97706' }
  ];

  const matched = colors.filter(c => new RegExp(`\\b${c.key}\\b`, 'i').test(nameUpper));
  if (matched.length >= 2) {
    return matched.map(c => ({
      name: c.name,
      price: basePrice,
      originalPrice: origPrice,
      stock: 45,
      colorCode: c.colorCode,
      swatchType: c.swatchType
    }));
  }

  return [
    {
      name: 'STANDAR ORIGINAL',
      price: basePrice,
      originalPrice: origPrice,
      stock: product.stock || 49,
      colorCode: '#0284c7'
    }
  ];
}
