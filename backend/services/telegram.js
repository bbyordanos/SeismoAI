/**
 * Telegram Alert Service
 * Sends formatted earthquake alerts to a Telegram chat via Bot API
 */

let bot = null;
let botReady = false;

function initTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const enabled = process.env.TELEGRAM_ENABLED !== 'false';

  if (!token || token === 'your_bot_token_here' || !enabled) {
    console.warn('⚠️  Telegram bot not configured — alerts disabled');
    return;
  }

  try {
    const TelegramBot = require('node-telegram-bot-api');
    bot = new TelegramBot(token, { polling: false });
    botReady = true;
    console.log('✅ Telegram bot initialized');
  } catch (err) {
    console.warn('⚠️  Telegram init failed:', err.message);
  }
}

/**
 * Send earthquake alert to Telegram
 * @param {Object} event - SeismicEvent data
 * @returns {Promise<number|null>} Telegram message_id or null
 */
async function sendAlert(event) {
  if (!botReady || !bot) return null;

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return null;

  const emoji = {
    mild:     '⚠️',
    moderate: '🚨',
    strong:   '🔴',
  }[event.level] || '📡';

  const action = {
    mild:     'Be aware. Minor shaking possible.',
    moderate: 'Take cover under sturdy furniture!',
    strong:   '🆘 DROP, COVER, HOLD ON immediately!',
  }[event.level] || '';

  const text = [
    `${emoji} *SEISMOAI EARTHQUAKE ALERT*`,
    ``,
    `*Magnitude:* M ${event.magnitude.toFixed(1)} — ${event.level.toUpperCase()}`,
    `*Peak Acceleration:* ${event.pga.toFixed(4)} g`,
    `*Location:* ${event.location || 'Local sensor'}`,
    event.lat ? `*Coordinates:* ${event.lat}°N, ${event.lon}°E` : null,
    event.depth ? `*Depth:* ${event.depth} km` : null,
    `*Detected:* ${new Date(event.createdAt || Date.now()).toUTCString()}`,
    ``,
    `🛡️ *Action:* ${action}`,
    ``,
    `_SeismoAI Early Warning System — ESP32 + ADXL335_`,
  ].filter(Boolean).join('\n');

  try {
    const msg = await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    return msg.message_id;
  } catch (err) {
    console.error('Telegram send error:', err.message);
    return null;
  }
}

/**
 * Send a custom text message (test, prediction summary, etc.)
 */
async function sendMessage(text) {
  if (!botReady || !bot) return null;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return null;
  try {
    const msg = await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    return msg.message_id;
  } catch (err) {
    console.error('Telegram send error:', err.message);
    return null;
  }
}

module.exports = { initTelegram, sendAlert, sendMessage, get isReady() { return botReady; } };
