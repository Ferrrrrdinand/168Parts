/**
 * ============================================================================
 * 168 PARTS SURABAYA - CONSIGNMENT & C2B2C QUALITY CHECK (QC) SYSTEM
 * Module: frontend/js/consignment.js
 * Fitur: Titip Jual Member, QC Toko Offline, Verifikasi Admin, & Antrean Transfer
 * ============================================================================
 */

const PasarinConsignment = {
  STORAGE_ITEMS: 'pasarin_consignment_items',
  STORAGE_PAYOUTS: 'pasarin_payout_queue',
  STORAGE_NOTIFS: 'pasarin_seller_notifications',

  // State sementara saat upload 4 foto sisi
  photoDrafts: {
    front: '',
    left: '',
    right: '',
    top: ''
  },

  init() {
    this.seedInitialData();
  },

  /**
   * Seed data contoh agar sistem langsung bisa diuji coba out-of-the-box
   */
  seedInitialData() {
    if (!localStorage.getItem(this.STORAGE_ITEMS)) {
      const mockItems = [
        {
          id: 'C2C-1001',
          name: 'LCD iPhone 12 Pro Max Original Copotan TrueTone On',
          category: 'LCD & Touchscreen',
          condition: 'Bekas Copotan Original (Normal 100%)',
          price: 1850000,
          stock: 1,
          description: 'LCD mulus 98%, TrueTone aktif, fungsi touchscreen responsif tanpa ghost touch. Baut dan bracket masih utuh siap pasang.',
          photos: {
            front: 'images/cat-lcd.svg',
            left: 'images/cat-lcd.svg',
            right: 'images/cat-lcd.svg',
            top: 'images/cat-lcd.svg'
          },
          seller: {
            name: 'Budi Santoso (Teknisi)',
            phone: '081234567890',
            email: 'budi.santoso@gmail.com',
            bankName: 'BCA',
            bankAccount: '1234567890',
            bankHolder: 'Budi Santoso'
          },
          status: 'approved', // 'pending_review', 'approved', 'rejected', 'in_qc', 'qc_passed', 'delivered', 'completed'
          isPublished: true,
          adminNotes: 'Disetujui oleh Admin. Fisik sangat mulus.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
          approvedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
        },
        {
          id: 'C2C-1002',
          name: 'Baterai Samsung S21 Ultra Original SEIN Health 94%',
          category: 'Baterai Handphone',
          condition: 'Bekas Copotan Original',
          price: 320000,
          stock: 2,
          description: 'Baterai copotan resmi SEIN, tidak kembung, battery health 94% awet seharian.',
          photos: {
            front: 'images/cat-battery.svg',
            left: 'images/cat-battery.svg',
            right: 'images/cat-battery.svg',
            top: 'images/cat-battery.svg'
          },
          seller: {
            name: 'Andi Jaya Servis',
            phone: '085678901234',
            email: 'andijaya@gmail.com',
            bankName: 'Mandiri',
            bankAccount: '9876543210123',
            bankHolder: 'Andi Jaya'
          },
          status: 'pending_review',
          isPublished: false,
          adminNotes: '',
          createdAt: new Date().toISOString()
        },
        {
          id: 'C2C-1003',
          name: 'Blower Uap Quick 857DW+ Original Elemen Baru',
          category: 'Alat Servis & Solder',
          condition: 'Bekas Normal Siap Pakai',
          price: 850000,
          stock: 1,
          description: 'Angin dan panas sangat stabil, baru ganti elemen pemanas original. Nozzle lengkap 3 pcs.',
          photos: {
            front: 'images/cat-tools.svg',
            left: 'images/cat-tools.svg',
            right: 'images/cat-tools.svg',
            top: 'images/cat-tools.svg'
          },
          seller: {
            name: 'Rudi Cell Malang',
            phone: '081987654321',
            email: 'rudicell@gmail.com',
            bankName: 'BRI',
            bankAccount: '00112233445566',
            bankHolder: 'Rudi Hartono'
          },
          status: 'in_qc',
          isPublished: false,
          adminNotes: 'Barang sudah diterima di toko offline 168 Parts Surabaya. Teknisi sedang memeriksa suhu panas dan aliran udara.',
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ];
      localStorage.setItem(this.STORAGE_ITEMS, JSON.stringify(mockItems));
    }

    if (!localStorage.getItem(this.STORAGE_PAYOUTS)) {
      const mockPayouts = [
        {
          id: 'PAY-8001',
          consignmentId: 'C2C-1001',
          itemName: 'LCD iPhone 12 Pro Max Original Copotan TrueTone On',
          sellerName: 'Budi Santoso (Teknisi)',
          sellerPhone: '081234567890',
          bankName: 'BCA',
          bankAccount: '1234567890',
          bankHolder: 'Budi Santoso',
          amount: 1850000,
          status: 'pending_transfer', // 'pending_transfer', 'transferred'
          completedAt: new Date().toISOString(),
          transferredAt: null,
          transferRef: ''
        }
      ];
      localStorage.setItem(this.STORAGE_PAYOUTS, JSON.stringify(mockPayouts));
    }

    if (!localStorage.getItem(this.STORAGE_NOTIFS)) {
      const mockNotifs = [
        {
          id: 'NOTIF-1',
          sellerPhone: '081234567890',
          title: '🎉 Barang Anda Resmi Tayang di 168 Parts!',
          message: 'Barang "LCD iPhone 12 Pro Max Original Copotan" telah disetujui admin dan kini dapat dibeli oleh calon pembeli di seluruh Indonesia.',
          type: 'approved',
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
          read: false
        }
      ];
      localStorage.setItem(this.STORAGE_NOTIFS, JSON.stringify(mockNotifs));
    }
  },

  getAllItems() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_ITEMS) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveAllItems(items) {
    localStorage.setItem(this.STORAGE_ITEMS, JSON.stringify(items));
  },

  getItemById(id) {
    return this.getAllItems().find(it => it.id === id) || null;
  },

  getPublishedProducts() {
    const items = this.getAllItems().filter(it => it.status === 'approved' && it.isPublished);
    return items.map(it => ({
      id: it.id,
      name: it.name,
      price: it.price,
      originalPrice: Math.round(it.price * 1.15),
      image: it.photos.front || 'images/cat-sparepart.svg',
      images: [it.photos.front, it.photos.left, it.photos.right, it.photos.top].filter(Boolean),
      category: it.category,
      categorySlug: 'titip-jual',
      rating: 5.0,
      sold: 1,
      ratingCount: 1,
      shopLocation: 'Surabaya (QC 168 Parts)',
      sellerName: it.seller.name,
      isConsignment: true,
      condition: it.condition,
      description: it.description + '\n\n[DIJAMIN 168 PARTS] Barang titip jual member resmi yang telah diverifikasi dan wajib melalui Quality Check (QC) fisik & fungsi oleh tim teknisi 168 Parts Surabaya sebelum dikirimkan ke pembeli.'
    }));
  },

  getCurrentUser() {
    if (window.PasarinAuth && window.PasarinAuth.getCurrentUser) {
      return window.PasarinAuth.getCurrentUser();
    }
    try {
      const userStr = localStorage.getItem('pasarin_current_user') || sessionStorage.getItem('pasarin_current_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Tambah pengajuan barang titip jual oleh member
   */
  createItem(data) {
    const items = this.getAllItems();
    const newId = 'C2C-' + (1000 + items.length + 1);

    const newItem = {
      id: newId,
      name: data.name,
      category: data.category,
      condition: data.condition,
      price: Number(data.price),
      stock: Number(data.stock || 1),
      description: data.description,
      photos: {
        front: data.photos.front || '',
        left: data.photos.left || '',
        right: data.photos.right || '',
        top: data.photos.top || ''
      },
      seller: {
        name: data.sellerName,
        phone: data.sellerPhone,
        email: data.sellerEmail || '',
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        bankHolder: data.bankHolder
      },
      status: 'pending_review',
      isPublished: false,
      adminNotes: '',
      createdAt: new Date().toISOString()
    };

    items.unshift(newItem);
    this.saveAllItems(items);

    // Kirim notifikasi pertama ke member
    this.addNotification({
      sellerPhone: data.sellerPhone,
      title: '📋 Pengajuan Jual Barang Berhasil Diterima',
      message: `Barang "${newItem.name}" berhasil diajukan. Saat ini sedang dalam tahap review oleh tim Admin 168 Parts. Kami akan memberitahu Anda segera saat barang disetujui!`,
      type: 'submitted'
    });

    return newItem;
  },

  /**
   * ADMIN: Setujui dan tampilkan barang di etalase web
   */
  approveItem(id, notes = '') {
    const items = this.getAllItems();
    const item = items.find(it => it.id === id);
    if (!item) return false;

    item.status = 'approved';
    item.isPublished = true;
    item.approvedAt = new Date().toISOString();
    if (notes) item.adminNotes = notes;
    this.saveAllItems(items);

    // Kirim notifikasi real-time ke member penjual
    this.addNotification({
      sellerPhone: item.seller.phone,
      title: '🎉 Hore! Barang Anda Kini Tayang di 168 Parts',
      message: `Selamat! Barang "${item.name}" telah disetujui admin dan resmi tayang di etalase web 168 Parts. Pembeli kini dapat melihat dan memesan barang Anda.`,
      type: 'approved'
    });

    // Refresh katalog produk jika PasarinApp aktif
    if (window.PasarinApp && typeof window.PasarinApp.loadProducts === 'function') {
      window.PasarinApp.loadProducts();
    }

    return true;
  },

  /**
   * ADMIN: Tolak barang dengan alasan
   */
  rejectItem(id, reason = 'Kondisi barang tidak memenuhi standar sparepart 168 Parts') {
    const items = this.getAllItems();
    const item = items.find(it => it.id === id);
    if (!item) return false;

    item.status = 'rejected';
    item.isPublished = false;
    item.adminNotes = reason;
    this.saveAllItems(items);

    this.addNotification({
      sellerPhone: item.seller.phone,
      title: '⚠️ Pengajuan Barang Belum Disetujui',
      message: `Mohon maaf, pengajuan barang "${item.name}" belum dapat ditampilkan di web. Catatan admin: ${reason}`,
      type: 'rejected'
    });

    return true;
  },

  /**
   * ADMIN: Update status penerimaan & QC di toko offline Surabaya
   */
  updateQCStatus(id, newStatus, notes = '') {
    const items = this.getAllItems();
    const item = items.find(it => it.id === id);
    if (!item) return false;

    item.status = newStatus;
    if (notes) item.adminNotes = notes;
    this.saveAllItems(items);

    let notifTitle = '';
    let notifMsg = '';

    if (newStatus === 'in_qc') {
      notifTitle = '🏢 Barang Diterima di Toko Offline 168 Parts (Sedang QC)';
      notifMsg = `Barang "${item.name}" telah tiba di toko offline 168 Parts Surabaya dan sedang dilakukan pengujian Quality Check (QC) fisik & fungsional oleh teknisi kami.`;
    } else if (newStatus === 'qc_passed') {
      notifTitle = '✅ Barang Lolos Quality Check (QC) 168 Parts!';
      notifMsg = `Luar biasa! Barang "${item.name}" lolos uji kelayakan QC teknisi 168 Parts. Pembeli telah menyelesaikan pembayaran dan barang segera dikemas & dikirimkan ke pembeli.`;
    } else if (newStatus === 'delivered') {
      notifTitle = '📦 Barang Telah Sampai di Pembeli!';
      notifMsg = `Barang "${item.name}" telah berhasil diterima dengan baik oleh pembeli. Transaksi kini masuk ke Antrean Pembayaran Penjual (Payout) untuk ditransfer ke rekening Anda.`;
      // Tambahkan ke antrean transfer
      this.addToPayoutQueue(item);
    }

    if (notifTitle) {
      this.addNotification({
        sellerPhone: item.seller.phone,
        title: notifTitle,
        message: notifMsg,
        type: newStatus
      });
    }

    return true;
  },

  /**
   * Tambah transaksi yang selesai ke antrean payout
   */
  addToPayoutQueue(item) {
    try {
      const payouts = JSON.parse(localStorage.getItem(this.STORAGE_PAYOUTS) || '[]');
      const exists = payouts.some(p => p.consignmentId === item.id);
      if (!exists) {
        payouts.unshift({
          id: 'PAY-' + (8000 + payouts.length + 1),
          consignmentId: item.id,
          itemName: item.name,
          sellerName: item.seller.name,
          sellerPhone: item.seller.phone,
          bankName: item.seller.bankName,
          bankAccount: item.seller.bankAccount,
          bankHolder: item.seller.bankHolder,
          amount: item.price,
          status: 'pending_transfer',
          completedAt: new Date().toISOString(),
          transferredAt: null,
          transferRef: ''
        });
        localStorage.setItem(this.STORAGE_PAYOUTS, JSON.stringify(payouts));
      }
    } catch (e) {
      console.error('Error adding to payout queue:', e);
    }
  },

  getPayoutQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_PAYOUTS) || '[]');
    } catch (e) {
      return [];
    }
  },

  /**
   * ADMIN: Konfirmasi bahwa dana sudah ditransfer manual ke rekening penjual
   */
  processPayout(payoutId, refNo = '', notes = '') {
    try {
      const payouts = this.getPayoutQueue();
      const payout = payouts.find(p => p.id === payoutId);
      if (!payout) return false;

      payout.status = 'transferred';
      payout.transferredAt = new Date().toISOString();
      payout.transferRef = refNo || ('TRF-' + Math.floor(100000 + Math.random() * 900000));
      payout.adminNotes = notes;
      localStorage.setItem(this.STORAGE_PAYOUTS, JSON.stringify(payouts));

      // Update juga status item barangnya
      const items = this.getAllItems();
      const it = items.find(i => i.id === payout.consignmentId);
      if (it) {
        it.status = 'completed';
        it.payoutCompletedAt = payout.transferredAt;
        this.saveAllItems(items);
      }

      // Kirim notifikasi pencairan dana ke penjual
      const rupiah = 'Rp' + Number(payout.amount).toLocaleString('id-ID');
      this.addNotification({
        sellerPhone: payout.sellerPhone,
        title: '💸 Dana Penjualan Berhasil Ditransfer!',
        message: `Pembayaran sebesar ${rupiah} untuk barang "${payout.itemName}" telah ditransfer manual ke rekening ${payout.bankName} (${payout.bankAccount} a/n ${payout.bankHolder}). No. Referensi Transfer: ${payout.transferRef}. Terima kasih telah menjual barang di 168 Parts!`,
        type: 'transferred'
      });

      return true;
    } catch (e) {
      console.error('Error processing payout:', e);
      return false;
    }
  },

  // -------------------------------------------------------------
  // NOTIFIKASI MEMBER PENJUAL
  // -------------------------------------------------------------
  addNotification(notif) {
    try {
      const notifs = JSON.parse(localStorage.getItem(this.STORAGE_NOTIFS) || '[]');
      const newNotif = {
        id: 'NOTIF-' + Date.now(),
        sellerPhone: notif.sellerPhone,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        createdAt: new Date().toISOString(),
        read: false
      };
      notifs.unshift(newNotif);
      localStorage.setItem(this.STORAGE_NOTIFS, JSON.stringify(notifs));
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  },

  getMyNotifications(phone = '') {
    try {
      const notifs = JSON.parse(localStorage.getItem(this.STORAGE_NOTIFS) || '[]');
      if (!phone) return notifs;
      return notifs.filter(n => !n.sellerPhone || n.sellerPhone === phone);
    } catch (e) {
      return [];
    }
  },

  // -------------------------------------------------------------
  // RENDER LANDING PAGE & FORMULIR JUAL BARANG MEMBER
  // -------------------------------------------------------------
  renderSellPage() {
    const user = this.getCurrentUser();
    const container = document.getElementById('view-sell-item');
    if (!container) return;

    const myItems = this.getAllItems().filter(it => user && it.seller.phone === user.phone);
    const myNotifs = this.getMyNotifications(user ? user.phone : '');
    const unreadNotifsCount = myNotifs.filter(n => !n.read).length;

    container.innerHTML = `
      <div class="c2c-landing-wrapper" style="background:#f8fafc; min-height:85vh; padding:24px 0 80px;">
        <div class="w" style="max-width:980px; margin:0 auto; padding:0 14px;">
          
          <!-- Breadcrumb -->
          <nav style="display:flex; align-items:center; gap:8px; font-size:13px; color:#64748b; margin-bottom:16px;">
            <a href="#/" style="color:#64748b; text-decoration:none;">Beranda</a>
            <span>&rsaquo;</span>
            <span style="color:#be123c; font-weight:700;">Jual Barang & Sparepart (Titip Jual QC)</span>
          </nav>

          <!-- Hero Banner -->
          <div class="c2c-hero-banner" style="background:linear-gradient(135deg, #881337 0%, #be123c 60%, #e11d48 100%); color:#ffffff; border-radius:16px; padding:28px 32px; box-shadow:0 10px 30px rgba(190,18,60,0.25); margin-bottom:24px; position:relative; overflow:hidden;">
            <div style="position:relative; z-index:2;">
              <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.18); backdrop-filter:blur(4px); padding:4px 12px; border-radius:20px; font-size:12px; font-weight:800; margin-bottom:12px;">
                <span>🛡️</span>
                <span>Program Titip Jual Resmi 168 Parts Surabaya</span>
              </div>
              <h1 style="font-size:24px; font-weight:900; margin:0 0 8px 0; color:#ffffff; letter-spacing:-0.3px;">
                Jual Sparepart & Alat Servis Anda Bersama 168 Parts
              </h1>
              <p style="font-size:13.5px; margin:0 0 20px 0; opacity:0.95; line-height:1.6; max-width:760px;">
                Punya sparepart cadangan, copotan original, atau alat servis yang tidak terpakai? Jual di 168 Parts! Barang Anda akan dicek oleh tim teknisi kami (Quality Check) di toko offline Surabaya, tampil di etalase nasional, dan uang langsung ditransfer ke rekening Anda setelah barang tiba di pembeli.
              </p>

              <!-- Step Pills -->
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-top:16px;">
                <div style="background:rgba(255,255,255,0.14); padding:10px 12px; border-radius:10px; font-size:12px;">
                  <b style="color:#fde047;">1. Input & 4 Foto</b>
                  <div style="opacity:0.85; font-size:11px;">Upload foto 4 sisi wajib</div>
                </div>
                <div style="background:rgba(255,255,255,0.14); padding:10px 12px; border-radius:10px; font-size:12px;">
                  <b style="color:#fde047;">2. Review Admin</b>
                  <div style="opacity:0.85; font-size:11px;">Admin setujui & tayangkan</div>
                </div>
                <div style="background:rgba(255,255,255,0.14); padding:10px 12px; border-radius:10px; font-size:12px;">
                  <b style="color:#fde047;">3. QC Toko Surabaya</b>
                  <div style="opacity:0.85; font-size:11px;">Ada pembeli &rarr; cek fisik/fungsi</div>
                </div>
                <div style="background:rgba(255,255,255,0.14); padding:10px 12px; border-radius:10px; font-size:12px;">
                  <b style="color:#fde047;">4. Dana Cair</b>
                  <div style="opacity:0.85; font-size:11px;">Transfer manual ke rekening</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="c2c-tab-nav" style="display:flex; gap:10px; border-bottom:2px solid #e2e8f0; margin-bottom:22px;">
            <button type="button" class="c2c-tab-btn active" id="btn-tab-form" onclick="PasarinConsignment.switchTab('form')" style="padding:10px 18px; border:none; background:none; font-weight:800; font-size:14px; color:#be123c; border-bottom:3px solid #be123c; cursor:pointer; display:flex; align-items:center; gap:8px;">
              <span>📝 Formulir Jual Barang</span>
            </button>
            <button type="button" class="c2c-tab-btn" id="btn-tab-myitems" onclick="PasarinConsignment.switchTab('myitems')" style="padding:10px 18px; border:none; background:none; font-weight:700; font-size:14px; color:#64748b; cursor:pointer; display:flex; align-items:center; gap:8px;">
              <span>📦 Barang Jualan Saya</span>
              <span style="background:#fee2e2; color:#be123c; font-size:11px; padding:2px 7px; border-radius:10px; font-weight:800;">${myItems.length}</span>
            </button>
            <button type="button" class="c2c-tab-btn" id="btn-tab-notifs" onclick="PasarinConsignment.switchTab('notifs')" style="padding:10px 18px; border:none; background:none; font-weight:700; font-size:14px; color:#64748b; cursor:pointer; display:flex; align-items:center; gap:8px;">
              <span>🔔 Pemberitahuan Penjual</span>
              ${unreadNotifsCount > 0 ? `<span style="background:#be123c; color:#fff; font-size:11px; padding:2px 7px; border-radius:10px; font-weight:800;">${unreadNotifsCount}</span>` : ''}
            </button>
          </div>

          <!-- TAB CONTENT 1: FORMULIR JUAL -->
          <div id="c2c-pane-form" class="c2c-pane" style="display:block;">
            <form id="form-sell-item" onsubmit="PasarinConsignment.handleSubmit(event)" style="background:#ffffff; border-radius:14px; padding:26px 30px; box-shadow:0 4px 18px rgba(0,0,0,0.06); border:1px solid #f1f5f9;">
              
              <!-- SECTION A: UPLOAD 4 FOTO SISI -->
              <div style="margin-bottom:26px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                  <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0; display:flex; align-items:center; gap:8px;">
                    <span style="background:#fee2e2; color:#be123c; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:900;">1</span>
                    Upload Foto Barang dari 4 Sisi Wajib
                  </h3>
                  <span style="font-size:12px; color:#be123c; font-weight:700;">*Wajib 4 Sisi Lengkap</span>
                </div>
                <p style="font-size:12.5px; color:#64748b; margin:0 0 16px 0;">
                  Untuk memastikan kejujuran kondisi fisik sebelum proses Quality Check (QC), wajib menyertakan foto jelas dari 4 sudut yang berbeda.
                </p>

                <!-- 4 Photo Slots Grid -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px;">
                  
                  <!-- Slot 1: Tampak Depan -->
                  <div class="photo-upload-slot" id="slot-front" style="border:2px dashed #cbd5e1; border-radius:12px; padding:12px; text-align:center; background:#f8fafc; position:relative; min-height:165px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <input type="file" id="input-photo-front" accept="image/*" onchange="PasarinConsignment.handlePhotoUpload(this, 'front')" style="display:none;">
                    <div id="preview-front" style="display:none; width:100%; height:110px; margin-bottom:8px; border-radius:8px; overflow:hidden;">
                      <img src="" alt="Tampak Depan" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div id="placeholder-front">
                      <div style="font-size:30px; margin-bottom:4px;">📸</div>
                      <b style="font-size:12.5px; color:#1e293b; display:block;">1. Tampak Depan</b>
                      <span style="font-size:11px; color:#64748b; display:block; margin-top:2px;">Layar / Sisi Muka</span>
                    </div>
                    <button type="button" onclick="document.getElementById('input-photo-front').click()" style="margin-top:8px; background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">
                      Pilih Foto
                    </button>
                  </div>

                  <!-- Slot 2: Tampak Samping Kiri -->
                  <div class="photo-upload-slot" id="slot-left" style="border:2px dashed #cbd5e1; border-radius:12px; padding:12px; text-align:center; background:#f8fafc; position:relative; min-height:165px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <input type="file" id="input-photo-left" accept="image/*" onchange="PasarinConsignment.handlePhotoUpload(this, 'left')" style="display:none;">
                    <div id="preview-left" style="display:none; width:100%; height:110px; margin-bottom:8px; border-radius:8px; overflow:hidden;">
                      <img src="" alt="Tampak Samping Kiri" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div id="placeholder-left">
                      <div style="font-size:30px; margin-bottom:4px;">📐</div>
                      <b style="font-size:12.5px; color:#1e293b; display:block;">2. Samping Kiri</b>
                      <span style="font-size:11px; color:#64748b; display:block; margin-top:2px;">Fleksibel / Bezel Kiri</span>
                    </div>
                    <button type="button" onclick="document.getElementById('input-photo-left').click()" style="margin-top:8px; background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">
                      Pilih Foto
                    </button>
                  </div>

                  <!-- Slot 3: Tampak Samping Kanan -->
                  <div class="photo-upload-slot" id="slot-right" style="border:2px dashed #cbd5e1; border-radius:12px; padding:12px; text-align:center; background:#f8fafc; position:relative; min-height:165px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <input type="file" id="input-photo-right" accept="image/*" onchange="PasarinConsignment.handlePhotoUpload(this, 'right')" style="display:none;">
                    <div id="preview-right" style="display:none; width:100%; height:110px; margin-bottom:8px; border-radius:8px; overflow:hidden;">
                      <img src="" alt="Tampak Samping Kanan" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div id="placeholder-right">
                      <div style="font-size:30px; margin-bottom:4px;">📐</div>
                      <b style="font-size:12.5px; color:#1e293b; display:block;">3. Samping Kanan</b>
                      <span style="font-size:11px; color:#64748b; display:block; margin-top:2px;">Konektor / Bezel Kanan</span>
                    </div>
                    <button type="button" onclick="document.getElementById('input-photo-right').click()" style="margin-top:8px; background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">
                      Pilih Foto
                    </button>
                  </div>

                  <!-- Slot 4: Tampak Atas -->
                  <div class="photo-upload-slot" id="slot-top" style="border:2px dashed #cbd5e1; border-radius:12px; padding:12px; text-align:center; background:#f8fafc; position:relative; min-height:165px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                    <input type="file" id="input-photo-top" accept="image/*" onchange="PasarinConsignment.handlePhotoUpload(this, 'top')" style="display:none;">
                    <div id="preview-top" style="display:none; width:100%; height:110px; margin-bottom:8px; border-radius:8px; overflow:hidden;">
                      <img src="" alt="Tampak Atas" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div id="placeholder-top">
                      <div style="font-size:30px; margin-bottom:4px;">🔍</div>
                      <b style="font-size:12.5px; color:#1e293b; display:block;">4. Tampak Atas</b>
                      <span style="font-size:11px; color:#64748b; display:block; margin-top:2px;">Bagian Atas / Soket IC</span>
                    </div>
                    <button type="button" onclick="document.getElementById('input-photo-top').click()" style="margin-top:8px; background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; padding:5px 12px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer;">
                      Pilih Foto
                    </button>
                  </div>

                </div>
              </div>

              <!-- SECTION B: DETAIL BARANG -->
              <div style="margin-bottom:26px; border-top:1px solid #f1f5f9; padding-top:20px;">
                <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
                  <span style="background:#fee2e2; color:#be123c; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:900;">2</span>
                  Informasi & Spesifikasi Barang
                </h3>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:14px;">
                  <div style="grid-column:1 / -1;">
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Nama Barang / Sparepart <span style="color:#dc2626;">*</span></label>
                    <input type="text" id="sell-name" required placeholder="Contoh: LCD iPhone 13 Pro Max Original Copotan TrueTone On" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; box-sizing:border-box;">
                  </div>

                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Kategori Sparepart <span style="color:#dc2626;">*</span></label>
                    <select id="sell-category" required style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; background:#ffffff; box-sizing:border-box;">
                      <option value="LCD & Touchscreen">LCD & Touchscreen</option>
                      <option value="Baterai Handphone">Baterai Handphone</option>
                      <option value="Fleksibel & Konektor Charger">Fleksibel & Konektor Charger</option>
                      <option value="Kamera Depan & Belakang">Kamera Depan & Belakang</option>
                      <option value="Mesin & IC Handphone">Mesin & IC Handphone</option>
                      <option value="Casing, Backdoor & Tulang">Casing, Backdoor & Tulang</option>
                      <option value="Alat Servis & Solder">Alat Servis, Blower & Solder</option>
                      <option value="Aksesoris & Lainnya">Aksesoris & Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Kondisi Barang <span style="color:#dc2626;">*</span></label>
                    <select id="sell-condition" required style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; background:#ffffff; box-sizing:border-box;">
                      <option value="Bekas Copotan Original (Normal 100%)">Bekas Copotan Original (Normal 100%)</option>
                      <option value="Baru Grade Original (Belum Pernah Dipakai)">Baru Grade Original (Belum Pernah Dipakai)</option>
                      <option value="Baru OEM / Aftermarket Berkualitas">Baru OEM / Aftermarket Berkualitas</option>
                      <option value="Bekas Normal Ada Minus Pemakaian">Bekas Normal Ada Minus Pemakaian</option>
                      <option value="Bahan Kanibal / Hanya untuk Teknisi">Bahan Kanibal / Khusus Teknisi</option>
                    </select>
                  </div>

                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Jumlah Barang (Stok) <span style="color:#dc2626;">*</span></label>
                    <input type="number" id="sell-stock" required min="1" value="1" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; box-sizing:border-box;">
                  </div>

                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Harga Jual yang Diinginkan (Rp) <span style="color:#dc2626;">*</span></label>
                    <input type="number" id="sell-price" required min="5000" step="1000" placeholder="Contoh: 1500000" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; font-weight:700; color:#be123c; box-sizing:border-box;">
                  </div>
                </div>

                <div>
                  <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Deskripsi Barang & Kelengkapan <span style="color:#dc2626;">*</span></label>
                  <textarea id="sell-desc" rows="4" required placeholder="Jelaskan kondisi fisik secara detail, kelengkapan baut/bracket/kamera, fungsi yang sudah dites, serta garansi pribadi jika ada." style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; box-sizing:border-box; resize:vertical;"></textarea>
                </div>
              </div>

              <!-- SECTION C: REKENING & KONTAK PENJUAL -->
              <div style="margin-bottom:26px; border-top:1px solid #f1f5f9; padding-top:20px;">
                <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 6px 0; display:flex; align-items:center; gap:8px;">
                  <span style="background:#fee2e2; color:#be123c; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:900;">3</span>
                  Rekening Pencairan Dana & Kontak Penjual
                </h3>
                <p style="font-size:12px; color:#64748b; margin:0 0 14px 0;">
                  Uang hasil penjualan akan ditransfer manual oleh 168 Parts ke rekening ini setelah barang diterima pembeli.
                </p>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Nama Bank / E-Wallet <span style="color:#dc2626;">*</span></label>
                    <select id="sell-bank" required style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; background:#ffffff; box-sizing:border-box;">
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                      <option value="SeaBank">SeaBank</option>
                      <option value="Jago">Bank Jago</option>
                      <option value="Dana">DANA</option>
                      <option value="GoPay">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="ShopeePay">ShopeePay</option>
                    </select>
                  </div>

                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Nomor Rekening / No. E-Wallet <span style="color:#dc2626;">*</span></label>
                    <input type="text" id="sell-bank-account" required placeholder="Contoh: 1234567890" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; box-sizing:border-box;">
                  </div>

                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">Nama Pemilik Rekening <span style="color:#dc2626;">*</span></label>
                    <input type="text" id="sell-bank-holder" required value="${user ? user.name : ''}" placeholder="Harus sesuai buku tabungan" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; box-sizing:border-box;">
                  </div>

                  <div>
                    <label style="display:block; font-size:13px; font-weight:700; color:#1e293b; margin-bottom:6px;">No. WhatsApp Aktif Penjual <span style="color:#dc2626;">*</span></label>
                    <input type="tel" id="sell-phone" required value="${user ? user.phone : ''}" placeholder="Contoh: 081234567890" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px; outline:none; box-sizing:border-box;">
                  </div>
                </div>
              </div>

              <!-- Disclaimer & Submit -->
              <div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:10px; padding:14px 18px; margin-bottom:20px; font-size:12.5px; color:#92400e; line-height:1.5;">
                <b style="display:block; margin-bottom:4px;">📌 Ketentuan Quality Check (QC) 168 Parts:</b>
                Saat ada pembeli yang melakukan checkout, Anda akan dihubungi untuk mengirimkan fisik barang ke Toko Offline 168 Parts Surabaya. Teknisi kami akan mencocokkan fisik barang dengan 4 foto yang Anda lampirkan serta mengetes fungsinya sebelum dikirimkan ke pembeli.
              </div>

              <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button type="button" onclick="window.location.hash='#/'" style="background:#f1f5f9; color:#475569; border:none; padding:12px 22px; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer;">
                  Batal
                </button>
                <button type="submit" id="btn-submit-sell" style="background:linear-gradient(135deg, #be123c, #9f1239); color:#ffffff; border:none; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(190,18,60,0.3); display:flex; align-items:center; gap:8px;">
                  <span>🚀 Ajukan Penjualan Sekarang</span>
                </button>
              </div>

            </form>
          </div>

          <!-- TAB CONTENT 2: BARANG JUALAN SAYA -->
          <div id="c2c-pane-myitems" class="c2c-pane" style="display:none;">
            ${this.renderMyItemsHtml(myItems)}
          </div>

          <!-- TAB CONTENT 3: NOTIFIKASI SAYA -->
          <div id="c2c-pane-notifs" class="c2c-pane" style="display:none;">
            ${this.renderMyNotifsHtml(myNotifs)}
          </div>

        </div>
      </div>
    `;
  },

  renderMyItemsHtml(items) {
    if (!items || items.length === 0) {
      return `
        <div style="background:#ffffff; border-radius:14px; padding:48px 20px; text-align:center; border:1px solid #f1f5f9; box-shadow:0 4px 18px rgba(0,0,0,0.04);">
          <div style="font-size:48px; margin-bottom:12px;">📦</div>
          <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0 0 6px 0;">Belum Ada Barang yang Diajukan</h3>
          <p style="font-size:13px; color:#64748b; margin:0 0 18px 0;">Anda belum pernah mengajukan barang untuk dijual di 168 Parts.</p>
          <button type="button" onclick="PasarinConsignment.switchTab('form')" style="background:#be123c; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer;">
            + Jual Barang Sekarang
          </button>
        </div>
      `;
    }

    const badgeMap = {
      pending_review: { text: '⏳ Menunggu Review Admin', bg: '#fef3c7', col: '#92400e' },
      approved: { text: '🟢 Tayang di Web (Aktif)', bg: '#dcfce7', col: '#166534' },
      rejected: { text: '🔴 Pengajuan Ditolak', bg: '#fee2e2', col: '#991b1b' },
      in_qc: { text: '🔍 Sedang Diperiksa Teknisi (QC)', bg: '#e0f2fe', col: '#0369a1' },
      qc_passed: { text: '✅ Lolos QC & Siap Kirim', bg: '#dcfce7', col: '#15803d' },
      delivered: { text: '📦 Diterima Pembeli (Antre Transfer)', bg: '#fef08a', col: '#854d0e' },
      completed: { text: '💸 Uang Sudah Ditransfer Selesai', bg: '#f3e8ff', col: '#6b21a8' }
    };

    return `
      <div style="display:flex; flex-direction:column; gap:14px;">
        ${items.map(it => {
          const badge = badgeMap[it.status] || { text: it.status, bg: '#f1f5f9', col: '#475569' };
          const rupiah = 'Rp' + Number(it.price).toLocaleString('id-ID');
          const thumb = it.photos.front || 'images/cat-sparepart.svg';

          return `
            <div style="background:#ffffff; border-radius:12px; padding:18px 22px; border:1px solid #e2e8f0; box-shadow:0 2px 10px rgba(0,0,0,0.03); display:flex; gap:16px; align-items:flex-start;">
              <img src="${thumb}" alt="${it.name}" style="width:84px; height:84px; object-fit:cover; border-radius:8px; border:1px solid #f1f5f9;">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px;">
                  <span style="font-size:11px; background:${badge.bg}; color:${badge.col}; padding:3px 10px; border-radius:12px; font-weight:800;">
                    ${badge.text}
                  </span>
                  <span style="font-size:12px; color:#94a3b8;">${new Date(it.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <h4 style="font-size:15px; font-weight:800; color:#0f172a; margin:0 0 6px 0;">${it.name}</h4>
                <div style="display:flex; gap:14px; font-size:12.5px; color:#64748b; margin-bottom:8px;">
                  <span>Kategori: <b>${it.category}</b></span>
                  <span>Kondisi: <b>${it.condition}</b></span>
                  <span>Harga: <b style="color:#be123c;">${rupiah}</b></span>
                </div>
                ${it.adminNotes ? `<div style="background:#f8fafc; border-left:3px solid #be123c; padding:6px 12px; border-radius:4px; font-size:12px; color:#475569;"><b>Catatan Admin:</b> ${it.adminNotes}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderMyNotifsHtml(notifs) {
    if (!notifs || notifs.length === 0) {
      return `
        <div style="background:#ffffff; border-radius:14px; padding:48px 20px; text-align:center; border:1px solid #f1f5f9;">
          <div style="font-size:42px; margin-bottom:10px;">🔔</div>
          <h3 style="font-size:16px; font-weight:800; color:#0f172a; margin:0 0 4px 0;">Belum Ada Pemberitahuan</h3>
          <p style="font-size:13px; color:#64748b; margin:0;">Status update barang jualan Anda akan muncul di sini.</p>
        </div>
      `;
    }

    return `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${notifs.map(n => `
          <div style="background:#ffffff; border-radius:12px; padding:16px 20px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <h4 style="font-size:14px; font-weight:800; color:#0f172a; margin:0;">${n.title}</h4>
              <span style="font-size:11.5px; color:#94a3b8;">${new Date(n.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
            <p style="font-size:13px; color:#475569; margin:0; line-height:1.5;">${n.message}</p>
          </div>
        `).join('')}
      </div>
    `;
  },

  switchTab(tab) {
    const paneForm = document.getElementById('c2c-pane-form');
    const paneMyItems = document.getElementById('c2c-pane-myitems');
    const paneNotifs = document.getElementById('c2c-pane-notifs');

    const btnForm = document.getElementById('btn-tab-form');
    const btnMyItems = document.getElementById('btn-tab-myitems');
    const btnNotifs = document.getElementById('btn-tab-notifs');

    if (!paneForm || !paneMyItems || !paneNotifs) return;

    // Reset styles
    [btnForm, btnMyItems, btnNotifs].forEach(b => {
      if (b) {
        b.style.color = '#64748b';
        b.style.borderBottom = 'none';
      }
    });

    paneForm.style.display = 'none';
    paneMyItems.style.display = 'none';
    paneNotifs.style.display = 'none';

    if (tab === 'form') {
      paneForm.style.display = 'block';
      btnForm.style.color = '#be123c';
      btnForm.style.borderBottom = '3px solid #be123c';
    } else if (tab === 'myitems') {
      paneMyItems.style.display = 'block';
      btnMyItems.style.color = '#be123c';
      btnMyItems.style.borderBottom = '3px solid #be123c';
    } else if (tab === 'notifs') {
      paneNotifs.style.display = 'block';
      btnNotifs.style.color = '#be123c';
      btnNotifs.style.borderBottom = '3px solid #be123c';
    }
  },

  handlePhotoUpload(input, side) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.photoDrafts[side] = dataUrl;

      const previewContainer = document.getElementById(`preview-${side}`);
      const placeholder = document.getElementById(`placeholder-${side}`);
      const slot = document.getElementById(`slot-${side}`);

      if (previewContainer) {
        const img = previewContainer.querySelector('img');
        if (img) img.src = dataUrl;
        previewContainer.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
      if (slot) {
        slot.style.borderColor = '#16a34a';
        slot.style.background = '#f0fdf4';
      }
    };

    reader.readAsDataURL(file);
  },

  handleSubmit(e) {
    e.preventDefault();

    const user = this.getCurrentUser();
    if (!user) {
      if (window.PasarinAuth) {
        window.PasarinAuth.openAuthModal('Silakan masuk atau daftar sebagai member 168 Parts terlebih dahulu untuk menjual barang.', () => {
          this.renderSellPage();
        });
      } else {
        alert('Silakan login terlebih dahulu.');
      }
      return;
    }

    // Validasi 4 foto sisi
    if (!this.photoDrafts.front || !this.photoDrafts.left || !this.photoDrafts.right || !this.photoDrafts.top) {
      // Gunakan default mock SVG jika user hanya ingin tes cepat
      const confirmUseFallback = confirm('Pemberitahuan Foto: Anda belum mengunggah lengkap 4 sisi foto (Depan, Kiri, Kanan, Atas).\n\nApakah Anda ingin sistem menggunakan template visual 4 sisi otomatis untuk demonstrasi?');
      if (confirmUseFallback) {
        if (!this.photoDrafts.front) this.photoDrafts.front = 'images/cat-lcd.svg';
        if (!this.photoDrafts.left) this.photoDrafts.left = 'images/cat-sparepart.svg';
        if (!this.photoDrafts.right) this.photoDrafts.right = 'images/cat-sparepart.svg';
        if (!this.photoDrafts.top) this.photoDrafts.top = 'images/cat-tools.svg';
      } else {
        return;
      }
    }

    const name = document.getElementById('sell-name').value.trim();
    const category = document.getElementById('sell-category').value;
    const condition = document.getElementById('sell-condition').value;
    const stock = document.getElementById('sell-stock').value;
    const price = document.getElementById('sell-price').value;
    const description = document.getElementById('sell-desc').value.trim();

    const bankName = document.getElementById('sell-bank').value;
    const bankAccount = document.getElementById('sell-bank-account').value.trim();
    const bankHolder = document.getElementById('sell-bank-holder').value.trim();
    const sellerPhone = document.getElementById('sell-phone').value.trim();

    const created = this.createItem({
      name,
      category,
      condition,
      stock,
      price,
      description,
      photos: { ...this.photoDrafts },
      sellerName: user.name || bankHolder,
      sellerPhone: sellerPhone || user.phone,
      sellerEmail: user.email || '',
      bankName,
      bankAccount,
      bankHolder
    });

    // Reset drafts
    this.photoDrafts = { front: '', left: '', right: '', top: '' };

    alert(`✅ Berhasil! Pengajuan barang "${created.name}" telah dikirim ke Admin 168 Parts.\n\nAdmin akan memeriksa kelengkapan data dan foto. Setelah disetujui, barang Anda akan langsung tampil di etalase web!`);

    // Alihkan ke tab "Barang Jualan Saya"
    this.renderSellPage();
    setTimeout(() => this.switchTab('myitems'), 100);
  }
};

// Expose globally
window.PasarinConsignment = PasarinConsignment;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    PasarinConsignment.init();
  });
}
