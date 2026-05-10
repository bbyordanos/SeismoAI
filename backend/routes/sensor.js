/**
 * GET  /api/sensor          — paginated sensor readings
 * GET  /api/sensor/latest   — last N readings (live feed)
 * GET  /api/sensor/stats    — aggregate statistics
 * DELETE /api/sensor        — clear all readings (dev only)
 */

const express = require('express');
const router  = express.Router();
const { SensorReading } = require('../models');

// ── GET /api/sensor/latest?n=200 ──────────────────────────────────────────────
router.get('/latest', async (req, res) => {
  const n = Math.min(parseInt(req.query.n) || 200, 1000);
  try {
    const readings = await SensorReading
      .find({}, { x:1, y:1, z:1, magnitude:1, pga:1, label:1, createdAt:1 })
      .sort({ createdAt: -1 })
      .limit(n)
      .lean();
    res.json({ ok: true, count: readings.length, data: readings.reverse() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/sensor/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, quakeCount, last24h] = await Promise.all([
      SensorReading.countDocuments(),
      SensorReading.countDocuments({ label: 1 }),
      SensorReading.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
    ]);

    const agg = await SensorReading.aggregate([
      { $group: {
        _id: null,
        maxPGA: { $max: '$pga' },
        avgPGA: { $avg: '$pga' },
        maxMag: { $max: '$magnitude' },
      }},
    ]);

    res.json({
      ok: true,
      stats: {
        total,
        quakeCount,
        noiseCount: total - quakeCount,
        last24h,
        maxPGA: agg[0]?.maxPGA || 0,
        avgPGA: agg[0]?.avgPGA || 0,
        maxMagnitude: agg[0]?.maxMag || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/sensor?page=1&limit=50&label=1 ───────────────────────────────────
router.get('/', async (req, res) => {
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const query = {};
  if (req.query.label !== undefined) query.label = parseInt(req.query.label);
  if (req.query.from)  query.createdAt = { $gte: new Date(req.query.from) };
  if (req.query.to)    query.createdAt = { ...(query.createdAt || {}), $lte: new Date(req.query.to) };

  try {
    const [data, total] = await Promise.all([
      SensorReading.find(query).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
      SensorReading.countDocuments(query),
    ]);
    res.json({ ok: true, page, limit, total, pages: Math.ceil(total/limit), data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── DELETE /api/sensor (dev only) ─────────────────────────────────────────────
router.delete('/', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ ok: false, error: 'Not allowed in production' });
  }
  try {
    const { deletedCount } = await SensorReading.deleteMany({});
    res.json({ ok: true, deleted: deletedCount });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
