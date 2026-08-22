import { useEffect, useState } from "react";
import { ShieldCheck, MapPin, Sparkles } from "lucide-react";

export default function Splash({ onComplete }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      id="splash-screen"
      onClick={onComplete}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0A0A0A] px-6 py-12 text-white cursor-pointer overflow-hidden select-none"
    >
      {/* Background Big Number Watermark */}
      <div className="absolute -left-8 top-12 opacity-[0.03] pointer-events-none select-none">
        <span className="text-[320px] font-black leading-none">01</span>
      </div>

      {/* Top subtle badge */}
      <div className={`transition-all duration-1000 transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"} flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF4D00] pt-4`}>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4D00] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4D00]"></span>
        </span>
        Mysuru Safety Grid
      </div>

      {/* Center Animated Masked Wordmark */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto relative z-10 w-full max-w-xs">
        <div className="relative">
          {/* Stark Bold Typography Headline */}
          <h1
            id="splash-wordmark"
            className="text-8xl sm:text-9xl font-black tracking-tighter leading-none text-[#FF4D00] select-none"
          >
            RAAHI
          </h1>
          <div className="text-2xl font-black tracking-tighter text-white uppercase mt-1">
            MYSURU
          </div>
        </div>

        {/* Tagline */}
        <p className={`text-white/70 text-sm font-medium tracking-wide leading-relaxed transition-all duration-1000 delay-300 transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          Community road safety net for Mysuru.
        </p>

        {/* Micro feature pills */}
        <div className={`flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 transition-all duration-1000 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <span className="flex items-center gap-1.5 text-white/80">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00]" /> Live Grid
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5 text-white/80">
            <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" /> Zero-Tap HUD
          </span>
        </div>
      </div>

      {/* Bottom tap prompt */}
      <div className="text-center text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold pb-4 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
        <span>Tap to start navigation</span>
      </div>
    </div>
  );
}
