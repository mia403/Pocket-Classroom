// library.js
import { $, $$, timeAgo, levelFa } from './assets.js';
import { storage } from './storage.js';
import { renderAuthor } from './author.js';
import { renderLearn, exportCapsule } from './learn.js';
import { state } from './assets.js';

//pop up message
function showMessage(msg) {
  let modal = $('#msg-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'msg-modal';
    modal.innerHTML = `
      <div class="msg-overlay"></div>
      <div class="msg-box">
        <p id="msg-text"></p>
        <button id="msg-ok">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#msg-ok').addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.classList.remove('blurred');
    });
  }
  $('#msg-text').textContent = msg;
  modal.style.display = 'flex';
  document.body.classList.add('blurred');
}

//yes & no confirmaiton
function showConfirmMessage(msg, onConfirm) {
  let modal = $('#msg-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'msg-modal';
    modal.innerHTML = `
      <div class="msg-overlay"></div>
      <div class="msg-box">
        <p id="msg-text"></p>
        <div id="msg-buttons" style="display:flex; justify-content:center; gap:1rem; margin-top:1rem;">
          <button id="msg-yes">Yes</button>
          <button id="msg-no">No</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  $('#msg-text').textContent = msg;
  modal.style.display = 'flex';
  document.body.classList.add('blurred');

  const yesBtn = $('#msg-yes');
  const noBtn = $('#msg-no');

  // Clear old event listeners safely
  const yes = yesBtn.cloneNode(true);
  const no = noBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(yes, yesBtn);
  noBtn.parentNode.replaceChild(no, noBtn);

  // Add fresh ones
  yes.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('blurred');
    if (onConfirm) onConfirm();
  });

  no.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.classList.remove('blurred');
  });
}

//render library
export function renderLibrary() {
  const index = storage.readIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const grid = $('#library-grid');
  grid.innerHTML = '';
  $('#library-empty').classList.toggle('hidden', index.length > 0);

  index.forEach(item => {
    const prog = storage.readProgress(item.id);
    const best = prog.bestScore || 0;
    const known = (prog.knownFlashcards || []).length;

    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div class="title">${item.title}</div>
      <div class="badges">
        <span class="badge">${item.subject || '-'}</span>
        <span class="badge">${levelFa(item.level || 'Beginner')}</span>
        <span class="badge">Updated: ${timeAgo(item.updatedAt)}</span>
      </div>
      <div><small>Best quiz score: ${best}%</small>
        <div class="progress"><span style="width:${best}%;"></span></div>
      </div>
      <div><small>Known flashcards: ${known}</small></div>
      <div style="display:flex; gap:8px; flex-wrap: wrap;">
        <button class="btn" data-act="learn"><i class="bi bi-mortarboard"></i> Learn</button>
        <button class="btn" data-act="edit"><i class="bi bi-pencil"></i> Edit</button>
        <button class="btn" data-act="export"><i class="bi bi-download"></i> Export</button>
        <button class="btn danger" data-act="delete"><i class="bi bi-trash3"></i> Delete</button>
      </div>
    `;

    // buttons listeners
    div.querySelector('[data-act="learn"]').addEventListener('click', () => {
      state.currentId = item.id;
      document.getElementById('tab-learn').click();
      renderLearn(state.currentId);
    });

    div.querySelector('[data-act="edit"]').addEventListener('click', () => {
      state.currentId = item.id;
      document.getElementById('tab-author').click();
      renderAuthor(state.currentId);
    });

    div.querySelector('[data-act="export"]').addEventListener('click', () => exportCapsule(item.id));

    div.querySelector('[data-act="delete"]').addEventListener('click', () => {
      showConfirmMessage('🗑️ Delete this capsule?', () => {
        storage.removeCapsule(item.id);
        renderLibrary();
        showMessage('✅ Capsule deleted successfully!');
      });
    });

    grid.appendChild(div);
  });

  $('#foot-progress').textContent = `Total capsules: ${index.length}`;
}

// delete current capusle
export function deleteCurrentLibrary() {
  if (!state.currentId) return;
  showConfirmMessage('🗑️ Delete this capsule?', () => {
    storage.removeCapsule(state.currentId);
    state.currentId = null;
    document.getElementById('tab-library').click();
    renderLibrary();
    showMessage('✅ Capsule deleted successfully!');
  });
}
