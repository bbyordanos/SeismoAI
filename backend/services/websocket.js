/**
 * WebSocket Service
 * Broadcasts real-time sensor readings and alerts to the React frontend
 */
const { WebSocketServer } = require('ws');

let wss = null;
const clients = new Set();

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    clients.add(ws);
    console.log(`🔌 WS client connected (total: ${clients.size})`);

    // Send welcome / current state
    ws.send(JSON.stringify({ type: 'connected', message: 'SeismoAI live feed active' }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`🔌 WS client disconnected (total: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.error('WS client error:', err.message);
      clients.delete(ws);
    });
  });

  console.log('✅ WebSocket server ready on /ws');
}

/**
 * Broadcast a message to all connected frontend clients
 * @param {string} type - event type
 * @param {Object} data - payload
 */
function broadcast(type, data) {
  if (!wss || clients.size === 0) return;
  const msg = JSON.stringify({ type, data, ts: Date.now() });
  for (const client of clients) {
    if (client.readyState === 1) {   // OPEN
      client.send(msg);
    }
  }
}

module.exports = { initWebSocket, broadcast, get clientCount() { return clients.size; } };
