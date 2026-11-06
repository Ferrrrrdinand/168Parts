import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Package, Ticket, Image as ImageIcon, ShoppingBag,
  TrendingUp, Plus, Edit, Trash2, Check, RefreshCw, Eye, UploadCloud
} from 'lucide-react';
import { Product, Promo, BannerConfig, Order } from '../types';
import { HeroBanners } from './HeroBanners';
import {
  fetchProducts, createProduct, updateProduct, deleteProduct, importShopeeProducts,
  fetchAllPromos, createPromo, updatePromo, togglePromoStatus, deletePromo,
  fetchBanners, updateBanners, resetBanners,
  fetchAllOrders, updateOrderStatus, formatRupiah
} from '../api';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'promos' | 'banners'>('overview');

  const [products, setProducts] = useState<Product[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<BannerConfig | null>(null);

  const [searchProd, setSearchProd] = useState('');
  const [selectedCat, setSelectedCat] = useState('Semua');

  // Modal Product State
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    name: '',
    category: 'Elektronik',
    price: 0,
    originalPrice: 0,
    stock: 20,
    shopName: '168part Surabaya',
    location: 'Kota Surabaya',
    description: '',
    isFlashSale: false
  });

  // Modal Promo State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [promoForm, setPromoForm] = useState<Partial<Promo>>({
    code: '',
    title: '',
    description: '',
    discount_type: 'percent',
    discount_value: 10,
    min_spend: 50000,
    max_discount: 100000,
    quota: 100,
    category: 'diskon'
  });

  // Banner State
  const [bannerForm, setBannerForm] = useState<BannerConfig | null>(null);

  // Shopee Importer State
  const [isShopeeModalOpen, setIsShopeeModalOpen] = useState(false);
  const [shopeeInput, setShopeeInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const loadData = async () => {
    const [pList, prList, oList, bData] = await Promise.all([
      fetchProducts(),
      fetchAllPromos(),
      fetchAllOrders(),
      fetchBanners()
    ]);
    setProducts(pList);
    setPromos(prList);
    setOrders(oList);
    setBanners(bData);
    setBannerForm(bData);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.price) return alert('Nama dan harga produk wajib diisi!');

    if (editingProd) {
      await updateProduct(editingProd.id, prodForm);
      alert('Produk berhasil diperbarui!');
    } else {
      await createProduct(prodForm);
      alert('Produk berhasil ditambahkan!');
    }
    setIsProdModalOpen(false);
    setEditingProd(null);
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Yakin ingin menghapus produk ini dari database?')) {
      await deleteProduct(id);
      loadData();
    }
  };

  const handleImportShopee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shopeeInput.trim()) {
      return alert('Silakan masukkan data JSON / daftar produk Shopee!');
    }
    setIsImporting(true);
    try {
      const res = await importShopeeProducts({ rawJson: shopeeInput, replaceExisting: false });
      if (res.success) {
        alert(`🎉 Berhasil memindahkan ${res.count || 0} produk Shopee ke database!`);
        setIsShopeeModalOpen(false);
        setShopeeInput('');
        loadData();
      } else {
        alert('Gagal impor: ' + res.message);
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat memproses data Shopee: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Handlers Promo
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.title) return alert('Kode dan judul voucher wajib diisi!');

    if (editingPromo) {
      await updatePromo(editingPromo.code, promoForm);
      alert('Voucher berhasil diperbarui!');
    } else {
      await createPromo(promoForm);
      alert('Voucher baru berhasil dibuat!');
    }
    setIsPromoModalOpen(false);
    setEditingPromo(null);
    loadData();
  };

  const handleTogglePromo = async (code: string, currentActive: any) => {
    const nextState = !(currentActive === 1 || currentActive === true);
    await togglePromoStatus(code, nextState);
    loadData();
  };

  const handleDeletePromo = async (code: string) => {
    if (confirm(`Yakin ingin menghapus voucher "${code}"?`)) {
      await deletePromo(code);
      loadData();
    }
  };

  // Handlers Banner
  const handleSaveBanners = async () => {
    if (!bannerForm) return;
    await updateBanners(bannerForm);
    alert('Pengaturan hero banner berhasil disimpan!');
    loadData();
  };

  const handleResetBanners = async () => {
    if (confirm('Kembalikan hero banner ke pengaturan default?')) {
      await resetBanners();
      loadData();
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchProd.toLowerCase()) || p.id.toLowerCase().includes(searchProd.toLowerCase());
    const matchCat = selectedCat === 'Semua' || p.category.toLowerCase().includes(selectedCat.toLowerCase());
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Topbar */}
      <header className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStore}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
            title="Kembali ke Toko 168 Parts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>👑 Super Admin 168 Parts</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-500/30">
                Backend Sequelize SQLite
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Pusat Manajemen Katalog Sparepart HP Surabaya, Promo Voucher, dan Banner Toko</p>
          </div>
        </div>

        <button
          onClick={onBackToStore}
          className="text-xs bg-rose-600 hover:bg-rose-500 font-bold px-3 py-1.5 rounded transition shadow"
        >
          Lihat Web Toko →
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-60 bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex-shrink-0">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition text-left ${
                activeTab === 'overview' ? 'bg-[#be123c] text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Overview & KPI</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition text-left ${
                activeTab === 'products' ? 'bg-[#be123c] text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Katalog Sparepart ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition text-left ${
                activeTab === 'orders' ? 'bg-[#be123c] text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pesanan ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('promos')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition text-left ${
                activeTab === 'promos' ? 'bg-[#be123c] text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Voucher & Promo ({promos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition text-left ${
                activeTab === 'banners' ? 'bg-[#be123c] text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Hero Banners</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Produk Aktif</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{products.length} Item</div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Termasuk 12 sparepart 168part</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Voucher & Promo</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{promos.length} Kupon</div>
                  <span className="text-[10px] text-purple-600 font-bold mt-1 block">Aktif di checkout & katalog</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Total Pesanan Masuk</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{orders.length} Transaksi</div>
                  <span className="text-[10px] text-blue-600 font-bold mt-1 block">Tersimpan di SQLite/Sequelize</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500">Status Database</span>
                  <div className="text-base font-black text-emerald-700 mt-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>Sequelize SQLite</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">pasarin_local.db terhubung</span>
                </div>
              </div>

              {/* Informational Banner */}
              <div className="bg-gradient-to-r from-[#881337] via-[#9f1239] to-[#be123c] text-white p-5 rounded-xl shadow flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold mb-1">⚡ 168 Parts - Transaksi Bebas Potongan Pajak & Komisi Shopee</h3>
                  <p className="text-xs text-rose-100 max-w-xl">
                    Produk dari toko Shopee 168part Surabaya telah terintegrasi penuh ke dalam database Sequelize SQLite lokal.
                    Seluruh checkout langsung masuk ke database Anda tanpa potongan komisi marketplace.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProd(null);
                    setProdForm({ name: '', price: 0, category: 'LCD & Layar', stock: 20 });
                    setIsProdModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white text-rose-950 font-black text-xs rounded-lg shadow hover:bg-slate-100 transition whitespace-nowrap"
                >
                  + Tambah Produk Baru
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CRUD */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchProd}
                    onChange={(e) => setSearchProd(e.target.value)}
                    placeholder="🔍 Cari nama atau ID produk..."
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700"
                  >
                    <option value="Semua">Semua Kategori ({products.length})</option>
                    <option value="LCD & Layar">LCD & Layar</option>
                    <option value="Baterai HP">Baterai HP</option>
                    <option value="IC & Chipset">IC & Chipset</option>
                    <option value="Alat Servis & Blower">Alat Servis & Blower</option>
                    <option value="Solder & Timah">Solder & Timah</option>
                    <option value="Lem & Perekat">Lem & Perekat</option>
                    <option value="Backdoor & Kaca">Backdoor & Kaca</option>
                    <option value="Alat Ukur & Tester">Alat Ukur & Tester</option>
                    <option value="Pinset & Pembuka">Pinset & Pembuka</option>
                    <option value="Sparepart Fleksibel">Sparepart Fleksibel</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsShopeeModalOpen(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition"
                  >
                    <UploadCloud className="w-4 h-4 text-rose-600" />
                    <span>📥 Impor dari Shopee</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProd(null);
                      setProdForm({ name: '', price: 0, category: 'LCD & Layar', stock: 20 });
                      setIsProdModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-[#be123c] hover:bg-[#9f1239] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Produk</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Harga</th>
                      <th className="p-3">Stok</th>
                      <th className="p-3">Toko</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 flex items-center gap-2.5">
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded border"
                          />
                          <div>
                            <span className="font-bold text-slate-900 line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-slate-400">ID: {p.id}</span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold">{p.category}</td>
                        <td className="p-3 font-bold text-[#ee4d2d]">{formatRupiah(p.price)}</td>
                        <td className="p-3">{p.stock}</td>
                        <td className="p-3 text-slate-500">{p.shopName || 'Pasarin Store'}</td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingProd(p);
                              setProdForm({ ...p });
                              setIsProdModalOpen(true);
                            }}
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-4">
              <h2 className="text-sm font-extrabold text-slate-800 mb-3">Daftar Transaksi Pesanan Pelanggan</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3">No. Pesanan</th>
                      <th className="p-3">Total Belanja</th>
                      <th className="p-3">Metode Bayar</th>
                      <th className="p-3">Alamat</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{o.id}</td>
                        <td className="p-3 font-bold text-[#ee4d2d]">{formatRupiah(o.totalAmount || o.total_amount || 0)}</td>
                        <td className="p-3">{o.paymentMethod || o.payment_method}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{o.shippingAddress || o.shipping_address}</td>
                        <td className="p-3">
                          <select
                            value={o.status}
                            onChange={async (e) => {
                              await updateOrderStatus(o.id, e.target.value);
                              loadData();
                            }}
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700"
                          >
                            <option value="Sedang Diproses">Sedang Diproses</option>
                            <option value="Sedang Dikirim">Sedang Dikirim</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Dibatalkan">Dibatalkan</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VOUCHER & PROMO (UNIFIED) */}
          {activeTab === 'promos' && (
            <div className="space-y-4">
              {/* Equality Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5">
                <span className="text-xl">💡</span>
                <span>
                  <b>Kesetaraan Sistem:</b> Seluruh <b>Voucher</b> dan <b>Kode Promo</b> adalah satu kesatuan yang sama tanpa perbedaan. Setiap kode yang Anda kelola otomatis berfungsi sebagai tiket klaim di katalog pembeli dan kupon diskon checkout.
                </span>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-extrabold text-xs text-slate-800">Katalog Voucher Aktif</h3>
                  <button
                    onClick={() => {
                      setEditingPromo(null);
                      setPromoForm({ code: '', title: '', discount_type: 'percent', discount_value: 10, min_spend: 50000 });
                      setIsPromoModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#be123c] hover:bg-[#9f1239] text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Voucher Baru</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Kode Voucher</th>
                        <th className="p-3">Nama Promo</th>
                        <th className="p-3">Nilai Diskon</th>
                        <th className="p-3">Min. Belanja</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {promos.map((pr) => {
                        const isActive = pr.is_active === 1 || pr.is_active === true;
                        const dType = pr.discount_type || pr.discountType;
                        const dVal = pr.discount_value !== undefined ? pr.discount_value : (pr.discountValue || 0);

                        return (
                          <tr key={pr.code} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-emerald-800">{pr.code}</td>
                            <td className="p-3 font-semibold text-slate-900">{pr.title}</td>
                            <td className="p-3 font-bold text-[#ee4d2d]">{dType === 'percent' ? `${dVal}%` : formatRupiah(dVal)}</td>
                            <td className="p-3">{formatRupiah(pr.min_spend || pr.minSpend || 0)}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleTogglePromo(pr.code, pr.is_active)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition ${
                                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {isActive ? '● Aktif' : '○ Nonaktif'}
                              </button>
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingPromo(pr);
                                  setPromoForm({ ...pr });
                                  setIsPromoModalOpen(true);
                                }}
                                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePromo(pr.code)}
                                className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded transition"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HERO BANNERS */}
          {activeTab === 'banners' && bannerForm && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Pengaturan Live Hero Banners (Super User)</h3>
                  <p className="text-xs text-slate-500">Sesuaikan tampilan headline, pill promo, foto produk/model, dan gradien warna beranda</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Preset 168 Parts */}
                  <button
                    type="button"
                    onClick={() => setBannerForm({
                      left: {
                        badge: '⚡ 168 PARTS OFFICIAL',
                        title: 'Pusat Sparepart & Alat Servis HP Surabaya',
                        pills: [
                          '🔧 LCD & Touchscreen Kualitas Pabrik',
                          '📦 Ready Stock Surabaya Langsung Kirim',
                          '⭐ Garansi Tes & Harga Grosir Teknisi'
                        ],
                        modelImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
                        bgGradient: 'linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%)'
                      },
                      right: {
                        title: 'Diskon Teknisi & Voucher',
                        modelImage1: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=240&auto=format&fit=crop&q=80',
                        modelImage2: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=240&auto=format&fit=crop&q=80',
                        pill1Title: 'DISKON TEKNISI',
                        pill1Val: '70%',
                        pill2Title: 'VOUCHER TOKO',
                        pill2Val: '50RB',
                        bgGradient: 'linear-gradient(135deg, #881337 0%, #9f1239 50%, #be123c 100%)'
                      }
                    })}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition border border-rose-200"
                  >
                    🔴 Preset 168 Parts (Merah Soft)
                  </button>

                  {/* Preset Pasarin Screenshot */}
                  <button
                    type="button"
                    onClick={() => setBannerForm({
                      left: {
                        badge: '✨ PASARIN PILIH LOKAL',
                        title: 'Kreasi Unggulan & Inovasi Nusantara',
                        pills: [
                          '🏷️ Produk Unik Asli Indonesia',
                          '⚡ Inovasi Lokal Rasa Global',
                          '⭐ Kualitas Unggulan Nusantara'
                        ],
                        modelImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&auto=format&fit=crop&q=80',
                        bgGradient: 'linear-gradient(135deg, #1d3f0d 0%, #285715 100%)'
                      },
                      right: {
                        title: 'Spesial Diskon & Voucher',
                        modelImage1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
                        modelImage2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
                        pill1Title: 'DISKON S.D.',
                        pill1Val: '80%',
                        pill2Title: 'VOUCHER',
                        pill2Val: '100RB',
                        bgGradient: 'linear-gradient(135deg, #3b0764 0%, #581c87 50%, #4c1d95 100%)'
                      }
                    })}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition border border-emerald-200"
                  >
                    🟢 Preset Sesuai Screenshot
                  </button>

                  <button
                    onClick={handleResetBanners}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSaveBanners}
                    className="px-4 py-1.5 bg-[#be123c] hover:bg-[#9f1239] text-white font-bold text-xs rounded-lg transition shadow"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>

              {/* LIVE PREVIEW BANNER */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 p-2 sm:p-4 shadow-inner">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-rose-600" />
                    <span>Live Preview Tampilan Banner:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Otomatis update saat form diubah</span>
                </div>
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <HeroBanners banners={bannerForm} />
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banner Kiri */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="font-black text-xs text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>Banner Kiri (Headline & Pills)</span>
                    <span className="text-[10px] text-rose-600 font-bold">2 Kolom Desktop</span>
                  </h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Badge Tag Atas:</label>
                    <input
                      type="text"
                      value={bannerForm.left.badge}
                      onChange={(e) => setBannerForm({
                        ...bannerForm,
                        left: { ...bannerForm.left, badge: e.target.value }
                      })}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Judul Headline:</label>
                    <input
                      type="text"
                      value={bannerForm.left.title}
                      onChange={(e) => setBannerForm({
                        ...bannerForm,
                        left: { ...bannerForm.left, title: e.target.value }
                      })}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800 font-bold"
                    />
                  </div>

                  {/* 3 Pills */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-600">3 Baris Pill Putih:</label>
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={bannerForm.left.pills?.[idx] || ''}
                        onChange={(e) => {
                          const currentPills = [...(bannerForm.left.pills || ['', '', ''])];
                          currentPills[idx] = e.target.value;
                          setBannerForm({
                            ...bannerForm,
                            left: { ...bannerForm.left, pills: currentPills }
                          });
                        }}
                        placeholder={`Pill #${idx + 1}`}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                      />
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">URL Foto Model / Teknisi:</label>
                    <input
                      type="text"
                      value={bannerForm.left.modelImage}
                      onChange={(e) => setBannerForm({
                        ...bannerForm,
                        left: { ...bannerForm.left, modelImage: e.target.value }
                      })}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Background Gradient CSS:</label>
                    <input
                      type="text"
                      value={bannerForm.left.bgGradient}
                      onChange={(e) => setBannerForm({
                        ...bannerForm,
                        left: { ...bannerForm.left, bgGradient: e.target.value }
                      })}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Banner Kanan */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="font-black text-xs text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>Banner Kanan (Diskon & Voucher)</span>
                    <span className="text-[10px] text-purple-600 font-bold">1 Kolom Desktop</span>
                  </h4>

                  {/* Tag 1: Diskon */}
                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Pill 1 Judul:</label>
                      <input
                        type="text"
                        value={bannerForm.right.pill1Title}
                        onChange={(e) => setBannerForm({
                          ...bannerForm,
                          right: { ...bannerForm.right, pill1Title: e.target.value }
                        })}
                        placeholder="DISKON S.D."
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Pill 1 Nilai:</label>
                      <input
                        type="text"
                        value={bannerForm.right.pill1Val}
                        onChange={(e) => setBannerForm({
                          ...bannerForm,
                          right: { ...bannerForm.right, pill1Val: e.target.value }
                        })}
                        placeholder="80%"
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-black text-purple-700"
                      />
                    </div>
                  </div>

                  {/* Tag 2: Voucher */}
                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Pill 2 Judul:</label>
                      <input
                        type="text"
                        value={bannerForm.right.pill2Title}
                        onChange={(e) => setBannerForm({
                          ...bannerForm,
                          right: { ...bannerForm.right, pill2Title: e.target.value }
                        })}
                        placeholder="VOUCHER"
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Pill 2 Nilai:</label>
                      <input
                        type="text"
                        value={bannerForm.right.pill2Val}
                        onChange={(e) => setBannerForm({
                          ...bannerForm,
                          right: { ...bannerForm.right, pill2Val: e.target.value }
                        })}
                        placeholder="100RB"
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-black text-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">URL Foto Model Kiri:</label>
                      <input
                        type="text"
                        value={bannerForm.right.modelImage1}
                        onChange={(e) => setBannerForm({
                          ...bannerForm,
                          right: { ...bannerForm.right, modelImage1: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">URL Foto Model Kanan:</label>
                      <input
                        type="text"
                        value={bannerForm.right.modelImage2}
                        onChange={(e) => setBannerForm({
                          ...bannerForm,
                          right: { ...bannerForm.right, modelImage2: e.target.value }
                        })}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Background Gradient CSS:</label>
                    <input
                      type="text"
                      value={bannerForm.right.bgGradient}
                      onChange={(e) => setBannerForm({
                        ...bannerForm,
                        right: { ...bannerForm.right, bgGradient: e.target.value }
                      })}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH/EDIT PRODUK */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsProdModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-5 z-10 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 mb-3">
              {editingProd ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk:</label>
                <input
                  type="text"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  required
                  className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    value={prodForm.price || ''}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stok:</label>
                  <input
                    type="number"
                    value={prodForm.stock || ''}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori:</label>
                <select
                  value={prodForm.category}
                  onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                >
                  <option value="LCD & Layar">LCD & Layar</option>
                  <option value="Baterai HP">Baterai HP</option>
                  <option value="IC & Chipset">IC & Chipset</option>
                  <option value="Alat Servis & Blower">Alat Servis & Blower</option>
                  <option value="Solder & Timah">Solder & Timah</option>
                  <option value="Lem & Perekat">Lem & Perekat</option>
                  <option value="Backdoor & Kaca">Backdoor & Kaca</option>
                  <option value="Alat Ukur & Tester">Alat Ukur & Tester</option>
                  <option value="Pinset & Pembuka">Pinset & Pembuka</option>
                  <option value="Sparepart Fleksibel">Sparepart Fleksibel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Toko:</label>
                <input
                  type="text"
                  value={prodForm.shopName || ''}
                  onChange={(e) => setProdForm({ ...prodForm, shopName: e.target.value })}
                  placeholder="168part Surabaya"
                  className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProdModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#be123c] text-white text-xs font-bold rounded shadow hover:bg-[#9f1239]"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPOR PRODUK SHOPEE 168PART */}
      {isShopeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsShopeeModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-5 z-10 animate-in zoom-in-95 space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-rose-600" />
                <span>Impor Produk Shopee ke Database Lokal</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pindahkan produk dari toko Shopee <b>168part Surabaya</b> langsung ke database Sequelize SQLite tanpa potongan komisi marketplace.
              </p>
            </div>

            {/* Quick Action: Sync Catalog */}
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <h4 className="text-xs font-bold text-rose-900 mb-1">⚡ Sinkronisasi 46+ Katalog Shopee 168part:</h4>
              <p className="text-[11px] text-rose-700 mb-2.5">
                Muat ulang seluruh katalog sparepart lengkap (LCD, Baterai, IC, Lem I9, Alat Servis) yang sudah di-scrape dari toko 168part ke database.
              </p>
              <button
                type="button"
                onClick={async () => {
                  setIsImporting(true);
                  try {
                    const res = await fetch('/api/products/import-shopee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ replaceExisting: false })
                    });
                    const d = await res.json();
                    if (d.success) {
                      alert(`🎉 Berhasil memindahkan ${d.count || 'seluruh'} produk Shopee ke database!`);
                      setIsShopeeModalOpen(false);
                      loadData();
                    } else {
                      alert('Gagal: ' + d.message);
                    }
                  } catch (err: any) {
                    alert('Error: ' + err.message);
                  } finally {
                    setIsImporting(false);
                  }
                }}
                disabled={isImporting}
                className="w-full py-2 bg-[#be123c] hover:bg-[#9f1239] text-white font-bold text-xs rounded shadow transition disabled:opacity-50"
              >
                {isImporting ? 'Sedang Memindahkan Produk...' : '⚡ Impor & Masukkan ke Database Sekarang'}
              </button>
            </div>

            {/* Manual JSON / Items Input */}
            <form onSubmit={handleImportShopee} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Tempel Data JSON / Daftar Produk Shopee Tambahan:
                </label>
                <textarea
                  value={shopeeInput}
                  onChange={(e) => setShopeeInput(e.target.value)}
                  rows={4}
                  placeholder='Tempel JSON produk dari Shopee API, contoh: [{"name": "LCD iPhone 13 Pro Max", "price": 850000, "category": "LCD & Layar", "stock": 20}]'
                  className="w-full p-2 border border-slate-200 rounded text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsShopeeModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !shopeeInput.trim()}
                  className="px-4 py-1.5 bg-[#be123c] hover:bg-[#9f1239] text-white text-xs font-bold rounded shadow transition disabled:opacity-50"
                >
                  {isImporting ? 'Memproses...' : 'Simpan ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PROMO */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsPromoModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-5 z-10 animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 mb-3">
              {editingPromo ? 'Edit Voucher' : 'Buat Voucher & Kode Promo Baru'}
            </h3>
            <form onSubmit={handleSavePromo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Voucher / Promo (Huruf Kapital):</label>
                <input
                  type="text"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  required
                  disabled={Boolean(editingPromo)}
                  placeholder="Contoh: HEMAT168"
                  className="w-full p-2 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Judul Voucher:</label>
                <input
                  type="text"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  required
                  placeholder="Diskon Spesial Sparepart"
                  className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Diskon:</label>
                  <select
                    value={promoForm.discount_type || 'percent'}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Rupiah (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Diskon:</label>
                  <input
                    type="number"
                    value={promoForm.discount_value || ''}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_value: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#be123c] text-white text-xs font-bold rounded shadow hover:bg-[#9f1239]"
                >
                  Simpan Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

