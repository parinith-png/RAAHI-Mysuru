import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseAvailable } from '../config/firebase.js';
import { getDeviceId } from '../utils/deviceId.js';
import { getGridCellId } from '../utils/gridCell.js';

const HAZARD_TYPES = [
  { id: 'pothole', label: 'Pothole', icon: '🕳️' },
  { id: 'broken_road', label: 'Broken road', icon: '🔨' },
  { id: 'waterlogging', label: 'Waterlogging', icon: '🌊' },
  { id: 'debris', label: 'Debris', icon: '🪨' },
  { id: 'poor_visibility', label: 'Poor visibility', icon: '🌫️' },
  { id: 'obstruction', label: 'Road obstruction', icon: '🚧' },
  { id: 'other', label: 'Other', icon: '⚠️' },
];

const REPORT_TYPES = [
  { id: 'hazard', label: 'Report Hazard', icon: '⚠️', color: '#f97316' },
  { id: 'blindspot', label: 'Report Blind Spot', icon: '👁️', color: '#8b5cf6' },
  { id: 'nearmiss', label: 'Report Near Miss', icon: '⚡', color: '#ef4444' },
];

export default function ReportSheet({ visible, onClose, userLocation, onReportSubmitted }) {
  const [step, setStep] = useState('type'); // 'type' | 'subtype' | 'submitting' | 'done'
  const [reportType, setReportType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTypeSelect = (type) => {
    setReportType(type);
    if (type === 'blindspot' || type === 'nearmiss') {
      // No subtype needed
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
      // Also notify parent to update local state
      if (onReportSubmitted) onReportSubmitted(flagData);
      setStep('done');
    } catch (err) {
      console.warn('Failed to submit report to Firestore:', err.message);
      // Still add locally
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
    <div className="bottom-sheet animate-slide-up" style={{ padding: '0 0 28px' }}>
      <div className="bottom-sheet-handle" />

      {/* Header */}
      <div style={{
        padding: '8px 20px 12px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--text-muted)', fontWeight: 600,
          }}>
            Community Report
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
            {step === 'type' ? 'What would you like to report?' :
              step === 'subtype' ? 'Select hazard type' :
                step === 'submitting' ? 'Submitting...' : 'Report submitted!'}
          </div>
        </div>
        <button onClick={() => { setStep('type'); setReportType(null); onClose(); }} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 20, cursor: 'pointer', padding: 4,
        }}>✕</button>
      </div>

      {/* Step: Report type */}
      {step === 'type' && (
        <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.id}
              onClick={() => handleTypeSelect(rt.id)}
              style={{
                flex: 1, padding: '16px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{rt.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: rt.color }}>{rt.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step: Hazard subtype */}
      {step === 'subtype' && (
        <div style={{
          padding: '0 16px', display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
        }}>
          {HAZARD_TYPES.map((ht) => (
            <button
              key={ht.id}
              onClick={() => submitReport('hazard', ht.label)}
              style={{
                padding: '14px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{ht.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{ht.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step: Submitting */}
      {step === 'submitting' && (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📡</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sending report...</div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <div style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>Report submitted!</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Thank you for helping keep Mysuru roads safer.
          </div>
        </div>
      )}

      {/* Location info */}
      {step === 'type' && (
        <div style={{
          padding: '12px 16px 0', fontSize: 11, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          📍 Using your current GPS location automatically
        </div>
      )}
    </div>
  );
}
