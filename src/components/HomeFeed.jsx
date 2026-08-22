import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Eye,
  Zap,
  MapPin,
  Navigation as NavIcon,
  BellRing,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Radio,
} from "lucide-react";
import Header from "./Header";
import { FlagDetailModal } from "./FlagDetailModal";
import { LandmarkFilterModal } from "./LandmarkFilterModal";

export default function HomeFeed({
  flags,
  onUpvoteFlag,
  locationEnabled,
  onEnableLocation,
  onNavigateToMap,
}) {
  const [forYouActive, setForYouActive] = useState(false);
  const [isLandmarkModalOpen, setIsLandmarkModalOpen] = useState(false);
  const [selectedLandmarks, setSelectedLandmarks] = useState([]);
  const [selectedFlagForDetail, setSelectedFlagForDetail] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Monitor scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const progress = Math.min(1, Math.max(0, scrollY / 160));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToFeed = () => {
    const feedTarget = document.getElementById("bulletins-feed-start");
    if (feedTarget) {
      const headerOffset = 90;
      const elementPosition = feedTarget.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 300,
        behavior: "smooth",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Toggle landmark
  const handleToggleLandmark = (landmarkName) => {
    setSelectedLandmarks((prev) =>
      prev.includes(landmarkName)
        ? prev.filter((item) => item !== landmarkName)
        : [...prev, landmarkName]
    );
  };

  const handleRemoveLandmark = (landmarkName) => {
    setSelectedLandmarks((prev) => prev.filter((item) => item !== landmarkName));
  };

  // Filter flags
  const filteredFlags = flags.filter((flag) => {
    if (forYouActive && !flag.isUserRoute) {
      return false;
    }
    if (selectedLandmarks.length > 0) {
      if (!flag.landmarkNear || !selectedLandmarks.includes(flag.landmarkNear)) {
        return false;
      }
    }
    return true;
  });

  const dateGroups = ["Today", "Yesterday", "Earlier this week"];

  const getTagMeta = (type) => {
    switch (type) {
      case "hazard":
        return {
          label: "HAZARD",
          icon: AlertTriangle,
          badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          iconColor: "text-rose-400",
        };
      case "blindspot":
        return {
          label: "BLIND SPOT",
          icon: Eye,
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          iconColor: "text-amber-400",
        };
      case "nearmiss":
        return {
          label: "NEAR-MISS",
          icon: Zap,
          badgeBg: "bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/40",
          iconColor: "text-[#FF4D00]",
        };
      default:
        return {
          label: "SAFETY",
          icon: AlertTriangle,
          badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          iconColor: "text-rose-400",
        };
    }
  };

  return (
    <div id="home-feed-screen" className="flex flex-col min-h-screen pb-24 max-w-[430px] mx-auto bg-[#0A0A0A] text-white">
      {/* Sticky Header */}
      <Header
        forYouActive={forYouActive}
        onToggleForYou={() => setForYouActive(!forYouActive)}
        onOpenLandmarkModal={() => setIsLandmarkModalOpen(true)}
        selectedLandmarks={selectedLandmarks}
        onRemoveLandmark={handleRemoveLandmark}
        cityAlertCount={flags.filter((f) => f.active).length}
        scrollProgress={scrollProgress}
        onLogoClick={scrollToTop}
      />

      {/* Main Content */}
      <main className="px-4 py-3 space-y-4">
        {/* hero section with stark transition */}
        <section
          id="hero-masked-header-card"
          onClick={scrollToFeed}
          style={{
            opacity: Math.max(0, 1 - scrollProgress * 1.4),
            transform: `scale(${Math.max(0.9, 1 - scrollProgress * 0.12)}) translate(0px, ${-scrollProgress * 25}px)`,
            pointerEvents: scrollProgress > 0.6 ? "none" : "auto",
            transition: "all 0.15s ease-out",
          }}
          className="relative cursor-pointer select-none rounded-2xl bg-gradient-to-b from-[#141414] via-[#101010] to-[#0A0A0A] border border-white/15 p-5 sm:p-6 shadow-2xl overflow-hidden group hover:border-[#FF4D00]/40 transition-colors"
        >
          <div className="absolute -right-3 -bottom-5 opacity-[0.04] pointer-events-none select-none font-black text-9xl tracking-tighter">
            01
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#FF4D00]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4D00] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4D00]" />
              </span>
              <span>Mysuru Safety Grid</span>
            </div>

            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              Live Grid
            </span>
          </div>

          <div className="my-3.5 relative">
            <h1
              id="hero-raahi-wordmark"
              className="text-6xl sm:text-7xl font-black tracking-tighter leading-none text-white select-none group-hover:text-[#FF4D00] transition-colors"
            >
              RAAHI
              <span className="text-[#FF4D00] inline-block ml-0.5 animate-pulse">.</span>
            </h1>
            <div className="text-base sm:text-lg font-black tracking-[0.2em] text-white/90 uppercase mt-1">
              MYSURU
            </div>
          </div>

          <p className="text-xs text-white/70 font-medium leading-relaxed max-w-[280px]">
            Community road safety net for Mysuru.
          </p>

          <div className="flex items-center gap-2.5 pt-3 mt-3 border-t border-white/10 text-[9px] uppercase tracking-[0.15em] font-black text-white/50">
            <span className="flex items-center gap-1 text-white/80">
              <ShieldCheck className="w-3" /> {flags.filter((f) => f.active).length} Active Alerts
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-white/80">
              <Radio className="w-3" /> Zero-Tap HUD
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-[10px] uppercase font-black tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
            <span className="flex items-center gap-1.5 text-[#FF4D00]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tap or scroll for bulletins</span>
            </span>
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white">
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </section>

        {/* Bulletins Section */}
        <div id="bulletins-feed-start" className="space-y-4">
          {!locationEnabled && (
            <div
              id="enable-location-banner"
              className="p-4 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FF4D00]/15 text-[#FF4D00] flex items-center justify-center shrink-0 border border-[#FF4D00]/30">
                  <NavIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white">Enable live location</p>
                  <p className="text-[11px] text-white/60 mt-0.5">Real-time proximity warnings for Mysuru roads</p>
                </div>
              </div>
              <button
                id="enable-location-btn"
                onClick={onEnableLocation}
                className="px-3.5 py-2 bg-white text-black text-xs font-black uppercase tracking-wider rounded transition-colors shrink-0 hover:bg-[#FF4D00] hover:text-white"
              >
                Enable
              </button>
            </div>
          )}

          {/* Quick Map Action */}
          <div className="flex items-center justify-between bg-[#121212] border border-white/10 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-white/80 text-[11px]">Safety Atlas Active</span>
            </div>
            <button
              onClick={onNavigateToMap}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF4D00] hover:underline transition-colors animate-pulse"
            >
              <span>View Atlas</span>
              <MapPin className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bulletins List */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-[#FF4D00]" />
              Mysuru Safety Bulletins
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
              {filteredFlags.length} Reports
            </span>
          </div>

          {filteredFlags.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-[#121212] rounded-xl border border-white/10 p-6">
              <Sparkles className="w-8 h-8 text-white/20 mx-auto" />
              <p className="text-sm font-bold uppercase tracking-wider text-white">No alerts match active filters</p>
              <p className="text-xs text-white/50">Try clearing landmarks or toggling off "For You" view.</p>
              <button
                onClick={() => {
                  setForYouActive(false);
                  setSelectedLandmarks([]);
                }}
                className="mt-2 px-4 py-2 bg-white text-black hover:bg-[#FF4D00] hover:text-white text-xs font-bold uppercase tracking-widest rounded"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            dateGroups.map((group) => {
              const groupFlags = filteredFlags.filter((f) => f.dateGroup === group);
              if (groupFlags.length === 0) return null;

              return (
                <div key={group} className="space-y-3">
                  <div className="flex items-center gap-2.5 my-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50 bg-[#141414] px-2 py-0.5 rounded border border-white/10">
                      {group}
                    </span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  {groupFlags.map((flag) => {
                    const tagMeta = getTagMeta(flag.type);
                    const TagIcon = tagMeta.icon;

                    return (
                      <article
                        key={flag.id}
                        id={`feed-card-${flag.id}`}
                        onClick={() => setSelectedFlagForDetail(flag)}
                        className="group cursor-pointer p-4 bg-[#121212] hover:bg-[#181818] border border-white/10 hover:border-white/30 rounded-xl transition-all duration-150 shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${tagMeta.badgeBg}`}
                            >
                              <TagIcon className={`w-3 h-3 ${tagMeta.iconColor}`} />
                              {tagMeta.label}
                            </span>

                            {flag.landmarkNear && (
                              <span className="text-[11px] text-white/50 font-semibold truncate max-w-[140px]">
                                • {flag.landmarkNear}
                              </span>
                            )}
                          </div>

                          <div
                            id={`density-badge-${flag.id}`}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              flag.colorTier === "red"
                                ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                                : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                flag.colorTier === "red" ? "bg-rose-500 animate-ping" : "bg-amber-400"
                              }`}
                            />
                            <span>
                              {flag.activeFlagCountInCell} {flag.activeFlagCountInCell === 1 ? "FLAG" : "FLAGS"}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base font-black tracking-tight text-white group-hover:text-[#FF4D00] transition-colors leading-snug">
                          {flag.title}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-white/50 mt-3 pt-2.5 border-t border-white/10">
                          <div className="flex items-center gap-1.5 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" />
                            <span className="text-white/80">{flag.distanceText}</span>
                            <span className="text-white/20">/</span>
                            <span>{flag.timeAgoText}</span>
                          </div>

                          <span className="text-[10px] font-black uppercase tracking-wider text-white/60 group-hover:text-white flex items-center gap-1">
                            Inspect →
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </main>

      <LandmarkFilterModal
        isOpen={isLandmarkModalOpen}
        onClose={() => setIsLandmarkModalOpen(false)}
        selectedLandmarks={selectedLandmarks}
        onToggleLandmark={handleToggleLandmark}
        onClearLandmarks={() => setSelectedLandmarks([])}
      />

      <FlagDetailModal
        flag={selectedFlagForDetail}
        onClose={() => setSelectedFlagForDetail(null)}
        onUpvote={(flagId) => {
          onUpvoteFlag(flagId);
          if (selectedFlagForDetail && selectedFlagForDetail.id === flagId) {
            setSelectedFlagForDetail({
              ...selectedFlagForDetail,
              upvotes: (selectedFlagForDetail.upvotes || 0) + 1,
            });
          }
        }}
      />
    </div>
  );
}
