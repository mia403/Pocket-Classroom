import { $, $$, escapeHTML, levelFa, timeAgo, slug, nowISO } from './assets.js';
import { storage } from './storage.js';
import { state } from './assets.js';

//render
export function renderLearn(selectedId) {
  const sel = $('#learn-select');
  const index = storage.readIndex().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  sel.innerHTML = index
    .map(
      (x) =>
        `<option value="${x.id}" ${x.id === selectedId ? 'selected' : ''}>${escapeHTML(x.title)}</option>`
    )
    .join('');

  const id = sel.value;
  state.currentId = id;
  const c = storage.readCapsule(id);
  if (!c) return;

  renderNotes(c);

  // Flashcards
  state.fc = { list: c.flashcards || [], i: 0, flipped: false };
  renderFlashcard();

  // Quiz
  state.quiz = { i: 0, score: 0, answers: [] };
  renderQuizStep();

  const prog = storage.readProgress(id);
  $('#foot-progress').textContent = `Best score: ${prog.bestScore || 0}% · Known: ${
    (prog.knownFlashcards || []).length
  } cards`;
}

//notes
export function renderNotes(c) {
  const list = $('#notes-list');
  const q = $('#notes-search').value?.toLowerCase() || '';
  const notes = (c.notes || []).filter((n) => n.toLowerCase().includes(q));
  list.innerHTML =
    notes.map((n) => `<li>${escapeHTML(n)}</li>`).join('') ||
    '<li style="color:var(--muted)">No notes available.</li>';
}

//flashcards
export function renderFlashcard() {
  const box = $('#fc-card');
  const list = state.fc.list;
  const i = state.fc.i;
  const total = list.length;
  $('#fc-counter').textContent = `${Math.min(i + 1, total)}/${total}`;

  if (!total) {
    box.classList.remove('flipped');
    box.innerHTML = `<div class="face">No flashcards available.</div>`;
    return;
  }
  if (i >= total) {
    const prog = storage.readProgress(state.currentId);
    const known = (prog.knownFlashcards || []).length;
    const unknown = total - known;
    box.innerHTML = `
      <div class="panel text-center" style="border:none;">
        <h3><i class="bi bi-emoji-smile"></i> Session Complete</h3>
        <p>Known cards: <b>${known}</b> / Unknown cards: <b>${unknown}</b></p>
        <button class="btn" id="fc-restart"><i class="bi bi-arrow-counterclockwise"></i> Restart</button>
      </div>
    `;
    $('#fc-restart').addEventListener('click', () => {
      state.fc.i = 0;
      renderFlashcard();
    });
    return;
  }

  box.innerHTML = `
    <div class="face front">${escapeHTML(list[i].front || '(No text)')}</div>
    <div class="face back">${escapeHTML(list[i].back || '(No text)')}</div>
  `;
  box.classList.toggle('flipped', state.fc.flipped);
}

export function fcNext() {
  if (!state.fc.list.length) return;
  state.fc.i++;
  state.fc.flipped = false;
  renderFlashcard();
}

export function fcPrev() {
  if (!state.fc.list.length) return;
  state.fc.i = Math.max(state.fc.i - 1, 0);
  state.fc.flipped = false;
  renderFlashcard();
}

export function markKnown(isKnown) {
  if (!state.currentId || !state.fc.list.length) return;
  const prog = storage.readProgress(state.currentId);
  const set = new Set(prog.knownFlashcards || []);
  if (isKnown) set.add(state.fc.i);
  else set.delete(state.fc.i);
  prog.knownFlashcards = Array.from(set).sort((a, b) => a - b);
  storage.writeProgress(state.currentId, prog);
  state.fc.i++;
  state.fc.flipped = false;
  renderFlashcard();
}

//quiz
export function renderQuizStep() {
  const c = storage.readCapsule(state.currentId);
  const qz = c?.quiz || [];
  const box = $('#quiz-box');
  const status = $('#quiz-status');

  if (!qz.length) {
    box.innerHTML = '<div class="panel">No questions available.</div>';
    status.textContent = '';
    return;
  }

 // result in screen
  if (state.quiz.i >= qz.length) {
    const percent = Math.round((state.quiz.score / qz.length) * 100);
    status.textContent = `Quiz completed · Score: ${percent}% (${state.quiz.score}/${qz.length})`;

    const prog = storage.readProgress(state.currentId);
    if (percent > (prog.bestScore || 0)) {
      prog.bestScore = percent;
      storage.writeProgress(state.currentId, prog);
    }

    box.innerHTML = `
      <div class="panel text-center" style="border:none;">
        <h3><i class="bi bi-trophy"></i> Result</h3>
        <p>Your score: <b>${percent}%</b> (${state.quiz.score}/${qz.length})</p>
        <button class="btn" id="quiz-restart"><i class="bi bi-arrow-counterclockwise"></i> Restart</button>
      </div>
    `;

    $('#quiz-restart').addEventListener('click', () => {
      state.quiz = { i: 0, score: 0, answers: [] };
      renderQuizStep();
      renderLearn(state.currentId);
    });
    return;
  }

// display the questin
  const q = qz[state.quiz.i];
  box.innerHTML = `
    <div class="panel" style="border:none;">
      <div class="quiz-q">${escapeHTML(q.text)}</div>
      <div class="quiz-opts">
        ${q.choices
          .map(
            (c, i) =>
              `<button class="btn" data-i="${i}">${String.fromCharCode(0x41 + i)}. ${escapeHTML(
                c || '-'
              )}</button>`
          )
          .join('')}
      </div>
      ${
        q.explanation
          ? `<div class="muted" style="margin-top:6px;color:var(--muted)">Explanation: ${escapeHTML(
              q.explanation
            )}</div>`
          : ''
      }
    </div>
  `;

  status.textContent = `Question ${state.quiz.i + 1} of ${qz.length} · Current score: ${
    state.quiz.score
  }`;

  box.querySelectorAll('.quiz-opts button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pick = Number(btn.dataset.i);
      const correct = q.correctIndex | 0;

      if (pick === correct) {
        btn.classList.add('correct');
        state.quiz.score++;
      } else {
        btn.classList.add('wrong');
        box.querySelector(`.quiz-opts button[data-i="${correct}"]`)?.classList.add('correct');
      }

      setTimeout(() => {
        state.quiz.i++;
        renderQuizStep();
      }, 550);
    });
  });
}

//export capsule
export function exportCapsule(id) {
  const c = storage.readCapsule(id);
  if (!c) {
    alert('Capsule not found');
    return;
  }
  const data = JSON.stringify(c, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${slug(c.meta.title) || 'capsule'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// import capsule
export function handleImportText(text) {
  const obj = JSON.parse(text);
  if (obj.schema !== 'pocket-classroom/v1') throw new Error('Invalid schema.');
  if (!obj.meta || typeof obj.meta.title !== 'string' || !obj.meta.title.trim())
    throw new Error('Invalid title.');
  const hasAny =
    (obj.notes && obj.notes.length) ||
    (obj.flashcards && obj.flashcards.length) ||
    (obj.quiz && obj.quiz.length);
  if (!hasAny) throw new Error('File is empty.');

  const id = 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const capsule = { ...obj, id, updatedAt: nowISO() };
  storage.writeCapsule(id, capsule);

  const idx = storage.readIndex();
  idx.push({
    id,
    title: capsule.meta.title,
    subject: capsule.meta.subject,
    level: capsule.meta.level,
    updatedAt: capsule.updatedAt,
  });
  storage.writeIndex(idx);
}

//keyboard listeners
document.addEventListener('keydown', (e) => {
  if (!state.fc || !state.fc.list.length) return;

  switch (e.key) {
    case 'ArrowRight':
      fcNext();
      break;
    case 'ArrowLeft':
      fcPrev();
      break;
    case ' ':
      state.fc.flipped = !state.fc.flipped;
      renderFlashcard();
      e.preventDefault();
      break;
  }
});

// buttons
$('#fc-next')?.addEventListener('click', fcNext);
$('#fc-prev')?.addEventListener('click', fcPrev);
$('#fc-card')?.addEventListener('click', () => {
  state.fc.flipped = !state.fc.flipped;
  renderFlashcard();
});
$('#fc-known')?.addEventListener('click', () => markKnown(true));
$('#fc-unknown')?.addEventListener('click', () => markKnown(false));
