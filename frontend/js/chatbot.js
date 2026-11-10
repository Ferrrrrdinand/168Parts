/* =========================================================
   168 Parts Surabaya - Intelligent AI Customer Care Chatbot
   Automated 24/7 Smart Assistant for Spareparts, Orders,
   Promos, Product Consultation, and Store Information
   ========================================================= */

const PasarinChatBot = {
  isOpen: false,
  isTyping: false,
  messages: [],
  unreadCount: 0,
  STORAGE_KEY: 'pasarin_chatbot_history_v1',

  init() {
    this.createWidgetDOM();
    this.loadHistory();
    this.bindEvents();
    this.updateUnreadBadge();

    // Pastikan tombol dock chat membuka chatbot
    const dockChatBtn = document.getElementById('btn-dock-chat');
    if (dockChatBtn) {
      dockChatBtn.onclick = (e) => {
        e.preventDefault();
        this.toggleChat();
      };
    }
  },

  createWidgetDOM() {
    if (document.getElementById('chatbot-widget-container')) return;

    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    container.className = 'chatbot-widget-container';
    container.innerHTML = `
      <!-- Chatbot Floating Window -->
      <div class="chatbot-window" id="chatbot-window" aria-hidden="true">
        
        <!-- Header -->
        <div class="chatbot-header">
          <div class="chatbot-header-left">
            <div class="chatbot-avatar-wrap">
              <div class="chatbot-avatar">168</div>
              <span class="chatbot-online-dot" title="Online Aktif"></span>
            </div>
            <div class="chatbot-header-info">
              <div class="chatbot-title">
                <span>Customer Care 168</span>
                <span class="chatbot-bot-badge">AI BOT</span>
              </div>
              <div class="chatbot-subtitle">⚡ Balas Otomatis Seketika • 24/7</div>
            </div>
          </div>
          <div class="chatbot-header-actions">
            <button type="button" class="chatbot-header-btn" onclick="PasarinChatBot.clearHistory()" title="Mulai Ulang Percakapan">
              🔄
            </button>
            <button type="button" class="chatbot-header-btn" onclick="PasarinChatBot.closeChat()" title="Tutup Chat" aria-label="Tutup Chat">
              ✕
            </button>
          </div>
        </div>

        <!-- Quick Info Notice Banner -->
        <div class="chatbot-notice">
          <span>💡 <b>Pusat Bantuan 168 Parts:</b> Tanya stok LCD, baterai, lacak pesanan, atau klaim voucher langsung di sini!</span>
        </div>

        <!-- Message List Body -->
        <div class="chatbot-body" id="chatbot-messages">
          <!-- Messages will be rendered here -->
        </div>

        <!-- Typing Indicator Bubble -->
        <div class="chatbot-typing" id="chatbot-typing" style="display:none;">
          <div class="typing-avatar">168</div>
          <div class="typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-label">168 Care sedang mengetik...</span>
          </div>
        </div>

        <!-- Quick Suggestion Pills -->
        <div class="chatbot-quick-pills" id="chatbot-quick-pills">
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Cek Status Pesanan')">📦 Status Pesanan</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Tanya Stok LCD & Baterai')">🔍 Stok LCD & Baterai</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Voucher & Promo Diskon')">🎟️ Promo & Voucher</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Lokasi Toko & Jam Buka')">📍 Lokasi & Jam Buka</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Syarat Garansi & Retur Barang')">🔄 Garansi & Retur</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Hubungi Admin WhatsApp')">👨‍🔧 Kontak WhatsApp</button>
        </div>

        <!-- Footer Input Bar -->
        <form class="chatbot-footer" id="chatbot-form" onsubmit="PasarinChatBot.handleSend(event)">
          <div class="chatbot-input-wrap">
            <input 
              type="text" 
              id="chatbot-input" 
              class="chatbot-input" 
              placeholder="Ketik pertanyaan atau nomor pesanan Anda..." 
              autocomplete="off"
            >
          </div>
          <button type="submit" class="chatbot-send-btn" id="btn-chatbot-send" aria-label="Kirim Pesan" title="Kirim Pesan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>

      </div>
    `;

    document.body.appendChild(container);
  },

  loadHistory() {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.messages = JSON.parse(stored);
      }
    } catch (e) {
      this.messages = [];
    }

    if (!this.messages || this.messages.length === 0) {
      this.initWelcomeMessage();
    } else {
      this.renderMessages();
    }
  },

  saveHistory() {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
    } catch (e) {
      // Storage quota or private mode
    }
  },

  clearHistory() {
    this.messages = [];
    sessionStorage.removeItem(this.STORAGE_KEY);
    this.initWelcomeMessage();
    if (window.showToast) window.showToast('Percakapan obrolan telah di-reset.', 'info');
  },

  initWelcomeMessage() {
    const user = window.PasarinAuth?.currentUser;
    const greetingName = user ? user.name.split(' ')[0] : 'Kak';

    const welcomeText = `Halo ${greetingName}! 👋 Selamat datang di layanan Customer Care 168 Parts Surabaya.\n\nSaya adalah Asisten Virtual cerdas toko kami yang siap membantu Anda 24/7! Ada yang bisa kami bantu seputar sparepart HP, cek stok, status pesanan, klaim promo, atau informasi servis?`;

    this.messages = [
      {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        quickPills: [
          'Cek Status Pesanan',
          'Tanya Stok LCD & Baterai',
          'Voucher & Promo Diskon',
          'Lokasi Toko & Jam Buka',
          'Syarat Garansi & Retur Barang'
        ]
      }
    ];

    this.saveHistory();
    this.renderMessages();
  },

  bindEvents() {
    const input = document.getElementById('chatbot-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend(e);
        }
      });
    }
  },

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  },

  openChat() {
    const windowEl = document.getElementById('chatbot-window');
    if (!windowEl) return;

    this.isOpen = true;
    windowEl.classList.add('active');
    windowEl.setAttribute('aria-hidden', 'false');

    this.unreadCount = 0;
    this.updateUnreadBadge();

    setTimeout(() => {
      const input = document.getElementById('chatbot-input');
      if (input && window.innerWidth > 640) input.focus();
      this.scrollToBottom();
    }, 150);
  },

  closeChat() {
    const windowEl = document.getElementById('chatbot-window');
    if (!windowEl) return;

    this.isOpen = false;
    windowEl.classList.remove('active');
    windowEl.setAttribute('aria-hidden', 'true');
  },

  updateUnreadBadge() {
    const badge = document.getElementById('chat-badge-bubble');
    if (!badge) return;

    if (this.unreadCount > 0 && !this.isOpen) {
      badge.textContent = this.unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  },

  sendQuickPrompt(text) {
    const input = document.getElementById('chatbot-input');
    if (input) input.value = text;
    this.handleSend();
  },

  handleSend(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('chatbot-input');
    if (!input) return;

    const userText = input.value.trim();
    if (!userText || this.isTyping) return;

    // Bersihkan input
    input.value = '';

    // Tambah pesan user
    const userMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    this.messages.push(userMsg);
    this.saveHistory();
    this.renderMessages();
    this.scrollToBottom();

    // Trigger auto-reply dengan efek mengetik
    this.triggerAutoReply(userText);
  },

  triggerAutoReply(userQuery) {
    this.setTyping(true);

    // Variasi waktu berpikir natural (600ms - 900ms)
    const delay = Math.floor(Math.random() * 300) + 600;

    setTimeout(() => {
      const botResponse = this.generateResponse(userQuery);
      this.setTyping(false);

      this.messages.push({
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: botResponse.text,
        html: botResponse.html || null,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        actions: botResponse.actions || null
      });

      this.saveHistory();
      this.renderMessages();
      this.scrollToBottom();

      if (!this.isOpen) {
        this.unreadCount++;
        this.updateUnreadBadge();
      }
    }, delay);
  },

  setTyping(typing) {
    this.isTyping = typing;
    const typingEl = document.getElementById('chatbot-typing');
    if (typingEl) {
      typingEl.style.display = typing ? 'flex' : 'none';
      if (typing) this.scrollToBottom();
    }
  },

  scrollToBottom() {
    const msgContainer = document.getElementById('chatbot-messages');
    if (msgContainer) {
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  },

  renderMessages() {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    container.innerHTML = this.messages.map(m => {
      const isUser = m.sender === 'user';

      if (isUser) {
        return `
          <div class="chat-msg chat-msg-user">
            <div class="chat-bubble chat-bubble-user">
              <div class="chat-text">${this.escapeHtml(m.text)}</div>
              <span class="chat-time">${m.timestamp}</span>
            </div>
          </div>
        `;
      }

      // Pesan Bot
      let contentHtml = '';
      if (m.html) {
        contentHtml = m.html;
      } else {
        contentHtml = `<div class="chat-text">${this.formatBotText(m.text)}</div>`;
      }

      let actionsHtml = '';
      if (m.actions && Array.isArray(m.actions) && m.actions.length > 0) {
        actionsHtml = `
          <div class="chat-action-buttons">
            ${m.actions.map(act => `
              <button type="button" class="chat-action-btn ${act.isPrimary ? 'is-primary' : ''}" onclick="${act.action}">
                ${act.icon ? `<span>${act.icon}</span>` : ''}
                <span>${act.label}</span>
              </button>
            `).join('')}
          </div>
        `;
      }

      return `
        <div class="chat-msg chat-msg-bot">
          <div class="chat-avatar-bot">168</div>
          <div class="chat-bubble chat-bubble-bot">
            ${contentHtml}
            ${actionsHtml}
            <span class="chat-time">${m.timestamp}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  formatBotText(text) {
    if (!text) return '';
    // Format bold **teks** dan newlines
    let formatted = this.escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<div class="chat-paragraph-gap"></div>')
      .replace(/\n/g, '<br>');
    return formatted;
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /* =========================================================
     INTELLIGENT KNOWLEDGE & AUTO-REPLY GENERATOR
     ========================================================= */
  generateResponse(rawQuery) {
    const q = rawQuery.toLowerCase().trim();

    // 1. CEK STATUS / LACAK PESANAN (ORD-...)
    const orderMatch = rawQuery.match(/ORD-[A-Z0-9]+/i);
    if (orderMatch || q.includes('pesanan') || q.includes('lacak') || q.includes('resi') || q.includes('status order') || q.includes('paket')) {
      return this.handleOrderInquiry(orderMatch ? orderMatch[0].toUpperCase() : null, q);
    }

    // 2. TANYA STOK / PRODUK SPESIFIK
    const productKeywords = [
      'lcd', 'layar', 'touchscreen', 'baterai', 'battery', 'ic', 'power',
      'blower', 'solder', 'timah', 'lem', 'backdoor', 'kaca', 'fleksibel',
      'flexibel', 'pinset', 'tester', 'iphone', 'samsung', 'xiaomi', 'oppo',
      'vivo', 'redmi', 'poco', 'realme', 'harga', 'stok', 'ready', 'jual', 'ada barang'
    ];

    const hasProductKeyword = productKeywords.some(kw => q.includes(kw));
    if (hasProductKeyword) {
      return this.handleProductInquiry(q);
    }

    // 3. VOUCHER & PROMO DISKON
    if (q.includes('promo') || q.includes('voucher') || q.includes('diskon') || q.includes('kupon') || q.includes('ongkir') || q.includes('cashback') || q.includes('klaim')) {
      return {
        text: `🎉 **Pesta Promo Terbaik 168 Parts Surabaya!**\n\nSaat ini tersedia **6 Voucher Belanja Resmi** yang dapat Anda gunakan:\n• 🎁 **PASARINBARU**: Potongan Rp100.000 untuk Pengguna Baru\n• 🚚 **ONGKIRXTRA**: Gratis Ongkir Xtra Se-Indonesia (Diskon Rp50.000)\n• ⚡ **FLASHSALE80**: Diskon Kilat 80% Super Murah\n• 💰 **CASHBACK50**: Cashback 50% Koin 168Pay\n• 🏷️ **GAJIANHEMAT**: Ekstra Diskon Gajian 15%\n• 🏬 **PILIHLOKAL**: Bangga Buatan Lokal (Potongan Rp25.000)\n\nKlaim semua voucher sekarang sebelum kuota habis!`,
        actions: [
          { label: 'Klaim Semua Voucher Sekarang', icon: '🎟️', action: 'PasarinApp.openPromoModal(); PasarinChatBot.closeChat();', isPrimary: true },
          { label: 'Lihat Produk Flash Sale', icon: '⚡', action: "window.location.hash='#/search?q=flash'; PasarinChatBot.closeChat();" }
        ]
      };
    }

    // 4. LOKASI TOKO & JAM OPERASIONAL
    if (q.includes('lokasi') || q.includes('alamat') || q.includes('toko') || q.includes('buka') || q.includes('tutup') || q.includes('jam') || q.includes('surabaya') || q.includes('dimana') || q.includes('di mana') || q.includes('offline') || q.includes('cabang')) {
      return {
        text: `🏬 **Informasi Gerai Resmi 168 Parts Surabaya:**\n\n📍 **Alamat Toko:**\nJl. Kusuma Bangsa, Kota Surabaya, Jawa Timur\n\n⏰ **Jam Buka Toko:**\n• Senin – Sabtu: **08:30 – 20:00 WIB**\n• Minggu & Hari Libur: **09:00 – 17:00 WIB**\n\n🚚 **Layanan Pengiriman:**\n• Pengiriman Instan Kurir 168 Parts (Tiba hari yang sama di Surabaya & sekitarnya).\n• Pengiriman Reguler (J&T, JNE, SiCepat) dengan packing bubble wrap tebal dan asuransi penuh.`,
        actions: [
          { label: 'Buka di Google Maps', icon: '🗺️', action: "window.open('https://maps.google.com/?q=Jl+Kusuma+Bangsa+Surabaya', '_blank')", isPrimary: true },
          { label: 'Pilih Pengiriman Instan', icon: '🚚', action: "window.location.hash='#/cart'; PasarinChatBot.closeChat();" }
        ]
      };
    }

    // 5. GARANSI & RETUR / PENGEMBALIAN BARANG
    if (q.includes('garansi') || q.includes('retur') || q.includes('kembali') || q.includes('rusak') || q.includes('pecah') || q.includes('cacat') || q.includes('tukar') || q.includes('komplain') || q.includes('salah')) {
      return {
        text: `🛡️ **Kebijakan Garansi & Retur 168 Parts (Aman & Terjamin):**\n\n1. **Garansi Tes 7 Hari** berlaku sejak pesanan berstatus *Sampai di Tujuan*.\n2. **Syarat Pengajuan Pengembalian:**\n   • Wajib melampirkan **1 rekaman video unboxing utuh** tanpa potongan (maks. 100MB).\n   • Wajib melampirkan **minimal 2 foto fisik barang** yang bermasalah (maks. 5MB/foto).\n   • Segel toko 168 Parts tidak robek / rusak dan sparepart belum dilem permanen.\n3. Tim admin akan mereview pengajuan retur Anda maksimal dalam **1x24 jam** setelah dikirim.`,
        actions: [
          { label: 'Ajukan Retur Barang Sekarang', icon: '🔄', action: "window.location.hash='#/order/return'; PasarinChatBot.closeChat();", isPrimary: true },
          { label: 'Hubungi Teknisi via WhatsApp', icon: '👨‍🔧', action: "window.open('https://wa.me/6281122334455?text=Halo%20Admin,%20saya%20ingin%20konsultasi%20garansi%20sparepart', '_blank')" }
        ]
      };
    }

    // 6. KONTAK ADMIN / WHATSAPP / SERVIS
    if (q.includes('admin') || q.includes('cs') || q.includes('wa') || q.includes('whatsapp') || q.includes('telepon') || q.includes('hp') || q.includes('nomor') || q.includes('hubungi') || q.includes('manusia') || q.includes('orang') || q.includes('servis')) {
      return {
        text: `👨‍🔧 **Terhubung Langsung dengan Admin & Teknisi 168 Parts:**\n\nIngin berbicara langsung dengan staf kami atau konsultasi kerusakan ponsel?\n\nWhatsApp Resmi: **+62 811-2233-4455**\nEmail: **support@168parts.com**\n\nTim teknisi kami siap memandu Anda memilih tipe sparepart yang presisi!`,
        actions: [
          { label: 'Buka Chat WhatsApp Resmi', icon: '💬', action: "window.open('https://wa.me/6281122334455?text=Halo%20Admin%20168%20Parts,%20saya%20ingin%20tanya%20seputar%20sparepart', '_blank')", isPrimary: true },
          { label: 'Kembali Belanja', icon: '🛒', action: 'PasarinChatBot.closeChat();' }
        ]
      };
    }

    // 7. SAPAAN / TERIMA KASIH
    if (q.includes('halo') || q.includes('hai') || q.includes('pagi') || q.includes('siang') || q.includes('sore') || q.includes('malam')) {
      return {
        text: `Halo! Senang sekali bisa membantu Anda hari ini di 168 Parts Surabaya 😊\n\nAda tipe sparepart atau alat servis tertentu yang sedang Anda cari untuk ponsel kesayangan atau servisan Anda?`,
        actions: [
          { label: 'Cari LCD & Layar', icon: '📱', action: "window.location.hash='#/search?category=LCD+%26+Layar'; PasarinChatBot.closeChat();" },
          { label: 'Cari Baterai Original', icon: '🔋', action: "window.location.hash='#/search?category=Baterai+HP'; PasarinChatBot.closeChat();" }
        ]
      };
    }

    if (q.includes('terima kasih') || q.includes('makasih') || q.includes('thanks') || q.includes('ok') || q.includes('oke') || q.includes('siap') || q.includes('mantap')) {
      return {
        text: `Sama-sama! Senang bisa membantu Anda di 168 Parts Surabaya 🙏\n\nJika ada pertanyaan lain seputar pesanan atau sparepart lainnya, jangan ragu untuk chat kembali kapan saja. Selamat berbelanja dan semoga sukses servisan HP-nya! ✨`
      };
    }

    // 8. DEFAULT / GENERAL SMART FALLBACK
    return {
      text: `Terima kasih atas pertanyaannya! 🤖\n\nSebagai Asisten Otomatis 168 Parts Surabaya, saya dapat langsung membantu Anda dengan beberapa pilihan cepat berikut:`,
      actions: [
        { label: 'Status & Lacak Pesanan', icon: '📦', action: "PasarinChatBot.sendQuickPrompt('Cek Status Pesanan')" },
        { label: 'Cari Stok LCD / Baterai', icon: '🔍', action: "PasarinChatBot.sendQuickPrompt('Tanya Stok LCD & Baterai')" },
        { label: 'Klaim Voucher Promo', icon: '🎟', action: "PasarinApp.openPromoModal(); PasarinChatBot.closeChat();" },
        { label: 'Chat Langsung ke WhatsApp', icon: '💬', action: "window.open('https://wa.me/6281122334455?text=Halo%20Admin%20168%20Parts,%20saya%20ingin%20tanya%20produk', '_blank')" }
      ]
    };
  },

  handleOrderInquiry(orderId, query) {
    // Jika user memasukkan kode pesanan spesifik (ORD-...)
    if (orderId) {
      return {
        text: `🔍 **Pengecekan Pesanan #${orderId}:**\n\nSistem sedang memantau pesanan Anda di database Supabase Cloud. Anda dapat melihat detail barang, status pengiriman kurir, tanggal sampai, serta bukti garansi secara lengkap melalui Portal Riwayat Pesanan:`,
        actions: [
          { label: `Lihat Detail Pesanan ${orderId}`, icon: '📑', action: `if(window.PasarinApp) PasarinApp.openOrdersModal(); PasarinChatBot.closeChat();`, isPrimary: true },
          { label: 'Ajukan Retur Barang', icon: '🔄', action: `window.location.hash='#/order/return?id=${orderId}'; PasarinChatBot.closeChat();` }
        ]
      };
    }

    // Jika tidak menyebutkan kode pesanan
    const user = window.PasarinAuth?.currentUser;
    if (user) {
      return {
        text: `📦 **Informasi Pesanan Anda (${user.name}):**\n\nSemua transaksi Anda tercatat otomatis di akun Anda. Silakan klik tombol di bawah untuk membuka daftar pesanan, melihat resi pengiriman kurir 168 Parts, atau mengajukan retur barang:`,
        actions: [
          { label: 'Buka Daftar Pesanan Saya', icon: '📑', action: 'if(window.PasarinApp) PasarinApp.openOrdersModal(); PasarinChatBot.closeChat();', isPrimary: true },
          { label: 'Ketik Nomor Pesanan (ORD-...)', icon: '⌨️', action: "document.getElementById('chatbot-input').focus(); document.getElementById('chatbot-input').placeholder='Ketik nomor pesanan contoh: ORD-MW8VI239...';" }
        ]
      };
    }

    return {
      text: `📦 **Lacak Pesanan 168 Parts:**\n\nUntuk melacak status pesanan secara akurat, Anda dapat:\n1. Mengetikkan nomor pesanan langsung di sini (contoh: **ORD-MW8VI239**).\n2. Atau masuk (Login) ke akun Anda untuk melihat seluruh riwayat belanja.`,
      actions: [
        { label: 'Masuk ke Akun Pembeli', icon: '🔐', action: "window.location.href='login.html#login';", isPrimary: true },
        { label: 'Hubungi CS via WhatsApp', icon: '💬', action: "window.open('https://wa.me/6281122334455?text=Halo%20Admin,%20tolong%20bantu%20cek%20pesanan%20saya', '_blank')" }
      ]
    };
  },

  handleProductInquiry(query) {
    const allProducts = window.PasarinApp?.products || [];
    const qTerms = query.split(/\s+/).filter(t => t.length > 2);

    // Cari produk yang paling cocok
    let matches = [];
    if (allProducts.length > 0) {
      matches = allProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return qTerms.some(term => name.includes(term) || cat.includes(term));
      }).slice(0, 3);
    }

    if (matches.length > 0) {
      const cardsHtml = matches.map(p => {
        const priceFmt = 'Rp' + Number(p.price || 0).toLocaleString('id-ID');
        const origPriceFmt = p.originalPrice ? `<del style="color:#94a3b8; font-size:11px; margin-right:4px;">Rp${Number(p.originalPrice).toLocaleString('id-ID')}</del>` : '';
        const discBadge = p.discountPercent ? `<span style="background:#be123c; color:#fff; font-size:9.5px; font-weight:800; padding:1px 5px; border-radius:3px;">-${p.discountPercent}%</span>` : '';

        return `
          <div class="chat-prod-card" onclick="PasarinApp.openProductDetail('${p.id}'); PasarinChatBot.closeChat();" title="Klik untuk lihat detail & spesifikasi produk">
            <img src="${p.image || 'images/product-placeholder.svg'}" alt="${p.name}" class="chat-prod-img" onerror="this.src='images/product-placeholder.svg'">
            <div class="chat-prod-info">
              <div class="chat-prod-name">${p.name}</div>
              <div class="chat-prod-price-row">
                ${origPriceFmt}
                <strong class="chat-prod-price">${priceFmt}</strong>
                ${discBadge}
              </div>
              <span class="chat-prod-stock">📦 Stok: ${p.stock || 'Tersedia'} • ⭐ ${p.rating || '4.9'}</span>
            </div>
          </div>
        `;
      }).join('');

      return {
        text: `✨ Ditemukan **${matches.length} produk rekomendasi** yang cocok di etalase 168 Parts:`,
        html: `
          <div class="chat-text">✨ Ditemukan <strong>${matches.length} produk rekomendasi</strong> yang cocok di etalase 168 Parts:</div>
          <div class="chat-prod-list">
            ${cardsHtml}
          </div>
        `,
        actions: [
          { label: 'Cari Produk Lainnya di Toko', icon: '🔍', action: `window.location.hash='#/search?q=${encodeURIComponent(query)}'; PasarinChatBot.closeChat();` },
          { label: 'Klaim Voucher Diskon Belanja', icon: '🎟️', action: 'PasarinApp.openPromoModal(); PasarinChatBot.closeChat();' }
        ]
      };
    }

    // Jika tidak ada kecocokan spesifik
    return {
      text: `📱 **Katalog Lengkap 168 Parts Surabaya:**\n\nKami menyediakan ribuan sparepart HP berkualitas tinggi:\n• **LCD & Touchscreen:** iPhone, Samsung, Xiaomi/Redmi, Oppo, Vivo, Realme (Grade A+ & Ori)\n• **Baterai HP:** High Capacity bergaransi resmi\n• **IC & Komponen:** IC Power, Charging, CPU, Audio\n• **Alat Servis & Blower:** Quick 857DW+, Solder T12, Timah Mechanic, Lem T7000/B7000\n\nSilakan klik tombol di bawah untuk menelusuri katalog:`,
      actions: [
        { label: 'Buka Katalog Semua Produk', icon: '📦', action: "window.location.hash='#/search'; PasarinChatBot.closeChat();", isPrimary: true },
        { label: 'Tanya Ketersediaan ke Admin WhatsApp', icon: '💬', action: `window.open('https://wa.me/6281122334455?text=Halo%20Admin,%20apakah%20ada%20stok%20${encodeURIComponent(query)}?', '_blank')` }
      ]
    };
  }
};

// Inisialisasi otomatis saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  PasarinChatBot.init();
});

window.PasarinChatBot = PasarinChatBot;

