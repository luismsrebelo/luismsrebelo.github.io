/*!
 * A visual map of AI model types — input × output matrix and task filters.
 * (c) Luís Rebelo. MIT License. No dependencies.
 * Works on the task cards rendered in the page (progressive enhancement).
 */
(function () {
  'use strict';

  const ROWS = [
    ['text', 'Text'], ['image', 'Image'], ['video', 'Video'], ['audio', 'Audio'], ['document', 'Document'],
    ['table', 'Table'], ['timeseries', 'Time series'], ['graph', 'Graph'], ['environment', 'Environment'],
  ];
  const COLS = [
    ['Label', ['label']], ['Location', ['boxes', 'mask', 'keypoints', 'depth']], ['Number', ['number', 'score']],
    ['Vector / rank', ['vector', 'ranking']], ['Text', ['text']], ['Image', ['image']], ['Video', ['video']],
    ['Audio', ['audio']], ['3D', ['3d']], ['Action', ['action']],
  ];

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  }

  function boot() {
    const list = document.getElementById('ai-task-list');
    const matrixHost = document.querySelector('[data-aitask="matrix"]');
    const filterHost = document.querySelector('[data-aitask="filters"]');
    if (!list || !matrixHost || !filterHost) return;

    const cards = Array.from(list.querySelectorAll('.aitask')).map((node) => ({
      node,
      name: node.querySelector('.aitask__name').textContent,
      cat: node.dataset.cat,
      ins: node.dataset.in ? node.dataset.in.split(' ') : [],
      outs: node.dataset.out.split(' '),
      gen: node.dataset.gen === '1',
      text: node.textContent.toLowerCase(),
    }));
    const sections = Array.from(list.querySelectorAll('.aitasks__cat'));
    const state = { cat: 'all', mode: 'all', q: '', cell: null };

    /* ---------- Matrix ---------- */
    const cellTasks = (row, col) => cards.filter((c) => c.ins.includes(row) && c.outs.some((o) => col[1].includes(o)));
    let max = 1;
    ROWS.forEach(([r]) => COLS.forEach((col) => { max = Math.max(max, cellTasks(r, col).length); }));

    const table = el('table', { class: 'aimatrix' });
    const thead = el('tr', {}, [el('th', { class: 'aimatrix__corner', text: 'input ↓ / output →' })]);
    COLS.forEach((c) => thead.appendChild(el('th', { scope: 'col', text: c[0] })));
    table.appendChild(el('thead', {}, [thead]));
    const tbody = el('tbody');
    const cellButtons = [];
    ROWS.forEach(([r, rl]) => {
      const tr = el('tr', {}, [el('th', { scope: 'row', text: rl })]);
      COLS.forEach((col) => {
        const tasks = cellTasks(r, col);
        const td = el('td');
        if (tasks.length) {
          const b = el('button', {
            type: 'button', class: 'aimatrix__cell', text: String(tasks.length),
            title: rl + ' → ' + col[0] + ': ' + tasks.map((t) => t.name).join(', '),
            'aria-label': tasks.length + ' tasks from ' + rl + ' to ' + col[0] + ': ' + tasks.map((t) => t.name).join(', '),
          });
          b.style.setProperty('--a', (0.18 + 0.82 * tasks.length / max).toFixed(2));
          b.addEventListener('click', () => {
            const same = state.cell && state.cell.r === r && state.cell.c === col[0];
            state.cell = same ? null : { r, c: col[0], label: rl + ' → ' + col[0], names: new Set(tasks.map((t) => t.name)) };
            cellButtons.forEach((x) => x.classList.remove('is-active'));
            if (!same) b.classList.add('is-active');
            apply(true);
          });
          cellButtons.push(b);
          td.appendChild(b);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    matrixHost.innerHTML = '';
    matrixHost.append(el('div', { class: 'aimatrix__wrap' }, [table]),
      el('p', { class: 'mlv-status', text: 'Each number is how many task types turn that kind of input into that kind of output. Darker = more; empty cells are combinations no common task covers. "Any-to-Any" models (not counted) span the whole grid. Click a cell to list those tasks below.' }));

    /* ---------- Filters ---------- */
    const chipGroup = (label, options, key) => {
      const g = el('div', { class: 'aifilter__group', role: 'group', 'aria-label': label }, [el('span', { class: 'aifilter__label', text: label })]);
      const btns = options.map(([v, t]) => {
        const b = el('button', { type: 'button', class: 'aifilter__chip' + (state[key] === v ? ' is-active' : ''), text: t, 'aria-pressed': String(state[key] === v) });
        b.addEventListener('click', () => {
          state[key] = v;
          btns.forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
          apply();
        });
        g.appendChild(b);
        return b;
      });
      return g;
    };
    const catOptions = [['all', 'All']].concat(sections.map((s) => [s.dataset.cat, s.querySelector('h2').textContent]));
    const search = el('input', { type: 'search', class: 'aifilter__search', placeholder: 'Search tasks, e.g. "segmentation" or "ECG"', 'aria-label': 'Search tasks' });
    search.addEventListener('input', () => { state.q = search.value.trim().toLowerCase(); apply(); });
    const summary = el('p', { class: 'aifilter__summary', 'aria-live': 'polite' });
    filterHost.innerHTML = '';
    filterHost.append(
      chipGroup('Area', catOptions, 'cat'),
      chipGroup('What it does', [['all', 'All'], ['analyse', 'Analyses'], ['generate', 'Generates']], 'mode'),
      search, summary
    );

    function apply(scroll) {
      let shown = 0;
      cards.forEach((c) => {
        const ok = (state.cat === 'all' || c.cat === state.cat)
          && (state.mode === 'all' || (state.mode === 'generate') === c.gen)
          && (!state.q || c.text.includes(state.q))
          && (!state.cell || state.cell.names.has(c.name));
        c.node.hidden = !ok;
        if (ok) shown++;
      });
      sections.forEach((s) => { s.hidden = !s.querySelector('.aitask:not([hidden])'); });
      summary.innerHTML = '';
      summary.append('Showing ' + shown + ' of ' + cards.length + ' task types' + (state.cell ? ' for ' + state.cell.label : '') + '. ');
      if (state.cell) {
        summary.appendChild(el('button', { type: 'button', class: 'mlv-btn', text: 'Clear matrix selection', onclick: () => {
          state.cell = null; cellButtons.forEach((x) => x.classList.remove('is-active')); apply();
        } }));
      }
      if (scroll) filterHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
