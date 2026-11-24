/*!
 * Local LLMs, explained visually — interactive widgets for the blog post
 * (c) Luís Rebelo. MIT License. No dependencies.
 */
(function () {
  'use strict';

  const TEAL = '#2f7f93', ORANGE = '#e07a2f', PURPLE = '#7b5ea7', GREEN = '#3a9a5b', PINK = '#c2456b', OLIVE = '#8a7a2a';

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  }
  function button(label, onclick, primary) {
    return el('button', { type: 'button', class: 'mlv-btn' + (primary ? ' mlv-btn--primary' : ''), text: label, onclick });
  }
  function select(label, options, value, onchange) {
    const s = el('select', { 'aria-label': label });
    options.forEach(([v, t]) => { const o = el('option', { value: v, text: t }); if (String(v) === String(value)) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', () => onchange(s.value));
    return el('label', { class: 'mlv-select' }, [label + ' ', s]);
  }
  function slider(label, min, max, step, value, oninput, format) {
    const f = format || ((v) => String(v));
    const out = el('output', { text: f(value) });
    const input = el('input', { type: 'range', min, max, step, value, 'aria-label': label });
    input.addEventListener('input', () => { const v = parseFloat(input.value); out.textContent = f(v); oninput(v); });
    return el('label', { class: 'mlv-slider' }, [label + ' ', input, out]);
  }
  const gb = (bytes) => (bytes / 1e9).toFixed(1);

  /* ------------------------------------------------------------------ */
  /* 1. Model name decoder                                               */
  /* ------------------------------------------------------------------ */

  const NAME_PARTS = [
    { t: 'Qwen', c: TEAL, title: 'Family: Qwen', body: 'The model family made by the Qwen team at Alibaba Cloud. The name is short for <em>Tongyi Qianwen</em> (通义千问); "Qianwen" means roughly "a thousand questions". Other families you will see in LM Studio: Llama (Meta), Gemma (Google), Mistral, Phi (Microsoft), DeepSeek, GPT-OSS (OpenAI).' },
    { t: '3', c: TEAL, title: 'Generation: 3', body: 'The third major generation (Qwen → Qwen1.5 → Qwen2 → Qwen2.5 → <strong>Qwen3</strong>). A higher number means newer training data and a newer recipe. It does <em>not</em> say anything about size.' },
    { t: '-Coder', c: ORANGE, title: 'Specialisation: Coder', body: 'A variant trained further on source code and on agentic coding tasks (reading files, calling tools, fixing tests). Other common tags: <em>VL</em> (vision-language, accepts images), <em>Math</em>, <em>Embedding</em> (turns text into vectors for search), <em>Thinking</em> (reasons step by step before answering).' },
    { t: '-30B', c: PURPLE, title: 'Size: 30B parameters', body: 'About <strong>30.5 billion parameters</strong>: the learned numbers (weights) inside the network. More parameters usually means more knowledge and better reasoning, but also more memory. Rule of thumb: memory ≈ parameters × bits-per-weight ÷ 8.' },
    { t: '-A3B', c: PURPLE, title: 'Active: 3B per token', body: '"<strong>A</strong>ctivated <strong>3B</strong>": this is a <em>Mixture-of-Experts</em> (MoE) model. All 30.5B parameters must be stored, but for each token a router picks 8 of 128 "experts", so only about 3.3B parameters are actually computed. Result: knowledge of a 30B model at roughly the speed of a 3B model.' },
    { t: '-Instruct', c: GREEN, title: 'Tuning: Instruct', body: 'Fine-tuned to follow instructions and chat. A <em>Base</em> model only continues text and is meant for further training. Qwen3-Coder answers directly (no hidden "thinking" phase), which keeps coding agents fast.' },
    { t: '-Q4_K_M', c: PINK, title: 'Quantisation: Q4_K_M', body: 'The weights are compressed from 16 bits to about <strong>4.8 bits</strong> each on average. <strong>Q4</strong> = roughly 4-bit; <strong>K</strong> = llama.cpp\'s "k-quant" method (weights grouped in blocks with their own scales); <strong>M</strong> = Medium mix (some sensitive tensors kept at 6 bits). This is why the file is 18.6 GB instead of ~61 GB.' },
    { t: '.gguf', c: OLIVE, title: 'File format: GGUF', body: 'The single-file format used by llama.cpp, the engine inside LM Studio on Windows and Linux. One file holds the weights <em>and</em> the metadata: architecture (<code>qwen3moe</code>), tokenizer, chat template and context length. On Apple Silicon you will also see <strong>MLX</strong> models, Apple\'s own format.' },
  ];

  function nameDecoder(root) {
    root.innerHTML = '';
    const name = el('div', { class: 'llm-name', role: 'group', 'aria-label': 'Parts of the model file name' });
    const card = el('div', { class: 'llm-name__card', 'aria-live': 'polite' });
    const btns = NAME_PARTS.map((p, i) => {
      const b = el('button', { type: 'button', class: 'llm-name__part', text: p.t });
      b.style.setProperty('--c', p.c);
      b.addEventListener('click', () => show(i));
      b.addEventListener('mouseenter', () => show(i));
      b.addEventListener('focus', () => show(i));
      name.appendChild(b);
      return b;
    });
    function show(i) {
      btns.forEach((b, j) => b.classList.toggle('is-active', i === j));
      card.style.setProperty('--c', NAME_PARTS[i].c);
      card.innerHTML = '<strong class="llm-name__title">' + NAME_PARTS[i].title + '</strong><p>' + NAME_PARTS[i].body + '</p>';
    }
    root.append(el('p', { class: 'mlv-status', text: 'Hover over or tap each part of the file name:' }), name, card);
    show(0);
  }

  /* ------------------------------------------------------------------ */
  /* 2. Memory calculator                                                */
  /* ------------------------------------------------------------------ */

  // Architecture numbers from the official model cards / config.json files.
  const MODELS = {
    'qwen3-coder-30b': { name: 'Qwen3-Coder-30B-A3B', params: 30.5, layers: 48, kvHeads: 4, headDim: 128, maxCtx: 262144, moe: true },
    'qwen3-8b': { name: 'Qwen3-8B (dense)', params: 8.2, layers: 36, kvHeads: 8, headDim: 128, maxCtx: 131072 },
    'llama3.1-8b': { name: 'Llama 3.1 8B (dense)', params: 8.0, layers: 32, kvHeads: 8, headDim: 128, maxCtx: 131072 },
    'qwen3-32b': { name: 'Qwen3-32B (dense)', params: 32.8, layers: 64, kvHeads: 8, headDim: 128, maxCtx: 131072 },
  };
  // Approximate average bits per weight of llama.cpp quantisation types.
  const QUANTS = [['16', 'F16 (16 bit)'], ['8.5', 'Q8_0 (~8.5 bit)'], ['6.56', 'Q6_K (~6.6 bit)'], ['5.69', 'Q5_K_M (~5.7 bit)'], ['4.85', 'Q4_K_M (~4.8 bit)'], ['4.25', 'IQ4_XS (~4.3 bit)'], ['3.91', 'Q3_K_M (~3.9 bit)'], ['2.96', 'Q2_K (~3 bit)']];
  const KV_TYPES = [['2', 'F16 (default)'], ['1.0625', 'Q8_0'], ['0.5625', 'Q4_0']];
  const OVERHEAD = 0.8e9; // compute buffers, CUDA/Vulkan context: rough estimate

  function memoryCalc(root) {
    root.innerHTML = '';
    let model = 'qwen3-coder-30b', bpw = 4.85, ctx = 32768, kvBytes = 2, vram = 16;
    const bar = el('div', { class: 'llm-mem', role: 'img' });
    const legend = el('div', { class: 'llm-mem__legend' });
    const status = el('p', { class: 'mlv-status', 'aria-live': 'polite' });
    const controls = el('div', { class: 'mlv-controls' });
    const ctxSel = el('span');
    function ctxOptions() {
      const m = MODELS[model], opts = [];
      for (let c = 4096; c <= m.maxCtx; c *= 2) opts.push([c, (c / 1024) + 'K tokens']);
      if (ctx > m.maxCtx) ctx = m.maxCtx;
      ctxSel.innerHTML = '';
      ctxSel.appendChild(select('Context length', opts, ctx, (v) => { ctx = +v; draw(); }));
    }
    controls.append(
      select('Model', Object.keys(MODELS).map((k) => [k, MODELS[k].name]), model, (v) => { model = v; ctxOptions(); draw(); }),
      select('Quantisation', QUANTS, bpw, (v) => { bpw = +v; draw(); }),
      ctxSel,
      select('KV cache type', KV_TYPES, kvBytes, (v) => { kvBytes = +v; draw(); }),
      select('Your GPU VRAM', [[6, '6 GB'], [8, '8 GB'], [12, '12 GB'], [16, '16 GB'], [24, '24 GB'], [32, '32 GB'], [48, '48 GB']], vram, (v) => { vram = +v; draw(); })
    );
    function draw() {
      const m = MODELS[model];
      const weights = m.params * 1e9 * bpw / 8;
      const kv = ctx * m.layers * m.kvHeads * m.headDim * 2 /* K and V */ * kvBytes;
      const total = weights + kv + OVERHEAD, cap = vram * 1e9;
      const scale = Math.max(total, cap) * 1.05;
      const pct = (v) => (100 * v / scale).toFixed(2) + '%';
      bar.innerHTML = '';
      bar.append(
        el('div', { class: 'llm-mem__seg', style: 'width:' + pct(weights) + ';background:' + TEAL, title: 'Weights ' + gb(weights) + ' GB' }),
        el('div', { class: 'llm-mem__seg', style: 'width:' + pct(kv) + ';background:' + ORANGE, title: 'KV cache ' + gb(kv) + ' GB' }),
        el('div', { class: 'llm-mem__seg', style: 'width:' + pct(OVERHEAD) + ';background:' + PURPLE, title: 'Overhead ~' + gb(OVERHEAD) + ' GB' }),
        el('div', { class: 'llm-mem__vram', style: 'left:' + pct(cap) }, [el('span', { text: vram + ' GB VRAM' })])
      );
      bar.setAttribute('aria-label', 'Estimated memory: weights ' + gb(weights) + ' GB, KV cache ' + gb(kv) + ' GB, overhead ' + gb(OVERHEAD) + ' GB, total ' + gb(total) + ' GB, against ' + vram + ' GB of VRAM');
      legend.innerHTML = '';
      [['Model weights', weights, TEAL], ['KV cache (context)', kv, ORANGE], ['Overhead (est.)', OVERHEAD, PURPLE]].forEach(([n, v, c]) => {
        legend.appendChild(el('span', {}, [el('i', { style: 'background:' + c }), n + ': ' + gb(v) + ' GB']));
      });
      legend.appendChild(el('strong', { text: 'Total ≈ ' + gb(total) + ' GB' }));
      let msg;
      if (total <= cap) {
        msg = '✅ Fits entirely in GPU memory: set GPU Offload to the maximum for the best speed.';
      } else {
        const fit = Math.max(0, cap - kv - OVERHEAD) / weights;
        const layers = Math.floor(fit * m.layers);
        msg = '⚠️ Does not fit in ' + vram + ' GB. With the KV cache on the GPU, about ' + layers + ' of ' + m.layers + ' layers fit (GPU Offload ≈ ' + layers + '); the rest runs from system RAM on the CPU, which is slower.';
        if (m.moe) msg += ' Because this is a MoE model, keeping the expert weights on the CPU hurts much less than for a dense model: only ~3B parameters are used per token.';
      }
      status.textContent = msg + ' KV cache = context × ' + m.layers + ' layers × ' + m.kvHeads + ' KV heads × ' + m.headDim + ' dims × 2 (K and V) × bytes per value.';
    }
    root.append(bar, legend, controls, status);
    ctxOptions(); draw();
  }

  /* ------------------------------------------------------------------ */
  /* 3. Mixture-of-Experts router                                        */
  /* ------------------------------------------------------------------ */

  function moe(root) {
    root.innerHTML = '';
    const tokens = ['def', ' fibonacci', '(n', '):', '\n   ', ' if', ' n', ' <', ' 2', ':', ' return', ' n'];
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const strip = el('div', { class: 'llm-moe__tokens', 'aria-hidden': 'true' });
    const tokEls = tokens.map((t) => { const s = el('span', { text: t.replace('\n', '↵') }); strip.appendChild(s); return s; });
    const grid = el('div', { class: 'llm-moe__grid', role: 'img', 'aria-label': '128 expert blocks; 8 light up for each token' });
    const cells = Array.from({ length: 128 }, () => { const c = el('span'); grid.appendChild(c); return c; });
    const compare = el('div', { class: 'llm-moe__compare' }, [
      el('div', {}, [el('span', { text: 'Stored (MoE)' }), el('b', { style: 'width:100%;background:' + PURPLE }), el('em', { text: '30.5B' })]),
      el('div', {}, [el('span', { text: 'Used per token (MoE)' }), el('b', { style: 'width:' + (3.3 / 30.5 * 100).toFixed(1) + '%;background:' + ORANGE }), el('em', { text: '≈3.3B' })]),
      el('div', {}, [el('span', { text: 'Used per token (dense 32B)' }), el('b', { style: 'width:' + (32.8 / 30.5 * 100 > 100 ? 100 : 32.8 / 30.5 * 100) + '%;background:' + TEAL }), el('em', { text: '32.8B' })]),
    ]);
    const status = el('p', { class: 'mlv-status', 'aria-live': 'polite' });
    let i = -1, timer = 0;
    function step() {
      i = (i + 1) % tokens.length;
      tokEls.forEach((t, j) => t.classList.toggle('is-active', j === i));
      cells.forEach((c) => c.classList.remove('is-on'));
      const chosen = new Set();
      while (chosen.size < 8) chosen.add(Math.floor(rand() * 128));
      chosen.forEach((k) => cells[k].classList.add('is-on'));
      status.textContent = 'Token "' + tokens[i].replace('\n', '↵').trim() + '": the router sent it to experts ' + Array.from(chosen).sort((a, b) => a - b).join(', ') + '. In each of the 48 layers a different set of 8 is chosen. All 128 must stay in memory, but only 8 do any work.';
    }
    const play = button('Play', () => { if (timer) { clearInterval(timer); timer = 0; play.textContent = 'Play'; } else { timer = setInterval(step, 700); play.textContent = 'Pause'; } }, true);
    root.append(strip, grid, el('div', { class: 'mlv-controls' }, [play, button('Next token', () => { step(); })]), status, compare);
    step();
  }

  /* ------------------------------------------------------------------ */
  /* 4. Sampling: temperature, top-k, top-p, min-p                        */
  /* ------------------------------------------------------------------ */

  function sampler(root) {
    root.innerHTML = '';
    const prompt = 'The patient\'s blood pressure was';
    const cand = [[' high', 3.2], [' normal', 2.9], [' elevated', 2.4], [' low', 1.9], [' measured', 1.5], [' 120', 1.2], [' stable', 0.9], [' checked', 0.5], [' recorded', 0.3], [' purple', -1.6]];
    let T = 0.7, K = 20, P = 0.8, MINP = 0.0;
    const sm = (xs) => { const m = Math.max(...xs), e = xs.map((x) => Math.exp(x - m)), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };
    const raw = sm(cand.map((c) => c[1]));
    const chart = el('div', { class: 'llm-samp', role: 'img' });
    const out = el('p', { class: 'llm-samp__out' });
    const status = el('p', { class: 'mlv-status', 'aria-live': 'polite' });
    // Same order as llama.cpp's default sampler chain: top-k -> top-p -> min-p -> temperature.
    function compute() {
      const idx = raw.map((p, i) => i).sort((a, b) => raw[b] - raw[a]);
      const keep = new Set(idx.slice(0, K));
      let cum = 0;
      idx.forEach((i) => { if (!keep.has(i)) return; if (cum >= P) keep.delete(i); else cum += raw[i]; });
      const pmax = raw[idx[0]];
      idx.forEach((i) => { if (keep.has(i) && raw[i] < MINP * pmax) keep.delete(i); });
      keep.add(idx[0]);
      let fin;
      if (T === 0) fin = raw.map((p, i) => (i === idx[0] ? 1 : 0));
      else {
        const logits = cand.map((c, i) => (keep.has(i) ? c[1] / T : -Infinity));
        const m = Math.max(...logits.filter(isFinite));
        const e = logits.map((x) => (isFinite(x) ? Math.exp(x - m) : 0)), z = e.reduce((a, b) => a + b, 0);
        fin = e.map((x) => x / z);
      }
      return { keep, fin };
    }
    function draw() {
      const { keep, fin } = compute();
      chart.innerHTML = '';
      cand.forEach((c, i) => {
        const row = el('div', { class: 'llm-samp__row' + (keep.has(i) && fin[i] > 0 ? '' : ' is-out') }, [
          el('span', { class: 'llm-samp__tok', text: c[0].trim() }),
          el('span', { class: 'llm-samp__track' }, [
            el('i', { class: 'llm-samp__raw', style: 'width:' + (raw[i] * 100).toFixed(1) + '%' }),
            el('b', { style: 'width:' + (fin[i] * 100).toFixed(1) + '%' }),
          ]),
          el('span', { class: 'llm-samp__pct', text: (fin[i] * 100).toFixed(1) + '%' }),
        ]);
        chart.appendChild(row);
      });
      const n = fin.filter((p) => p > 0).length;
      chart.setAttribute('aria-label', 'Probability of each candidate next word after sampling filters; ' + n + ' candidates remain.');
      status.textContent = n + ' of ' + cand.length + ' candidates can still be picked. Grey outline = the model\'s raw probability; coloured bar = the probability after your settings. ' + (T === 0 ? 'Temperature 0 means always pick the top word (greedy).' : T < 0.5 ? 'Low temperature: focused and repeatable.' : T > 1.2 ? 'High temperature: creative, but nonsense like "purple" becomes possible once filters are loose.' : '');
    }
    function sample() {
      const { fin } = compute();
      let r = Math.random(), i = 0;
      while (i < fin.length - 1 && r > fin[i]) { r -= fin[i]; i++; }
      out.innerHTML = '';
      out.append(prompt, el('mark', { text: cand[i][0] }));
    }
    out.append(prompt + ' …');
    const controls = el('div', { class: 'mlv-controls' }, [
      slider('Temperature', 0, 2, 0.05, T, (v) => { T = v; draw(); }, (v) => v.toFixed(2)),
      slider('Top K', 1, 20, 1, K, (v) => { K = v; draw(); }),
      slider('Top P', 0.05, 1, 0.05, P, (v) => { P = v; draw(); }, (v) => v.toFixed(2)),
      slider('Min P', 0, 0.5, 0.01, MINP, (v) => { MINP = v; draw(); }, (v) => v.toFixed(2)),
      button('Sample next word', sample, true),
    ]);
    root.append(out, chart, controls, status);
    draw();
  }

  /* ------------------------------------------------------------------ */

  const WIDGETS = { name: nameDecoder, memory: memoryCalc, moe, sampler };
  function boot() {
    document.querySelectorAll('.mlv-demo[data-llm]').forEach((node) => {
      const fn = WIDGETS[node.dataset.llm];
      if (fn) { node.classList.add('is-ready'); fn(node); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
