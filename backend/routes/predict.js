/**
 * POST /api/predict          — run ML prediction now
 * GET  /api/predict/history  — past predictions
 * GET  /api/predict/latest   — most recent prediction
 */

const express = require('express');
const router  = express.Router();
const { Prediction, SeismicEvent } = require('../models');
const { runPrediction } = require('../services/detector');
const { sendMessage }    = require('../services/telegram');

// ── POST /api/predict ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    // Get recent events for aftershock boost
    const recentEvents = await SeismicEvent.find({
      createdAt: { $gte: new Date(Date.now() - 3600000) },
    }).lean();

    const result = runPrediction(recentEvents);

    if (!result) {
      return res.status(202).json({
        ok: false,
        message: 'Not enough data yet — need at least 1 second of sensor readings',
      });
    }

    // Enrich with region info
    result.region  = 'Central Rift Valley, Ethiopia';
    result.coords  = '9.1°N, 40.5°E ± 25km';
    result.windowStart = new Date(Date.now() - 20000);
    result.windowEnd   = new Date();

    // Save prediction
    let saved = result;
    try { saved = await Prediction.create(result); } catch (_) {}

    // Send Telegram if high risk
    if (result.risk === 'high' && result.probability >= 50) {
      const msg = [
        `🔮 *SEISMOAI PREDICTION ALERT*`,
        ``,
        `*Risk:* HIGH`,
        `*Predicted Magnitude:* M ${result.magnitude}`,
        `*Probability:* ${result.probability}%`,
        `*Confidence:* ${result.confidence}%`,
        `*Region:* ${result.region}`,
        ``,
        `_This is a predictive alert — stay prepared._`,
      ].join('\n');
      sendMessage(msg).catch(() => {});
    }

    res.json({ ok: true, data: saved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/predict/latest ───────────────────────────────────────────────────
router.get('/latest', async (req, res) => {
  try {
    const pred = await Prediction.findOne().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: pred });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/predict/history?limit=20 ────────────────────────────────────────
router.get('/history', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  try {
    const history = await Prediction.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ ok: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
