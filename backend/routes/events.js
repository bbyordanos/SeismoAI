/**
 * GET  /api/events           — paginated seismic events
 * GET  /api/events/recent    — last 20 events
 * GET  /api/events/stats     — summary stats
 * GET  /api/events/:id       — single event
 */

const express = require('express');
const router  = express.Router();
const { SeismicEvent } = require('../models');

// ── GET /api/events/recent ────────────────────────────────────────────────────
router.get('/recent', async (req, res) => {
  const n = Math.min(parseInt(req.query.n) || 20, 100);
  try {
    const events = await SeismicEvent.find({}, { rawSamples: 0 }).sort({ createdAt: -1 }).limit(n).lean();
    res.json({ ok: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/events/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, byLevel, weekly, maxMag] = await Promise.all([
      SeismicEvent.countDocuments(),
      SeismicEvent.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }]),
      SeismicEvent.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7*86400000) } }),
      SeismicEvent.findOne({}, { magnitude: 1 }).sort({ magnitude: -1 }).lean(),
    ]);

    const levels = { mild: 0, moderate: 0, strong: 0 };
    for (const b of byLevel) levels[b._id] = b.count;

    res.json({
      ok: true,
      stats: { total, weekly, maxMagnitude: maxMag?.magnitude || 0, ...levels },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/events?page=1&level=mild ─────────────────────────────────────────
router.get('/', async (req, res) => {
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const query = {};
  if (req.query.level) query.level = req.query.level;
  if (req.query.from)  query.createdAt = { $gte: new Date(req.query.from) };
  if (req.query.to)    query.createdAt = { ...(query.createdAt||{}), $lte: new Date(req.query.to) };

  try {
    const [data, total] = await Promise.all([
      SeismicEvent.find(query, { rawSamples: 0 }).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
      SeismicEvent.countDocuments(query),
    ]);
    res.json({ ok: true, page, limit, total, pages: Math.ceil(total/limit), data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /api/events/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const event = await SeismicEvent.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ ok: false, error: 'Event not found' });
    res.json({ ok: true, data: event });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
