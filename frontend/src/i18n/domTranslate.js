// DOM-level runtime translation: catches text rendered outside the t() system
// (the 17 game components) and translates it with the same cached pipeline.
// - Text nodes AND placeholder/title/aria-label attributes are translated.
// - Numbers are tokenized (⟦0⟧) before lookup so "Level 2" / "If you pay ₹63…"
//   share one cache entry instead of one per number.
// - Originals are remembered so switching back to English restores them.
// React re-renders restore English; the observer re-applies the cached
// translation instantly — no network cost, no infinite loop.

import { lookup, register, onChange } from './lang.js';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
const ATTRS = ['placeholder', 'title', 'aria-label'];
const MAX_LEN = 300;

let observer = null;
let offChange = null;
let rafId = null;
const origText = new WeakMap();   // Text node → original value
const origAttrs = new WeakMap();  // Element → { attr: original }

function tokenize(text) {
  const nums = [];
  const key = text.replace(/\d+/g, (m) => { nums.push(m); return `⟦${nums.length - 1}⟧`; });
  return { key, nums };
}
function detokenize(hit, nums) {
  return hit
    .replace(/[⟦\[]\s*(\d+)\s*[⟧\]]/g, (m, i) => (nums[Number(i)] ?? m))
    .replace(/[⟦\[]\s*[⟧\]]/g, ''); // tokens lost in translation — don't show them
}

function skippableEl(el) {
  if (!el) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.closest && el.closest('.lang-switch')) return true; // native language names
  return false;
}

function translateText(trimmed) {
  if (!trimmed || trimmed.length > MAX_LEN || !/[A-Za-z]/.test(trimmed)) return null;
  const { key, nums } = /\d/.test(trimmed) ? tokenize(trimmed) : { key: trimmed, nums: [] };
  const hit = lookup(key);
  if (hit === undefined) { register([key]); return null; }
  if (hit === '' || hit === key) return null;
  return detokenize(hit, nums);
}

function translateTextNode(node) {
  const text = node.nodeValue;
  if (!text || !/[A-Za-z]/.test(text)) return;
  const trimmed = text.trim();
  const out = translateText(trimmed);
  if (out == null || out === trimmed) return;
  if (!origText.has(node)) origText.set(node, text);
  node.nodeValue = text.replace(trimmed, out);
}

function translateAttr(el, attr) {
  const val = el.getAttribute(attr);
  if (!val) return;
  const trimmed = val.trim();
  const out = translateText(trimmed);
  if (out == null || out === trimmed) return;
  if (!origAttrs.has(el)) origAttrs.set(el, {});
  const rec = origAttrs.get(el);
  if (!(attr in rec)) rec[attr] = val;
  el.setAttribute(attr, out);
}

function scan(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) { if (!skippableEl(root.parentElement)) translateTextNode(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (skippableEl(root)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) { return skippableEl(n.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; },
  });
  const batch = [];
  let n;
  while ((n = walker.nextNode())) batch.push(n);
  batch.forEach(translateTextNode);

  if (root.querySelectorAll) {
    root.querySelectorAll('[placeholder], [title], [aria-label]').forEach((el) => {
      ATTRS.forEach((a) => translateAttr(el, a));
    });
  }
  if (root.hasAttribute && ATTRS.some((a) => root.hasAttribute(a))) {
    ATTRS.forEach((a) => translateAttr(root, a));
  }
}

function restoreAll() {
  // Restore originals tracked so far; React owns the rest on next render.
  document.querySelectorAll('[placeholder], [title], [aria-label]').forEach((el) => {
    const rec = origAttrs.get(el);
    if (!rec) return;
    Object.entries(rec).forEach(([a, v]) => el.setAttribute(a, v));
    origAttrs.delete(el);
  });
  // Text nodes: TreeWalker over tracked ones isn't possible with WeakMap;
  // a full-document walk is cheap enough for this app's size.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const batch = [];
  let n;
  while ((n = walker.nextNode())) batch.push(n);
  batch.forEach((node) => {
    const orig = origText.get(node);
    if (orig !== undefined && node.nodeValue !== orig) node.nodeValue = orig;
  });
}

function scheduleScan() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => { rafId = null; scan(document.body); });
}

export function startDomTranslation() {
  if (typeof document === 'undefined' || observer) return;
  scan(document.body); // translate everything already rendered
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        if (!skippableEl(m.target.parentElement)) translateTextNode(m.target);
      } else if (m.type === 'attributes') {
        if (!skippableEl(m.target)) translateAttr(m.target, m.attributeName);
      } else {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            if (!skippableEl(node.parentElement)) translateTextNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            scan(node);
          }
        }
      }
    }
  });
  observer.observe(document.body, {
    characterData: true, childList: true, subtree: true,
    attributes: true, attributeFilter: ATTRS,
  });
  // Re-scan when new translations land (nodes queued on first sight).
  offChange = onChange(scheduleScan);
}

export function stopDomTranslation() {
  if (observer) { observer.disconnect(); observer = null; }
  if (offChange) { offChange(); offChange = null; }
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (typeof document !== 'undefined' && document.body) restoreAll();
}
