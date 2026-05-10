const mongoose = require('mongoose');

// ── SensorReading ─────────────────────────────────────────────────────────────
// Raw sample posted by the ESP32 every ~5ms (200 Hz)
const SensorReadingSchema = new mongoose.Schema({
  x:         { type: Number, required: true },   // X-axis acceleration (g)
  y:         { type: Number, required: true },   // Y-axis acceleration (g)
  z:         { type: Number, required: true },   // Z-axis acceleration (g)
  magnitude: { type: Number, required: true },   // sqrt(x²+y²+z²)
  pga:       { type: Number, default: 0 },       // Peak ground acceleration
  deviceId:  { type: String, default: 'esp32-01' },
  label:     { type: Number, default: 0 },       // 0 = noise, 1 = seismic event
  createdAt: { type: Date,   default: Date.now, index: true },
}, { versionKey: false });

// Keep only last 30 days of raw readings (TTL index)
SensorReadingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// ── SeismicEvent ──────────────────────────────────────────────────────────────
// Detected earthquake event (created when STA/LTA threshold is exceeded)
const SeismicEventSchema = new mongoose.Schema({
  magnitude:    { type: Number, required: true },
  level:        { type: String, enum: ['mild', 'moderate', 'strong'], required: true },
  pga:          { type: Number, required: true },
  staLta:       { type: Number, default: 0 },
  depth:        { type: Number, default: null },         // km, if known
  lat:          { type: Number, default: null },
  lon:          { type: Number, default: null },
  location:     { type: String, default: 'Unknown' },
  duration:     { type: Number, default: 0 },            // seconds
  alertSent:    { type: Boolean, default: false },
  telegramMsgId:{ type: Number, default: null },
  deviceId:     { type: String, default: 'esp32-01' },
  rawSamples:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'SensorReading' }],
  createdAt:    { type: Date, default: Date.now, index: true },
}, { versionKey: false });

// ── Prediction ────────────────────────────────────────────────────────────────
const PredictionSchema = new mongoose.Schema({
  probability:  { type: Number, required: true },  // 0–100
  magnitude:    { type: Number, required: true },
  confidence:   { type: Number, required: true },
  risk:         { type: String, enum: ['low', 'moderate', 'high'] },
  region:       { type: String, default: 'Unknown' },
  coords:       { type: String, default: '' },
  features: {
    stalta:    Number,
    pWave:     Number,
    energy:    Number,
    freqPeak:  Number,
    zVariance: Number,
  },
  windowStart:  { type: Date },
  windowEnd:    { type: Date },
  createdAt:    { type: Date, default: Date.now, index: true },
}, { versionKey: false });

// ── DeviceConfig ───────────────────────────────────────────────────────────────
const DeviceConfigSchema = new mongoose.Schema({
  deviceId:           { type: String, required: true, unique: true },
  sampleRate:         { type: Number, default: 200 },     // Hz
  thresholdMild:      { type: Number, default: 0.05 },
  thresholdModerate:  { type: Number, default: 0.15 },
  thresholdStrong:    { type: Number, default: 0.30 },
  staWindow:          { type: Number, default: 100 },
  ltaWindow:          { type: Number, default: 1000 },
  staLtaTrigger:      { type: Number, default: 3.0 },
  telegramEnabled:    { type: Boolean, default: true },
  updatedAt:          { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = {
  SensorReading: mongoose.model('SensorReading', SensorReadingSchema),
  SeismicEvent:  mongoose.model('SeismicEvent',  SeismicEventSchema),
  Prediction:    mongoose.model('Prediction',    PredictionSchema),
  DeviceConfig:  mongoose.model('DeviceConfig',  DeviceConfigSchema),
};
