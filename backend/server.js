/**
 * SeismoAI Backend — Main Server
 * ─────────────────────────────────────────────────────
 * Express + MongoDB + WebSocket server
 *
 * Key endpoints:
 *   POST /api/ingest          ← ESP32 sends sensor data here
 *   POST /api/ingest/batch    ← ESP32 bulk batch
 *   GET  /api/sensor/latest   ← frontend polls live readings
 *   GET  /api/events/recent   ← frontend polls events
 *   POST /api/predict         ← run AI prediction
 *   GET  /ws                  ← WebSocket live feed
 */

require('dotenv').config();

const express     = require('express');
const http        = require('http');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

const { connectDB }              = require('./config/db');
const { initWebSocket }          = require('./services/websocket');
const { initTelegram }           = require('./services/telegram');
const { espLogger, errorHandler, notFound } = require('./middleware');

// ── Routes ────────────────────────────────────────────────────────────────────
const ingestRoutes  = require('./routes/ingest');
const sensorRoutes  = require('./routes/sensor');
const eventsRoutes  = require('./routes/events');
const predictRoutes = require('./routes/predict');
const alertsRoutes  = require('./routes/alerts');
const devicesRoutes = require('./routes/devices');

// ── App setup ─────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const PORT   = parseInt(process.env.PORT) || 5000;

// ── Security & parsing middleware ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(espLogger);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Generous for ESP32 (200 Hz = 200 req/s), tighter for other endpoints
const sensorLimiter = rateLimit({
  windowMs: 1000,       // 1 second
  max: 250,             // allow 250 req/s (safe above 200 Hz)
  skip: () => false,
  message: { ok: false, error: 'Rate limit exceeded' },
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 300,
  message: { ok: false, error: 'Too many requests' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/ingest',  sensorLimiter, ingestRoutes);
app.use('/api/sensor',  apiLimiter, sensorRoutes);
app.use('/api/events',  apiLimiter, eventsRoutes);
app.use('/api/predict', apiLimiter, predictRoutes);
app.use('/api/alerts',  apiLimiter, alertsRoutes);
app.use('/api/devices', apiLimiter, devicesRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok:      true,
    service: 'SeismoAI Backend',
    version: '1.0.0',
    uptime:  Math.round(process.uptime()),
    time:    new Date().toISOString(),
  });
});

// ── API docs index ────────────────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    ok: true,
    name: 'SeismoAI API',
    version: '1.0.0',
    endpoints: {
      ingest: {
        'POST /api/ingest':         'Single sensor reading from ESP32',
        'POST /api/ingest/batch':   'Batch readings (up to 50)',
      },
      sensor: {
        'GET /api/sensor':          'Paginated sensor readings',
        'GET /api/sensor/latest':   'Last N readings',
        'GET /api/sensor/stats':    'Aggregate stats',
      },
      events: {
        'GET /api/events':          'Paginated seismic events',
        'GET /api/events/recent':   'Last 20 events',
        'GET /api/events/stats':    'Event statistics',
        'GET /api/events/:id':      'Single event detail',
      },
      predict: {
        'POST /api/predict':        'Run ML prediction',
        'GET /api/predict/latest':  'Most recent prediction',
        'GET /api/predict/history': 'Prediction history',
      },
      alerts: {
        'GET /api/alerts/telegram': 'Telegram bot status',
        'POST /api/alerts/test':    'Send test Telegram message',
        'GET /api/alerts/config':   'Get alert config',
        'POST /api/alerts/config':  'Update alert config',
      },
      ws: {
        'WS /ws': 'WebSocket live feed (sensor, alert, batch events)',
      },
    },
  });
});

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  initTelegram();
  initWebSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║       SeismoAI Backend — Running              ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  HTTP   → http://localhost:${PORT}               ║`);
    console.log(`║  WS     → ws://localhost:${PORT}/ws              ║`);
    console.log(`║  Ingest → POST http://localhost:${PORT}/api/ingest║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

module.exports = app;
