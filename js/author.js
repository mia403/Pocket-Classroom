import { $, $$, escapeHTML, uid, nowISO } from './assets.js';
import { storage } from './storage.js';
import { renderLibrary } from './library.js';

//state
export const state = {
  currentId: null
};

//pop up message
function showMessage(msg, type = 'ok', onConfirm) {
  let modal = $('#msg-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'msg-modal';
    modal.innerHTML = `
      <div class="msg-overlay"></div>
      <div class="msg-box">
        <p id="msg-text"></p>
        <div id="msg-buttons" style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  $('#msg-text').textContent = msg;
  const buttonsEl = $('#msg-buttons');
  buttonsEl.innerHTML = '';

  if (type === 'ok') {
    const btn = document.createElement('button');
    btn.textContent = 'OK';
    btn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.classList.remove('blurred');
    });
    buttonsEl.appendChild(btn);
  } else if (type === 'confirm') {
    const yes = document.createElement('button');
    yes.textContent = 'Yes';
    yes.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.classList.remove('blurred');
      if (onConfirm) onConfirm();
    });
    const no = document.createElement('button');
    no.textContent = 'No';
    no.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.classList.remove('blurred');
    });
    buttonsEl.appendChild(yes);
    buttonsEl.appendChild(no);
  }

  modal.style.display = 'flex';
  document.body.classList.add('blurred');
}

//css
const style = document.createElement('style');
style.textContent = `
  #msg-modal { display:none; position:fixed; inset:0; justify-content:center; align-items:center; z-index:9999; }
  #msg-modal .msg-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(6px); }
  #msg-modal .msg-box { position:relative; background:#fff; padding:2rem; border-radius:1rem; box-shadow:0 10px 40px rgba(0,0,0,0.3); width:360px; text-align:center; font-size:1.1rem; animation:popIn 0.25s ease; }
  #msg-modal .msg-box button { padding:0.6rem 1.4rem; border:none; border-radius:0.6rem; background:#007bff; color:#fff; cursor:pointer; font-weight:600; }
  @keyframes popIn { from {transform:scale(0.9);opacity:0;} to {transform:scale(1);opacity:1;} }
  body.blurred > *:not(#msg-modal) { filter:blur(5px); pointer-events:none; user-select:none; }
  .q-block { display:flex; flex-direction:column; gap:1rem; }
  .q-row { display:grid; grid-template-columns:repeat(2,1fr); gap:0.7rem; }
  .inline-field { display:flex; flex-direction:column; }
`;
document.head.appendChild(style);

//clear form
export function clearAuthorForm() {
  $('#meta-title').value = '';
  $('#meta-subject').value = '';
  $('#meta-level').value = 'Beginner';
  $('#meta-desc').value = '';
  $('#notes-input').value = '';
  $('#fc-rows').innerHTML = '';
  $('#quiz-rows').innerHTML = '';
  $('#btn-delete').classList.add('hidden');
  state.currentId = null;
}

// add flashcard
export function addFcRow(front = '', back = '') {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  wrap.innerHTML = `
    <div class="row-head"><span>Flashcard</span><button class="icon-btn"><i class="bi bi-x-lg"></i></button></div>
    <div class="row-body">
      <div class="inline">
        <input type="text" placeholder="Front" value="${escapeHTML(front)}">
        <input type="text" placeholder="Back" value="${escapeHTML(back)}">
      </div>
    </div>
  `;
  wrap.querySelector('.icon-btn').addEventListener('click', () => wrap.remove());
  $('#fc-rows').appendChild(wrap);
}
//add quiz
export function addQRow(q = { text:'', choices:['','','',''], correctIndex:0, explanation:'' }) {
  const wrap = document.createElement('div');
  wrap.className = 'row';
  wrap.innerHTML = `
    <div class="row-head"><span>Question</span><button class="icon-btn"><i class="bi bi-x-lg"></i></button></div>
    <div class="row-body q-block">
      <div>
        <label>Question</label>
        <input type="text" class="q-text" placeholder="Question text" value="${escapeHTML(q.text)}">
      </div>
      <div class="q-row">
        ${[0,1,2,3].map(i=>`
          <div class="inline-field">
            <label>Option ${'ABCD'[i]}</label>
            <input type="text" class="q-choice" data-i="${i}" value="${escapeHTML(q.choices[i]||'')}">
          </div>
        `).join('')}
      </div>
      <div class="inline-field">
        <label>Correct answer (0–3)</label>
        <input type="number" class="q-correct" min="0" max="3" value="${Number(q.correctIndex)||0}">
      </div>
      <div class="inline-field">
        <label>Explanation (optional)</label>
        <input type="text" class="q-expl" value="${escapeHTML(q.explanation||'')}">
      </div>
    </div>
  `;
  wrap.querySelector('.icon-btn').addEventListener('click', () => wrap.remove());
  $('#quiz-rows').appendChild(wrap);
}

//save capsule
export function saveFromAuthor() {
  const meta = {
    title: $('#meta-title').value.trim(),
    subject: $('#meta-subject').value.trim(),
    level: $('#meta-level').value,
    description: $('#meta-desc').value.trim()
  };

  const notes = $('#notes-input').value.split('\n').map(s=>s.trim()).filter(Boolean);
  const flashcards = Array.from($('#fc-rows').children).map(row=>{
    const inputs = row.querySelectorAll('input');
    return { front: inputs[0].value.trim(), back: inputs[1].value.trim() };
  }).filter(fc=>fc.front || fc.back);

  const quiz = Array.from($('#quiz-rows').children).map(row=>{
    const text = row.querySelector('.q-text').value.trim();
    const choices = Array.from(row.querySelectorAll('.q-choice'))
      .sort((a,b)=>a.dataset.i-b.dataset.i)
      .map(x=>x.value.trim());
    const correctIndex = Number(row.querySelector('.q-correct').value) || 0;
    const explanation = row.querySelector('.q-expl').value.trim();
    return { text, choices, correctIndex, explanation };
  }).filter(q=>q.text && q.choices.some(Boolean));

  if (!meta.title) return showMessage('⚠️ Please enter a title.');
  if (!meta.subject) return showMessage('⚠️ Please enter a subject.');
  if (!(notes.length || flashcards.length || quiz.length))
    return showMessage('⚠️ Please fill at least one section: Notes, Flashcards, or Quiz.');

  const id = uid();
  const capsule = { schema:'pocket-classroom/v1', id, updatedAt:nowISO(), meta, notes, flashcards, quiz };
  storage.writeCapsule(id, capsule);

  const index = storage.readIndex();
  index.push({ id, title: meta.title, subject: meta.subject, level: meta.level, updatedAt: capsule.updatedAt });
  storage.writeIndex(index);

  clearAuthorForm(); 
  showMessage('✅ Saved successfully! Ready for a new capsule.');
  renderLibrary();
  document.getElementById('tab-library').click();
}

//delete capsule
export function deleteCurrent() {
  if (!state.currentId) return;
  showMessage('🗑️ Delete this capsule?', 'confirm', ()=>{
    storage.removeCapsule(state.currentId);
    clearAuthorForm();
    renderLibrary();
    document.getElementById('tab-library').click();
  });
}

// render
export function renderAuthor(id) {
  clearAuthorForm();
}
