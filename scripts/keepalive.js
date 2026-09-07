/**
 * Keepalive script for Render free tier
 * 
 * Render's free tier spins down after 15 minutes of inactivity.
 * This script pings the backend health endpoint every 10 minutes
 * to keep the service alive.
 * 
 * Usage:
 *   node scripts/keepalive.js
 * 
 * Note: This only works when running continuously.
 * For production, consider using a cron job or external service
 * like UptimeRobot (free tier available).
 */

const https = require('https');
const http = require('http');

// Configurable via env or defaults
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const PING_INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS) || 10 * 60 * 1000; // 10 minutes default
const HEALTH_ENDPOINT = '/api/health';

console.log('=== SmritiLoom Keepalive ===');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Ping interval: ${PING_INTERVAL_MS / 1000 / 60} minutes`);
console.log('Press Ctrl+C to stop\n');

function pingBackend() {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL);
    const lib = url.protocol === 'https:' ? https : http;
    
    const req = lib.get(`${BACKEND_URL}${HEALTH_ENDPOINT}`, {
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[${new Date().toLocaleTimeString()}] ✓ Ping successful (status: ${res.statusCode})`);
          resolve(true);
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] ✗ Ping failed (status: ${res.statusCode})`);
          reject(new Error(`Status: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`[${new Date().toLocaleTimeString()}] ✗ Ping error: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`[${new Date().toLocaleTimeString()}] ✗ Ping timeout`);
      reject(new Error('Timeout'));
    });
  });
}

// Initial ping on start
async function initialPing() {
  console.log('Sending initial ping...');
  try {
    await pingBackend();
    console.log('Backend is responsive!\n');
  } catch (err) {
    console.log('Backend not reachable yet, will retry...\n');
  }
}

// Start ping loop
async function startKeepalive() {
  await initialPing();
  
  setInterval(async () => {
    try {
      await pingBackend();
    } catch (err) {
      // Log but don't crash - next ping will retry
    }
  }, PING_INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping keepalive...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nStopping keepalive...');
  process.exit(0);
});

startKeepalive();
