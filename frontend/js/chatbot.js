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
  roomId: null,
  pollTimer: null,
  roomStatus: 'ai_active',
  STORAGE_KEY: 'pasarin_chatbot_history_v1',

  init() {
    this.createWidgetDOM();
    this.loadHistory();
    this.bindEvents();
    this.updateUnreadBadge();
    this.syncWithBackendRoom();

    // Pastikan tombol dock chat membuka chatbot
    const dockChatBtn = document.getElementById('btn-dock-chat');
    if (dockChatBtn) {
      dockChatBtn.onclick = (e) => {
        e.preventDefault();
        this.toggleChat();
      };
    }
  },

  async syncWithBackendRoom() {
    let storedRoomId = localStorage.getItem('168_chat_room_id');
    const user = window.PasarinAuth?.currentUser;
    if (!storedRoomId) {
      storedRoomId = user ? `room_${user.id}` : `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('168_chat_room_id', storedRoomId);
    }
    this.roomId = storedRoomId;

    try {
      if (window.PasarinAPI && typeof window.PasarinAPI.initChatRoom === 'function') {
        const res = await window.PasarinAPI.initChatRoom({
          roomId: this.roomId,
          userId: user ? user.id : null,
          customerName: user ? (user.name || user.username) : 'Pelanggan 168',
          customerEmail: user ? user.email : null,
          customerPhone: user ? user.phone : null
        });

        if (res && res.success) {
          if (res.room) {
            this.roomStatus = res.room.status;
            this.updateHeaderStatusBadge();
          }
          if (res.messages && res.messages.length > 0) {
            // Sinkronkan pesan dari server
            this.messages = res.messages.map(m => ({
              id: m.id,
              sender: m.senderType,
              senderName: m.senderName,
              text: m.message,
              actions: m.actions,
              timestamp: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            }));
            this.saveHistory();
            this.renderMessages();
            this.scrollToBottom();
          }
        }
      }
    } catch (e) {
      console.warn('Chat init offline fallback:', e.message);
    }

    // Mulai polling berkala pesan admin
    this.startPolling();
  },

  startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.pollLiveMessages();
    }, 3500);
  },

  async pollLiveMessages() {
    if (!this.roomId || !window.PasarinAPI || typeof window.PasarinAPI.getChatMessages !== 'function') return;
    try {
      const res = await window.PasarinAPI.getChatMessages(this.roomId, false);
      if (res && res.success && res.messages) {
        if (res.room && res.room.status !== this.roomStatus) {
          this.roomStatus = res.room.status;
          this.updateHeaderStatusBadge();
        }

        // Cek jika ada pesan baru yang belum ada di local
        let hasNew = false;
        res.messages.forEach(m => {
          const exists = this.messages.some(localMsg => localMsg.id === m.id);
          if (!exists) {
            this.messages.push({
              id: m.id,
              sender: m.senderType,
              senderName: m.senderName,
              text: m.message,
              actions: m.actions,
              timestamp: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
            hasNew = true;
            if (m.senderType === 'admin') {
              if (!this.isOpen) {
                this.unreadCount++;
                this.updateUnreadBadge();
              }
            }
          }
        });

        if (hasNew) {
          this.saveHistory();
          this.renderMessages();
          this.scrollToBottom();
        }
      }
    } catch (e) {
      // ignore
    }
  },

  updateHeaderStatusBadge() {
    const badgeEl = document.getElementById('chatbot-bot-badge');
    const subtitleEl = document.getElementById('chatbot-subtitle');
    if (!badgeEl) return;

    if (this.roomStatus === 'admin_handling') {
      badgeEl.textContent = '🛡️ ADMIN AKTIF';
      badgeEl.style.background = '#10b981';
      badgeEl.style.color = '#ffffff';
      if (subtitleEl) subtitleEl.textContent = '👨‍💻 Terhubung langsung dengan Admin CS 168 Parts';
    } else if (this.roomStatus === 'needs_admin') {
      badgeEl.textContent = '⏳ MENUNGGU ADMIN';
      badgeEl.style.background = '#f59e0b';
      badgeEl.style.color = '#ffffff';
      if (subtitleEl) subtitleEl.textContent = '💬 Pesan diteruskan ke Admin CS (Online)';
    } else {
      badgeEl.textContent = 'AI BOT';
      badgeEl.style.background = '';
      badgeEl.style.color = '';
      if (subtitleEl) subtitleEl.textContent = '⚡ Balas Otomatis Seketika • 24/7';
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
                <span class="chatbot-bot-badge" id="chatbot-bot-badge">AI BOT</span>
              </div>
              <div class="chatbot-subtitle" id="chatbot-subtitle">⚡ Balas Otomatis Seketika • 24/7</div>
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
          <button type="button" class="chat-pill" style="background:#fff1f2; color:#be123c; border-color:#fecdd3; font-weight:800;" onclick="PasarinChatBot.sendQuickPrompt('Hubungi Admin CS')">👨‍💻 Hubungi Admin CS</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Cek Status Pesanan')">📦 Status Pesanan</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Tanya Stok LCD & Baterai')">🔍 Stok LCD & Baterai</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Voucher & Promo Diskon')">🎟️ Promo & Voucher</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Lokasi Toko & Jam Buka')">📍 Lokasi & Jam Buka</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Syarat Garansi & Retur Barang')">🔄 Garansi & Retur</button>
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

  async handleSend(event) {
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

    // Kirim pesan user ke backend
    this.sendToBackend(userText, 'user');

    // Trigger auto-reply dengan efek mengetik
    this.triggerAutoReply(userText);
  },

  async sendToBackend(text, senderType, actions = null, status = null) {
    if (!this.roomId || !window.PasarinAPI || typeof window.PasarinAPI.sendChatMessage !== 'function') return;
    try {
      await window.PasarinAPI.sendChatMessage(this.roomId, {
        text,
        senderType,
        actions,
        status
      });
    } catch (e) {
      console.warn('Gagal sinkron chat ke backend:', e.message);
    }
  },

  triggerAutoReply(userQuery) {
    this.setTyping(true);

    // Variasi waktu berpikir natural (500ms - 800ms)
    const delay = Math.floor(Math.random() * 300) + 500;

    setTimeout(() => {
      const botResponse = this.generateResponse(userQuery);
      this.setTyping(false);

      const botMsg = {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: botResponse.text,
        html: botResponse.html || null,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        actions: botResponse.actions || null
      };

      this.messages.push(botMsg);

      if (botResponse.isEscalatedToAdmin) {
        this.roomStatus = 'needs_admin';
        this.updateHeaderStatusBadge();
        // Tandai ke backend bahwa room butuh bantuan Admin
        this.sendToBackend(botResponse.text, 'bot', botResponse.actions, 'needs_admin');
      } else {
        this.sendToBackend(botResponse.text, 'bot', botResponse.actions);
      }

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
      const isAdmin = m.sender === 'admin';

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

      if (isAdmin) {
        return `
          <div class="chat-msg chat-msg-admin" style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
            <div style="width:30px; height:30px; border-radius:50%; background:#be123c; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; flex-shrink:0; box-shadow:0 2px 6px rgba(190,18,60,0.3);">
              🛡️
            </div>
            <div class="chat-bubble chat-bubble-admin" style="background:#fff1f2; border:1px solid #fecdd3; color:#1e293b; border-radius:14px 14px 14px 2px; padding:10px 14px; max-width:82%; box-shadow:0 1px 4px rgba(0,0,0,0.04);">
              <div style="font-size:10px; font-weight:800; color:#be123c; margin-bottom:4px; display:flex; align-items:center; gap:5px;">
                <span>🛡️ ADMIN CS 168 PARTS</span>
                <span style="background:#be123c; color:#fff; font-size:9px; padding:1px 5px; border-radius:6px;">OFFICIAL</span>
              </div>
              <div class="chat-text" style="font-size:12.5px; line-height:1.45;">${this.formatBotText(m.text)}</div>
              <span class="chat-time" style="font-size:10px; color:#94a3b8; display:block; text-align:right; margin-top:4px;">${m.timestamp}</span>
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

    // 6. KONTAK ADMIN / WHATSAPP / SERVIS / MINTA BANTUAN MANUSIA
    if (q.includes('admin') || q.includes('cs') || q.includes('wa') || q.includes('whatsapp') || q.includes('telepon') || q.includes('hp') || q.includes('nomor') || q.includes('hubungi') || q.includes('manusia') || q.includes('orang') || q.includes('servis') || q.includes('staf') || q.includes('tolong') || q.includes('bantuan')) {
      return {
        isEscalatedToAdmin: true,
        text: `👨‍💼 **Pertanyaan Anda Telah Diteruskan ke Admin 168 Parts!**\n\nAdmin Customer Service kami sedang standby di Admin Panel dan akan segera membalas langsung di ruang obrolan ini.\n\nMohon ditunggu sebentar ya kak, kami sedang menyiapkan respon terbaik untuk Anda... 🙏`,
        actions: [
          { label: 'Chat Langsung via WhatsApp', icon: '💬', action: `window.open('https://wa.me/6281122334455?text=Halo%20Admin%20168%20Parts,%20saya%20butuh%20bantuan%20mengenai:%20${encodeURIComponent(userQuery)}', '_blank')` },
          { label: 'Lihat Semua Sparepart', icon: '📦', action: "window.location.hash='#/search'; PasarinChatBot.closeChat();" }
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

    // 8. KETIKA AI MENTOK / TIDAK MEMILIKI JAWABAN SPESIFIK -> OTOMATIS TERUSKAN KE ADMIN TOKO!
    return {
      isEscalatedToAdmin: true,
      text: `👨‍💼 **Pertanyaan Anda Telah Diteruskan ke Admin 168 Parts!**\n\nAsisten otomatis belum memiliki jawaban spesifik untuk pertanyaan Anda:\n*"${this.escapeHtml(userQuery)}"* \n\nTenang kak, percakapan ini **sudah otomatis masuk ke antrean Live Chat Admin Customer Service 168 Parts** 🛡️.\nAdmin kami sedang online dan akan membalas langsung di ruang obrolan ini. Mohon ditunggu sebentar ya kak... 🙏`,
      actions: [
        { label: 'Hubungi WhatsApp Cadangan', icon: '💬', action: `window.open('https://wa.me/6281122334455?text=Halo%20Admin%20168%20Parts,%20saya%20ingin%20tanya:%20${encodeURIComponent(userQuery)}', '_blank')` },
        { label: 'Buka Katalog Sparepart', icon: '🔍', action: "window.location.hash='#/search'; PasarinChatBot.closeChat();" },
        { label: 'Cek Status Pesanan', icon: '📦', action: "PasarinChatBot.sendQuickPrompt('Cek Status Pesanan')" }
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

