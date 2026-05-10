/**
 * GET  /api/alerts/config     — get current alert configuration
 * POST /api/alerts/config     — update alert thresholds
 * POST /api/alerts/test       — send a test Telegram message
 * GET  /api/alerts/telegram   — get Telegram bot status
 */

const express = require('express');
const router  = express.Router();
const { sendMessage, isReady } = require('../services/telegram');
const { DeviceConfig } = require('../models');

// ── GET /api/alerts/telegram ──────────────────────────────────────────────────
router.get('/telegram', (_req, res) => {
  res.json({
    ok: true,
    enabled: process.env.TELEGRAM_ENABLED !== 'false',
    configured: isReady,
    chatId: process.env.TELEGRAM_CHAT_ID ? '***' + process.env.TELEGRAM_CHAT_ID.slice(-4) : null,
  });
});

// ── POST /api/alerts/test ─────────────────────────────────────────────────────
router.post('/test', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ ok: false, error: 'Telegram bot not configured' });
  }
  try {
    const msgId = await sendMessage(
      '✅ *SeismoAI Test Alert*\n\nYour Telegram notifications are working correctly!\n_SeismoAI — Earthquake Early Warning System_'
    );
    res.json({ ok: true, messageId: msgId });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/alerts/config ────────────────────────────────────────────────────
router.get('/config', async (req, res) => {
  try {
    let config = await DeviceConfig.findOne({ deviceId: 'esp32-01' }).lean();
    if (!config) {
      config = {
        deviceId:          'esp32-01',
        sampleRate:        200,
        thresholdMild:     parseFloat(process.env.THRESHOLD_MILD     || '0.05'),
        thresholdModerate: parseFloat(process.env.THRESHOLD_MODERATE || '0.15'),
        thresholdStrong:   parseFloat(process.env.THRESHOLD_STRONG   || '0.30'),
        staWindow:         parseInt(process.env.STA_WINDOW           || '100'),
        ltaWindow:         parseInt(process.env.LTA_WINDOW           || '1000'),
        staLtaTrigger:     parseFloat(process.env.STA_LTA_TRIGGER    || '3.0'),
        telegramEnabled:   process.env.TELEGRAM_ENABLED !== 'false',
      };
    }
    res.json({ ok: true, data: config });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── POST /api/alerts/config ───────────────────────────────────────────────────
router.post('/config', async (req, res) => {
  const allowed = ['thresholdMild','thresholdModerate','thresholdStrong','staLtaTrigger','telegramEnabled','sampleRate'];
  const update  = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  update.updatedAt = new Date();

  try {
    const config = await DeviceConfig.findOneAndUpdate(
      { deviceId: 'esp32-01' },
      { $set: update },
      { upsert: true, new: true }
    ).lean();
    res.json({ ok: true, data: config });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
