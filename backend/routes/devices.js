/**
 * GET  /api/devices           — list all registered sensor nodes
 * POST /api/devices           — register a new sensor node
 * GET  /api/devices/:id       — single device detail + stats
 * PUT  /api/devices/:id       — update device metadata
 * GET  /api/devices/:id/readings — recent readings for one device
 */

const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { SensorReading, SeismicEvent } = require('../models');

// ── Device registry (in-memory + DB hybrid) ───────────────────────────────────
const deviceRegistry = new Map([
  ['ETH-001', { id:'ETH-001', name:'Addis Ababa Central',  lat:9.0254,  lon:38.7469, region:'Central Highlands',   zone:'moderate', city:'Addis Ababa', country:'Ethiopia', installDate:'2024-01-15', active:true }],
  ['ETH-002', { id:'ETH-002', name:'Awash Valley Station', lat:8.9806,  lon:40.1686, region:'Afar Rift',            zone:'high',     city:'Awash',       country:'Ethiopia', installDate:'2024-01-20', active:true }],
  ['ETH-003', { id:'ETH-003', name:'Dire Dawa Monitor',    lat:9.5931,  lon:41.8661, region:'Eastern Escarpment',  zone:'moderate', city:'Dire Dawa',   country:'Ethiopia', installDate:'2024-02-01', active:true }],
  ['ETH-004', { id:'ETH-004', name:'Mekelle Array',        lat:13.4966, lon:39.4766, region:'Tigray',               zone:'moderate', city:'Mekelle',     country:'Ethiopia', installDate:'2024-02-10', active:true }],
  ['ETH-005', { id:'ETH-005', name:'Harar Sensor',         lat:9.3119,  lon:42.1183, region:'Eastern Ethiopia',    zone:'low',      city:'Harar',       country:'Ethiopia', installDate:'2024-03-01', active:true }],
  ['ETH-007', { id:'ETH-007', name:'Afar Triangle Node',   lat:11.8251, lon:41.0186, region:'Afar Depression',     zone:'critical', city:'Logia',       country:'Ethiopia', installDate:'2024-01-10', active:true }],
  ['ETH-011', { id:'ETH-011', name:'Koka Reservoir',       lat:8.4108,  lon:39.4837, region:'Main Ethiopian Rift', zone:'high',     city:'Koka',        country:'Ethiopia', installDate:'2024-01-25', active:true }],
]);

// ── GET /api/devices ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Enrich each device with latest reading stats from DB
    const devices = [];
    for (const [id, device] of deviceRegistry) {
      const [lastReading, eventCount, totalReadings] = await Promise.all([
        SensorReading.findOne({ deviceId: id }).sort({ createdAt: -1 }).select('pga magnitude createdAt').lean(),
        SeismicEvent.countDocuments({ deviceId: id }),
        SensorReading.countDocuments({ deviceId: id }),
      ]).catch(() => [null, 0, 0]);

      const secondsAgo = lastReading
        ? (Date.now() - new Date(lastReading.createdAt).getTime()) / 1000
        : null;

      devices.push({
        ...device,
        status:        secondsAgo !== null && secondsAgo < 60 ? 'online' : 'offline',
        lastSeenSecs:  secondsAgo,
        lastPGA:       lastReading?.pga || 0,
        lastMagnitude: lastReading?.magnitude || 0,
        eventCount,
        totalReadings,
      });
    }

    // Sort: critical first, then by zone danger
    const zoneOrder = { critical:0, high:1, moderate:2, low:3 };
    devices.sort((a, b) => (zoneOrder[a.zone] || 3) - (zoneOrder[b.zone] || 3));

    res.json({ ok:true, count:devices.length, data:devices });
  } catch (err) {
    res.status(500).json({ ok:false, error:err.message });
  }
});

// ── POST /api/devices — register new device ────────────────────────────────────
router.post('/', (req, res) => {
  const { id, name, lat, lon, region, zone, city, country } = req.body;
  if (!id || !name || lat === undefined || lon === undefined) {
    return res.status(400).json({ ok:false, error:'id, name, lat, lon required' });
  }
  if (deviceRegistry.has(id)) {
    return res.status(409).json({ ok:false, error:`Device ${id} already registered` });
  }
  const device = { id, name, lat:parseFloat(lat), lon:parseFloat(lon), region:region||'Unknown', zone:zone||'low', city:city||'', country:country||'Ethiopia', installDate:new Date().toISOString().slice(0,10), active:true };
  deviceRegistry.set(id, device);
  console.log(`📡 New device registered: ${id} — ${name}`);
  res.status(201).json({ ok:true, data:device });
});

// ── GET /api/devices/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const device = deviceRegistry.get(req.params.id);
  if (!device) return res.status(404).json({ ok:false, error:'Device not found' });

  try {
    const [recentReadings, recentEvents, agg] = await Promise.all([
      SensorReading.find({ deviceId:req.params.id }).sort({ createdAt:-1 }).limit(20).lean(),
      SeismicEvent.find({ deviceId:req.params.id }).sort({ createdAt:-1 }).limit(10).lean(),
      SensorReading.aggregate([
        { $match: { deviceId:req.params.id } },
        { $group: { _id:null, maxPGA:{ $max:'$pga' }, avgPGA:{ $avg:'$pga' }, count:{ $sum:1 } } },
      ]),
    ]);

    res.json({
      ok: true,
      data: { ...device, recentReadings, recentEvents, stats: agg[0] || { maxPGA:0, avgPGA:0, count:0 } },
    });
  } catch (err) {
    res.status(500).json({ ok:false, error:err.message });
  }
});

// ── PUT /api/devices/:id ───────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  if (!deviceRegistry.has(req.params.id)) {
    return res.status(404).json({ ok:false, error:'Device not found' });
  }
  const current = deviceRegistry.get(req.params.id);
  const allowed = ['name','region','zone','city','country','active','lat','lon'];
  const update  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }
  const updated = { ...current, ...update };
  deviceRegistry.set(req.params.id, updated);
  res.json({ ok:true, data:updated });
});

// ── GET /api/devices/:id/readings ─────────────────────────────────────────────
router.get('/:id/readings', async (req, res) => {
  const n = Math.min(parseInt(req.query.n) || 100, 500);
  try {
    const readings = await SensorReading
      .find({ deviceId:req.params.id })
      .sort({ createdAt:-1 })
      .limit(n)
      .lean();
    res.json({ ok:true, count:readings.length, data:readings.reverse() });
  } catch (err) {
    res.status(500).json({ ok:false, error:err.message });
  }
});

module.exports = router;
