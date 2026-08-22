import { useCallback, useRef } from 'react';

const COOLDOWN_MS = 45000; // 45 second cooldown between alerts

export function useVoiceAlerts() {
  const lastAlertRef = useRef({});
  const lastAlertTimeRef = useRef(0);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not available');
      return false;
    }

    const now = Date.now();
    if (now - lastAlertTimeRef.current < COOLDOWN_MS) {
      return false; // global cooldown
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-IN';

    window.speechSynthesis.cancel(); // cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
    lastAlertTimeRef.current = now;
    return true;
  }, []);

  const alertForFlag = useCallback((flagId, message) => {
    // Don't repeat alert for same flag until user has moved away and re-entered
    if (lastAlertRef.current[flagId]) return false;

    const spoke = speak(message);
    if (spoke) {
      lastAlertRef.current[flagId] = true;
    }
    return spoke;
  }, [speak]);

  const clearFlagAlert = useCallback((flagId) => {
    delete lastAlertRef.current[flagId];
  }, []);

  const clearAllAlerts = useCallback(() => {
    lastAlertRef.current = {};
  }, []);

  return { speak, alertForFlag, clearFlagAlert, clearAllAlerts };
}
