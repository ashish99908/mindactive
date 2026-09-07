import api from './api.js';

const QUEUE_KEY = 'smritiloom.pendingGameResults';

const readQueue = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
};

const writeQueue = (queue) => {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch { /* storage full/unavailable */ }
};

// axios: no response object means network/DNS/CORS failure — worth retrying later.
// HTTP 4xx (bad payload etc.) should NOT be queued.
const isNetworkError = (err) => !err.response;

let flushing = false;

/** Try to send every queued result; drop ones the server accepts or rejects outright. */
export const flushQueue = async () => {
  if (flushing) return;
  const queue = readQueue();
  if (queue.length === 0) return;
  flushing = true;
  const remaining = [];
  for (const item of queue) {
    try {
      await api.post('/game-results', item.payload);
    } catch (err) {
      if (isNetworkError(err)) remaining.push(item); // still offline — keep for next attempt
      else console.error('Queued result rejected by server:', err.response?.data || err.message);
    }
  }
  writeQueue(remaining);
  flushing = false;
};

/**
 * Save a completed game session. Posts to /api/game-results; if the network is
 * unavailable the payload is queued in localStorage and synced automatically
 * as soon as the connection is back (or on next app load).
 * Returns 'saved' | 'queued' | 'failed'.
 */
export const saveGameResult = async (payload) => {
  try {
    const res = await api.post('/game-results', payload);
    return { status: 'saved', data: res.data };
  } catch (err) {
    if (isNetworkError(err)) {
      const queue = readQueue();
      queue.push({ payload, queuedAt: Date.now() });
      writeQueue(queue);
      // Best-effort sync listeners; if we're back online already this flushes immediately.
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => { flushQueue(); }, { once: true });
      }
      return { status: 'queued' };
    }
    console.error('Save game result failed:', err.response?.data || err.message);
    return { status: 'failed', error: err.response?.data?.error || err.message };
  }
};

// Flush any leftover queue on app start and whenever the browser regains connectivity.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue(); });
  flushQueue();
}
