import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceAlerts } from '../hooks/useVoiceAlerts.js';
import { seedBlindSpots } from '../data/seedFlags.js';
import { seedAccidents } from '../data/seedAccidents.js';
import { scorePoint } from '../utils/riskEngine.js';
import { calculateCautiousSpeed } from '../utils/speedEngine.js';
import SafetyMap from './SafetyMap.jsx';
import {
  AlertTriangle,
  Eye,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  Check,
  X,
  ShieldCheck,
  Square,
  BellRing
} from 'lucide-react';

const DEMO_ROUTE = [
  { lat: 12.3050, lng: 76.6560 },
  { lat: 12.3055, lng: 76.6558 },
  { lat: 12.3062, lng: 76.6555 },
  { lat: 12.3070, lng: 76.6553 },
  { lat: 12.3078, lng: 76.6552 },
  { lat: 12.3085, lng: 76.6551 },
  { lat: 12.3092, lng: 76.6550 },
  { lat: 12.3098, lng: 76.6550 },
  { lat: 12.3100, lng: 76.6550 },
  { lat: 12.3105, lng: 76.6548 },
  { lat: 12.3112, lng: 76.6545 },
  { lat: 12.3120, lng: 76.6540 },
  { lat: 12.3128, lng: 76.6530 },
  { lat: 12.3135, lng: 76.6515 },
  { lat: 12.3140, lng: 76.6500 },
  { lat: 12.3142, lng: 76.6480 },
  { lat: 12.3145, lng: 76.6460 },
  { lat: 12.3147, lng: 76.6440 },
  { lat: 12.3148, lng: 76.6420 },
  { lat: 12.3149, lng: 76.6400 },
  { lat: 12.3150, lng: 76.6380 },
  { lat: 12.3150, lng: 76.6360 },
  { lat: 12.3150, lng: 76.6340 },
  { lat: 12.3150, lng: 76.6320 },
  { lat: 12.3150, lng: 76.6300 },
  { lat: 12.3155, lng: 76.6305 },
  { lat: 12.3165, lng: 76.6320 },
  { lat: 12.3180, lng: 76.6350 },
  { lat: 12.3200, lng: 76.6400 },
  { lat: 12.3220, lng: 76.6450 },
  { lat: 12.3250, lng: 76.6520 },
  { lat: 12.3280, lng: 76.6580 },
  { lat: 12.3300, lng: 76.6620 },
  { lat: 12.3320, lng: 76.6680 },
  { lat: 12.3340, lng: 76.6750 },
  { lat: 12.3348, lng: 76.6795 },
  { lat: 12.3350, lng: 76.6800 },
  { lat: 12.3355, lng: 76.6810 },
  { lat: 12.3360, lng: 76.6820 },
];

function playBeep(severity) {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (severity === 'red') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      
      setTimeout(() => {
        const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx2.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx2.currentTime);
        osc2.start();
        osc2.stop(ctx2.currentTime + 0.15);
      }, 200);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (err) {
    console.warn('Audio synthesis failed', err);
  }
}

export default function DriveMode({
  active,
  route,
  flags,
  accidents,
  onEnd,
  onPositionUpdate,
  inline = false
}) {
  const [progress, setProgress] = useState(5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [alertLog, setAlertLog] = useState([]);

  // Speed Limit and advisories info
  const [speedInfo, setSpeedInfo] = useState({
    postedLimit: 50,
    recommendedSpeed: 42,
    currentSpeed: 38,
    reasonTags: ["Clear road ahead"],
  });

  // Passive popup banner overlays
  const [activeBanner, setActiveBanner] = useState(null);
  const [rerouteProposal, setRerouteProposal] = useState(null);

  // Refs for tracking duplicates and timers
  const triggeredAlertsRef = useRef(new Set());
  const bannerTimerRef = useRef(null);
  const rerouteTimerRef = useRef(null);

  const { alertForFlag, clearFlagAlert, speak } = useVoiceAlerts();

  // Resolve current route coordinates array (OSRM decodes or fall back)
  const currentPath = route?.overview_path || route?.path || DEMO_ROUTE;

  const currentPosition = (() => {
    if (!currentPath || currentPath.length === 0) {
      return { lat: 12.3524, lng: 76.6190 };
    }
    const totalSegments = currentPath.length - 1;
    const scaledProgress = (progress / 100) * totalSegments;
    const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
    const segmentProgress = scaledProgress - segmentIndex;

    const p1 = currentPath[segmentIndex];
    const p2 = currentPath[segmentIndex + 1] || p1;

    const lat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
    const lng = p1.lng + (p2.lng - p1.lng) * segmentProgress;
    return { lat, lng };
  })();

  // Keep state sync with parent coordinate trigger
  useEffect(() => {
    if (onPositionUpdate && currentPosition) {
      onPositionUpdate(currentPosition);
    }
  }, [currentPosition, onPositionUpdate]);

  // Voice Alert Banner Launcher
  const triggerPassiveAlert = useCallback((alert, spokenText) => {
    setActiveBanner(alert);

    if (!isAudioMuted) {
      playBeep(alert.severity);
      speak(spokenText);
    }

    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setActiveBanner(null);
    }, 4500);
  }, [isAudioMuted, speak]);

  // Rerouting Proposal Launcher
  const triggerReroutePopup = useCallback((proposal) => {
    setRerouteProposal(proposal);

    if (!isAudioMuted) {
      speak("Safer route detected. 10 seconds to switch.");
    }

    if (rerouteTimerRef.current) clearInterval(rerouteTimerRef.current);
    let sec = proposal.secondsRemaining;
    rerouteTimerRef.current = setInterval(() => {
      sec -= 1;
      setRerouteProposal(prev => prev ? { ...prev, secondsRemaining: sec } : null);
      if (sec <= 0) {
        clearInterval(rerouteTimerRef.current);
        setRerouteProposal(null);
      }
    }, 1000);
  }, [isAudioMuted, speak]);

  // Simulation execution loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 0.3 * speedMultiplier;
        if (next >= 100) {
          setIsPlaying(false);
          speak("Demo simulation complete.");
          return 100;
        }

        // Event A: Trigger blind spot (at 18% progress)
        if (next >= 18 && next < 35 && !triggeredAlertsRef.current.has("alert-bs")) {
          triggeredAlertsRef.current.add("alert-bs");
          setSpeedInfo({
            postedLimit: 50,
            recommendedSpeed: 28,
            currentSpeed: 30,
            reasonTags: ["Blind spot ahead", "Metagalli Junction"],
          });
          const alert = {
            id: "bs-1",
            type: "blindspot",
            severity: "red",
            title: "Blind Spot: Metagalli Junction",
            distanceText: "250m ahead",
            recommendedAction: "Reduce speed to 30 km/h · Sound horn"
          };
          triggerPassiveAlert(alert, "Blind spot ahead near Metagalli Junction. Reduce speed to 30.");
          setAlertLog(prev => [...prev, { type: 'blindspot', name: 'Metagalli Junction', time: new Date().toLocaleTimeString() }]);
        }

        // Event B: Trigger reroute recommendation (at 45% progress)
        if (next >= 45 && next < 60 && !triggeredAlertsRef.current.has("alert-rr")) {
          triggeredAlertsRef.current.add("alert-rr");
          triggerReroutePopup({
            id: "rr-1",
            reason: "Route straight contains high severity fatal grids ahead",
            currentRouteScore: 8.5,
            suggestedRouteScore: 2.8,
            alternativeRouteName: "Ring Road Bypass",
            distanceToDecisionMeters: 250,
            secondsRemaining: 10
          });
        }

        // Event C: Trigger waterlogged pothole hazard (at 72% progress)
        if (next >= 72 && next < 88 && !triggeredAlertsRef.current.has("alert-hz")) {
          triggeredAlertsRef.current.add("alert-hz");
          setSpeedInfo({
            postedLimit: 50,
            recommendedSpeed: 25,
            currentSpeed: 27,
            reasonTags: ["Deep pothole cluster", "Wet road segments"],
          });
          const alert = {
            id: "hz-1",
            type: "hazard",
            severity: "red",
            title: "Deep Pothole Cluster in Center Lane",
            distanceText: "180m ahead",
            recommendedAction: "Shift to right lane cautiously"
          };
          triggerPassiveAlert(alert, "Caution. Hazard reported 180 meters ahead. Shift to right lane.");
          setAlertLog(prev => [...prev, { type: 'hazard', score: 75, time: new Date().toLocaleTimeString() }]);
        }

        // Normal speed variation updates
        if (next > 35 && next < 45) {
          setSpeedInfo(s => ({
            ...s,
            recommendedSpeed: 45,
            currentSpeed: 44,
            reasonTags: ["Normal traffic flow"]
          }));
        } else if (next > 88) {
          setSpeedInfo(s => ({
            ...s,
            recommendedSpeed: 32,
            currentSpeed: 30,
            reasonTags: ["Approaching destination corridor"]
          }));
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier, triggerPassiveAlert, triggerReroutePopup, speak]);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      if (rerouteTimerRef.current) clearInterval(rerouteTimerRef.current);
    };
  }, []);

  const handleManualTriggerAlert = (type) => {
    if (type === "blindspot") {
      triggerPassiveAlert({
        id: "m-1",
        type: "blindspot",
        severity: "red",
        title: "Test Blind Spot: KRS Road Merge",
        distanceText: "200m ahead",
        recommendedAction: "Slow down to 30 km/h"
      }, "Blind spot ahead, proceed with caution.");
      setAlertLog(prev => [...prev, { type: 'blindspot', name: 'KRS Road Merge', time: new Date().toLocaleTimeString() }]);
    } else if (type === "hazard") {
      triggerPassiveAlert({
        id: "m-2",
        type: "hazard",
        severity: "yellow",
        title: "Test Hazard: Loose Gravel & Debris",
        distanceText: "150m ahead",
        recommendedAction: "Maintain grip · avoid sudden braking"
      }, "Caution. Road hazard 150 meters ahead.");
      setAlertLog(prev => [...prev, { type: 'hazard', score: 35, time: new Date().toLocaleTimeString() }]);
    } else {
      triggerReroutePopup({
        id: "m-3",
        reason: "Continuing straight passes 2 active community safety alerts",
        currentRouteScore: 7.2,
        suggestedRouteScore: 3.1,
        alternativeRouteName: "Ring Road Bypass",
        distanceToDecisionMeters: 250,
        secondsRemaining: 10
      });
    }
  };

  const getAlertIcon = (type) => {
    if (type === 'blindspot') return Eye;
    if (type === 'hazard') return AlertTriangle;
    return Zap;
  };

  if (!active) return null;

  return (
    <div className={inline
      ? "relative w-full h-full bg-[#0A0A0A] text-white flex flex-col justify-between p-5 font-sans overflow-hidden select-none"
      : "fixed inset-0 z-[1000] w-full max-w-[430px] mx-auto bg-[#0A0A0A] text-white flex flex-col justify-between p-5 font-sans overflow-hidden select-none"
    }>
      {/* 1. PASSIVE TOP ALERT BANNER */}
      {activeBanner && (
        <div className="absolute top-3 left-3 right-3 z-50 animate-fade-in shadow-2xl">
          <div className={`p-4 rounded-xl border backdrop-blur-xl ${
            activeBanner.severity === 'red'
              ? 'bg-[#180A0A]/95 border-[#FF4D00] text-white'
              : 'bg-[#161208]/95 border-amber-500 text-white'
          }`}>
            <div className="flex gap-3">
              <div className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center ${
                activeBanner.severity === 'red' ? 'bg-[#FF4D00]' : 'bg-amber-500 text-black'
              }`}>
                {(() => {
                  const Icon = getAlertIcon(activeBanner.type);
                  return <Icon className="w-5 h-5" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#FF4D00]">{activeBanner.distanceText}</span>
                  <span className="text-[8px] text-white/40 font-bold uppercase">AUDIO HUD LOGGED</span>
                </div>
                <h3 className="text-xs font-black uppercase text-white truncate mt-0.5">{activeBanner.title}</h3>
                <p className="text-[10px] text-white/70 mt-1 font-semibold">{activeBanner.recommendedAction}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REROUTING COUNTDOWN MODAL */}
      {rerouteProposal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00] animate-ping" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Safer corridor detected</h3>
                  <span className="text-[9px] text-white/45">Decision point {rerouteProposal.distanceToDecisionMeters}m ahead</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black">
                {rerouteProposal.secondsRemaining}s
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-3 rounded-lg text-xs leading-relaxed text-white/80">
              "{rerouteProposal.reason}"
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-lg border border-white/5 text-[10px]">
              <div>
                <span className="text-white/40 block font-semibold">Current path</span>
                <span className="text-[#FF4D00] font-black">Risk {rerouteProposal.currentRouteScore}</span>
              </div>
              <div className="border-l border-white/15 pl-3">
                <span className="text-white/40 block font-semibold">Alternative Corridor</span>
                <span className="text-[#00E5A3] font-black">Risk {rerouteProposal.suggestedRouteScore}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setRerouteProposal(null)}
                className="py-2.5 px-3 bg-white/5 hover:bg-white/10 active:bg-white/20 text-white font-black rounded-lg text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 border border-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Keep Current</span>
              </button>
              <button
                onClick={() => {
                  setRerouteProposal(null);
                  speak("Switched to safer alternative route.");
                  setSpeedInfo(s => ({
                    ...s,
                    recommendedSpeed: 45,
                    reasonTags: ["Switched to safer corridor"]
                  }));
                }}
                className="py-2.5 px-3 bg-white hover:bg-[#FF4D00] text-black hover:text-white font-black rounded-lg text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Switch Route</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SPEED & ADVISORY GLANCEABLE DIAL */}
      <div className="bg-[#0A0A0A] border-b border-white/10 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-white truncate max-w-[200px]">
              {route?.summary || "Direct Route"}
            </span>
          </div>

          <button
            onClick={onEnd}
            className="px-3.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white bg-white/5 hover:bg-rose-500 border border-white/10 hover:border-transparent rounded transition-colors"
          >
            End Drive
          </button>
        </div>

        {/* Speeds Grid */}
        <div className="grid grid-cols-3 gap-2 bg-[#121212] p-3.5 rounded-xl border border-white/15 text-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[8px] uppercase font-black tracking-widest text-white/40">Current</span>
            <div className="text-3xl font-black text-white leading-none mt-1">
              {isPlaying ? Math.round(speedInfo.currentSpeed) : 0}
            </div>
            <span className="text-[8px] text-white/40 font-bold uppercase mt-1">KM/H</span>
          </div>

          <div className="flex flex-col items-center justify-center border-x border-white/15">
            <span className="text-[8px] uppercase font-black tracking-widest text-white/40">Posted</span>
            <div className="w-8 h-8 rounded-full border-2 border-[#FF4D00] flex items-center justify-center text-xs font-black text-white my-1 bg-[#1A1A1A]">
              {speedInfo.postedLimit}
            </div>
            <span className="text-[8px] text-white/40 font-bold uppercase">KM/H</span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-[8px] uppercase font-black tracking-widest text-[#FF4D00]">Target</span>
            <div className="text-3xl font-black text-[#FF4D00] leading-none mt-1">
              {speedInfo.recommendedSpeed}
            </div>
            <span className="text-[8px] text-[#FF4D00]/55 font-bold uppercase mt-1">KM/H</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Tags:</span>
          {speedInfo.reasonTags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[9px] font-black uppercase tracking-wider bg-white/5 text-white/80 border border-white/10 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 4. MAP VIEW CONTAINER (Only rendered on mobile) */}
      {!inline && (
        <div className="flex-1 w-full relative min-h-[220px]">
          <SafetyMap
            flags={flags}
            selectedRoute={route}
            userLocation={currentPosition}
            demoPosition={currentPosition}
            mapMode="mysuru"
            mysuruAccidents={accidents && accidents.length > 0 ? accidents : seedAccidents}
            isDriveMode={true}
          />

          {/* Floating Driving Compass / Progress Pill */}
          <div className="absolute bottom-4 left-4 z-[999] bg-[#0A0A0A]/95 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[9px] text-white flex items-center gap-1.5 shadow-xl pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-[#FF4D00] animate-spin" style={{ animationDuration: "12s" }} />
            <span className="font-black uppercase tracking-wider">{Math.round(progress)}% of trip</span>
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-bold">
              {((1 - progress / 100) * (route?.legs?.[0]?.distance?.value / 1000 || 3.5)).toFixed(1)} km left
            </span>
          </div>
        </div>
      )}

      {/* 5. ACTIVE VOICE ALERTS LOG GAUGE */}
      <div className="bg-[#121212]/50 border border-white/5 p-4 rounded-xl flex-1 max-h-[140px] overflow-y-auto my-3 flex flex-col justify-start">
        <span className="text-[8px] font-black tracking-widest text-[#FF4D00] uppercase mb-2 flex items-center gap-1">
          <BellRing className="w-3.5 h-3.5" />
          Active voice notifications log
        </span>

        {alertLog.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-[9px] text-white/35 uppercase font-black tracking-wider py-4">
            No voice advisories generated
          </div>
        ) : (
          <div className="space-y-1.5 overflow-y-auto">
            {alertLog.slice(-3).reverse().map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[9px] py-1 border-b border-white/5 last:border-0 font-medium text-white/80"
              >
                <span>
                  {a.type === 'blindspot' ? (
                    <span className="text-[#8b5cf6] font-bold">👁️ Blind Spot: {a.name}</span>
                  ) : (
                    <span className="text-[#FF4D00] font-bold">⚠️ Risk Node Segment Alert</span>
                  )}
                </span>
                <span className="text-white/35 font-bold uppercase tracking-wider text-[8px]">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. PLAYBACK SIMULATION CONTROLLER PANEL */}
      <div className="bg-[#0A0A0A] border-t border-white/10 pt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-[#121212] hover:bg-white hover:text-black text-white rounded-lg border border-white/10 transition-colors"
            title={isPlaying ? "Pause journey" : "Play drive"}
          >
            {isPlaying ? <Pause className="w-4 h-4 shadow-sm" /> : <Play className="w-4 h-4 shadow-sm" />}
          </button>

          <button
            onClick={() => setSpeedMultiplier(m => m === 1 ? 2 : m === 2 ? 4 : 1)}
            className="px-2.5 py-1.5 bg-[#121212] text-white rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
          >
            {speedMultiplier}x
          </button>

          <button
            onClick={() => {
              setProgress(5);
              setIsPlaying(true);
              triggeredAlertsRef.current.clear();
              setAlertLog([]);
              speak("Reset simulation.");
            }}
            className="p-2 bg-[#121212] text-white/50 hover:text-white rounded-lg border border-white/10 transition-colors"
            title="Reset journey"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleManualTriggerAlert("blindspot")}
            className="px-2.5 py-1.5 bg-[#121212] hover:border-white border border-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
          >
            Alert
          </button>
          <button
            onClick={() => handleManualTriggerAlert("reroute")}
            className="px-2.5 py-1.5 bg-[#121212] hover:border-white border border-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
          >
            Reroute
          </button>
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-2 rounded-lg border transition-colors ${
              isAudioMuted ? "bg-[#FF4D00]/10 border-[#FF4D00] text-[#FF4D00]" : "bg-[#181818] border-white/10 text-white"
            }`}
            title={isAudioMuted ? "Unmute chimes" : "Mute chimes"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
