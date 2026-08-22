import { useState } from "react";
import {
  User,
  Shield,
  MapPin,
  Mail,
  Phone,
  Volume2,
  Bell,
  Sliders,
  CheckCircle2,
  Clock,
  LogOut,
  AlertTriangle,
  Eye,
  Zap,
  Sparkles,
} from "lucide-react";

export const ProfileView = ({
  profile,
  cityFlagCount,
  onUpdateProfile,
}) => {
  const [authTab, setAuthTab] = useState("email");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Settings State
  const [voiceAlerts, setVoiceAlerts] = useState(profile.settings.voiceAlerts);
  const [beepAlerts, setBeepAlerts] = useState(profile.settings.beepAlerts);
  const [units, setUnits] = useState(profile.settings.units);
  const [notificationRadius, setNotificationRadius] = useState(
    profile.settings.notificationRadiusMeters || 1500
  );

  const handleToggleVoice = () => {
    const next = !voiceAlerts;
    setVoiceAlerts(next);
    onUpdateProfile({
      ...profile,
      settings: { ...profile.settings, voiceAlerts: next },
    });
  };

  const handleToggleBeep = () => {
    const next = !beepAlerts;
    setBeepAlerts(next);
    onUpdateProfile({
      ...profile,
      settings: { ...profile.settings, beepAlerts: next },
    });
  };

  const handleToggleUnits = (newUnit) => {
    setUnits(newUnit);
    onUpdateProfile({
      ...profile,
      settings: { ...profile.settings, units: newUnit },
    });
  };

  const handleRadiusChange = (meters) => {
    setNotificationRadius(meters);
    onUpdateProfile({
      ...profile,
      settings: { ...profile.settings, notificationRadiusMeters: meters },
    });
  };

  const handleMockLogin = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      isGuest: false,
      displayName: authTab === "email" ? (emailInput.split("@")[0] || "Mysuru Citizen") : "Mysuru Commuter",
      email: authTab === "email" ? emailInput : undefined,
      phone: authTab === "phone" ? phoneInput : undefined,
    };
    onUpdateProfile(updated);
  };

  const handleLogout = () => {
    const updated = {
      ...profile,
      isGuest: true,
      displayName: undefined,
      email: undefined,
      phone: undefined,
    };
    onUpdateProfile(updated);
  };

  const testVoiceChimes = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = "Audio test successful. R-A-A-H-I voice warning alert active.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      utterance.pitch = 1.0;
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis not supported on this browser.");
    }
  };

  const getTagMeta = (type) => {
    switch (type) {
      case "hazard":
        return { label: "Hazard", icon: AlertTriangle, color: "text-rose-400" };
      case "blindspot":
        return { label: "Blind Spot", icon: Eye, color: "text-amber-400" };
      case "nearmiss":
        return { label: "Near-Miss", icon: Zap, color: "text-teal-400" };
      default:
        return { label: "Safety Alert", icon: AlertTriangle, color: "text-rose-400" };
    }
  };

  return (
    <div id="profile-view-screen" className="flex flex-col min-h-screen pb-28 max-w-[430px] mx-auto bg-[#0A0A0A] text-white px-4 pt-5 space-y-4">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-wider text-white flex items-center gap-2">
          <User className="w-5 h-5 text-[#FF4D00]" />
          {profile.isGuest ? "Safety Hub" : "Account"}
        </h1>
        <div className="text-[10px] bg-[#141414] border border-white/15 text-white font-black uppercase tracking-widest px-2.5 py-1 rounded flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00]" />
          <span>Mysuru Grid</span>
        </div>
      </div>

      {/* 1. CURRENT CITY SAFETY OVERVIEW */}
      <div className="bg-[#121212] p-4 rounded-xl border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4D00] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#FF4D00]" />
            Mysuru Road Safety Status
          </span>
          <span className="text-[9px] bg-white/10 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/10">
            Live Grid
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-[#181818] p-3 rounded-lg border border-white/10">
            <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Active Flags</span>
            <div className="text-xl font-black text-[#FF4D00] mt-0.5">{cityFlagCount}</div>
            <span className="text-[8px] text-white/40 font-bold uppercase">Today</span>
          </div>

          <div className="bg-[#181818] p-3 rounded-lg border border-white/10">
            <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Red Zones</span>
            <div className="text-xl font-black text-white mt-0.5">3</div>
            <span className="text-[8px] text-white/40 font-bold uppercase">High Hazard</span>
          </div>

          <div className="bg-[#181818] p-3 rounded-lg border border-white/10">
            <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Safety Index</span>
            <div className="text-xl font-black text-white mt-0.5">88%</div>
            <span className="text-[8px] text-white/40 font-bold uppercase">Normal</span>
          </div>
        </div>

        <p className="text-xs text-white/80 leading-relaxed bg-[#181818] p-3 rounded-lg border border-white/10 font-medium">
          Heavy truck traffic flagged near <span className="text-[#FF4D00] font-black">Metagalli Junction</span> and <span className="text-[#FF4D00] font-black">Manipal Hospital flyover</span>. Drive with caution.
        </p>
      </div>

      {/* 2. GUEST STATE vs LOGGED IN STATE */}
      {profile.isGuest ? (
        <div className="bg-[#121212] p-5 rounded-xl border border-white/10 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF4D00]" />
              Save History & Custom Alerts
            </h2>
            <p className="text-xs text-white/60 mt-1 font-medium leading-relaxed">
              Authenticate to track personal flag reports, gain community trust ratings, and tune corridor alerts.
            </p>
          </div>

          {/* Form Tabs: Email vs Phone */}
          <div className="flex bg-[#181818] p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setAuthTab("email")}
              className={`flex-1 py-2 rounded font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                authTab === "email" ? "bg-white text-black shadow" : "text-white/50 hover:text-white"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              onClick={() => setAuthTab("phone")}
              className={`flex-1 py-2 rounded font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                authTab === "phone" ? "bg-white text-black shadow" : "text-white/50 hover:text-white"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone OTP</span>
            </button>
          </div>

          {/* Email Form */}
          {authTab === "email" ? (
            <form onSubmit={handleMockLogin} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white hover:bg-[#FF4D00] text-black hover:text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest transition-colors shadow-xl"
              >
                Log In with Email
              </button>
            </form>
          ) : (
            /* Phone + OTP Form */
            <form onSubmit={handleMockLogin} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] block mb-1">
                  Mobile Number (India)
                </label>
                <div className="flex gap-2">
                  <span className="bg-[#181818] border border-white/15 text-white/60 text-xs px-3 py-2.5 rounded-lg flex items-center font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98450 12345"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="flex-1 bg-[#181818] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {otpSent ? (
                <div>
                  <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] block mb-1">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF4D00] tracking-widest text-center"
                  />
                </div>
              ) : null}

              {!otpSent ? (
                <button
                  type="button"
                  onClick={() => setOtpSent(true)}
                  className="w-full bg-[#181818] hover:bg-white/10 text-white font-black py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all border border-white/15"
                >
                  Send OTP Code
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-[#FF4D00] text-black hover:text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest transition-colors shadow-xl"
                >
                  Verify & Log In
                </button>
              )}
            </form>
          )}

          {/* Quick Demo 1-Tap Login */}
          <div className="pt-2 border-t border-white/10 text-center">
            <button
              onClick={() => {
                onUpdateProfile({
                  ...profile,
                  isGuest: false,
                  displayName: "Ramesh K.",
                  email: "ramesh.k@mysuru-citizen.org",
                  phone: "+91 98450 12345",
                  myFlags: profile.myFlags || []
                });
              }}
              className="text-xs text-[#FF4D00] hover:underline font-black uppercase tracking-wider text-center flex justify-center mx-auto"
            >
              Continue with demo profile (Ramesh K.) →
            </button>
          </div>
        </div>
      ) : (
        /* LOGGED-IN PROFILE HEADER */
        <div className="bg-[#121212] p-4 rounded-xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white text-black flex items-center justify-center font-black text-lg shadow-md">
                {profile.displayName?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-tight text-white">{profile.displayName}</h2>
                <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="w-3 h-3 text-[#FF4D00]" />
                  <span>Mysuru Resident · Tier 1 Reporter</span>
                </p>
              </div>
            </div>

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="p-2 text-white/40 hover:text-rose-400 bg-[#181818] rounded-lg border border-white/10 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* User Trust & Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Reports</div>
              <div className="text-sm font-black text-white mt-0.5">{profile.myFlags ? profile.myFlags.length : 0}</div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Confirmed</div>
              <div className="text-sm font-black text-[#FF4D00] mt-0.5">32 upvotes</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Trust Rating</div>
              <div className="text-sm font-black text-white mt-0.5">99.4%</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MY FLAGS SECTION */}
      {!profile.isGuest && profile.myFlags && profile.myFlags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4D00]" />
              My Reported Flags ({profile.myFlags.length})
            </h2>
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-black">Live Status</span>
          </div>

          <div className="space-y-2">
            {profile.myFlags.map((flag) => {
              const tagMeta = getTagMeta(flag.type);
              const TagIcon = tagMeta.icon;

              return (
                <div
                  key={flag.id}
                  className="p-3 bg-[#121212] border border-white/10 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${tagMeta.color}`}>
                      <TagIcon className="w-3.5 h-3.5" />
                      {tagMeta.label}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        flag.active
                          ? "bg-white/10 text-white border-white/15"
                          : "bg-white/5 text-white/30 border-white/10"
                      }`}
                    >
                      {flag.active ? "Active Alert" : "Resolved"}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white uppercase tracking-tight">{flag.title}</h3>

                  <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/10 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF4D00]" />
                      {flag.locationName || `${flag.lat.toFixed(4)}, ${flag.lng.toFixed(4)}`}
                    </span>
                    <span className="flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="w-2.5 h-2.5" />
                      {flag.timeAgoText || "Recent"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SETTINGS SECTION */}
      <div className="bg-[#121212] p-4 rounded-xl border border-white/10 shadow-xl space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#FF4D00]" />
          Alert & Drive Preferences
        </h2>

        {/* Setting 1: Voice Alerts */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-[#FF4D00]" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-tight text-white">Voice Spoken Alerts</div>
              <div className="text-[10px] text-white/50 font-medium">Read hazard warnings out loud in Drive Mode</div>
            </div>
          </div>
          <button
            onClick={handleToggleVoice}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              voiceAlerts ? "bg-[#FF4D00]" : "bg-white/20"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                voiceAlerts ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Setting 2: Beep Alerts */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#FF4D00]" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-tight text-white">Warning Chimes</div>
              <div className="text-[10px] text-white/50 font-medium">Play dual tone chimes on hazard proximity</div>
            </div>
          </div>
          <button
            onClick={handleToggleBeep}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              beepAlerts ? "bg-[#FF4D00]" : "bg-white/20"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                beepAlerts ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Audio Test Button */}
        <button
          onClick={testVoiceChimes}
          className="w-full bg-[#181818] hover:bg-white hover:text-black text-white font-black py-2.5 rounded-lg text-xs uppercase tracking-wider border border-white/15 flex items-center justify-center gap-2 transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          <span>Test Audio & Voice Chimes</span>
        </button>

        {/* Setting 3: Distance Units */}
        <div className="flex items-center justify-between py-1 pt-2 border-t border-white/10">
          <div>
            <div className="text-xs font-black uppercase tracking-tight text-white">Distance Units</div>
            <div className="text-[10px] text-white/50 font-medium">Metric (km/h) vs Imperial (mph)</div>
          </div>
          <div className="flex bg-[#181818] p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => handleToggleUnits("km")}
              className={`px-2.5 py-1 rounded font-black text-[10px] uppercase tracking-wider ${
                units === "km" ? "bg-white text-black" : "text-white/50"
              }`}
            >
              km/h
            </button>
            <button
              onClick={() => handleToggleUnits("mi")}
              className={`px-2.5 py-1 rounded font-black text-[10px] uppercase tracking-wider ${
                units === "mi" ? "bg-white text-black" : "text-white/50"
              }`}
            >
              mph
            </button>
          </div>
        </div>

        {/* Setting 4: Notification Radius */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-tight text-white">Alert Proximity Radius</span>
            <span className="text-xs font-black text-[#FF4D00]">
              {(notificationRadius / 1000).toFixed(1)} km
            </span>
          </div>
          <input
            type="range"
            min={500}
            max={5000}
            step={250}
            value={notificationRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="w-full accent-[#FF4D00] bg-[#181818] h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-white/40 font-black uppercase tracking-wider">
            <span>500m</span>
            <span>2.5 km</span>
            <span>5.0 km</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfileView;
