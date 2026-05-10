/**
 * SeismoAI Detection Engine
 * ─────────────────────────
 * Implements:
 *   1. STA/LTA (Short-Term Average / Long-Term Average) earthquake detector
 *   2. Magnitude estimation from PGA
 *   3. Simple ML-style prediction scoring
 */

// ── In-memory circular buffer for STA/LTA ────────────────────────────────────
const STA_WIN  = parseInt(process.env.STA_WINDOW  || '100');   // ~0.5s at 200Hz
const LTA_WIN  = parseInt(process.env.LTA_WINDOW  || '1000');  // ~5s  at 200Hz
const TRIGGER  = parseFloat(process.env.STA_LTA_TRIGGER || '3.0');

class CircularBuffer {
  constructor(size) {
    this.buf  = new Float32Array(size);
    this.size = size;
    this.idx  = 0;
    this.sum  = 0;
    this.count= 0;
  }
  push(val) {
    const old = this.buf[this.idx];
    this.sum  -= old;
    this.sum  += val;
    this.buf[this.idx] = val;
    this.idx = (this.idx + 1) % this.size;
    if (this.count < this.size) this.count++;
  }
  mean() { return this.count ? this.sum / this.count : 0; }
}

const staBuffer = new CircularBuffer(STA_WIN);
const ltaBuffer = new CircularBuffer(LTA_WIN);

// Track current event state
let eventActive   = false;
let eventStart    = null;
let eventPeakPGA  = 0;
let eventSamples  = 0;

/**
 * Process one sensor sample through STA/LTA
 * Returns { isEvent, staLta, level, pga } 
 */
function processSample(x, y, z) {
  const pga = Math.sqrt(x * x + y * y + z * z);
  const sq  = pga * pga;

  staBuffer.push(sq);
  ltaBuffer.push(sq);

  const sta   = staBuffer.mean();
  const lta   = ltaBuffer.mean() || 1e-9;
  const ratio = sta / lta;

  // Track peak during event
  if (ratio >= TRIGGER) {
    if (!eventActive) {
      eventActive  = true;
      eventStart   = Date.now();
      eventPeakPGA = 0;
      eventSamples = 0;
    }
    if (pga > eventPeakPGA) eventPeakPGA = pga;
    eventSamples++;
  } else if (eventActive && ratio < TRIGGER * 0.5) {
    // De-trigger
    eventActive = false;
  }

  return {
    pga:     parseFloat(pga.toFixed(5)),
    staLta:  parseFloat(ratio.toFixed(4)),
    isEvent: ratio >= TRIGGER,
    level:   classifyLevel(pga),
  };
}

/** Classify alert level from PGA (g) */
function classifyLevel(pga) {
  const mild     = parseFloat(process.env.THRESHOLD_MILD     || '0.05');
  const moderate = parseFloat(process.env.THRESHOLD_MODERATE || '0.15');
  const strong   = parseFloat(process.env.THRESHOLD_STRONG   || '0.30');
  if (pga >= strong)   return 'strong';
  if (pga >= moderate) return 'moderate';
  if (pga >= mild)     return 'mild';
  return 'none';
}

/**
 * Estimate local magnitude from PGA
 * Uses simplified Richter-like scale:  M ≈ log10(PGA * 1000) + 1.5
 */
function estimateMagnitude(pga) {
  if (pga <= 0) return 0;
  const mag = Math.log10(pga * 1000) + 1.5;
  return parseFloat(Math.max(0, mag).toFixed(2));
}

/**
 * Flush completed event (called after de-trigger)
 */
function flushEvent() {
  if (!eventStart || eventPeakPGA === 0) return null;
  const duration = (Date.now() - eventStart) / 1000;
  const pga      = eventPeakPGA;
  const mag      = estimateMagnitude(pga);
  const level    = classifyLevel(pga);
  eventStart   = null;
  eventPeakPGA = 0;
  eventSamples = 0;
  if (level === 'none') return null;
  return { pga, magnitude: mag, level, duration, samples: eventSamples };
}

// ── In-memory window for prediction ──────────────────────────────────────────
const PRED_WINDOW_SIZE = 4000;  // ~20s at 200Hz
const predWindow = [];

function addToPredWindow(sample) {
  predWindow.push(sample);
  if (predWindow.length > PRED_WINDOW_SIZE) predWindow.shift();
}

/**
 * Run ML-style prediction on buffered window
 * (In a real system this calls Python/TensorFlow; here we use feature scoring)
 */
function runPrediction(recentEvents = []) {
  if (predWindow.length < 200) return null;

  const pgaValues = predWindow.map(s => s.pga || 0);
  const maxPGA    = Math.max(...pgaValues);
  const meanPGA   = pgaValues.reduce((a,b) => a+b, 0) / pgaValues.length;
  const variance  = pgaValues.reduce((a,b) => a + (b-meanPGA)**2, 0) / pgaValues.length;

  // STA/LTA on window
  const recent = pgaValues.slice(-STA_WIN);
  const staVal = recent.reduce((a,b)=>a+b*b,0)/recent.length;
  const ltaVal = pgaValues.reduce((a,b)=>a+b*b,0)/pgaValues.length || 1e-9;
  const staLta = staVal / ltaVal;

  // Dominant frequency estimate (zero-crossing rate)
  let crossings = 0;
  for (let i = 1; i < pgaValues.length; i++) {
    if ((pgaValues[i] - meanPGA) * (pgaValues[i-1] - meanPGA) < 0) crossings++;
  }
  const freqPeak = parseFloat(((crossings / 2) / (predWindow.length / 200)).toFixed(2));

  // P-wave energy estimate
  const pWaveEnergy = parseFloat(Math.sqrt(variance).toFixed(4));

  // Score → probability (heuristic — replace with real model output)
  let score = 0;
  score += Math.min(staLta / 5, 1) * 30;
  score += Math.min(maxPGA / 0.5, 1) * 25;
  score += Math.min(pWaveEnergy / 0.1, 1) * 20;
  score += Math.min(freqPeak / 10, 1) * 15;
  if (recentEvents.length >= 2) score += 10;  // aftershock boost

  const probability  = Math.min(Math.round(score), 99);
  const magnitude    = parseFloat((estimateMagnitude(maxPGA * 1.3)).toFixed(1));
  const confidence   = Math.min(Math.round(60 + predWindow.length / PRED_WINDOW_SIZE * 35), 92);
  const risk         = probability >= 50 ? 'high' : probability >= 25 ? 'moderate' : 'low';

  return {
    probability,
    magnitude,
    confidence,
    risk,
    features: {
      stalta:    parseFloat(staLta.toFixed(3)),
      pWave:     pWaveEnergy,
      energy:    parseFloat(Math.sqrt(staVal).toFixed(4)),
      freqPeak,
      zVariance: parseFloat(variance.toFixed(6)),
    },
  };
}

module.exports = { processSample, classifyLevel, estimateMagnitude, flushEvent, addToPredWindow, runPrediction };
