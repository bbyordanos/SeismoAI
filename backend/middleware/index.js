/**
 * Middleware: request logging, error handling, 404
 */

// Pretty-print incoming ESP32 POST requests
function espLogger(req, res, next) {
  if (req.path.startsWith('/api/ingest')) {
    const body = req.body;
    if (body && body.x !== undefined) {
      process.stdout.write(`\r📡 ESP32 → x=${body.x?.toFixed(4)} y=${body.y?.toFixed(4)} z=${body.z?.toFixed(4)}      `);
    }
  }
  next();
}

// Global error handler
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    ok:    false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

// 404 handler
function notFound(req, res) {
  res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.path}` });
}

module.exports = { espLogger, errorHandler, notFound };
