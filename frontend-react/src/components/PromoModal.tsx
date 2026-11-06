import React, { useState } from 'react';
import { X, Ticket, Check } from 'lucide-react';
import { Promo } from '../types';
import { formatRupiah, validatePromo } from '../api';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  promos: Promo[];
  onApplyPromo: (p: Promo) => void;
  appliedPromo: Promo | null;
  totalAmount: number;
}

export const PromoModal: React.FC<PromoModalProps> = ({
  isOpen,
  onClose,
  promos,
  onApplyPromo,
  appliedPromo,
  totalAmount
}) => {
  const [customCode, setCustomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleApplyCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim()) return;
    setErrorMsg('');
    const res = await validatePromo(customCode.trim(), totalAmount || 100000);
    if (res.success && res.data) {
      onApplyPromo(res.data);
      onClose();
    } else {
      setErrorMsg(res.message || 'Kode promo tidak valid atau kadaluarsa.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-rose-700">
            <Ticket className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-800">Voucher & Kode Promo 168 Parts</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Code Input Form */}
        <div className="p-4 border-b border-slate-100 bg-rose-50/50">
          <form onSubmit={handleApplyCustom} className="flex gap-2">
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode promo (misal: TEKNISI168 / SHOPEE168)"
              className="flex-1 p-2.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#be123c] hover:bg-[#9f1239] text-white text-xs font-bold rounded shadow transition"
            >
              Pakai
            </button>
          </form>
          {errorMsg && <p className="text-xs text-red-600 mt-1 font-semibold">{errorMsg}</p>}
        </div>

        {/* List of Vouchers */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
          {promos.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">Tidak ada voucher aktif saat ini.</p>
          ) : (
            promos.map((p) => {
              const isApplied = appliedPromo?.code === p.code;
              const dType = p.discount_type || p.discountType;
              const dVal = p.discount_value !== undefined ? p.discount_value : (p.discountValue || 0);

              return (
                <div key={p.code} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded border border-rose-300">
                        {p.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{p.category || 'Diskon'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{p.title}</h4>
                    <p className="text-[11px] text-slate-500">{p.description || `Potongan ${dType === 'percent' ? dVal + '%' : formatRupiah(dVal)}`}</p>
                  </div>

                  <button
                    onClick={() => {
                      onApplyPromo(p);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${
                      isApplied
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Terpasang</span>
                      </>
                    ) : (
                      'Klaim & Pakai'
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

