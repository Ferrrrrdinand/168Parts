import React, { useState } from 'react';
import { ArrowLeft, Ticket, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { CartItem, Promo } from '../types';
import { formatRupiah } from '../api';

interface CheckoutViewProps {
  cart: CartItem[];
  onBackToShopping: () => void;
  onOpenPromoModal: () => void;
  appliedPromo: Promo | null;
  onRemovePromo: () => void;
  onPlaceOrder: (orderData: any) => Promise<boolean>;
}

const paymentMethods = [
  'Debit Instan',
  'COD (Bayar di Tempat)',
  'COD - Cek Dulu',
  'QRIS',
  'Transfer Bank',
  'Kartu Kredit/Debit',
  'Cicilan Kartu Kredit',
  'Bayar Tunai di Mitra/Agen'
];

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  onBackToShopping,
  onOpenPromoModal,
  appliedPromo,
  onRemovePromo,
  onPlaceOrder
}) => {
  const [address, setAddress] = useState('Jl. Basuki Rahmat No. 168, Genteng, Kota Surabaya, Jawa Timur 60271');
  const [selectedPayment, setSelectedPayment] = useState('Debit Instan');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotalProducts = cart.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const shippingFee = 5000;
  const serviceFee = 1200;
  const protectionFee = 1700;

  // Calculate Voucher Discount
  let voucherDiscount = 0;
  if (appliedPromo) {
    const dType = appliedPromo.discount_type || appliedPromo.discountType;
    const dVal = appliedPromo.discount_value !== undefined ? appliedPromo.discount_value : (appliedPromo.discountValue || 0);
    const maxD = appliedPromo.max_discount !== undefined ? appliedPromo.max_discount : (appliedPromo.maxDiscount || null);

    if (dType === 'percent') {
      voucherDiscount = Math.round((subtotalProducts * dVal) / 100);
      if (maxD && voucherDiscount > maxD) voucherDiscount = maxD;
    } else {
      voucherDiscount = dVal;
    }
  }

  const totalPayment = Math.max(0, subtotalProducts + shippingFee + serviceFee + protectionFee - voucherDiscount);

  const handleOrderSubmit = async () => {
    if (!address.trim()) {
      alert('Alamat pengiriman wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    const success = await onPlaceOrder({
      shippingAddress: address,
      paymentMethod: selectedPayment,
      notes: notes,
      totalAmount: totalPayment
    });
    setIsSubmitting(false);
    if (success) {
      alert('Pesanan berhasil dibuat!');
      onBackToShopping();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBackToShopping}
          className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Checkout Pesanan</h1>
          <p className="text-xs text-slate-500">Periksa detail pesanan dan pilih opsi pembayaran Anda</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Alamat Pengiriman */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>Alamat Pengiriman Pelanggan</span>
          </div>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Tulis alamat lengkap pengiriman beserta patokan..."
          />
        </div>

        {/* 2. Produk Dipesan Table Card (Presisi 5:2:2:2 Kolom Sesuai Feedback) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center px-6 py-3.5 border-b border-slate-100 text-xs sm:text-sm font-semibold text-slate-400">
            <div className="flex-[5] text-slate-700">Produk Dipesan</div>
            <div className="flex-[2] text-center">Harga Satuan</div>
            <div className="flex-[2] text-center">Jumlah</div>
            <div className="flex-[2] text-center">Subtotal Produk</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-50">
            {cart.map((it) => (
              <div key={it.product.id} className="flex items-center px-6 py-4 text-xs sm:text-sm">
                <div className="flex-[5] flex items-center gap-3">
                  <img
                    src={it.product.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80'}
                    alt={it.product.name}
                    className="w-14 h-14 object-cover rounded border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-semibold text-slate-800 line-clamp-2 leading-snug">
                      {it.product.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">Toko: {it.product.shopName || '168part Surabaya'}</span>
                  </div>
                </div>

                <div className="flex-[2] text-center font-medium text-slate-700">
                  {formatRupiah(it.product.price)}
                </div>

                <div className="flex-[2] text-center font-bold text-slate-800">
                  {it.quantity}
                </div>

                <div className="flex-[2] text-center font-bold text-slate-900">
                  {formatRupiah(it.product.price * it.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Voucher & Kode Promo Card */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-rose-700" />
            <span className="font-bold text-sm text-slate-800">Voucher & Kode Promo 168 Parts</span>
            {appliedPromo && (
              <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded border border-rose-300">
                KODE: {appliedPromo.code} (-{formatRupiah(voucherDiscount)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {appliedPromo ? (
              <button
                onClick={onRemovePromo}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                Hapus Voucher
              </button>
            ) : null}
            <button
              onClick={onOpenPromoModal}
              className="text-xs sm:text-sm font-bold text-rose-700 hover:text-rose-900 transition"
            >
              {appliedPromo ? 'Ganti Voucher' : 'Pilih / Masukkan Kode Voucher >'}
            </button>
          </div>
        </div>

        {/* 4. Metode Pembayaran & Rincian Total */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-800 mb-3">Pilih Metode Pembayaran</h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => {
                const isSelected = selectedPayment === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPayment(method)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-rose-700 text-white border-rose-700 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Tambahan untuk Penjual:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Titipkan ke satpam, packing bubble tebal..."
                className="w-full p-2.5 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Price Calculations */}
            <div className="w-full md:w-80 space-y-2 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Produk:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(subtotalProducts)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Proteksi Produk:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(protectionFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal Pengiriman:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Layanan:</span>
                <span className="font-semibold text-slate-800">{formatRupiah(serviceFee)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Voucher Diskon:</span>
                  <span>-{formatRupiah(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Pembayaran:</span>
                <span className="text-[#ee4d2d]">{formatRupiah(totalPayment)}</span>
              </div>

              <button
                onClick={handleOrderSubmit}
                disabled={isSubmitting}
                className="w-full mt-4 py-3 bg-[#ee4d2d] hover:bg-[#d73211] text-white font-black text-sm rounded-lg shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

