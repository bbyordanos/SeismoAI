/**
 * POST /api/ingest/batch
 * ──────────────────────────────────────────────────────────────────────────────
 * Receives batched sensor data from ESP32 + ADXL335.
 *
 * ESP32 sends every 200ms:
 * {
 *   "deviceId": "ETH-001",
 *   "secret":   "esp32-seismoai-secret-key-2025",
 *   "pga":       0.0342,
 *   "staLta":    1.8,
 *   "level":     "mild",           ← computed on ESP32
 *   "samples":  [
 *     { "x": 0.012, "y": -0.008, "z": 0.981, "ts": 1234567890 },
 *     ...up to 10 samples
 *   ]
 * }
 *
 * POST /api/ingest  (single sample — legacy support)
 * {
 *   "x": 0.012, "y": -0.008, "z": 0.981,
 *   "deviceId": "ETH-001",
 *   "secret": "..."
 * }
 */

const express = require('express');
const router  = express.Router();

const { SensorReading, SeismicEvent } = require('../models');
const { processSample, estimateMagnitude, addToPredWindow } = require('../services/detector');
const { broadcast } = require('../services/websocket');
const { sendAlert }  = require('../services/telegram');

// ── Alert debounce (prevent duplicate alerts per device) ─────────────────────
const lastAlertTime = {};
const ALERT_COOLDOWN_MS = 10000;

// ── Single sample endpoint (ESP32 legacy / fallback) ─────────────────────────
router.post('/', async (req, res) => {
  const { x, y, z, deviceId = 'esp32-01', secret } = req.body;

  // Optional auth
  const serverSecret = process.env.DEVICE_SECRET;
  if (serverSecret && secret && secret !== serverSecret) {
    return res.status(401).json({ ok: false, error: 'Invalid device secret' });
  }

  if (x == null || y == null || z == null) {
    return res.status(400).json({ ok: false, error: 'x, y, z are required' });
  }

  const xf = parseFloat(x), yf = parseFloat(y), zf = parseFloat(z);
  const { pga, staLta, isEvent, level } = processSample(xf, yf, zf);
  const magnitude = estimateMagnitude(pga);

  const reading = {
    x: xf, y: yf, z: zf,
    magnitude, pga, deviceId,
    label: level !== 'none' ? 1 : 0,
    createdAt: new Date(),
  };

  let savedId = null;
  try {
    const doc = await SensorReading.create(reading);
    savedId = doc._id;
  } catch (_) {}

  addToPredWindow({ pga, x: xf, y: yf, z: zf });
  broadcast('sensor', { ...reading, staLta, level, id: savedId });

  await _handleEvent({ isEvent, level, pga, staLta, magnitude, deviceId });

  return res.status(200).json({ ok: true, pga, staLta, level, magnitude, savedId });
});

// ── Batch endpoint (main — ESP32 sends every 200ms) ──────────────────────────
router.post('/batch', async (req, res) => {
  const {
    samples,
    deviceId   = 'esp32-01',
    secret,
    pga        = 0,
    staLta     = 0,
    level      = 'none',
  } = req.body;

  // Optional auth
  const serverSecret = process.env.DEVICE_SECRET;
  if (serverSecret && secret && secret !== serverSecret) {
    return res.status(401).json({ ok: false, error: 'Invalid device secret' });
  }

  if (!Array.isArray(samples) || samples.length === 0) {
    return res.status(400).json({ ok: false, error: 'samples must be a non-empty array' });
  }
  if (samples.length > 50) {
    return res.status(400).json({ ok: false, error: 'Max 50 samples per batch' });
  }

  const docs    = [];
  const results = [];
  let   peakPga = parseFloat(pga);

  for (const s of samples) {
    const xv = parseFloat(s.x), yv = parseFloat(s.y), zv = parseFloat(s.z);
    if (isNaN(xv) || isNaN(yv) || isNaN(zv)) continue;

    // Run server-side detector too (for AI prediction window)
    const detected  = processSample(xv, yv, zv);
    const magnitude = estimateMagnitude(detected.pga);

    if (detected.pga > peakPga) peakPga = detected.pga;

    addToPredWindow({ pga: detected.pga, x: xv, y: yv, z: zv });

    docs.push({
      x: xv, y: yv, z: zv,
      magnitude,
      pga:       detected.pga,
      deviceId,
      label:     detected.level !== 'none' ? 1 : 0,
      createdAt: s.ts ? new Date(s.ts) : new Date(),
    });

    results.push({ pga: detected.pga, staLta: detected.staLta, level: detected.level, magnitude });
  }

  // Bulk save to MongoDB
  try {
    await SensorReading.insertMany(docs, { ordered: false });
  } catch (_) {}

  // Broadcast to frontend via WebSocket
  // Use the ESP32-reported level (already computed with hardware STA/LTA)
  // as it reflects real-time hardware state including LED/buzzer status
  const broadcastPayload = {
    deviceId,
    count:     results.length,
    pga:       parseFloat(peakPga.toFixed(4)),
    staLta:    parseFloat(parseFloat(staLta).toFixed(2)),
    level,                          // ← comes from ESP32 hardware
    x:         docs[docs.length-1]?.x || 0,
    y:         docs[docs.length-1]?.y || 0,
    z:         docs[docs.length-1]?.z || 0,
    magnitude: estimateMagnitude(peakPga),
    timestamp: Date.now(),
  };
  broadcast('sensor', broadcastPayload);

  // Handle alert event if ESP32 reported meaningful level
  const isEvent = level === 'moderate' || level === 'strong';
  await _handleEvent({
    isEvent,
    level,
    pga:       peakPga,
    staLta:    parseFloat(staLta),
    magnitude: estimateMagnitude(peakPga),
    deviceId,
  });

  return res.status(200).json({
    ok:        true,
    processed: results.length,
    peak: { pga: peakPga, level, staLta },
  });
});

// ── Internal: handle seismic event detection & alerts ────────────────────────
async function _handleEvent({ isEvent, level, pga, staLta, magnitude, deviceId }) {
  if (!isEvent || level === 'none') return;

  const now       = Date.now();
  const lastAlert = lastAlertTime[deviceId] || 0;
  if (now - lastAlert < ALERT_COOLDOWN_MS) return;

  lastAlertTime[deviceId] = now;

  const event = {
    magnitude,
    level,
    pga,
    staLta,
    deviceId,
    alertSent: false,
    location:  'Ethiopia — Sensor ' + deviceId,
    createdAt: new Date(),
  };

  let savedEvent = event;
  try {
    savedEvent = await SeismicEvent.create(event);
  } catch (_) {}

  broadcast('alert', savedEvent);

  try {
    const msgId = await sendAlert(savedEvent);
    if (msgId && savedEvent._id) {
      await SeismicEvent.findByIdAndUpdate(savedEvent._id, { alertSent: true, telegramMsgId: msgId });
    }
  } catch (_) {}

  console.log(`🚨 SEISMIC EVENT: M${magnitude.toFixed(1)} | Level: ${level.toUpperCase()} | PGA: ${pga.toFixed(4)}g | STA/LTA: ${staLta.toFixed(2)} | Device: ${deviceId}`);
}

module.exports = router;
