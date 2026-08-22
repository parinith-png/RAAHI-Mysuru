import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, firebaseAvailable } from '../config/firebase.js';
import { getDeviceId } from '../utils/deviceId.js';
import { getGridCellId } from '../utils/gridCell.js';
import { AlertTriangle, Eye, Zap, Loader2, CheckCircle2, X } from 'lucide-react';

const HAZARD_TYPES = [
  { id: 'pothole', label: 'Pothole', icon: '🕳️' },
  { id: 'broken_road', label: 'Broken road', icon: '🔨' },
  { id: 'waterlogging', label: 'Waterlogging', icon: '🌊' },
  { id: 'debris', label: 'Debris', icon: '🪨' },
  { id: 'poor_visibility', label: 'Poor visibility', icon: '🌫️' },
  { id: 'obstruction', label: 'Road obstruction', icon: '🚧' },
  { id: 'other', label: 'Other Type', icon: '⚠️' },
];

const REPORT_TYPES = [
  { id: 'hazard', label: 'Report Hazard', icon: AlertTriangle, color: 'text-[#FF4D00]' },
  { id: 'blindspot', label: 'Report Blind Spot', icon: Eye, color: 'text-[#8b5cf6]' },
  { id: 'nearmiss', label: 'Report Near Miss', icon: Zap, color: 'text-[#FF0055]' },
];

export default function ReportSheet({ visible, onClose, userLocation, onReportSubmitted }) {
  const [step, setStep] = useState('type'); // 'type' | 'subtype' | 'submitting' | 'done'
  const [reportType, setReportType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTypeSelect = (type) => {
    setReportType(type);
    if (type === 'blindspot' || type === 'nearmiss') {
      submitReport(type, type === 'blindspot' ? 'Blind spot' : 'Near miss');
    } else {
      setStep('subtype');
    }
  };

  const submitReport = async (type, subtype) => {
    setSubmitting(true);
    setStep('submitting');

    const lat = userLocation?.lat || 12.3051;
    const lng = userLocation?.lng || 76.6551;

    const flagData = {
      lat,
      lng,
      gridCellId: getGridCellId(lat, lng),
      type: type,
      subtype: subtype,
      createdBy: getDeviceId(),
      timestamp: new Date().toISOString(),
      active: true,
    };

    try {
      if (firebaseAvailable && db) {
        await addDoc(collection(db, 'flags'), flagData);
      }
      if (onReportSubmitted) onReportSubmitted(flagData);
      setStep('done');
    } catch (err) {
      console.warn('Failed to submit report to Firestore:', err.message);
      if (onReportSubmitted) onReportSubmitted(flagData);
      setStep('done');
    }

    setSubmitting(false);
    setTimeout(() => {
      setStep('type');
      setReportType(null);
      if (onClose) onClose();
    }, 1500);
  };

  if (!visible) return null;

  return (
    <div className="absolute bottom-[76px] left-0 right-0 z-[1001] w-full max-w-[430px] mx-auto bg-[#0A0A0A]/95 border-t border-white/10 rounded-t-2xl shadow-2xl p-4 space-y-4 animate-slide-up font-sans text-white">
      {/* Handle decoration */}
      <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-1" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4D00]">
            RAAHI Community Advisory
          </span>
          <h2 className="text-sm font-black uppercase text-white mt-1 tracking-tight">
            {step === 'type' ? 'Submit Live Road Warning' :
              step === 'subtype' ? 'Identify Hazard Overlay' :
                step === 'submitting' ? 'Broadcasting to Grid...' : 'Hazard Logged!'}
          </h2>
        </div>
        <button
          onClick={() => { setStep('type'); setReportType(null); onClose(); }}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step: Report type */}
      {step === 'type' && (
        <div className="flex gap-2">
          {REPORT_TYPES.map((rt) => {
            const Icon = rt.icon;
            return (
              <button
                key={rt.id}
                onClick={() => handleTypeSelect(rt.id)}
                className="flex-1 bg-[#121212] border border-white/5 hover:border-white/15 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-200 group"
              >
                <Icon className={`w-8 h-8 mb-2.5 transition-transform group-hover:scale-110 ${rt.color}`} />
                <span className="text-[10px] font-black uppercase tracking-wider text-white/80">{rt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Step: Hazard subtype */}
      {step === 'subtype' && (
        <div className="grid grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto pr-1">
          {HAZARD_TYPES.map((ht) => (
            <button
              key={ht.id}
              onClick={() => submitReport('hazard', ht.label)}
              className="bg-[#121212] border border-white/5 hover:border-white/15 p-3 rounded-xl flex items-center gap-3 text-left transition-all duration-200"
            >
              <span className="text-lg bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center">{ht.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/90">{ht.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step: Submitting */}
      {step === 'submitting' && (
        <div className="py-8 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin" />
          <span className="text-xs font-black uppercase tracking-wider text-white/50">Broadcasting coordinate feed to live database...</span>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[#00E5A3] animate-bounce" />
          <div>
            <h3 className="text-sm font-black uppercase text-white">Broadcast Successful</h3>
            <p className="text-[10px] text-white/45 mt-1 font-medium max-w-[260px] mx-auto">
              Your warning node has been pinned to the live Mysuru road safety net layout.
            </p>
          </div>
        </div>
      )}

      {/* Footer Location info */}
      {step === 'type' && (
        <div className="text-[9px] text-white/35 font-medium flex items-center gap-1.5 justify-center pt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00E5A3] animate-pulse" />
          <span>Active GPS positioning is logging this report node in real time.</span>
        </div>
      )}
    </div>
  );
}
