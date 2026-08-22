import { X, AlertTriangle, Eye, Zap, MapPin, Clock, ThumbsUp, Users } from "lucide-react";

export const FlagDetailModal = ({
  flag,
  onClose,
  onUpvote,
}) => {
  if (!flag) return null;

  const getTypeMeta = (type) => {
    switch (type) {
      case "hazard":
        return {
          label: "Hazard Report",
          icon: AlertTriangle,
          badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          iconBg: "bg-rose-500 text-white",
          dotColor: "bg-rose-500",
        };
      case "blindspot":
        return {
          label: "Blind Spot Warning",
          icon: Eye,
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          iconBg: "bg-amber-500 text-slate-950",
          dotColor: "bg-amber-500",
        };
      case "nearmiss":
        return {
          label: "Near-Miss Cluster",
          icon: Zap,
          badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
          iconBg: "bg-teal-500 text-slate-950",
          dotColor: "bg-teal-500",
        };
      default:
        return {
          label: "Safety Warning",
          icon: AlertTriangle,
          badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/40",
          iconBg: "bg-slate-500 text-white",
          dotColor: "bg-slate-500",
        };
    }
  };

  const meta = getTypeMeta(flag.type);
  const Icon = meta.icon;

  return (
    <div
      id="flag-detail-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end justify-center max-w-[430px] mx-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id={`flag-detail-sheet-${flag.id}`}
        className="w-full bg-[#0A0A0A] border-t border-white/15 rounded-t-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              <Icon className="w-5 h-5 text-[#FF4D00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                  {meta.label}
                </span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  {flag.timeAgoText || "Just now"}
                </span>
              </div>
              <h2 className="text-sm font-black uppercase tracking-tight text-white mt-1 leading-snug">
                {flag.title}
              </h2>
            </div>
          </div>

          <button
            id="close-flag-detail-btn"
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-3 space-y-4 flex-1 pr-1">
          {/* Mini Static Map Thumbnail */}
          <div className="relative w-full h-36 bg-[#121212] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
            {/* SVG Simulated Mini Map Grid */}
            <svg className="w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="detail-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#222222" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#0A0A0A" />
              <rect width="100%" height="100%" fill="url(#detail-grid)" />
              {/* Road lines */}
              <line x1="0" y1="70" x2="100%" y2="70" stroke="#333333" strokeWidth="8" />
              <line x1="180" y1="0" x2="180" y2="100%" stroke="#333333" strokeWidth="8" />
              <line x1="0" y1="70" x2="100%" y2="70" stroke="#FF4D00" strokeWidth="1" strokeDasharray="6 4" />
            </svg>

            {/* Pulsing Pin on Mini Map */}
            <div className="absolute flex flex-col items-center">
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#FF4D00]"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-[#FF4D00] border border-white shadow-lg items-center justify-center text-[10px] text-white font-black">
                  !
                </span>
              </span>
              <div className="mt-1 bg-black/90 text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded border border-white/20 shadow-md">
                {flag.locationName || `${flag.lat.toFixed(4)}, ${flag.lng.toFixed(4)}`}
              </div>
            </div>

            <div className="absolute top-2 right-2 bg-black/90 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white/70 border border-white/15 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#FF4D00]" />
              <span>{flag.lat.toFixed(4)}, {flag.lng.toFixed(4)}</span>
            </div>
          </div>

          {/* Location & Density Summary Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#121212] p-3 rounded-xl border border-white/10">
              <span className="text-[9px] text-white/40 block font-black uppercase tracking-widest">Distance</span>
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" />
                {flag.distanceText || "Nearby"}
              </span>
            </div>

            <div className="bg-[#121212] p-3 rounded-xl border border-white/10">
              <span className="text-[9px] text-white/40 block font-black uppercase tracking-widest">Cell Reports</span>
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${flag.colorTier === "red" ? "bg-[#FF4D00]" : "bg-amber-400"}`} />
                {flag.activeFlagCountInCell || 1} Reports ({flag.colorTier === "red" ? "High Density" : "Moderate"})
              </span>
            </div>
          </div>

          {/* Full Flag Description */}
          {flag.description && (
            <div>
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1.5">
                Situation Overview
              </h3>
              <p className="text-xs text-white/90 bg-[#121212] p-3.5 rounded-xl border border-white/10 leading-relaxed font-medium">
                {flag.description}
              </p>
            </div>
          )}

          {/* Rolled-up Reports in Grid Cell */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FF4D00]" />
                Community Reports ({flag.reports ? flag.reports.length : 0})
              </h3>
              <span className="text-[9px] text-white/40 font-mono">
                {flag.gridCellId}
              </span>
            </div>

            <div className="space-y-2">
              {!flag.reports || flag.reports.length === 0 ? (
                <p className="text-xs text-white/40 italic">Initial report by community member</p>
              ) : (
                flag.reports.map((report, idx) => (
                  <div
                    key={report.id || idx}
                    className="p-3 rounded-xl bg-[#121212] border border-white/10 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white uppercase text-[11px] tracking-wide">{report.userName || "Reporter"}</span>
                      <span className="text-[9px] text-white/40 flex items-center gap-1 font-semibold uppercase">
                        <Clock className="w-2.5 h-2.5" />
                        {report.timestamp || "Recent"}
                      </span>
                    </div>
                    <p className="text-white/80 text-xs font-medium">{report.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-3">
          <button
            id={`upvote-flag-btn-${flag.id}`}
            onClick={() => onUpvote(flag.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#FF4D00] text-black hover:text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest transition-colors shadow-xl"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Confirm Alert ({flag.upvotes || 0})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
