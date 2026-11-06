import React, { useState, useEffect } from 'react';

interface RealisticLoaderProps {
  isLoading: boolean;
  onAnimationComplete?: () => void;
}

export const RealisticLoader: React.FC<RealisticLoaderProps> = ({ isLoading, onAnimationComplete }) => {
  const [progress, setProgress] = useState(12);
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Dynamic progressive progress counter
  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(38), 250);
    const timer2 = setTimeout(() => setProgress(65), 550);
    const timer3 = setTimeout(() => setProgress(88), 850);
    const timer4 = setTimeout(() => setProgress(100), 1150);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Handle smooth fade out exit
  useEffect(() => {
    if (!isLoading && progress >= 88) {
      setProgress(100);
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        const removeTimer = setTimeout(() => {
          setShouldRender(false);
          if (onAnimationComplete) onAnimationComplete();
        }, 500);
        return () => clearTimeout(removeTimer);
      }, 400);
      return () => clearTimeout(exitTimer);
    }
  }, [isLoading, progress, onAnimationComplete]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Memuat aplikasi 168 Parts"
    >
      <div className="flex flex-col items-center max-w-[420px] w-[90%] p-6 sm:p-8 text-center select-none">
        {/* Animated Cart & Physics Simulation Stage */}
        <div className="relative w-[180px] sm:w-[200px] h-[130px] flex items-end justify-center mb-5">
          {/* Parallax Ground Speed Track Lines */}
          <svg className="absolute bottom-1 left-0 w-full h-[22px] overflow-visible pointer-events-none" viewBox="0 0 200 22" fill="none">
            {/* Speed dash 1 (Fast rolling road) */}
            <line
              x1="0"
              y1="16"
              x2="200"
              y2="16"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="14 16"
              className="animate-[roadTrack_0.38s_linear_infinite]"
            />
            {/* Speed dash 2 (Secondary ground blur) */}
            <line
              x1="0"
              y1="20"
              x2="200"
              y2="20"
              stroke="#fecdd3"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="8 20"
              className="animate-[roadTrack_0.6s_linear_infinite]"
            />
          </svg>

          {/* Parabolic Gravity Jumping Spare Parts into Cart */}
          {/* Item 1: LCD Screen */}
          <div className="absolute pointer-events-none will-change-transform z-10 animate-[jumpLcd_2.4s_cubic-bezier(0.25,1,0.5,1)_infinite]">
            <span className="text-2xl drop-shadow-md">📱</span>
          </div>

          {/* Item 2: Battery Li-ion */}
          <div className="absolute pointer-events-none will-change-transform z-10 animate-[jumpBattery_2.4s_cubic-bezier(0.25,1,0.5,1)_infinite_0.6s]">
            <span className="text-2xl drop-shadow-md">🔋</span>
          </div>

          {/* Item 3: IC Chipset / Transceiver */}
          <div className="absolute pointer-events-none will-change-transform z-10 animate-[jumpIc_2.4s_cubic-bezier(0.25,1,0.5,1)_infinite_1.2s]">
            <span className="text-2xl drop-shadow-md">⚡</span>
          </div>

          {/* Item 4: Lem LANRUI I9 / Servis Tool */}
          <div className="absolute pointer-events-none will-change-transform z-10 animate-[jumpTool_2.4s_cubic-bezier(0.25,1,0.5,1)_infinite_1.8s]">
            <span className="text-2xl drop-shadow-md">🧪</span>
          </div>

          {/* Shopping Cart Chassis with Mechanical Suspension Bounce */}
          <div className="relative w-[114px] h-[92px] will-change-transform flex items-end justify-center animate-[cartSuspensionRide_1.1s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]">
            <svg className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(190,18,60,0.22)]" viewBox="0 0 100 84" fill="none">
              {/* Dynamic Ground Contact Shadow (Expands & contracts with chassis height) */}
              <ellipse
                cx="50"
                cy="76"
                rx="36"
                ry="4"
                fill="#881337"
                className="opacity-25 origin-center animate-[shadowPulse_1.1s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]"
              />

              {/* Red-tinted Mesh Basket Gradient */}
              <defs>
                <linearGradient id="basketGradRed" x1="20" y1="18" x2="84" y2="52" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#be123c" stopOpacity="0.28" />
                  <stop offset="1" stopColor="#e11d48" stopOpacity="0.12" />
                </linearGradient>
                <linearGradient id="chassisChrome" x1="8" y1="12" x2="88" y2="56" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#e11d48" />
                  <stop offset="0.5" stopColor="#be123c" />
                  <stop offset="1" stopColor="#881337" />
                </linearGradient>
              </defs>

              {/* Basket Fill Mesh */}
              <path
                d="M24 20h60l-8 30H32L24 20z"
                fill="url(#basketGradRed)"
                stroke="#be123c"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />

              {/* Wireframe Grid Details */}
              <path
                d="M38 24v22M52 24v22M66 24v22M27 31h53M29 41h47"
                stroke="#be123c"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />

              {/* Tubular Heavy Duty Red Frame Chassis */}
              <path
                d="M10 14h14l10 38h40l9-24H28"
                stroke="url(#chassisChrome)"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Ergonomic Red Rubber Handle Grip */}
              <path d="M8 14h8" stroke="#f43f5e" strokeWidth="5.2" strokeLinecap="round" />

              {/* Wheel Strut Bars with Suspension Angle */}
              <path d="M35 52l-3 12M70 52l3 12" stroke="#be123c" strokeWidth="3" strokeLinecap="round" />

              {/* Realistic Rear Spoke Wheel (Rolls Without Slip) */}
              <g className="origin-[32px_66px] animate-[wheelSpin_0.42s_linear_infinite]">
                <circle cx="32" cy="66" r="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <circle cx="32" cy="66" r="3.2" fill="#be123c" />
                <circle cx="32" cy="66" r="1.4" fill="#ffffff" />
                <line x1="32" y1="58" x2="32" y2="74" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="24" y1="66" x2="40" y2="66" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
              </g>

              {/* Realistic Front Castor Spoke Wheel */}
              <g className="origin-[73px_66px] animate-[wheelSpin_0.42s_linear_infinite]">
                <circle cx="73" cy="66" r="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <circle cx="73" cy="66" r="3.2" fill="#be123c" />
                <circle cx="73" cy="66" r="1.4" fill="#ffffff" />
                <line x1="73" y1="58" x2="73" y2="74" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="65" y1="66" x2="81" y2="66" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>

        {/* Brand Information & Progress Indicator */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-[11px] font-black px-3 py-1 rounded-full border border-rose-200 shadow-sm tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>168 Parts • Surabaya</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            Menyiapkan Katalog Sparepart HP
            <span className="inline-block w-4 text-left animate-pulse">...</span>
          </h3>

          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Sinkronisasi LCD, baterai original, IC chipset, dan alat servis teknisi langsung dari Surabaya
          </p>

          {/* Realistic Progressive Loading Bar */}
          <div className="w-56 sm:w-64 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 mx-auto mt-2 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#be123c] via-[#e11d48] to-[#f43f5e] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider pt-0.5">
            {progress}% MEMUAT DATA
          </div>
        </div>
      </div>
    </div>
  );
};

