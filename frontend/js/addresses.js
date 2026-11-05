/* =========================================================
   Pasarin Indonesia - Multi-Address Management (Alamat Saya)
   Exact Shopee Replica: Multi-recipient, Multi-phone, Alamat Baru
   ========================================================= */

const PasarinAddressBook = {
  STORAGE_KEY: 'pasarin_user_addresses_v2',
  ACTIVE_KEY: 'pasarin_active_address_id_v2',

  // 4 Alamat Presisi Sesuai Screenshot Pengguna
  defaultAddresses: [
    {
      id: 'addr-shopee-1',
      name: 'Ferdinand',
      phone: '(+62) 823 3549 3176',
      region: 'GUNUNGANYAR, KOTA SURABAYA, JAWA TIMUR, ID, 60294',
      street: 'Perumahan Gunung Anyar Mas, Jalan Raya Gunung Anyar Emas Blok R No. 8, RT.3/RW.8',
      detail: 'Gunung Anyar Tambak (Blok R9)',
      address: 'Perumahan Gunung Anyar Mas, Jalan Raya Gunung Anyar Emas Blok R No. 8, RT.3/RW.8, Gunung Anyar Tambak (Blok R9) GUNUNGANYAR, KOTA SURABAYA, JAWA TIMUR, ID, 60294',
      label: 'Rumah',
      isDefault: true,
      coordinates: { lat: -7.3377, lng: 112.7845 }
    },
    {
      id: 'addr-shopee-2',
      name: 'Celyn.',
      phone: '(+62) 823 3549 3176',
      region: 'SEDATI, KAB. SIDOARJO, JAWA TIMUR, ID, 61253',
      street: 'Jalan Pasar Wisata Kavling 36-38 Rt 03 Rw 01, Jalan Semampir, Semampir Barat',
      detail: 'Semampir (sunrise residence 32)',
      address: 'Jalan Pasar Wisata Kavling 36-38 Rt 03 Rw 01, Jalan Semampir, Semampir Barat, Semampir (sunrise residence 32) SEDATI, KAB. SIDOARJO, JAWA TIMUR, ID, 61253',
      label: 'Rumah',
      isDefault: false,
      coordinates: { lat: -7.3789, lng: 112.7753 }
    },
    {
      id: 'addr-shopee-3',
      name: 'PT. Mahaghora',
      phone: '(+62) 812 3347 9840',
      region: 'MULYOREJO, KOTA SURABAYA, JAWA TIMUR, ID, 60114',
      street: 'Pt Mahaghora, Jalan Kenjeran No. 546, /RW.5, Kalijudan',
      detail: 'Mulyorejo',
      address: 'Pt Mahaghora, Jalan Kenjeran No. 546, /RW.5, Kalijudan, Mulyorejo MULYOREJO, KOTA SURABAYA, JAWA TIMUR, ID, 60114',
      label: 'Kantor',
      isDefault: false,
      coordinates: { lat: -7.2505, lng: 112.7812 }
    },
    {
      id: 'addr-shopee-4',
      name: 'Dwi (Toko Paris Look Parfume)',
      phone: '(+62) 813 5788 3777',
      region: 'KOTA MALANG, JAWA TIMUR, ID, 65126',
      street: 'Toko Paris Look Parfume plaza araya, Jalan Blimbing Indah Mega, Purwodadi, Kec. Blimbing',
      detail: 'Plaza Araya',
      address: 'Toko Paris Look Parfume plaza araya, Jalan Blimbing Indah Mega, Purwodadi, Kec. Blimbing, KOTA MALANG, JAWA TIMUR, ID, 65126',
      label: 'Rumah',
      isDefault: false,
      coordinates: { lat: -7.9351, lng: 112.6534 }
    }
  ],

  getAddresses() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    // Inisialisasi dengan 4 alamat persis screenshot
    this.saveAddresses(this.defaultAddresses);
    return this.defaultAddresses;
  },

  saveAddresses(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  },

  getActiveAddress() {
    const list = this.getAddresses();
    let activeId = localStorage.getItem(this.ACTIVE_KEY);
    let found = list.find(a => a.id === activeId);
    if (!found) {
      found = list.find(a => a.isDefault) || list[0];
      if (found) {
        localStorage.setItem(this.ACTIVE_KEY, found.id);
      }
    }
    return found;
  },

  setActiveAddress(id) {
    const list = this.getAddresses();
    const found = list.find(a => a.id === id);
    if (found) {
      localStorage.setItem(this.ACTIVE_KEY, id);
      this.updateCheckoutDisplay();
      if (window.showToast) {
        window.showToast(`Alamat pengiriman diubah ke: ${found.name}`, 'success');
      }
      return found;
    }
    return null;
  },

  addAddress(addrData) {
    const list = this.getAddresses();
    const newId = 'addr-custom-' + Date.now();
    const isFirst = list.length === 0;

    const fullStr = addrData.address || [addrData.street, addrData.detail, addrData.region].filter(Boolean).join(', ');

    const newAddr = {
      id: newId,
      name: (addrData.name || 'Penerima').trim(),
      phone: (addrData.phone || '').trim(),
      region: (addrData.region || '').trim(),
      street: (addrData.street || '').trim(),
      detail: (addrData.detail || '').trim(),
      address: fullStr.trim(),
      label: addrData.label || 'Rumah',
      isDefault: isFirst ? true : Boolean(addrData.isDefault),
      coordinates: addrData.coordinates || null
    };

    if (newAddr.isDefault) {
      list.forEach(a => a.isDefault = false);
    }

    list.unshift(newAddr);
    this.saveAddresses(list);
    this.setActiveAddress(newId);
    return newAddr;
  },

  updateAddress(id, addrData) {
    const list = this.getAddresses();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;

    if (addrData.isDefault) {
      list.forEach(a => a.isDefault = false);
    }

    const fullStr = addrData.address || [addrData.street, addrData.detail, addrData.region].filter(Boolean).join(', ');

    list[idx] = {
      ...list[idx],
      name: (addrData.name || list[idx].name).trim(),
      phone: (addrData.phone || list[idx].phone).trim(),
      region: (addrData.region !== undefined ? addrData.region : list[idx].region || '').trim(),
      street: (addrData.street !== undefined ? addrData.street : list[idx].street || '').trim(),
      detail: (addrData.detail !== undefined ? addrData.detail : list[idx].detail || '').trim(),
      address: fullStr.trim(),
      label: addrData.label || list[idx].label,
      isDefault: Boolean(addrData.isDefault),
      coordinates: addrData.coordinates !== undefined ? addrData.coordinates : list[idx].coordinates
    };

    this.saveAddresses(list);
    this.updateCheckoutDisplay();
    return list[idx];
  },

  updateCheckoutDisplay() {
    const active = this.getActiveAddress();
    if (!active) return;

    const recipientEl = document.getElementById('chk-display-recipient');
    const addressEl = document.getElementById('chk-display-address');
    const badgeEl = document.getElementById('chk-display-badge');

    if (recipientEl) {
      recipientEl.textContent = `${active.name} ${active.phone}`;
    }

    if (addressEl) {
      addressEl.textContent = active.address;
    }

    if (badgeEl) {
      if (active.isDefault) {
        badgeEl.textContent = 'Utama';
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.textContent = active.label || '';
        badgeEl.style.display = active.label ? 'inline-block' : 'none';
      }
    }
  },

  /* =========================================================
     Shopee "Alamat Saya" Modal Selector (Persis Screenshot 1)
     ========================================================= */
  openModal() {
    const modalId = 'address-book-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'shopee-addr-modal-overlay';
      document.body.appendChild(modal);
    }

    const addresses = this.getAddresses();
    const active = this.getActiveAddress();
    const currentActiveId = active ? active.id : (addresses[0]?.id || null);

    const listHtml = addresses.map(addr => {
      const isChecked = addr.id === currentActiveId;
      const badgeUtama = addr.isDefault ? `<span class="shopee-badge-utama">Utama</span>` : '';

      return `
        <div class="shopee-address-item ${isChecked ? 'selected' : ''}" onclick="PasarinAddressBook.chooseAddress('${addr.id}')">
          <div class="item-radio-col">
            <span class="shopee-radio-circle ${isChecked ? 'checked' : ''}"></span>
          </div>
          <div class="item-content-col">
            <div class="item-top-row">
              <div class="item-name-phone">
                <span class="item-name">${addr.name}</span>
                <span class="item-phone">${addr.phone}</span>
              </div>
              <a href="javascript:void(0)" class="item-edit-btn" onclick="event.stopPropagation(); PasarinAddressBook.openFormModal('${addr.id}')">Ubah</a>
            </div>
            <div class="item-address-text">
              ${addr.address}
            </div>
            ${badgeUtama ? `<div class="item-badges-row">${badgeUtama}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="shopee-addr-modal-dialog">
        <div class="shopee-dialog-header">
          <h4 class="dialog-title">Alamat Saya</h4>
          <button type="button" class="dialog-close-btn" onclick="PasarinAddressBook.closeModal()">&times;</button>
        </div>
        <div class="shopee-dialog-body">
          <div class="shopee-addr-list">
            ${listHtml}
          </div>
          <div class="shopee-dialog-actions-row">
            <button type="button" class="btn-shopee-tambah-alamat" onclick="PasarinAddressBook.openFormModal()">
              <span class="plus-sign">+</span> Tambah Alamat Baru
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('address-book-modal');
    if (modal) modal.classList.remove('active');
  },

  chooseAddress(id) {
    this.setActiveAddress(id);
    this.closeModal();
  },

  /* =========================================================
     Shopee "Alamat Baru" Modal (Persis Screenshot 2)
     ========================================================= */
  openFormModal(idToEdit = null) {
    const formModalId = 'address-form-modal';
    let modal = document.getElementById(formModalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = formModalId;
      modal.className = 'shopee-addr-modal-overlay';
      document.body.appendChild(modal);
    }

    const addresses = this.getAddresses();
    const existing = idToEdit ? addresses.find(a => a.id === idToEdit) : null;
    const isEdit = Boolean(existing);

    this.tempCoords = existing ? existing.coordinates : null;
    let currentTag = existing ? (existing.label || 'Rumah') : 'Rumah';

    modal.innerHTML = `
      <div class="shopee-addr-modal-dialog shopee-dialog-alamat-baru">
        <div class="shopee-dialog-header" style="border-bottom: none; padding-bottom: 0;">
          <h4 class="dialog-title">${isEdit ? 'Ubah Alamat' : 'Alamat Baru'}</h4>
        </div>
        <div class="shopee-dialog-body" style="padding-top: 16px;">
          
          <!-- Baris 1: Nama Lengkap & Nomor Telepon (2 Kolom) -->
          <div class="shopee-form-row-2col">
            <input type="text" id="ab-input-name" class="shopee-input-box" placeholder="Nama Lengkap" value="${existing ? existing.name : ''}">
            <input type="text" id="ab-input-phone" class="shopee-input-box" placeholder="Nomor Telepon" value="${existing ? existing.phone : ''}">
          </div>

          <!-- Baris 2: Provinsi, Kota, Kecamatan, Kode Pos (Dropdown) -->
          <div class="shopee-form-row-1col">
            <div class="shopee-dropdown-wrap" onclick="PasarinAddressBook.pickRegionQuick()">
              <input type="text" id="ab-input-region" class="shopee-input-box" placeholder="Provinsi, Kota, Kecamatan, Kode Pos" value="${existing ? (existing.region || '') : ''}">
              <span class="dropdown-arrow-icon">▾</span>
            </div>
          </div>

          <!-- Baris 3: Nama Jalan, Gedung, No. Rumah -->
          <div class="shopee-form-row-1col">
            <input type="text" id="ab-input-street" class="shopee-input-box" placeholder="Nama Jalan, Gedung, No. Rumah" value="${existing ? (existing.street || '') : ''}">
          </div>

          <!-- Baris 4: Detail Lainnya (Cth: Blok / Unit No., Patokan) -->
          <div class="shopee-form-row-1col">
            <input type="text" id="ab-input-detail" class="shopee-input-box" placeholder="Detail Lainnya (Cth: Blok / Unit No., Patokan)" value="${existing ? (existing.detail || '') : ''}">
          </div>

          <!-- Baris 5: Banner Peta + Tambah Lokasi (Persis Screenshot) -->
          <div class="shopee-map-banner-box">
            <button type="button" class="btn-shopee-tambah-lokasi" onclick="PasarinAddressBook.triggerMapPicker()">
              <span class="plus-icon">+</span> <span id="ab-map-btn-text">${this.tempCoords ? 'Ubah Titik Lokasi' : 'Tambah Lokasi'}</span>
            </button>
            <div id="ab-map-indicator" class="map-indicator-text" style="${this.tempCoords ? 'display:block;' : 'display:none;'}">
              📍 Titik Lokasi Peta Disematkan
            </div>
          </div>

          <!-- Baris 6: Tandai Sebagai (Rumah / Kantor) -->
          <div class="shopee-tag-select-group">
            <span class="tag-label">Tandai Sebagai:</span>
            <div class="tag-pills-wrap">
              <button type="button" class="shopee-tag-btn ${currentTag === 'Rumah' ? 'active' : ''}" onclick="PasarinAddressBook.selectTag(this, 'Rumah')">Rumah</button>
              <button type="button" class="shopee-tag-btn ${currentTag === 'Kantor' ? 'active' : ''}" onclick="PasarinAddressBook.selectTag(this, 'Kantor')">Kantor</button>
            </div>
            <input type="hidden" id="ab-selected-tag" value="${currentTag}">
          </div>

          <!-- Baris 7: Checkbox Atur sebagai Alamat Utama -->
          <div class="shopee-checkbox-row">
            <label class="shopee-checkbox-wrap">
              <input type="checkbox" id="ab-check-default" ${(existing ? existing.isDefault : addresses.length === 0) ? 'checked' : ''}>
              <span class="custom-check-square"></span>
              <span class="check-label-text">Atur sebagai Alamat Utama</span>
            </label>
          </div>

          <!-- Baris 8: Tombol Aksi (Nanti Saja | OK) -->
          <div class="shopee-form-footer-actions">
            <button type="button" class="btn-shopee-nanti-saja" onclick="PasarinAddressBook.closeFormModal()">Nanti Saja</button>
            <button type="button" class="btn-shopee-ok-solid" onclick="PasarinAddressBook.handleSaveAddress('${existing ? existing.id : ''}')">OK</button>
          </div>

        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  selectTag(btn, tag) {
    document.querySelectorAll('.shopee-tag-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const input = document.getElementById('ab-selected-tag');
    if (input) input.value = tag;
  },

  pickRegionQuick() {
    const regionInput = document.getElementById('ab-input-region');
    if (regionInput && !regionInput.value) {
      regionInput.value = 'GUNUNGANYAR, KOTA SURABAYA, JAWA TIMUR, ID, 60294';
    }
  },

  triggerMapPicker() {
    if (window.PasarinGmapsPicker) {
      const street = document.getElementById('ab-input-street')?.value || '';
      const region = document.getElementById('ab-input-region')?.value || '';
      const query = [street, region].filter(Boolean).join(', ') || 'Surabaya, Jawa Timur';

      window.PasarinGmapsPicker.open({
        initialAddress: query,
        onConfirm: (fullAddress, coords) => {
          this.tempCoords = coords || null;
          const streetInput = document.getElementById('ab-input-street');
          if (streetInput && fullAddress && !streetInput.value) {
            streetInput.value = fullAddress;
          }
          const ind = document.getElementById('ab-map-indicator');
          const btnText = document.getElementById('ab-map-btn-text');
          if (ind) ind.style.display = 'block';
          if (btnText) btnText.textContent = 'Ubah Titik Lokasi';
          if (window.showToast) window.showToast('📍 Titik peta berhasil disematkan!', 'success');
        }
      });
    }
  },

  handleSaveAddress(editId = '') {
    const name = document.getElementById('ab-input-name')?.value.trim();
    const phone = document.getElementById('ab-input-phone')?.value.trim();
    const region = document.getElementById('ab-input-region')?.value.trim() || 'KOTA SURABAYA, JAWA TIMUR, ID';
    const street = document.getElementById('ab-input-street')?.value.trim();
    const detail = document.getElementById('ab-input-detail')?.value.trim();
    const label = document.getElementById('ab-selected-tag')?.value || 'Rumah';
    const isDefault = document.getElementById('ab-check-default')?.checked;

    if (!name || !phone || !street) {
      alert('Silakan lengkapi Nama Lengkap, Nomor Telepon, dan Nama Jalan/No. Rumah.');
      return;
    }

    const payload = {
      name,
      phone,
      region,
      street,
      detail,
      label,
      isDefault,
      coordinates: this.tempCoords
    };

    if (editId) {
      this.updateAddress(editId, payload);
    } else {
      this.addAddress(payload);
    }

    this.closeFormModal();
    this.openModal();
  },

  closeFormModal() {
    const modal = document.getElementById('address-form-modal');
    if (modal) modal.classList.remove('active');
  }
};

window.PasarinAddressBook = PasarinAddressBook;

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    PasarinAddressBook.updateCheckoutDisplay();
  });
}
