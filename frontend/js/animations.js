/* =========================================================
   168 Parts Surabaya - Animation Engine
   High-performance canvas confetti, fly-to-cart,
   voucher sparkles & micro-interactions.
   ========================================================= */

const PasarinAnimations = {
  confettiCanvas: null,
  confettiCtx: null,
  confettiParticles: [],
  confettiAnimId: null,

  // Inisialisasi Canvas Confetti Global
  initConfettiCanvas() {
    if (this.confettiCanvas && document.body.contains(this.confettiCanvas)) {
      return this.confettiCanvas;
    }
    const canvas = document.createElement('canvas');
    canvas.id = 'celebration-confetti-canvas';
    document.body.appendChild(canvas);
    this.confettiCanvas = canvas;
    this.confettiCtx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    return canvas;
  },

  // 1. 🎉 ANIMASI CELEBRATION CHECKOUT (CONFETTI & KOIN EMAS)
  launchCheckoutCelebration() {
    const canvas = this.initConfettiCanvas();
    const ctx = this.confettiCtx;
    const count = 140;
    const colors = ['#be123c', '#e11d48', '#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];
    const emojis = ['🪙', '✨', '🎉', '⭐'];

    this.confettiParticles = [];

    for (let i = 0; i < count; i++) {
      const isEmoji = Math.random() < 0.22;
      this.confettiParticles.push({
        x: canvas.width * (0.35 + Math.random() * 0.3),
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 22,
        vy: -Math.random() * 20 - 6,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        isEmoji: isEmoji,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        gravity: 0.55 + Math.random() * 0.2,
        drag: 0.96,
        opacity: 1,
        wobble: Math.random() * 10
      });
    }

    if (this.confettiAnimId) cancelAnimationFrame(this.confettiAnimId);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeParticles = 0;

      for (let p of this.confettiParticles) {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.wobble += 0.1;

        if (p.y < canvas.height + 50) {
          activeParticles++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);

          if (p.isEmoji) {
            ctx.font = `${p.size * 2}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.emoji, 0, 0);
          } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size * Math.cos(p.wobble), p.size * 1.6);
          }
          ctx.restore();
        }
      }

      if (activeParticles > 0) {
        this.confettiAnimId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    render();
  },

  // 2. 🎟️ ANIMASI SAAT MENGGUNAKAN PROMO / VOUCHER
  triggerVoucherApplied(targetElement, discountText = 'Diskon') {
    // 1. Tag Pulse Effect
    if (targetElement) {
      targetElement.classList.remove('voucher-applied-pulse');
      void targetElement.offsetWidth; // reflow
      targetElement.classList.add('voucher-applied-pulse');
    }

    // 2. Floating Savings Pill
    const rect = targetElement ? targetElement.getBoundingClientRect() : { left: window.innerWidth / 2, top: 200, width: 0 };
    const pill = document.createElement('div');
    pill.className = 'floating-savings-pill';
    pill.innerHTML = `<span>🎉</span> <span>Hemat ${discountText}!</span> <span>🎟️</span>`;
    pill.style.left = `${Math.max(20, rect.left + rect.width / 2 - 80)}px`;
    pill.style.top = `${Math.max(80, rect.top - 20)}px`;
    document.body.appendChild(pill);

    setTimeout(() => {
      if (pill && pill.parentNode) pill.parentNode.removeChild(pill);
    }, 1800);

    // 3. Highlight kalkulasi voucher row
    const voucherRow = document.getElementById('chk-calc-voucher-row');
    if (voucherRow) {
      voucherRow.classList.remove('calc-row-highlight');
      void voucherRow.offsetWidth;
      voucherRow.classList.add('calc-row-highlight');
    }

    // 4. Mini Confetti Sparkle di sekitar voucher
    this.launchMiniSparkle(rect.left + rect.width / 2, rect.top);
  },

  // Sparkle mini untuk voucher dan klaim promo
  launchMiniSparkle(x, y) {
    const canvas = this.initConfettiCanvas();
    const ctx = this.confettiCtx;
    const sparkles = [];
    const colors = ['#be123c', '#fbbf24', '#10b981', '#f43f5e'];

    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      sparkles.push({
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0.95
      });
    }

    const anim = () => {
      let alive = false;
      for (let s of sparkles) {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.25;
        s.alpha *= s.life;

        if (s.alpha > 0.05) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = s.alpha;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (alive) {
        requestAnimationFrame(anim);
      }
    };

    anim();
  },

  // 3. 🪙 ANIMASI PENUKARAN KOIN (COIN 3D FLIP)
  triggerCoinRedeemed(coinEl) {
    const coin = coinEl || document.querySelector('.coin-s-badge') || document.querySelector('#chk-coin-row span');
    if (coin) {
      coin.classList.remove('coin-3d-spin');
      void coin.offsetWidth;
      coin.classList.add('coin-3d-spin');
    }

    const coinRow = document.getElementById('chk-calc-coins-row');
    if (coinRow) {
      coinRow.classList.remove('calc-row-highlight');
      void coinRow.offsetWidth;
      coinRow.classList.add('calc-row-highlight');
    }
  },

  // 4. 🛍️ ANIMASI TERBANG KE KERANJANG ("FLY TO CART")
  flyToCart(originEl, customImg = null) {
    if (!originEl) return;
    const targetCart = document.querySelector('.btn-cart') || document.getElementById('cart-btn') || document.querySelector('.sr a.cart');
    if (!targetCart) return;

    const startRect = originEl.getBoundingClientRect();
    const endRect = targetCart.getBoundingClientRect();

    const particle = document.createElement('div');
    particle.className = 'fly-to-cart-particle';
    particle.style.width = '48px';
    particle.style.height = '48px';
    particle.style.left = `${startRect.left + startRect.width / 2 - 24}px`;
    particle.style.top = `${startRect.top + startRect.height / 2 - 24}px`;

    if (customImg && !customImg.includes('unsplash.com')) {
      particle.style.backgroundImage = `url('${customImg}')`;
    } else {
      particle.style.backgroundColor = '#be123c';
      particle.style.display = 'flex';
      particle.style.alignItems = 'center';
      particle.style.justifyContent = 'center';
      particle.style.color = '#ffffff';
      particle.style.fontSize = '22px';
      particle.innerHTML = '🛒';
    }

    document.body.appendChild(particle);

    requestAnimationFrame(() => {
      particle.style.left = `${endRect.left + endRect.width / 2 - 12}px`;
      particle.style.top = `${endRect.top + endRect.height / 2 - 12}px`;
      particle.style.width = '24px';
      particle.style.height = '24px';
      particle.style.opacity = '0.3';
      particle.style.transform = 'scale(0.5) rotate(360deg)';
    });

    setTimeout(() => {
      if (particle.parentNode) particle.parentNode.removeChild(particle);

      // Bounce effect on cart badge
      const badges = document.querySelectorAll('.cart-badge, .badge-cart, #cart-badge');
      badges.forEach(b => {
        b.classList.remove('cart-badge-bounce');
        void b.offsetWidth;
        b.classList.add('cart-badge-bounce');
      });
    }, 750);
  },

  // 5. 🔢 ANIMASI NUMBER ROLL-UP (MENGHITUNG ANGKA HALUS)
  animateNumber(element, start, end, duration = 800, formatter = null) {
    if (!element) return;
    const startTime = performance.now();
    const range = end - start;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const ease = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + range * ease);

      element.textContent = formatter ? formatter(current) : current.toLocaleString('id-ID');

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = formatter ? formatter(end) : end.toLocaleString('id-ID');
      }
    };

    requestAnimationFrame(update);
  }
};

window.PasarinAnimations = PasarinAnimations;
