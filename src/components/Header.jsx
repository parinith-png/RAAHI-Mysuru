import { MapPin, SlidersHorizontal, Sparkles, X, ShieldAlert } from "lucide-react";

export default function Header({
  forYouActive,
  onToggleForYou,
  onOpenLandmarkModal,
  selectedLandmarks,
  onRemoveLandmark,
  cityAlertCount = 7,
  scrollProgress = 1,
  onLogoClick,
}) {
  return (
    <header
      id="app-sticky-header"
      className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 px-4 pt-3 pb-3 transition-all"
    >
      {/* Top Branding Row */}
      <div className="flex items-center justify-between">
        {/* Left: Stark Raahi Wordmark + Location Pin */}
        <div
          id="header-brand-container"
          onClick={onLogoClick}
          className="flex items-center gap-3 cursor-pointer group"
          style={{
            opacity: scrollProgress > 0.1 ? 1 : 0.4,
            transform: `scale(${scrollProgress > 0.1 ? 1 : 0.9}) translate(${scrollProgress > 0.1 ? 0 : -8}px, 0px)`,
            transition: "all 0.25s ease-out",
          }}
          title="Tap to return to top"
        >
          <div className="flex items-baseline gap-1">
            <span
              id="header-brand-logo"
              className="text-2xl font-black tracking-tighter text-white select-none group-hover:text-[#FF4D00] transition-colors"
            >
              RAAHI
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] group-hover:scale-125 transition-transform" />
          </div>

          <div className="h-3.5 w-px bg-white/20" />

          {/* Current City Label */}
          <div
            id="header-city-pill"
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded group-hover:border-white/30 transition-colors"
          >
            <MapPin className="w-2.5 h-2.5 text-[#FF4D00]" />
            <span>Mysuru</span>
          </div>
        </div>

        {/* Right: Live Safety Net Alert Counter */}
        <div className="flex items-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded">
          <ShieldAlert className="w-3.5 h-3.5 text-[#FF4D00]" />
          <span className="font-black text-white">{cityAlertCount}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Alerts</span>
        </div>
      </div>

      {/* Filter Controls: For You Toggle & Landmark Filter Button */}
      <div className="flex items-center gap-2 mt-3">
        {/* 'For You' Toggle Button */}
        <button
          id="toggle-for-you-btn"
          onClick={onToggleForYou}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            forYouActive
              ? "bg-[#FF4D00] text-white shadow-sm font-black"
              : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
          }`}
          aria-pressed={forYouActive}
        >
          <Sparkles className={`w-3.5 h-3.5 ${forYouActive ? "text-white fill-current" : "text-[#FF4D00]"}`} />
          <span>For You</span>
        </button>

        {/* Filter Landmarks Button */}
        <button
          id="open-landmark-filter-btn"
          onClick={onOpenLandmarkModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
            selectedLandmarks.length > 0
              ? "bg-white text-black border border-white"
              : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Landmarks</span>
          {selectedLandmarks.length > 0 && (
            <span className="bg-[#FF4D00] text-white font-black rounded-full w-4 h-4 text-[9px] flex items-center justify-center">
              {selectedLandmarks.length}
            </span>
          )}
        </button>

        {forYouActive && (
          <span className="text-[10px] uppercase tracking-wider text-white/40 ml-auto font-medium">
            Common corridors
          </span>
        )}
      </div>

      {/* Removable Selected Landmark Chips */}
      {selectedLandmarks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-white/10">
          <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">Near:</span>
          {selectedLandmarks.map((lm) => (
            <span
              key={lm}
              id={`active-landmark-chip-${lm.replace(/\s+/g, "-")}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded"
            >
              <span>{lm}</span>
              <button
                onClick={() => onRemoveLandmark(lm)}
                className="hover:text-[#FF4D00] transition-colors"
                aria-label={`Remove filter for ${lm}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
