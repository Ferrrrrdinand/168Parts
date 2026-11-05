/* =========================================================
   Pasarin Indonesia - Advanced GMaps Location Picker
   Ultra-Proper Interactive Google Maps Picker Component
   ========================================================= */

const PasarinGmapsPicker = {
  map: null,
  streetLayer: null,
  satelliteLayer: null,
  activeLayer: 'street',
  currentCoords: { lat: -6.2088, lng: 106.8456 }, // Default: Jakarta Pusat
  currentAddressData: {
    mainText: 'Memuat titik lokasi...',
    subText: 'Geser peta untuk memilih alamat',
    fullAddress: '',
    lat: -6.2088,
    lng: 106.8456
  },
  onConfirmCallback: null,
  reverseTimer: null,
  searchTimer: null,

  init() {
    this.createModalDOM();
  },

  createModalDOM() {
    if (document.getElementById('gmaps-picker-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'gmaps-picker-overlay';
    overlay.className = 'gmaps-picker-overlay';
    overlay.innerHTML = `
      <div class="gmaps-picker-card">
        
        <!-- Header -->
        <div class="gmaps-picker-header">
          <div class="gmaps-header-left">
            <div class="gmaps-header-icon">📍</div>
            <div>
              <h3 class="gmaps-header-title">Pilih Titik Pengiriman (Google Maps)</h3>
              <p class="gmaps-header-desc">Arahkan pin pada peta ke titik lokasi rumah / tujuan pengiriman Anda</p>
            </div>
          </div>
          <button type="button" class="gmaps-header-close" id="btn-close-gmaps" aria-label="Tutup">&times;</button>
        </div>

        <!-- Toolbar Pencarian & Kontrol -->
        <div class="gmaps-toolbar">
          <div class="gmaps-search-row">
            <div class="gmaps-search-box">
              <span class="gmaps-search-icon">🔍</span>
              <input type="text" id="gmaps-input-search" class="gmaps-search-input" placeholder="Ketik nama jalan, perumahan, gedung, atau patokan...">
              <button type="button" id="btn-clear-search" class="gmaps-search-clear">&times;</button>
              
              <!-- Dropdown Rekomendasi Hasil Pencarian -->
              <div id="gmaps-autocomplete-list" class="gmaps-autocomplete-dropdown"></div>
            </div>

            <button type="button" class="btn-gmaps-gps" id="btn-trigger-gps" title="Gunakan Lokasi GPS Saat Ini">
              <span class="gps-pulse-dot"></span>
              <span>GPS Saya</span>
            </button>

            <!-- Toggle Satelit / Peta Jalan -->
            <div class="gmaps-layer-toggle">
              <button type="button" class="gmaps-layer-btn active" id="btn-layer-street">🗺️ Jalan</button>
              <button type="button" class="gmaps-layer-btn" id="btn-layer-sat">🛰️ Satelit</button>
            </div>
          </div>

          <!-- Quick City Chips -->
          <div class="gmaps-quick-chips">
            <span class="gmaps-chip-label">PILIH CEPAT:</span>
            <button type="button" class="gmaps-chip-btn" data-lat="-6.1754" data-lng="106.8272">📍 Jakarta Pusat</button>
            <button type="button" class="gmaps-chip-btn" data-lat="-6.2250" data-lng="106.8097">🏢 Sudirman / SCBD</button>
            <button type="button" class="gmaps-chip-btn" data-lat="-6.9175" data-lng="107.6191">🛍️ Bandung</button>
            <button type="button" class="gmaps-chip-btn" data-lat="-7.2575" data-lng="112.7521">🌊 Surabaya</button>
            <button type="button" class="gmaps-chip-btn" data-lat="-7.7956" data-lng="110.3695">🌿 Yogyakarta</button>
            <button type="button" class="gmaps-chip-btn" data-lat="-8.6705" data-lng="115.2126">🌴 Bali / Denpasar</button>
            <button type="button" class="gmaps-chip-btn" data-lat="3.5952" data-lng="98.6722">🏬 Medan</button>
          </div>
        </div>

        <!-- Map Stage dengan Bouncing Center Pin -->
        <div class="gmaps-map-stage" id="gmaps-map-stage">
          
          <div class="gmaps-hint-badge">
            <span>💡</span> Geser peta untuk menempatkan pin di lokasi yang tepat
          </div>

          <!-- Leaflet Map Container -->
          <div id="gmaps-active-map"></div>

          <!-- Fixed Animated Center Pin (Tokopedia / Shopee Standard) -->
          <div class="gmaps-center-pin-wrap" id="gmaps-center-pin">
            <div class="gmaps-pin-pill" id="gmaps-pin-pill">
              <span>📍</span>
              <span id="gmaps-pill-text">Titik Pengiriman</span>
            </div>
            <svg class="gmaps-pin-svg-icon" viewBox="0 0 24 32" fill="none">
              <path d="M12 0C5.372 0 0 5.372 0 12c0 8.5 12 20 12 20s12-11.5 12-20c0-6.628-5.372-12-12-12z" fill="#1d3f0d"/>
              <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
              <circle cx="12" cy="11" r="2" fill="#1d3f0d"/>
            </svg>
          </div>

          <!-- Pin Shadow on the ground -->
          <div class="gmaps-pin-shadow"></div>
        </div>

        <!-- Panel Bawah: Detail Alamat & Catatan Kurir -->
        <div class="gmaps-bottom-card">
          <div class="gmaps-address-preview-row">
            <div class="gmaps-pin-target-icon">📍</div>
            <div class="gmaps-address-text-wrap">
              <div class="gmaps-address-badge-row">
                <span class="gmaps-badge-primary">Titik Alamat Terpilih</span>
                <span class="gmaps-coords-text" id="gmaps-coords-display">-6.20880, 106.84560</span>
              </div>
              <h4 class="gmaps-main-address" id="gmaps-main-address">Memuat nama jalan...</h4>
              <p class="gmaps-sub-address" id="gmaps-sub-address">Kecamatan, Kota, Provinsi...</p>
            </div>
          </div>

          <!-- Catatan Tambahan untuk Kurir (Patokan/Detail Rumah) -->
          <div class="gmaps-note-row">
            <input type="text" id="gmaps-courier-note" class="gmaps-note-input" placeholder="📝 Tambahkan patokan kurir (contoh: Pagar hitam, Blok B2 No. 14, sebelah minimarket)...">
          </div>

          <!-- Tombol Aksi -->
          <div class="gmaps-actions-row">
            <button type="button" class="btn-gmaps-cancel" id="btn-cancel-gmaps">Batal</button>
            <button type="button" class="btn-gmaps-confirm" id="btn-confirm-gmaps">
              <span>✓ Konfirmasi Titik & Gunakan Alamat Ini</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);
    this.bindEvents();
  },

  bindEvents() {
    const overlay = document.getElementById('gmaps-picker-overlay');
    const closeBtn = document.getElementById('btn-close-gmaps');
    const cancelBtn = document.getElementById('btn-cancel-gmaps');
    const confirmBtn = document.getElementById('btn-confirm-gmaps');
    const searchInput = document.getElementById('gmaps-input-search');
    const clearBtn = document.getElementById('btn-clear-search');
    const gpsBtn = document.getElementById('btn-trigger-gps');
    const streetBtn = document.getElementById('btn-layer-street');
    const satBtn = document.getElementById('btn-layer-sat');

    // Close on overlay / button
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // Confirm button
    confirmBtn?.addEventListener('click', () => {
      const note = document.getElementById('gmaps-courier-note')?.value.trim() || '';
      let finalFullAddress = this.currentAddressData.mainText;

      if (note) {
        finalFullAddress += ` (${note})`;
      }
      if (this.currentAddressData.subText && this.currentAddressData.subText !== 'Kecamatan, Kota, Provinsi...') {
        finalFullAddress += `, ${this.currentAddressData.subText}`;
      }

      if (this.onConfirmCallback) {
        this.onConfirmCallback(finalFullAddress, {
          mainAddress: this.currentAddressData.mainText,
          subAddress: this.currentAddressData.subText,
          note: note,
          lat: this.currentCoords.lat,
          lng: this.currentCoords.lng,
          formatted: finalFullAddress
        });
      }

      this.close();
      if (window.showToast) {
        window.showToast('✓ Titik lokasi alamat berhasil diperbarui dari Google Maps!', 'success');
      }
    });

    // Realtime Search Input with Debounce & Dropdown
    searchInput?.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearBtn.classList.toggle('show', q.length > 0);

      clearTimeout(this.searchTimer);
      if (q.length < 3) {
        this.hideAutocomplete();
        return;
      }

      this.searchTimer = setTimeout(() => {
        this.fetchAutocompleteSuggestions(q);
      }, 350);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) this.searchAndFlyTo(q);
      }
    });

    clearBtn?.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('show');
      this.hideAutocomplete();
      searchInput.focus();
    });

    // Layer Switcher
    streetBtn?.addEventListener('click', () => this.switchLayer('street'));
    satBtn?.addEventListener('click', () => this.switchLayer('sat'));

    // GPS Current Location Button
    gpsBtn?.addEventListener('click', () => this.locateUserGps());

    // Quick City Chips
    document.querySelectorAll('.gmaps-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lat = parseFloat(btn.dataset.lat);
        const lng = parseFloat(btn.dataset.lng);
        if (!isNaN(lat) && !isNaN(lng) && this.map) {
          this.map.flyTo([lat, lng], 16, { duration: 1.2 });
        }
      });
    });

    // Hide dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.gmaps-search-box')) {
        this.hideAutocomplete();
      }
    });
  },

  open(options = {}) {
    this.createModalDOM();
    this.onConfirmCallback = options.onConfirm || null;

    const overlay = document.getElementById('gmaps-picker-overlay');
    if (!overlay) return;

    overlay.classList.add('active');

    // Pre-fill note if existing
    const noteInput = document.getElementById('gmaps-courier-note');
    if (noteInput) noteInput.value = options.initialNote || '';

    // Initial Coordinates
    if (options.lat && options.lng) {
      this.currentCoords = { lat: options.lat, lng: options.lng };
    }

    setTimeout(() => {
      this.initLeafletMap();
    }, 150);
  },

  close() {
    const overlay = document.getElementById('gmaps-picker-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    this.hideAutocomplete();
  },

  initLeafletMap() {
    if (typeof L === 'undefined') {
      console.warn('[PasarinGmapsPicker] Leaflet library belum dimuat.');
      return;
    }

    const mapContainer = document.getElementById('gmaps-active-map');
    const stage = document.getElementById('gmaps-map-stage');
    if (!mapContainer) return;

    if (!this.map) {
      this.map = L.map('gmaps-active-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([this.currentCoords.lat, this.currentCoords.lng], 16);

      // Add sleek zoom control on bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      // Official Google Maps Roadmap Tile Layer
      this.streetLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=id', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(this.map);

      // Official Google Maps Hybrid Satellite Layer
      this.satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=id', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });

      // Pin Animation during Map Dragging
      this.map.on('movestart', () => {
        if (stage) stage.classList.add('is-moving');
        const pillText = document.getElementById('gmaps-pill-text');
        if (pillText) pillText.textContent = 'Mengarahkan...';
      });

      this.map.on('moveend', () => {
        if (stage) stage.classList.remove('is-moving');
        const center = this.map.getCenter();
        this.currentCoords = { lat: center.lat, lng: center.lng };
        this.updateCoordsDisplay(center.lat, center.lng);

        // Debounce reverse geocoding
        clearTimeout(this.reverseTimer);
        const pillText = document.getElementById('gmaps-pill-text');
        if (pillText) pillText.textContent = 'Memeriksa alamat...';

        this.reverseTimer = setTimeout(() => {
          this.reverseGeocode(center.lat, center.lng);
        }, 300);
      });

    } else {
      this.map.invalidateSize();
      this.map.setView([this.currentCoords.lat, this.currentCoords.lng], 16);
    }

    this.reverseGeocode(this.currentCoords.lat, this.currentCoords.lng);
  },

  switchLayer(type) {
    if (!this.map) return;
    this.activeLayer = type;

    const btnStreet = document.getElementById('btn-layer-street');
    const btnSat = document.getElementById('btn-layer-sat');

    if (type === 'sat') {
      if (this.map.hasLayer(this.streetLayer)) this.map.removeLayer(this.streetLayer);
      if (!this.map.hasLayer(this.satelliteLayer)) this.map.addLayer(this.satelliteLayer);
      btnSat?.classList.add('active');
      btnStreet?.classList.remove('active');
    } else {
      if (this.map.hasLayer(this.satelliteLayer)) this.map.removeLayer(this.satelliteLayer);
      if (!this.map.hasLayer(this.streetLayer)) this.map.addLayer(this.streetLayer);
      btnStreet?.classList.add('active');
      btnSat?.classList.remove('active');
    }
  },

  updateCoordsDisplay(lat, lng) {
    const el = document.getElementById('gmaps-coords-display');
    if (el) el.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  },

  async reverseGeocode(lat, lng) {
    const mainEl = document.getElementById('gmaps-main-address');
    const subEl = document.getElementById('gmaps-sub-address');
    const pillText = document.getElementById('gmaps-pill-text');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'id,en' }
      });
      const data = await res.json();

      if (data && data.address) {
        const a = data.address;
        const road = a.road || a.pedestrian || a.residential || a.building || a.neighbourhood || '';
        const houseNumber = a.house_number ? ' No. ' + a.house_number : '';
        const village = a.village || a.suburb || a.quarter || '';
        const district = a.city_district || a.county || '';
        const city = a.city || a.town || a.regency || '';
        const state = a.state || '';
        const postcode = a.postcode ? ` (${a.postcode})` : '';

        const main = road ? (road + houseNumber) : (village || data.display_name.split(',')[0]);
        const subParts = [village, district, city, state + postcode].filter(Boolean);
        const sub = subParts.length > 0 ? subParts.join(', ') : data.display_name;

        this.currentAddressData = {
          mainText: main || 'Titik Terpilih',
          subText: sub || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          fullAddress: `${main}, ${sub}`,
          lat,
          lng
        };

        if (mainEl) mainEl.textContent = this.currentAddressData.mainText;
        if (subEl) subEl.textContent = this.currentAddressData.subText;
        if (pillText) pillText.textContent = '✓ Titik Siap';
      } else {
        throw new Error('No address');
      }
    } catch (e) {
      this.currentAddressData = {
        mainText: `Titik Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        subText: 'Geser peta untuk menyesuaikan titik alamat',
        fullAddress: `Koordinat (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
        lat,
        lng
      };
      if (mainEl) mainEl.textContent = this.currentAddressData.mainText;
      if (subEl) subEl.textContent = this.currentAddressData.subText;
      if (pillText) pillText.textContent = 'Titik Lokasi';
    }
  },

  async fetchAutocompleteSuggestions(query) {
    const dropdown = document.getElementById('gmaps-autocomplete-list');
    if (!dropdown) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5&addressdetails=1`, {
        headers: { 'Accept-Language': 'id,en' }
      });
      const items = await res.json();

      if (!items || items.length === 0) {
        dropdown.innerHTML = `
          <div style="padding: 12px 14px; font-size: 12px; color: #64748b; text-align: center;">
            Tidak ditemukan lokasi yang cocok untuk "${query}"
          </div>
        `;
        dropdown.classList.add('show');
        return;
      }

      dropdown.innerHTML = items.map(it => {
        const displayName = it.display_name || '';
        const parts = displayName.split(',');
        const title = parts[0] || query;
        const sub = parts.slice(1, 4).join(',').trim();

        let icon = '📍';
        if (it.type === 'administrative' || it.class === 'boundary') icon = '🏘️';
        if (it.type === 'building' || it.type === 'shop' || it.type === 'mall') icon = '🏢';
        if (it.type === 'road' || it.type === 'highway') icon = '🛣️';

        return `
          <div class="gmaps-autocomplete-item" onclick="PasarinGmapsPicker.selectSearchSuggestion(${it.lat}, ${it.lon}, '${encodeURIComponent(displayName)}')">
            <span class="gmaps-item-icon">${icon}</span>
            <div class="gmaps-item-info">
              <div class="gmaps-item-title">${title}</div>
              <div class="gmaps-item-sub">${sub}</div>
            </div>
          </div>
        `;
      }).join('');

      dropdown.classList.add('show');
    } catch (e) {
      this.hideAutocomplete();
    }
  },

  selectSearchSuggestion(lat, lon, encName) {
    this.hideAutocomplete();
    const searchInput = document.getElementById('gmaps-input-search');
    try {
      const name = decodeURIComponent(encName);
      if (searchInput) searchInput.value = name.split(',')[0];
    } catch (e) {}

    if (this.map) {
      this.map.flyTo([lat, lon], 17, { duration: 1.2 });
    }
  },

  hideAutocomplete() {
    const dropdown = document.getElementById('gmaps-autocomplete-list');
    if (dropdown) dropdown.classList.remove('show');
  },

  async searchAndFlyTo(query) {
    this.hideAutocomplete();
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=1`, {
        headers: { 'Accept-Language': 'id' }
      });
      const list = await res.json();
      if (list && list.length > 0) {
        const lat = parseFloat(list[0].lat);
        const lon = parseFloat(list[0].lon);
        if (this.map) this.map.flyTo([lat, lon], 17, { duration: 1.2 });
      } else {
        if (window.showToast) window.showToast(`Lokasi "${query}" tidak ditemukan.`, 'warning');
      }
    } catch (e) {}
  },

  locateUserGps() {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation tidak didukung di browser ini.');
      return;
    }

    const gpsBtn = document.getElementById('btn-trigger-gps');
    if (gpsBtn) gpsBtn.style.opacity = '0.5';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (gpsBtn) gpsBtn.style.opacity = '1';
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (this.map) {
          this.map.flyTo([lat, lng], 17, { duration: 1.2 });
        }
        if (window.showToast) {
          window.showToast('📍 Berhasil mendeteksi lokasi GPS Anda!', 'success');
        }
      },
      (err) => {
        if (gpsBtn) gpsBtn.style.opacity = '1';
        alert('Gagal mengambil titik GPS. Pastikan izin akses lokasi telah diaktifkan pada browser.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }
};

window.PasarinGmapsPicker = PasarinGmapsPicker;

