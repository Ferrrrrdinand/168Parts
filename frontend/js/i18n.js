/* =========================================================
   168 Parts Surabaya - Internationalization & Translation (i18n)
   Bilingual System: Bahasa Indonesia (ID) & English (EN)
   Translates all text, banners, images, alt/titles, and modals
   ========================================================= */

const PasarinI18n = {
  currentLang: localStorage.getItem('pasarin_lang') || 'id',

  translations: {
    id: {
      // Topbar & Navigation
      'nav.seller_channel': '⚙️ Kanal Penjual',
      'nav.seller_channel_title': 'Kanal Penjual & Dashboard Admin 168 Parts (Wajib Login)',
      'nav.promo_vouchers': '🎁 Kode Promo & Voucher',
      'nav.promo_vouchers_title': 'Buka Pop up Kode Promo & Voucher',
      'nav.download_app': 'Unduh Aplikasi',
      'nav.follow_us': 'Ikuti kami di',
      'nav.notifications': 'Notifikasi',
      'nav.help': 'Bantuan',
      'nav.language': 'Bahasa Indonesia',
      'nav.register': 'Daftar',
      'nav.login': 'Log In',
      'nav.my_account': 'Akun Saya',
      'nav.my_orders': 'Pesanan Saya',
      'nav.logout': 'Keluar',
      'nav.cart_title': 'Keranjang Saya',
      'nav.search_placeholder': 'Cari produk, merek dan toko...',
      'nav.search_aria': 'Cari',

      // Hero Banners
      'banner.left_action': 'Daftar & Klaim 50RB ↗',
      'banner.left_badge': '✨ 168 PARTS SURABAYA',
      'banner.left_title': 'Pusat Sparepart & Alat Servis HP Terlengkap',
      'banner.pill_lcd': '🏷️ LCD & Baterai Bergaransi',
      'banner.pill_promo': '⚡ Promo Pengguna Baru: Diskon 50RB',
      'banner.pill_precision': '⭐ Sparepart Presisi Siap Kirim',
      'banner.right_action': 'Klaim Voucher ↗',
      'banner.right_discount_label': 'DISKON S.D.',
      'banner.right_voucher_label': 'VOUCHER',

      // Quick Categories
      'cat.all': 'Semua Kategori',
      'cat.lcd': 'LCD & Layar',
      'cat.battery': 'Baterai HP',
      'cat.ic': 'IC & Chipset',
      'cat.tools': 'Alat Servis & Blower',
      'cat.solder': 'Solder & Timah',
      'cat.glue': 'Lem & Perekat',
      'cat.backdoor': 'Backdoor & Kaca',
      'cat.tester': 'Alat Ukur & Tester',
      'cat.tweezers': 'Pinset & Pembuka',
      'cat.flex': 'Sparepart Fleksibel',
      'cat.promo': 'Semua Promo',

      // Flash Sale & Sections
      'section.flash_sale': 'FLASH SALE',
      'section.see_all': 'Lihat Semua ›',
      'section.recommended': 'Rekomendasi Produk Terbaik',
      'section.explore_more': 'Jelajahi Lebih Banyak Produk ›',

      // Product Card & Details
      'prod.sold': 'Terjual',
      'prod.stock': 'Stok:',
      'prod.buy_now': 'Beli Sekarang',
      'prod.add_cart': 'Tambah ke Keranjang',
      'prod.grade_a': 'Grade A+',
      'prod.warranty': 'Garansi Toko',
      'prod.ready_today': 'Siap Kirim Hari Ini',
      'prod.out_of_stock': 'Stok Habis',
      'prod.desc_title': 'Deskripsi Produk',
      'prod.spec_title': 'Spesifikasi Produk',

      // Search & Filters
      'search.filter_title': 'FILTER PENCARIAN',
      'search.cat_title': 'Kategori Produk',
      'search.price_title': 'Batas Harga (Rp)',
      'search.min_price': 'Harga Minimum',
      'search.max_price': 'Harga Maksimum',
      'search.apply_filter': 'Terapkan Filter',
      'search.reset_filter': 'Hapus Semua',
      'search.sort_title': 'Urutkan Menurut:',
      'search.sort_relevance': 'Terkait',
      'search.sort_latest': 'Terbaru',
      'search.sort_sales': 'Terlaris',
      'search.sort_price_asc': 'Harga: Rendah ke Tinggi',
      'search.sort_price_desc': 'Harga: Tinggi ke Rendah',
      'search.no_products': 'Tidak ada produk yang cocok dengan pencarian.',

      // Dock Bar
      'dock.promo': 'Promo Spesial',
      'dock.chat': 'Chat',

      // Profile Page
      'prof.title': 'Profil Saya',
      'prof.subtitle': 'Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun',
      'prof.username': 'Username',
      'prof.name': 'Nama',
      'prof.email': 'Email',
      'prof.phone': 'Nomor Telepon',
      'prof.shop_name': 'Nama Toko',
      'prof.gender': 'Jenis Kelamin',
      'prof.gender_male': 'Laki-laki',
      'prof.gender_female': 'Perempuan',
      'prof.gender_other': 'Lainnya',
      'prof.birthdate': 'Tanggal lahir',
      'prof.save': 'Simpan',
      'prof.choose_image': 'Pilih Gambar',
      'prof.image_hint': 'Ukuran gambar: maks. 1 MB. Format gambar: .JPEG, .PNG',
      'prof.change': 'Ubah',
      'prof.nav_account': 'Akun Saya',
      'prof.nav_profile': 'Profil',
      'prof.nav_address': 'Alamat',
      'prof.nav_password': 'Ubah Password',
      'prof.nav_orders': 'Pesanan Saya',
      'prof.nav_notifications': 'Notifikasi Toko',
      'prof.nav_vouchers': 'Voucher Saya',
      'prof.nav_coins': 'Koin 168 Parts Saya',
      'prof.nav_seller': 'Kanal Penjual (Admin)',

      // Promo Modal
      'modal_promo.badge': '🔥 PESTA DISKON SPESIAL',
      'modal_promo.title': '🎉 Sambut Promo Terbaik 168 Parts!',
      'modal_promo.desc': 'Klaim voucher belanja pengguna baru, gratis ongkir se-Indonesia, dan cashback kilat sekarang sebelum kuota habis!',
      'modal_promo.input_placeholder': 'PUNYA KODE VOUCHER / PROMO? KETIK DI SINI...',
      'modal_promo.use_btn': 'Gunakan Voucher',
      'modal_promo.tab_all': 'Semua Promo',
      'modal_promo.tab_ongkir': 'Gratis Ongkir',
      'modal_promo.tab_diskon': 'Diskon Belanja',
      'modal_promo.tab_cashback': 'Cashback',
      'modal_promo.tab_lokal': 'Brand Lokal',
      'modal_promo.claim_all': '✨ Klaim Semua Promo',
      'modal_promo.dont_show': 'Jangan tampilkan lagi hari ini',
      'modal_promo.quota_left': 'Sisa kuota:',
      'modal_promo.min_spend': 'Min. Belanja',
      'modal_promo.claim_btn': 'Klaim',
      'modal_promo.claimed_btn': 'Terklaim',

      // Notifications Modal
      'modal_notif.title': 'Pusat Notifikasi & Broadcast',
      'modal_notif.subtitle': 'Pengumuman promo, restok sparepart, dan info toko resmi 168 Parts',
      'modal_notif.mark_all': '✓ Baca Semua',
      'modal_notif.tab_all': 'Semua Pesan',
      'modal_notif.tab_promo': '🎟️ Promo',
      'modal_notif.tab_info': '📦 Info & Restok',
      'modal_notif.tab_system': '⚙️ Pengumuman Toko',
      'modal_notif.empty_title': 'Tidak Ada Notifikasi',
      'modal_notif.empty_desc': 'Semua pengumuman dan promo terbaru akan langsung muncul di sini.',
      'modal_notif.footer_hint': '💡 Butuh bantuan seputar pesanan atau sparepart?',
      'modal_notif.chat_btn': '💬 Chat Customer Care',
      'modal_notif.view_detail': 'Lihat Selengkapnya',
      'modal_notif.marked_read': '✓ Sudah Dibaca',

      // Chatbot
      'chat.title': 'Customer Care 168',
      'chat.ai_badge': 'AI BOT',
      'chat.ai_subtitle': '⚡ Balas Otomatis Seketika • 24/7',
      'chat.admin_badge': 'ADMIN CS',
      'chat.admin_subtitle': '👨‍💻 Terhubung dengan Teknisi Admin',
      'chat.notice': '💡 <b>Pusat Bantuan 168 Parts:</b> Tanya stok LCD, baterai, lacak pesanan, atau klaim voucher langsung di sini!',
      'chat.pill_admin': '👨‍💻 Hubungi Admin CS',
      'chat.pill_order': '📦 Status Pesanan',
      'chat.pill_stock': '🔍 Stok LCD & Baterai',
      'chat.pill_promo': '🎟️ Promo & Voucher',
      'chat.pill_location': '📍 Lokasi & Jam Buka',
      'chat.pill_warranty': '🔄 Garansi & Retur',
      'chat.input_placeholder': 'Ketik pertanyaan atau nomor pesanan Anda...',
      'chat.send_btn': 'Kirim Pesan',

      // Orders Modal
      'orders.title': 'Riwayat Pesanan Saya',
      'orders.empty': 'Belum ada riwayat pesanan.',
      'orders.track': 'Lacak Resi Pengiriman',
      'orders.return_btn': 'Ajukan Pengembalian / Retur',

      // Cart
      'cart.header': 'Keranjang Belanja',
      'cart.empty_title': 'Keranjang Belanja Anda Kosong',
      'cart.empty_desc': 'Yuk jelajahi ribuan pilihan sparepart dan alat servis HP berkualitas!',
      'cart.shop_now': 'Belanja Sekarang',
      'cart.total': 'Total Pembayaran:',
      'cart.checkout': 'Checkout Pesanan',

      // SEO & Footer
      'seo.title1': '168 Parts Surabaya - Pusat Sparepart & Peralatan Servis HP Terlengkap',
      'seo.desc1': '168 Parts adalah toko grosir dan eceran sparepart handphone terlengkap di Surabaya. Menyediakan LCD touchscreen, baterai original, IC power & chipset, fleksibel, lem LCD, solder station, blower, hingga perlengkapan teknisi HP dengan kualitas terjamin dan harga terbaik tanpa potongan komisi marketplace.',
      'seo.title2': 'Belanja Nyaman & Garansi Tes Teknisi',
      'seo.desc2': 'Dapatkan kemudahan order langsung dengan stok ready Surabaya, garansi tes fungsi sebelum dipasang lem, serta pengiriman cepat ke seluruh Indonesia. Mendukung pembayaran transfer bank, e-wallet, dan COD.',
      'footer.customer_care': 'Layanan Pelanggan',
      'footer.help_center': 'Pusat Bantuan',
      'footer.payment_methods': 'Metode Pembayaran',
      'footer.warranty': 'Garansi 168 Parts',
      'footer.return_policy': 'Pengembalian Barang',
      'footer.about_us': 'Tentang 168 Parts',
      'footer.careers': 'Karir',
      'footer.privacy': 'Kebijakan Privasi',
      'footer.blog': 'Blog Teknisi HP',
      'footer.shipping': 'Mitra Pengiriman',
      'footer.security': 'Keamanan Transaksi Terjamin',
      'footer.copyright': '© 2026 168 Parts Surabaya. Seluruh Hak Cipta Dilindungi Undang-Undang.',

      // Login & Register Page
      'login.back_home': '← Kembali ke Beranda',
      'login.title_login': 'Masuk',
      'login.title_register': 'Daftar Akun',
      'login.promo_heading': 'Pusat Sparepart & Alat Servis HP Surabaya',
      'login.promo_desc': 'Solusi lengkap kebutuhan sparepart HP, LCD touchscreen, baterai original, IC chipset, hingga perlengkapan servis teknisi profesional dengan harga grosir terbaik.',
      'login.feat1': 'Garansi Toko Resmi & Kualitas Presisi Grade A+',
      'login.feat2': 'Pengiriman Cepat Se-Indonesia & Siap Kirim Hari Ini',
      'login.feat3': 'Dukungan Konsultasi Sparepart Langsung Teknisi',
      'login.tab_login': 'Log In',
      'login.tab_register': 'Daftar Akun',
      'login.label_email': 'Email / Nomor Handphone',
      'login.placeholder_email': 'contoh: nama@email.com',
      'login.label_password': 'Password',
      'login.placeholder_password': 'Masukkan kata sandi...',
      'login.show_pwd': 'Lihat',
      'login.btn_login': 'Masuk ke Akun',
      'login.demo_title': 'Coba Cepat (Akun Siap Pakai di Supabase):',
      'login.demo_buyer': 'Akun Pembeli (demo)',
      'login.demo_admin': 'Akun Admin (admin@168parts)',
      'login.reg_name': 'Nama Lengkap',
      'login.reg_phone': 'Nomor Handphone (WhatsApp)',
      'login.reg_pwd_label': 'Password (Min. 8 Karakter, Huruf Besar, Kecil, Angka & Simbol)',
      'login.reg_address': 'Alamat Lengkap Pengiriman',
      'login.reg_gmaps': 'Pilih Lewat Peta (GMaps)',
      'login.btn_register': 'Daftar Sekarang'
    },

    en: {
      // Topbar & Navigation
      'nav.seller_channel': '⚙️ Seller Center',
      'nav.seller_channel_title': '168 Parts Seller Center & Admin Dashboard (Login Required)',
      'nav.promo_vouchers': '🎁 Promo Codes & Vouchers',
      'nav.promo_vouchers_title': 'Open Promo Codes & Vouchers Pop-up',
      'nav.download_app': 'Download App',
      'nav.follow_us': 'Follow us on',
      'nav.notifications': 'Notifications',
      'nav.help': 'Help Center',
      'nav.language': 'English',
      'nav.register': 'Register',
      'nav.login': 'Log In',
      'nav.my_account': 'My Account',
      'nav.my_orders': 'My Orders',
      'nav.logout': 'Sign Out',
      'nav.cart_title': 'My Cart',
      'nav.search_placeholder': 'Search parts, models, and tools...',
      'nav.search_aria': 'Search',

      // Hero Banners
      'banner.left_action': 'Register & Claim 50K ↗',
      'banner.left_badge': '✨ 168 PARTS SURABAYA',
      'banner.left_title': 'Complete Phone Spare Parts & Repair Equipment Center',
      'banner.pill_lcd': '🏷️ Warranty LCD & Batteries',
      'banner.pill_promo': '⚡ New User Promo: 50K Off',
      'banner.pill_precision': '⭐ Precision Parts Ready to Ship',
      'banner.right_action': 'Claim Voucher ↗',
      'banner.right_discount_label': 'UP TO',
      'banner.right_voucher_label': 'VOUCHER',

      // Quick Categories
      'cat.all': 'All Categories',
      'cat.lcd': 'LCD & Screens',
      'cat.battery': 'Phone Batteries',
      'cat.ic': 'IC & Chipsets',
      'cat.tools': 'Repair Tools & Blowers',
      'cat.solder': 'Soldering & Tin',
      'cat.glue': 'Adhesives & Glues',
      'cat.backdoor': 'Backdoors & Glass',
      'cat.tester': 'Meters & Testers',
      'cat.tweezers': 'Tweezers & Openers',
      'cat.flex': 'Flex Cables & Parts',
      'cat.promo': 'All Promos',

      // Flash Sale & Sections
      'section.flash_sale': 'FLASH SALE',
      'section.see_all': 'See All ›',
      'section.recommended': 'Top Recommended Products',
      'section.explore_more': 'Explore More Products ›',

      // Product Card & Details
      'prod.sold': 'Sold',
      'prod.stock': 'Stock:',
      'prod.buy_now': 'Buy Now',
      'prod.add_cart': 'Add to Cart',
      'prod.grade_a': 'Grade A+',
      'prod.warranty': 'Store Warranty',
      'prod.ready_today': 'Ready to Ship Today',
      'prod.out_of_stock': 'Out of Stock',
      'prod.desc_title': 'Product Description',
      'prod.spec_title': 'Product Specifications',

      // Search & Filters
      'search.filter_title': 'SEARCH FILTERS',
      'search.cat_title': 'Product Categories',
      'search.price_title': 'Price Range (IDR)',
      'search.min_price': 'Minimum Price',
      'search.max_price': 'Maximum Price',
      'search.apply_filter': 'Apply Filters',
      'search.reset_filter': 'Reset All',
      'search.sort_title': 'Sort By:',
      'search.sort_relevance': 'Relevance',
      'search.sort_latest': 'Latest',
      'search.sort_sales': 'Top Sales',
      'search.sort_price_asc': 'Price: Low to High',
      'search.sort_price_desc': 'Price: High to Low',
      'search.no_products': 'No products matched your search criteria.',

      // Dock Bar
      'dock.promo': 'Special Promo',
      'dock.chat': 'Chat',

      // Profile Page
      'prof.title': 'My Profile',
      'prof.subtitle': 'Manage your profile information to control, protect, and secure your account',
      'prof.username': 'Username',
      'prof.name': 'Full Name',
      'prof.email': 'Email Address',
      'prof.phone': 'Phone Number',
      'prof.shop_name': 'Shop / Workshop Name',
      'prof.gender': 'Gender',
      'prof.gender_male': 'Male',
      'prof.gender_female': 'Female',
      'prof.gender_other': 'Other',
      'prof.birthdate': 'Birth Date',
      'prof.save': 'Save Changes',
      'prof.choose_image': 'Choose Image',
      'prof.image_hint': 'Max image size: 1 MB. Formats: .JPEG, .PNG',
      'prof.change': 'Change',
      'prof.nav_account': 'My Account',
      'prof.nav_profile': 'Profile',
      'prof.nav_address': 'Addresses',
      'prof.nav_password': 'Change Password',
      'prof.nav_orders': 'My Orders',
      'prof.nav_notifications': 'Store Notifications',
      'prof.nav_vouchers': 'My Vouchers',
      'prof.nav_coins': 'My 168 Parts Coins',
      'prof.nav_seller': 'Seller Center (Admin)',

      // Promo Modal
      'modal_promo.badge': '🔥 SPECIAL DISCOUNT FESTIVAL',
      'modal_promo.title': '🎉 Welcome to 168 Parts Best Deals!',
      'modal_promo.desc': 'Claim new user shopping vouchers, nationwide free shipping, and instant cashback before quota runs out!',
      'modal_promo.input_placeholder': 'HAVE A VOUCHER / PROMO CODE? TYPE HERE...',
      'modal_promo.use_btn': 'Apply Voucher',
      'modal_promo.tab_all': 'All Promos',
      'modal_promo.tab_ongkir': 'Free Shipping',
      'modal_promo.tab_diskon': 'Discounts',
      'modal_promo.tab_cashback': 'Cashback',
      'modal_promo.tab_lokal': 'Local Brands',
      'modal_promo.claim_all': '✨ Claim All Promos',
      'modal_promo.dont_show': "Don't show again today",
      'modal_promo.quota_left': 'Remaining quota:',
      'modal_promo.min_spend': 'Min. Spend',
      'modal_promo.claim_btn': 'Claim',
      'modal_promo.claimed_btn': 'Claimed',

      // Notifications Modal
      'modal_notif.title': 'Notification & Broadcast Center',
      'modal_notif.subtitle': 'Promo news, spare part restocks, and official 168 Parts announcements',
      'modal_notif.mark_all': '✓ Mark All Read',
      'modal_notif.tab_all': 'All Messages',
      'modal_notif.tab_promo': '🎟️ Promos',
      'modal_notif.tab_info': '📦 Info & Restock',
      'modal_notif.tab_system': '⚙️ Store News',
      'modal_notif.empty_title': 'No Notifications',
      'modal_notif.empty_desc': 'All new announcements and promotions will appear here instantly.',
      'modal_notif.footer_hint': '💡 Need instant help with orders or spare parts?',
      'modal_notif.chat_btn': '💬 Chat Customer Care',
      'modal_notif.view_detail': 'View Details',
      'modal_notif.marked_read': '✓ Marked as Read',

      // Chatbot
      'chat.title': '168 Customer Care',
      'chat.ai_badge': 'AI BOT',
      'chat.ai_subtitle': '⚡ Instant Auto Reply • 24/7',
      'chat.admin_badge': 'ADMIN CS',
      'chat.admin_subtitle': '👨‍💻 Connected with Support Technician',
      'chat.notice': '💡 <b>168 Parts Help Center:</b> Ask about LCD stock, batteries, order tracking, or claim vouchers right here!',
      'chat.pill_admin': '👨‍💻 Contact Admin CS',
      'chat.pill_order': '📦 Order Status',
      'chat.pill_stock': '🔍 LCD & Battery Stock',
      'chat.pill_promo': '🎟️ Promos & Vouchers',
      'chat.pill_location': '📍 Store Location & Hours',
      'chat.pill_warranty': '🔄 Warranty & Returns',
      'chat.input_placeholder': 'Type your question or order number...',
      'chat.send_btn': 'Send Message',

      // Orders Modal
      'orders.title': 'My Order History',
      'orders.empty': 'No order history yet.',
      'orders.track': 'Track Shipment Waybill',
      'orders.return_btn': 'Request Return / Refund',

      // Cart
      'cart.header': 'Shopping Cart',
      'cart.empty_title': 'Your Shopping Cart is Empty',
      'cart.empty_desc': 'Explore thousands of premium phone spare parts and repair tools!',
      'cart.shop_now': 'Start Shopping',
      'cart.total': 'Total Payment:',
      'cart.checkout': 'Proceed to Checkout',

      // SEO & Footer
      'seo.title1': '168 Parts Surabaya - Complete Phone Spare Parts & Repair Equipment Center',
      'seo.desc1': '168 Parts is Surabaya’s premier wholesale and retail store for mobile phone spare parts. We supply touchscreens, original batteries, power ICs & chipsets, flex cables, UV glues, solder stations, heat guns, and professional technician tools with guaranteed quality at direct prices without marketplace fees.',
      'seo.title2': 'Comfortable Shopping & Technician Testing Warranty',
      'seo.desc2': 'Enjoy hassle-free ordering with ready stock in Surabaya, pre-installation function testing warranty, and express shipping across Indonesia. We accept bank transfer, e-wallets, and cash on delivery.',
      'footer.customer_care': 'Customer Service',
      'footer.help_center': 'Help Center',
      'footer.payment_methods': 'Payment Methods',
      'footer.warranty': '168 Parts Warranty',
      'footer.return_policy': 'Return & Refund Policy',
      'footer.about_us': 'About 168 Parts',
      'footer.careers': 'Careers',
      'footer.privacy': 'Privacy Policy',
      'footer.blog': 'Technician Blog',
      'footer.shipping': 'Shipping Partners',
      'footer.security': 'Guaranteed Secure Transactions',
      'footer.copyright': '© 2026 168 Parts Surabaya. All Rights Reserved.',

      // Login & Register Page
      'login.back_home': '← Back to Home',
      'login.title_login': 'Log In',
      'login.title_register': 'Register Account',
      'login.promo_heading': 'Complete Phone Spare Parts & Repair Equipment Center',
      'login.promo_desc': 'Your complete solution for mobile phone spare parts, touchscreens, original batteries, chipsets, and professional technician tools at the best wholesale prices.',
      'login.feat1': 'Official Store Warranty & Grade A+ Precision Quality',
      'login.feat2': 'Fast Delivery Across Indonesia & Ready to Ship Today',
      'login.feat3': 'Direct Technician Spare Part Consultation Support',
      'login.tab_login': 'Log In',
      'login.tab_register': 'Register Account',
      'login.label_email': 'Email / Mobile Phone Number',
      'login.placeholder_email': 'example: name@email.com',
      'login.label_password': 'Password',
      'login.placeholder_password': 'Enter password...',
      'login.show_pwd': 'Show',
      'login.btn_login': 'Sign In to Account',
      'login.demo_title': 'Quick Demo (Ready Accounts on Supabase):',
      'login.demo_buyer': 'Buyer Account (demo)',
      'login.demo_admin': 'Admin Account (admin@168parts)',
      'login.reg_name': 'Full Name',
      'login.reg_phone': 'Phone Number (WhatsApp)',
      'login.reg_pwd_label': 'Password (Min. 8 Chars, Upper, Lower, Number & Symbol)',
      'login.reg_address': 'Complete Delivery Address',
      'login.reg_gmaps': 'Choose via Map (GMaps)',
      'login.btn_register': 'Register Now'
    }
  },

  // Hero Slides bilingual content
  heroSlidesData: {
    id: [
      {
        badge: '✨ 168 PARTS SURABAYA',
        title: 'Pusat Sparepart & Alat Servis HP Terlengkap',
        pills: [
          '🏷️ LCD & Baterai Bergaransi',
          '⚡ Promo Pengguna Baru: Diskon 50RB',
          '⭐ Sparepart Presisi Siap Kirim'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: 'Foto Produk Sparepart & Alat Servis HP 168 Parts',
        bgGradient: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
        targetUrl: 'login.html?promo=newuser#register',
        actionText: 'Daftar & Klaim 50RB ↗',
        actionIcon: '🎁'
      },
      {
        badge: '▶️ YOUTUBE CHANNEL RESMI',
        title: 'Tutorial Servis & Review Sparepart 168 Parts',
        pills: [
          '🔧 Cara Pasang & Tes Touchscreen',
          '🔋 Solusi Baterai Presisi & Awet',
          '🎥 Tonton Gratis di YouTube'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: 'Tutorial Servis & Ulasan Sparepart YouTube',
        bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
        targetUrl: 'https://www.youtube.com',
        actionText: 'Tonton Video ↗',
        actionIcon: '🎥'
      },
      {
        badge: '🔥 PRODUK TERBARU',
        title: 'LCD iPhone 11 Incell True Tone Grade A+',
        pills: [
          '📱 Layar Jernih & Presisi Tinggi',
          '🛡️ Garansi Toko Langsung Tukar',
          '🚚 Stok Siap Kirim Hari Ini'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: 'Katalog LCD iPhone 11 Incell True Tone',
        bgGradient: 'linear-gradient(135deg, #701a75 0%, #a21caf 100%)',
        targetUrl: '#/search?category=LCD+%26+Layar',
        actionText: 'Lihat Produk ↗',
        actionIcon: '📦'
      },
      {
        badge: '🎁 VOUCHER PROMO SPESIAL',
        title: 'Klaim Voucher Diskon 80% & Cashback Kilat',
        pills: [
          '💰 Cashback Koin 50%',
          '🚚 Gratis Ongkir Se-Indonesia',
          '🎟️ Kuota Terbatas Setiap Hari'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: 'Koleksi Voucher Promo Spesial 168 Parts',
        bgGradient: 'linear-gradient(135deg, #831843 0%, #db2777 100%)',
        targetUrl: '#promo',
        actionText: 'Buka Voucher ↗',
        actionIcon: '🎟️'
      }
    ],
    en: [
      {
        badge: '✨ 168 PARTS SURABAYA',
        title: 'Complete Phone Spare Parts & Repair Equipment Center',
        pills: [
          '🏷️ Warranty LCD & Batteries',
          '⚡ New User Promo: 50K Off',
          '⭐ Precision Parts Ready to Ship'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: '168 Parts Phone Spare Parts & Repair Tools Photo',
        bgGradient: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
        targetUrl: 'login.html?promo=newuser#register',
        actionText: 'Register & Claim 50K ↗',
        actionIcon: '🎁'
      },
      {
        badge: '▶️ OFFICIAL YOUTUBE CHANNEL',
        title: 'Repair Tutorials & 168 Parts Product Reviews',
        pills: [
          '🔧 Touchscreen Installation & Test',
          '🔋 Precision & Long-lasting Batteries',
          '🎥 Watch Free on YouTube'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: 'YouTube Repair Tutorial & Spare Part Reviews',
        bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
        targetUrl: 'https://www.youtube.com',
        actionText: 'Watch Video ↗',
        actionIcon: '🎥'
      },
      {
        badge: '🔥 NEW ARRIVALS',
        title: 'LCD iPhone 11 Incell True Tone Grade A+',
        pills: [
          '📱 Ultra-Clear & High Precision Display',
          '🛡️ Instant Store Replacement Warranty',
          '🚚 In-Stock & Ready to Ship Today'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: 'LCD iPhone 11 Incell True Tone Catalog',
        bgGradient: 'linear-gradient(135deg, #701a75 0%, #a21caf 100%)',
        targetUrl: '#/search?category=LCD+%26+Layar',
        actionText: 'View Product ↗',
        actionIcon: '📦'
      },
      {
        badge: '🎁 SPECIAL PROMO VOUCHERS',
        title: 'Claim 80% Discount Vouchers & Lightning Cashback',
        pills: [
          '💰 50% Coin Cashback',
          '🚚 Nationwide Free Shipping',
          '🎟️ Limited Daily Quotas'
        ],
        modelImage: 'images/white-product.svg',
        modelAlt: '168 Parts Special Promo Voucher Collection',
        bgGradient: 'linear-gradient(135deg, #831843 0%, #db2777 100%)',
        targetUrl: '#promo',
        actionText: 'Open Vouchers ↗',
        actionIcon: '🎟️'
      }
    ]
  },

  // Category label translation map
  categoryMap: {
    id: {
      "LCD & Layar": "LCD & Layar",
      "Baterai HP": "Baterai HP",
      "IC & Chipset": "IC & Chipset",
      "Alat Servis & Blower": "Alat Servis & Blower",
      "Solder & Timah": "Solder & Timah",
      "Lem & Perekat": "Lem & Perekat",
      "Backdoor & Kaca": "Backdoor & Kaca",
      "Alat Ukur & Tester": "Alat Ukur & Tester",
      "Pinset & Pembuka": "Pinset & Pembuka",
      "Sparepart Fleksibel": "Sparepart Fleksibel",
      "Semua Promo": "Semua Promo"
    },
    en: {
      "LCD & Layar": "LCD & Screens",
      "Baterai HP": "Phone Batteries",
      "IC & Chipset": "IC & Chipsets",
      "Alat Servis & Blower": "Service Tools",
      "Solder & Timah": "Soldering & Tin",
      "Lem & Perekat": "Adhesives & Glues",
      "Backdoor & Kaca": "Backdoors & Glass",
      "Alat Ukur & Tester": "Meters & Testers",
      "Pinset & Pembuka": "Tweezers & Picks",
      "Sparepart Fleksibel": "Flex Cables",
      "Semua Promo": "All Promos"
    }
  },

  init() {
    this.applyLanguage(this.currentLang);
    this.bindDropdownEvents();
  },

  t(key, fallback = '') {
    const langDict = this.translations[this.currentLang] || this.translations['id'];
    return langDict[key] || fallback || key;
  },

  setLanguage(lang) {
    if (lang !== 'id' && lang !== 'en') lang = 'id';
    this.currentLang = lang;
    localStorage.setItem('pasarin_lang', lang);
    this.applyLanguage(lang);
    this.closeDropdown();

    // Notifikasi Toast
    if (window.showToast) {
      const msg = lang === 'en' 
        ? '🇬🇧 Language switched to English' 
        : '🇮🇩 Bahasa berhasil diubah ke Bahasa Indonesia';
      window.showToast(msg, 'success');
    }

    // Trigger custom event untuk komponen lain
    window.dispatchEvent(new CustomEvent('pasarin:languageChanged', { detail: { lang } }));
  },

  applyLanguage(lang) {
    const dict = this.translations[lang] || this.translations['id'];

    // 1. Update text pada elemen yang memiliki atribut data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // 2. Update placeholder pada elemen yang memiliki data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // 3. Update title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) {
        el.setAttribute('title', dict[key]);
      }
    });

    // 4. Update aria-label attribute
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (dict[key]) {
        el.setAttribute('aria-label', dict[key]);
      }
    });

    // 5. Update seluruh Gambar (img tags & image alts)
    this.translateImages(lang);

    // 6. Update Topbar Language Button & Menu State
    this.updateLanguageButton(lang);

    // 7. Update Dynamic Application Components (PasarinApp)
    if (window.PasarinApp) {
      this.syncPasarinApp(lang);
    }

    // 8. Update Chatbot jika sudah di-render
    if (window.PasarinChatBot) {
      this.syncChatbot(lang);
    }
  },

  translateImages(lang) {
    // Translate image alt and title attributes
    document.querySelectorAll('img').forEach(img => {
      // 1. Dynamic source swap jika ada gambar versi bahasa inggris
      if (lang === 'en') {
        const srcEn = img.getAttribute('data-i18n-src-en');
        if (srcEn) img.src = srcEn;
      } else {
        const srcId = img.getAttribute('data-i18n-src-id');
        if (srcId) img.src = srcId;
      }

      // 2. Alt text translation
      const altKey = img.getAttribute('data-i18n-alt');
      if (altKey && this.translations[lang] && this.translations[lang][altKey]) {
        img.alt = this.translations[lang][altKey];
        img.title = this.translations[lang][altKey];
      } else if (img.alt) {
        // Translation fallback untuk alt bawaan
        const altMap = {
          'Sparepart & Alat Servis': lang === 'en' ? 'Phone Spare Parts & Service Equipment' : 'Sparepart & Alat Servis',
          'Sparepart Kiri': lang === 'en' ? 'Phone Parts Left' : 'Sparepart Kiri',
          'Teknisi Kanan': lang === 'en' ? 'Technician Right' : 'Teknisi Kanan',
          'Foto Produk': lang === 'en' ? 'Product Photo' : 'Foto Produk'
        };
        if (altMap[img.alt]) {
          img.alt = altMap[img.alt];
          img.title = altMap[img.alt];
        }
      }
    });
  },

  updateLanguageButton(lang) {
    const labelEl = document.getElementById('lang-label');
    const flagEl = document.getElementById('lang-flag');
    const checkId = document.getElementById('check-id');
    const checkEn = document.getElementById('check-en');
    const optId = document.getElementById('lang-opt-id');
    const optEn = document.getElementById('lang-opt-en');

    if (labelEl) {
      labelEl.textContent = lang === 'en' ? 'English (US)' : 'Bahasa Indonesia';
    }
    if (flagEl) {
      flagEl.textContent = lang === 'en' ? '🇬🇧' : '🇮🇩';
    }
    if (checkId) checkId.style.display = lang === 'id' ? 'inline-block' : 'none';
    if (checkEn) checkEn.style.display = lang === 'en' ? 'inline-block' : 'none';

    if (optId) optId.classList.toggle('active', lang === 'id');
    if (optEn) optEn.classList.toggle('active', lang === 'en');
  },

  syncPasarinApp(lang) {
    const app = window.PasarinApp;

    // A. Sinkronkan Slide Banner Hero
    if (this.heroSlidesData[lang]) {
      app.heroSlides = JSON.parse(JSON.stringify(this.heroSlidesData[lang]));
      if (typeof app.renderHeroSlide === 'function') {
        app.renderHeroSlide(app.activeHeroSlideIndex || 0);
      }
    }

    // B. Sinkronkan Kategori Lingkaran Cepat
    if (typeof app.renderHomeCategories === 'function') {
      app.renderHomeCategories();
    }

    // C. Sinkronkan Banner Kanan
    const elPill1Title = document.getElementById('banner-right-pill1-title');
    const elPill2Title = document.getElementById('banner-right-pill2-title');
    const elActionText = document.getElementById('banner-right-action-text');
    if (elPill1Title) elPill1Title.textContent = lang === 'en' ? 'UP TO' : 'DISKON S.D.';
    if (elPill2Title) elPill2Title.textContent = lang === 'en' ? 'VOUCHER' : 'VOUCHER';
    if (elActionText) elActionText.textContent = lang === 'en' ? 'Claim Voucher ↗' : 'Klaim Voucher ↗';

    // D. Re-render Grid Produk & Flash Sale jika aktif
    if (typeof app.renderProducts === 'function' && app.filteredProducts) {
      app.renderProducts(app.filteredProducts);
    }
    if (typeof app.renderFlashSale === 'function') {
      app.renderFlashSale();
    }

    // E. Sinkronkan Modal Promo & Tiket Voucher jika terbuka
    if (typeof app.renderPromoTickets === 'function') {
      app.renderPromoTickets();
    }

    // F. Sinkronkan Modal Notifikasi jika terbuka
    if (typeof app.renderNotificationList === 'function') {
      app.renderNotificationList();
    }

    // G. Sinkronkan Keranjang Belanja jika ada
    if (window.PasarinCart && typeof window.PasarinCart.renderCartDrawer === 'function') {
      window.PasarinCart.renderCartDrawer();
    }
  },

  syncChatbot(lang) {
    const cb = window.PasarinChatBot;
    const badgeEl = document.getElementById('chatbot-bot-badge');
    const subtitleEl = document.getElementById('chatbot-subtitle');
    const noticeEl = document.querySelector('.chatbot-notice span');
    const inputEl = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('btn-chatbot-send');

    if (badgeEl && subtitleEl) {
      if (cb.roomStatus === 'admin_handling') {
        badgeEl.textContent = lang === 'en' ? 'ADMIN CS' : 'ADMIN CS';
        subtitleEl.textContent = lang === 'en' ? '👨‍💻 Connected with Support Technician' : '👨‍💻 Terhubung dengan Teknisi Admin';
      } else {
        badgeEl.textContent = lang === 'en' ? 'AI BOT' : 'AI BOT';
        subtitleEl.textContent = lang === 'en' ? '⚡ Instant Auto Reply • 24/7' : '⚡ Balas Otomatis Seketika • 24/7';
      }
    }

    if (noticeEl) {
      noticeEl.innerHTML = lang === 'en'
        ? '💡 <b>168 Parts Help Center:</b> Ask about LCD stock, batteries, order tracking, or claim vouchers right here!'
        : '💡 <b>Pusat Bantuan 168 Parts:</b> Tanya stok LCD, baterai, lacak pesanan, atau klaim voucher langsung di sini!';
    }

    if (inputEl) {
      inputEl.setAttribute('placeholder', lang === 'en' ? 'Type your question or order number...' : 'Ketik pertanyaan atau nomor pesanan Anda...');
    }

    if (sendBtn) {
      sendBtn.setAttribute('title', lang === 'en' ? 'Send Message' : 'Kirim Pesan');
    }

    // Render ulang quick chips
    const pillsWrap = document.getElementById('chatbot-quick-pills');
    if (pillsWrap) {
      if (lang === 'en') {
        pillsWrap.innerHTML = `
          <button type="button" class="chat-pill" style="background:#fff1f2; color:#be123c; border-color:#fecdd3; font-weight:800;" onclick="PasarinChatBot.sendQuickPrompt('Contact Admin CS')">👨‍💻 Contact Admin CS</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Order Status')">📦 Order Status</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('LCD & Battery Stock')">🔍 LCD & Battery Stock</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Promos & Vouchers')">🎟️ Promos & Vouchers</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Store Location & Hours')">📍 Store Location & Hours</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Warranty & Return Policy')">🔄 Warranty & Returns</button>
        `;
      } else {
        pillsWrap.innerHTML = `
          <button type="button" class="chat-pill" style="background:#fff1f2; color:#be123c; border-color:#fecdd3; font-weight:800;" onclick="PasarinChatBot.sendQuickPrompt('Hubungi Admin CS')">👨‍💻 Hubungi Admin CS</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Cek Status Pesanan')">📦 Status Pesanan</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Tanya Stok LCD & Baterai')">🔍 Stok LCD & Baterai</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Voucher & Promo Diskon')">🎟️ Promo & Voucher</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Lokasi Toko & Jam Buka')">📍 Lokasi & Jam Buka</button>
          <button type="button" class="chat-pill" onclick="PasarinChatBot.sendQuickPrompt('Syarat Garansi & Retur Barang')">🔄 Garansi & Retur</button>
        `;
      }
    }
  },

  toggleDropdown() {
    const menu = document.getElementById('lang-dropdown-menu');
    if (!menu) return;
    const isShowing = menu.style.display === 'block';
    menu.style.display = isShowing ? 'none' : 'block';
  },

  closeDropdown() {
    const menu = document.getElementById('lang-dropdown-menu');
    if (menu) menu.style.display = 'none';
  },

  bindDropdownEvents() {
    // Klik di luar dropdown untuk menutup
    document.addEventListener('click', (e) => {
      const container = document.getElementById('lang-dropdown-wrapper');
      if (container && !container.contains(e.target)) {
        this.closeDropdown();
      }
    });
  }
};

// Global expose
window.PasarinI18n = PasarinI18n;

// Inisialisasi otomatis setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
  PasarinI18n.init();
});
