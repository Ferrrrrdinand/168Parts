import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { formatRupiah } from '../api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onGoToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onGoToCheckout
}) => {
  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-700" />
            <h3 className="font-extrabold text-slate-800 text-base">Keranjang Belanja</h3>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.length} Item
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center">
              <ShoppingBag className="w-16 h-16 text-slate-200 mb-3 stroke-[1.5]" />
              <p className="font-bold text-slate-600 mb-1">Keranjang masih kosong</p>
              <p className="text-xs">Yuk pilih produk sparepart dan promo spesial hari ini!</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-3 flex items-center gap-3">
                <img
                  src={item.product.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80'}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded border border-slate-200 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug mb-1">
                    {item.product.name}
                  </h4>
                  <div className="text-sm font-extrabold text-[#ee4d2d]">
                    {formatRupiah(item.product.price)}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 rounded">
                      <button
                        onClick={() => onUpdateQty(item.product.id, -1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.product.id, 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-red-500 hover:text-red-700 p-1 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Total Harga:</span>
              <span className="text-lg font-black text-[#ee4d2d]">
                {formatRupiah(total)}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onGoToCheckout();
              }}
              className="w-full py-3 bg-[#ee4d2d] hover:bg-[#d73211] text-white font-extrabold text-sm rounded-lg shadow-md transition"
            >
              Lanjut ke Checkout ({cart.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

