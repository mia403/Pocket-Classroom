
// Shortcuts for selecting DOM elements
export const $ = selector => document.querySelector(selector);
export const $$ = selector => Array.from(document.querySelectorAll(selector));

// Escape HTML special characters to prevent XSS
export const escapeHTML = (str = '') =>
  str.replace(/[&<>"']/g, m => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[m]));

// Generate unique ID for capsules
export const uid = () => 'c_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);

// Get current timestamp in ISO format
export const nowISO = () => new Date().toISOString();

// Convert ISO date to human-readable "time ago"
export const timeAgo = iso => {
  if(!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if(diff < 60) return 'a few seconds ago';
  if(diff < 3600) return Math.floor(diff/60) + ' minutes ago';
  if(diff < 86400) return Math.floor(diff/3600) + ' hours ago';
  const d = Math.floor(diff/86400);
  return d + ' days ago';
};

// Convert string to URL-friendly slug
export const slug = s => s.trim().toLowerCase()
  .replace(/[^\w\u0600-\u06FF]+/g,'-').replace(/-+/g,'-').replace(/^-|-$|_/g,'');

// Debounce function to limit execution frequency
export const debounce = (fn, wait = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

// Convert level codes to English labels
export const levelFa = lvl => lvl === 'Advanced' ? 'Advanced' : (lvl === 'Intermediate' ? 'Intermediate' : 'Beginner');

// Shared application state
export const state = {
  currentId: null,         
  learnSeg: 'notes',      
  fc: { list: [], i: 0, flipped: false },
  quiz: { i: 0, score: 0, answers: [] }, 
};

// Initialize theme and theme toggle button
export function initTheme() {
  const saved = localStorage.getItem('pc_theme') || 'dark';
  if(saved === 'light') document.body.classList.add('light');
  $('#btn-theme')?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('pc_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
}
