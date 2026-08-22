// Cautious speed recommendation engine
// NEVER recommends a speed above the legal limit

import { findSpeedLimitNearby } from '../data/speedLimits.js';

// Risk-based speed reduction factors
function getSpeedReductionFactor(riskScore, conditions = {}) {
  let factor = 1.0;

  // Risk-based reduction
  if (riskScore >= 80) factor *= 0.5;       // Critical: reduce by 50%
  else if (riskScore >= 60) factor *= 0.6;   // High: reduce by 40%
  else if (riskScore >= 30) factor *= 0.8;   // Moderate: reduce by 20%
  // Low risk: no reduction

  // Weather-based reduction
  if (conditions.rain) factor *= 0.8;
  if (conditions.fog || conditions.poorVisibility) factor *= 0.7;

  // Time-based reduction (nighttime)
  const hour = new Date().getHours();
  if (hour >= 21 || hour <= 5) factor *= 0.85;

  return Math.max(factor, 0.3); // Never reduce below 30% of limit
}

export function calculateCautiousSpeed(lat, lng, riskScore, conditions = {}) {
  const speedData = findSpeedLimitNearby(lat, lng);

  if (!speedData || speedData.postedLimit === null) {
    return {
      legalLimit: null,
      cautiousSpeed: null,
      reason: 'Speed limit unavailable. Follow posted signage.',
      roadName: speedData?.roadName || 'Unknown road',
      confidence: 'unknown',
      source: speedData?.source || 'unknown',
    };
  }

  const factor = getSpeedReductionFactor(riskScore, conditions);
  const rawRecommended = speedData.postedLimit * factor;

  // Round to nearest 5, never exceed legal limit
  const cautiousSpeed = Math.min(
    Math.round(rawRecommended / 5) * 5,
    speedData.postedLimit
  );

  // Generate reason
  const reasons = [];
  if (riskScore >= 60) reasons.push('high-risk zone');
  if (riskScore >= 30 && riskScore < 60) reasons.push('moderate-risk area');
  if (conditions.rain) reasons.push('rain');
  if (conditions.fog || conditions.poorVisibility) reasons.push('reduced visibility');
  const hour = new Date().getHours();
  if (hour >= 21 || hour <= 5) reasons.push('nighttime');
  if (reasons.length === 0) reasons.push('current conditions');

  return {
    legalLimit: speedData.postedLimit,
    cautiousSpeed: Math.max(cautiousSpeed, 10), // minimum 10 km/h
    reason: reasons.join(' + '),
    roadName: speedData.roadName,
    confidence: speedData.confidence,
    source: speedData.source,
    disclaimer: 'Not a legal speed-limit change. Follow posted signs and traffic laws.',
  };
}
