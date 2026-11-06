import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const endpoint = isLoginTab ? '/api/auth/login' : '/api/auth/register';
      const payload = isLoginTab ? { email, password } : { name, email, phone, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.user) {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMsg(data.message || 'Gagal memproses autentikasi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke server gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex border-b border-slate-100 mb-5">
          <button
            onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-sm font-black transition border-b-2 ${
              isLoginTab ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-400'
            }`}
          >
            Masuk / Log In
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-sm font-black transition border-b-2 ${
              !isLoginTab ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-400'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap:</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Budi Santoso"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email:</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP:</label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password:</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#be123c] hover:bg-[#9f1239] text-white text-xs font-extrabold rounded-lg shadow-md transition disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Memproses...' : (isLoginTab ? 'Masuk Sekarang' : 'Daftar Akun')}
          </button>
        </form>

        {isLoginTab && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">Akun Bawaan Demo 168 Parts:</span>
            <div className="text-[10px] bg-slate-50 p-2 rounded text-slate-600 font-mono space-y-0.5">
              <div>Admin: <b>admin@pasarin.com</b> / <b>admin123</b></div>
              <div>Buyer: <b>demo@pasarin.com</b> / <b>demo123</b></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

