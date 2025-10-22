import { $, $$, initTheme, state, debounce } from './assets.js';
import { renderLibrary } from './library.js';
import { clearAuthorForm, renderAuthor, addFcRow, addQRow, saveFromAuthor, deleteCurrent } from './author.js';
import { renderLearn, renderFlashcard, markKnown, renderQuizStep, exportCapsule, renderNotes, handleImportText } from './learn.js';
import { storage } from './storage.js';

// Initialize theme
initTheme();

// Navigation between main views
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(x => x.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    const view = btn.dataset.view;
    $$('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    if(view === 'library') renderLibrary();
    if(view === 'author') renderAuthor(state.currentId);
    if(view === 'learn') renderLearn(state.currentId);
  });
});


// Header buttons
document.getElementById('btn-new').addEventListener('click', () => {
  state.currentId = null;
  document.getElementById('tab-author').click();
  clearAuthorForm();
  document.getElementById('meta-title').focus();
});

// Import JSON
document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  try {
    const text = await file.text();
    handleImportText(text);
    alert('Imported successfully!');
    document.getElementById('tab-library').click();
    renderLibrary();
  } catch(err) {
    alert('Import error: ' + err.message);
  } finally {
    e.target.value = '';
  }
});

// Author actions
document.getElementById('btn-add-fc').addEventListener('click', () => addFcRow());
document.getElementById('btn-add-q').addEventListener('click', () => addQRow());
document.getElementById('btn-save').addEventListener('click', () => saveFromAuthor());
document.getElementById('btn-delete').addEventListener('click', () => deleteCurrent());

// Learn actions
document.getElementById('learn-select').addEventListener('change', () => renderLearn(document.getElementById('learn-select').value));

$$('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.seg-btn').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    state.learnSeg = btn.dataset.seg;
    $$('.seg').forEach(s => s.classList.remove('active'));
    document.getElementById('seg-' + state.learnSeg).classList.add('active');
  });
});

document.getElementById('notes-search').addEventListener('input', debounce(() => {
  const c = storage.readCapsule(state.currentId);
  if(c) renderNotes(c);
}, 180));

document.getElementById('fc-card').addEventListener('click', () => { 
  state.fc.flipped = !state.fc.flipped; 
  renderFlashcard(); 
});
document.getElementById('fc-card').addEventListener('keydown', (e) => { 
  if(e.code === 'Space'){ 
    e.preventDefault(); 
    state.fc.flipped = !state.fc.flipped; 
    renderFlashcard(); 
  } 
});
document.getElementById('fc-prev').addEventListener('click', () => { 
  if(state.fc.list.length){ 
    state.fc.i = (state.fc.i - 1 + state.fc.list.length) % state.fc.list.length; 
    state.fc.flipped = false; 
    renderFlashcard(); 
  } 
});
document.getElementById('fc-next').addEventListener('click', () => { 
  if(state.fc.list.length){ 
    state.fc.i = (state.fc.i + 1) % state.fc.list.length; 
    state.fc.flipped = false; 
    renderFlashcard(); 
  } 
});
document.getElementById('fc-known').addEventListener('click', () => markKnown(true));
document.getElementById('fc-unknown').addEventListener('click', () => markKnown(false));

document.getElementById('btn-export').addEventListener('click', () => {
  const id = document.getElementById('learn-select').value;
  if(!id){ alert('Please select a capsule first.'); return; }
  exportCapsule(id);
});

// Keyboard shortcuts for Learn view
document.addEventListener('keydown', (e) => {
  if(!document.getElementById('view-learn').classList.contains('active')) return;
  if(e.code === 'Space' && document.getElementById('seg-flashcards').classList.contains('active')){
    e.preventDefault(); 
    state.fc.flipped = !state.fc.flipped; 
    renderFlashcard();
  }
  if(e.key === '[' || e.key === ']'){
    e.preventDefault();
    const segs = ['notes','flashcards','quiz'];
    let i = segs.indexOf(state.learnSeg);
    i = (i + (e.key === ']' ? 1 : -1) + segs.length) % segs.length;
    state.learnSeg = segs[i];
    $$('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.seg === state.learnSeg));
    $$('.seg').forEach(s => s.classList.remove('active'));
    document.getElementById('seg-' + state.learnSeg).classList.add('active');
  }
});

// Initialize library view on load
renderLibrary();
