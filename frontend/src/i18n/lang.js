// Global runtime translation engine.
// Languages: English, Assamese, Bodo, Meiteilon (Manipuri), Mizo.
// Translations are fetched at runtime from a free endpoint and cached in
// localStorage, so each string is translated only once per browser.

export const LANGUAGES = [
  { code: 'en', native: 'English' },
  { code: 'as', native: 'অসমীয়া' },
  { code: 'brx', native: 'बड़ो' },
  { code: 'mni', native: 'ꯃꯤꯇꯩꯂꯣꯟ' },
  { code: 'lus', native: 'Mizo ṭawng' },
];

const LANG_KEY = 'sl_lang';
const cacheKey = (lang) => `sl_tr_${lang}`;

export function getSavedLang() {
  try { return localStorage.getItem(LANG_KEY) || 'en'; } catch { return 'en'; }
}
export function saveLangPref(lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
}
export function loadCache(lang) {
  try { return JSON.parse(localStorage.getItem(cacheKey(lang)) || '{}'); } catch { return {}; }
}
function saveCache(lang, cache) {
  try { localStorage.setItem(cacheKey(lang), JSON.stringify(cache)); } catch { /* ignore */ }
}

const VAR_RE = /\{(\w+)\}/g;
export function hasVars(str) { return /\{\w+\}/.test(str); }
export function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(VAR_RE, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

async function googleTranslate(text, target) {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' +
    encodeURIComponent(target) + '&dt=t&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error('translate http ' + res.status);
  const data = await res.json();
  return (data[0] || []).map((seg) => seg && seg[0]).join('');
}

async function myMemoryTranslate(text, target) {
  const url = 'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(text) + '&langpair=en|' + encodeURIComponent(target);
  const res = await fetch(url);
  if (!res.ok) throw new Error('mymemory http ' + res.status);
  const data = await res.json();
  const out = data?.responseData?.translatedText;
  if (!out || /^MYMEMORY WARNING/i.test(out)) throw new Error('mymemory unsupported');
  return out;
}

// Provider attempts per language, tried in order. Google supports all four
// (Meiteilon is exposed as mni-Mtei); MyMemory is a fallback that at least
// covers Assamese. If every provider fails we fall back to English text.
function providersFor(lang) {
  if (lang === 'mni') return [['gtx', 'mni-Mtei'], ['gtx', 'mni'], ['mm', 'mni']];
  if (lang === 'as') return [['gtx', 'as'], ['mm', 'as']];
  return [['gtx', lang], ['mm', lang]];
}

async function translateAny(text, lang) {
  let lastErr;
  for (const [kind, tl] of providersFor(lang)) {
    try {
      const out = kind === 'gtx' ? await googleTranslate(text, tl) : await myMemoryTranslate(text, tl);
      if (out && String(out).trim()) return out;
      throw new Error('empty');
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('no provider');
}

// Protect {vars} from mangling: {name} → ⟦0⟧ before sending, restored after.
async function translateOne(str, target) {
  const names = [];
  const tokenized = str.replace(VAR_RE, (m) => { names.push(m); return `⟦${names.length - 1}⟧`; });
  let out = await translateAny(tokenized, target);
  out = String(out || '').trim();
  if (!out) throw new Error('empty translation');
  out = out.replace(/[⟦\[]\s*(\d+)\s*[⟧\]]/g, (m, i) => names[Number(i)] ?? '');
  return out;
}

// ---- batch queue -----------------------------------------------------------
const listeners = new Set();
const state = { lang: 'en', cache: {}, queued: [], inflight: new Set(), timer: null, busy: false, running: false };
const LANES = 3;        // concurrent request lanes
const BATCH = 12;       // strings per lane per round-trip

export function initTranslation(lang) {
  state.lang = lang;
  state.cache = loadCache(lang);
  state.queued = [];
  state.inflight = new Set();
  if (state.timer) { clearTimeout(state.timer); state.timer = null; }
  state.busy = false;
}
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function lookup(str) { return state.cache[str]; }
export function isBusy() { return state.busy || state.inflight.size > 0; }

function notify() { listeners.forEach((fn) => fn()); }

// Every string ever rendered, used to pre-warm caches for other languages.
const registry = new Set();
let prewarmTimer = null;
let prewarming = false;

export async function prewarmLanguages() {
  if (prewarming) return;
  prewarming = true;
  try {
    const strings = Array.from(registry).filter(Boolean);
    if (!strings.length) return;
    const others = LANGUAGES.map((l) => l.code).filter((c) => c !== state.lang);
    for (const lang of others) {
      const cache = loadCache(lang);
      const missing = strings.filter((s) => cache[s] === undefined);
      if (!missing.length) continue;
      for (let i = 0; i < missing.length; i += BATCH) {
        const batch = missing.slice(i, i + BATCH);
        await Promise.all(batch.map(async (s) => {
          try { cache[s] = await translateOne(s, lang); }
          catch { cache[s] = ''; }
        }));
        saveCache(lang, cache);
      }
    }
  } finally {
    prewarming = false;
    if (prewarmTimer) { clearTimeout(prewarmTimer); prewarmTimer = null; }
  }
}

function schedulePrewarm() {
  if (prewarming) return;
  if (prewarmTimer) clearTimeout(prewarmTimer);
  prewarmTimer = setTimeout(() => {
    prewarmTimer = null;
    const idle = (typeof window !== 'undefined' && window.requestIdleCallback)
      ? window.requestIdleCallback
      : (fn) => setTimeout(fn, 1000);
    idle(() => prewarmLanguages());
  }, 2500);
}

export function register(strings) {
  let added = false;
  for (const s of strings) {
    if (!s) continue;
    registry.add(s);
    if (state.lang === 'en') continue; // English needs no translation
    if (state.cache[s] !== undefined || state.inflight.has(s)) continue;
    if (state.queued.includes(s)) continue;
    state.queued.push(s);
    added = true;
  }
  if (state.lang !== 'en' && added) {
    if (!state.timer) state.timer = setTimeout(flush, 20);
  }
  if (registry.size) schedulePrewarm();
}

function kick() {
  if (state.running) return; // drain loop picks up new items automatically
  if (state.timer) { clearTimeout(state.timer); state.timer = null; }
  flush();
}

async function flush() {
  if (state.running || !state.queued.length) return;
  state.running = true;
  state.busy = true;
  notify();
  await Promise.all(Array.from({ length: LANES }, () => drain()));
  state.running = false;
  state.busy = false;
  saveCache(state.lang, state.cache);
  notify();
  if (state.queued.length) kick(); // strings registered while draining
}

async function drain() {
  while (state.queued.length) {
    const batch = state.queued.splice(0, BATCH);
    await Promise.all(batch.map(async (s) => {
      state.inflight.add(s);
      try {
        state.cache[s] = await translateOne(s, state.lang);
      } catch {
        state.cache[s] = ''; // '' = no translation available; keep English, don't retry-loop
      } finally {
        state.inflight.delete(s);
      }
    }));
    saveCache(state.lang, state.cache);
    notify();
  }
}
