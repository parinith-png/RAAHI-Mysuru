import { X, Check, MapPin, Building, RotateCcw } from "lucide-react";
import { MYSURU_LANDMARKS } from "../data/landmarks";

export const LandmarkFilterModal = ({
  isOpen,
  onClose,
  selectedLandmarks,
  onToggleLandmark,
  onClearLandmarks,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="landmark-filter-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-end max-w-[430px] mx-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="landmark-filter-bottom-sheet"
        className="w-full bg-[#0A0A0A] border-t border-white/15 rounded-t-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF4D00]" />
              Filter by Corridors
            </h3>
            <p className="text-[11px] text-white/50 font-medium mt-0.5">
              Select specific corridors or junctions in Mysuru
            </p>
          </div>
          <button
            id="close-landmark-modal"
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Landmark List */}
        <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
          {MYSURU_LANDMARKS.map((landmark) => {
            const isSelected = selectedLandmarks.includes(landmark.name);
            return (
              <button
                key={landmark.id}
                id={`landmark-option-${landmark.id}`}
                onClick={() => onToggleLandmark(landmark.name)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-[#161616] border-[#FF4D00] text-white"
                    : "bg-[#121212] border-white/10 text-white/70 hover:bg-[#181818]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-[#FF4D00] text-white" : "bg-white/10 text-white/60"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black uppercase text-xs tracking-tight text-white">{landmark.name}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">{landmark.area}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/60 border border-white/10">
                    {landmark.flagCount} flags
                  </span>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border ${
                      isSelected
                        ? "bg-[#FF4D00] border-[#FF4D00] text-white"
                        : "border-white/20 bg-black/50"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-3">
          {selectedLandmarks.length > 0 && (
            <button
              id="clear-landmarks-btn"
              onClick={onClearLandmarks}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-white/60 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ({selectedLandmarks.length})
            </button>
          )}
          <button
            id="apply-landmarks-btn"
            onClick={onClose}
            className="flex-1 bg-white hover:bg-[#FF4D00] text-black hover:text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest transition-colors shadow-xl"
          >
            {selectedLandmarks.length === 0
              ? "Show All Corridors"
              : `Apply Filter (${selectedLandmarks.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
