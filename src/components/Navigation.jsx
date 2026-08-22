import { Home, Map, Plus, User } from "lucide-react";

export default function Navigation({ activeTab, onTabChange, isDriving = false }) {
  // If driving on mobile, the bottom navigation tab is hidden to maintain zero-distraction passive Drive Mode
  if (isDriving && window.innerWidth < 768) return null;


  return (
    <nav
      id="bottom-tab-navigation"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/10 px-4 py-2 safe-area-bottom max-w-[430px] mx-auto shadow-2xl"
    >
      <div className="flex items-center justify-around relative">
        {/* Tab 1: Home (Flag Feed) */}
        <button
          id="nav-tab-home"
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all duration-150 ${
            activeTab === "home"
              ? "text-white font-black"
              : "text-white/40 hover:text-white/80"
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === "home" ? "scale-105 text-[#FF4D00]" : ""}`} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-[0.2em]">Feed</span>
          {activeTab === "home" && (
            <span className="w-1.5 h-1 bg-[#FF4D00] rounded-sm mt-0.5" />
          )}
        </button>

        {/* Tab 2: Map (Live & Heatmap) */}
        <button
          id="nav-tab-map"
          onClick={() => onTabChange("map")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all duration-150 ${
            activeTab === "map"
              ? "text-white font-black"
              : "text-white/40 hover:text-white/80"
          }`}
        >
          <Map className={`w-5 h-5 transition-transform ${activeTab === "map" ? "scale-105 text-[#FF4D00]" : ""}`} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-[0.2em]">Atlas</span>
          {activeTab === "map" && (
            <span className="w-1.5 h-1 bg-[#FF4D00] rounded-sm mt-0.5" />
          )}
        </button>

        {/* Tab 3: Flag (Center Elevated Action Button) */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            id="nav-tab-flag-elevated"
            onClick={() => onTabChange("flag")}
            className="w-13 h-13 rounded-full bg-[#FF4D00] text-white flex items-center justify-center shadow-lg shadow-[#FF4D00]/30 border-4 border-[#0A0A0A] hover:scale-105 active:scale-95 transition-transform"
            aria-label="Report a Road Hazard or Flag"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
          <span className="text-[9px] mt-0.5 font-bold uppercase tracking-[0.2em] text-white/70">Report</span>
        </div>

        {/* Tab 4: Profile (Account / History / Settings) */}
        <button
          id="nav-tab-profile"
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all duration-150 ${
            activeTab === "profile"
              ? "text-white font-black"
              : "text-white/40 hover:text-white/80"
          }`}
        >
          <User className={`w-5 h-5 transition-transform ${activeTab === "profile" ? "scale-105 text-[#FF4D00]" : ""}`} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-[0.2em]">Hub</span>
          {activeTab === "profile" && (
            <span className="w-1.5 h-1 bg-[#FF4D00] rounded-sm mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
}
