let prompts = JSON.parse(localStorage.getItem('prompt-library') || '[]');
prompts = prompts.map(p => ({ ...p, date: new Date(p.date) }));

const titleEl = document.getElementById('inp-title');
const contentEl = document.getElementById('inp-content');
const charCount = document.getElementById('char-count');
const gridEl = document.getElementById('grid');
const searchEl = document.getElementById('inp-search');
const searchRow = document.getElementById('search-row');

contentEl.addEventListener('input', () => {
  charCount.textContent = contentEl.value.length + ' / 2000';
});

document.getElementById('btn-save').addEventListener('click', () => {
  const title = titleEl.value.trim();
  const content = contentEl.value.trim();
  if (!title) { shake(titleEl); return; }
  if (!content) { shake(contentEl); return; }
  prompts.unshift({ id: Date.now(), title, content, date: new Date() });
  save();
  titleEl.value = '';
  contentEl.value = '';
  charCount.textContent = '0 / 2000';
  render();
  showToast('Prompt saved');
});

function save() {
  localStorage.setItem('prompt-library', JSON.stringify(prompts));
}

function shake(el) {
  el.style.borderColor = '#c5221f';
  el.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(-4px)'},{transform:'translateX(0)'}],{duration:250,easing:'ease-out'});
  setTimeout(() => el.style.borderColor = '', 800);
}

function render() {
  const q = searchEl.value.toLowerCase();
  const filtered = q ? prompts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)) : prompts;

  document.getElementById('stat-total').textContent = prompts.length;
  if (prompts.length) {
    const avgWords = Math.round(prompts.reduce((a,p) => a + p.content.split(/\s+/).length, 0) / prompts.length);
    document.getElementById('stat-words').textContent = avgWords;
    const d = prompts[0].date;
    document.getElementById('stat-recent').textContent = d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
  } else {
    document.getElementById('stat-words').textContent = '0';
    document.getElementById('stat-recent').textContent = '—';
  }

  searchRow.style.display = prompts.length > 2 ? '' : 'none';
  document.getElementById('lib-label').textContent = filtered.length ? `Library · ${filtered.length} prompt${filtered.length !== 1 ? 's' : ''}` : 'Library';

  if (!filtered.length) {
    gridEl.innerHTML = prompts.length
      ? `<div class="empty">No prompts match your search.</div>`
      : `<div class="empty">No prompts yet. Add your first one above.</div>`;
    return;
  }

  gridEl.innerHTML = filtered.map(p => {
    const d = p.date.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
    const words = p.content.split(/\s+/).length;
    return `<div class="prompt-card" id="card-${p.id}">
        <div class="card-body">
          <div class="card-title">${esc(p.title)}</div>
          <div class="card-content">${esc(p.content)}</div>
          <div class="card-meta">${d} · ${words} word${words !== 1 ? 's' : ''}</div>
        </div>
        <div class="card-actions">
          <button class="btn-copy" onclick="copyPrompt(${p.id}, this)">Copy</button>
          <button class="btn-delete" onclick="deletePrompt(${p.id})">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function copyPrompt(id, btn) {
  const p = prompts.find(x => x.id === id);
  if (!p) return;
  navigator.clipboard.writeText(p.content).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
  });
}

function deletePrompt(id) {
  const card = document.getElementById('card-' + id);
  if (card) {
    card.style.transition = 'opacity 0.2s, transform 0.2s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(12px)';
  }
  setTimeout(() => {
    prompts = prompts.filter(p => p.id !== id);
    save();
    render();
    showToast('Prompt deleted');
  }, 200);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

searchEl.addEventListener('input', render);
render();
