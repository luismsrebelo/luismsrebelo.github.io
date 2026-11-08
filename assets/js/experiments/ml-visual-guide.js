/*!
 * Machine Learning — A Visual Guide
 * Interactive, dependency-free demos for luismsrebelo.github.io/experiments/
 * (c) Luís Rebelo. MIT License.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Utilities                                                           */
  /* ------------------------------------------------------------------ */

  // Seeded PRNG (mulberry32) so datasets are reproducible.
  function rng(seed) {
    let a = seed >>> 0;
    const r = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.normal = function () {
      let u = 0, v = 0;
      while (u === 0) u = r();
      while (v === 0) v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return r;
  }
  let seedCounter = 7;
  const nextSeed = () => (seedCounter = (seedCounter * 9301 + 49297) % 233280);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));
  const fmt = (v, d = 3) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);

  const CLASS_COLORS = ['#2f7f93', '#e07a2f', '#7b5ea7', '#3a9a5b', '#c2456b', '#8a7a2a'];

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function theme() {
    return {
      text: cssVar('--global-text-color', '#494e52'),
      light: cssVar('--global-text-color-light', '#9ca1a5'),
      border: cssVar('--global-border-color', '#e6e7e8'),
      bg: cssVar('--global-bg-color', '#ffffff'),
    };
  }
  const colorCtx = document.createElement('canvas').getContext('2d');
  function hexToRgb(color) {
    // Normalise any CSS colour (names, #rgb, rgb()) via the canvas API.
    colorCtx.fillStyle = '#ffffff';
    colorCtx.fillStyle = String(color).trim();
    const norm = colorCtx.fillStyle;
    const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(norm);
    if (m) return [+m[1], +m[2], +m[3]];
    let h = norm.replace('#', '');
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) h = 'ffffff';
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const CLASS_RGB = CLASS_COLORS.map(hexToRgb);

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => n.appendChild(c));
    return n;
  }
  function button(label, onclick, primary) {
    return el('button', { type: 'button', class: 'mlv-btn' + (primary ? ' mlv-btn--primary' : ''), text: label, onclick });
  }
  function slider(label, min, max, step, value, oninput) {
    const out = el('output', { text: String(value) });
    const input = el('input', { type: 'range', min, max, step, value, 'aria-label': label });
    input.addEventListener('input', () => { out.textContent = input.value; oninput(parseFloat(input.value)); });
    return el('label', { class: 'mlv-slider' }, [document.createTextNode(label + ' '), input, out]);
  }
  function select(label, options, value, onchange) {
    const s = el('select', { 'aria-label': label });
    options.forEach(([v, t]) => { const o = el('option', { value: v, text: t }); if (v === value) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', () => onchange(s.value));
    return el('label', { class: 'mlv-select' }, [document.createTextNode(label + ' '), s]);
  }

  /* ------------------------------------------------------------------ */
  /* Plot: a responsive, HiDPI canvas with data coords in [-1, 1]^2      */
  /* ------------------------------------------------------------------ */

  class Plot {
    constructor(container, aspect) {
      this.aspect = aspect || 1;
      this.canvas = el('canvas', { class: 'mlv-canvas', role: 'img' });
      container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.pad = 0.08;
      this.resize();
    }
    resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = this.canvas.clientWidth || 320;
      const h = Math.round(w / this.aspect);
      this.canvas.style.height = h + 'px';
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = w; this.h = h;
    }
    // data (x,y) in [-1-pad, 1+pad] -> pixels
    sx(x) { return ((x + 1 + this.pad) / (2 + 2 * this.pad)) * this.w; }
    sy(y) { return this.h - ((y + 1 + this.pad) / (2 + 2 * this.pad)) * this.h; }
    inv(px, py) {
      const s = 2 + 2 * this.pad;
      return [(px / this.w) * s - 1 - this.pad, ((this.h - py) / this.h) * s - 1 - this.pad];
    }
    clear() {
      const t = theme();
      this.ctx.fillStyle = t.bg;
      this.ctx.fillRect(0, 0, this.w, this.h);
    }
    grid() {
      const t = theme(), c = this.ctx;
      c.strokeStyle = t.border; c.lineWidth = 1;
      c.beginPath();
      for (let v = -1; v <= 1.001; v += 0.5) {
        c.moveTo(this.sx(v), this.sy(-1 - this.pad)); c.lineTo(this.sx(v), this.sy(1 + this.pad));
        c.moveTo(this.sx(-1 - this.pad), this.sy(v)); c.lineTo(this.sx(1 + this.pad), this.sy(v));
      }
      c.stroke();
    }
    // fn(x, y) -> [r, g, b, alpha 0..1]; drawn on a coarse grid
    regions(fn, res) {
      res = res || 56;
      const c = this.ctx, t = theme();
      const bg = hexToRgb(t.bg);
      const cw = this.w / res, ch = this.h / res;
      for (let i = 0; i < res; i++) {
        for (let j = 0; j < res; j++) {
          const [x, y] = this.inv((i + 0.5) * cw, (j + 0.5) * ch);
          const [r, g, b, a] = fn(x, y);
          c.fillStyle = 'rgb(' + Math.round(bg[0] + (r - bg[0]) * a) + ',' + Math.round(bg[1] + (g - bg[1]) * a) + ',' + Math.round(bg[2] + (b - bg[2]) * a) + ')';
          c.fillRect(Math.floor(i * cw), Math.floor(j * ch), Math.ceil(cw) + 1, Math.ceil(ch) + 1);
        }
      }
    }
    points(pts, opts) {
      const c = this.ctx, t = theme();
      const r = (opts && opts.r) || 4.5;
      pts.forEach((p) => {
        c.beginPath();
        c.arc(this.sx(p.x), this.sy(p.y), r, 0, Math.PI * 2);
        c.fillStyle = p.c == null ? t.text : CLASS_COLORS[p.c];
        c.fill();
        c.lineWidth = 1.2; c.strokeStyle = t.bg; c.stroke();
      });
    }
    line(x1, y1, x2, y2, color, width, dash) {
      const c = this.ctx;
      c.save();
      c.strokeStyle = color; c.lineWidth = width || 2;
      if (dash) c.setLineDash(dash);
      c.beginPath(); c.moveTo(this.sx(x1), this.sy(y1)); c.lineTo(this.sx(x2), this.sy(y2)); c.stroke();
      c.restore();
    }
    // Draw the line w0*x + w1*y + b = level, clipped to the view.
    implicitLine(w0, w1, b, level, color, width, dash) {
      const L = 1 + this.pad;
      if (Math.abs(w1) > Math.abs(w0)) {
        const y = (x) => (level - b - w0 * x) / w1;
        this.line(-L, y(-L), L, y(L), color, width, dash);
      } else if (Math.abs(w0) > 1e-9) {
        const x = (y) => (level - b - w1 * y) / w0;
        this.line(x(-L), -L, x(L), L, color, width, dash);
      }
    }
    label(text, x, y, opts) {
      const c = this.ctx, t = theme();
      c.font = ((opts && opts.size) || 12) + 'px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      c.fillStyle = (opts && opts.color) || t.text;
      c.textAlign = (opts && opts.align) || 'left';
      c.textBaseline = 'top';
      c.fillText(text, x, y);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Datasets                                                            */
  /* ------------------------------------------------------------------ */

  const data = {
    blobs(n, centers, spread, seed) {
      const r = rng(seed), pts = [];
      for (let i = 0; i < n; i++) {
        const k = i % centers.length;
        pts.push({ x: clamp(centers[k][0] + r.normal() * spread, -1, 1), y: clamp(centers[k][1] + r.normal() * spread, -1, 1), c: k });
      }
      return pts;
    },
    circle(n, seed) {
      const r = rng(seed), pts = [];
      for (let i = 0; i < n; i++) {
        const inner = i % 2 === 0;
        const rad = inner ? r() * 0.4 : 0.6 + r() * 0.35;
        const a = r() * Math.PI * 2;
        pts.push({ x: rad * Math.cos(a), y: rad * Math.sin(a), c: inner ? 0 : 1 });
      }
      return pts;
    },
    xor(n, seed) {
      const r = rng(seed), pts = [];
      for (let i = 0; i < n; i++) {
        let x = r() * 2 - 1, y = r() * 2 - 1;
        x += x > 0 ? 0.08 : -0.08; y += y > 0 ? 0.08 : -0.08;
        pts.push({ x: clamp(x, -1, 1), y: clamp(y, -1, 1), c: x * y > 0 ? 0 : 1 });
      }
      return pts;
    },
    spiral(n, seed) {
      const r = rng(seed), pts = [];
      for (let i = 0; i < n; i++) {
        const c = i % 2, t = (Math.floor(i / 2) / (n / 2)) * 1.75 * Math.PI + 0.3;
        const rad = (t / (2 * Math.PI)) * 0.85;
        const a = t + c * Math.PI;
        pts.push({ x: rad * Math.cos(a) + r.normal() * 0.03, y: rad * Math.sin(a) + r.normal() * 0.03, c });
      }
      return pts;
    },
    moons(n, seed) {
      const r = rng(seed), pts = [];
      for (let i = 0; i < n; i++) {
        const c = i % 2, t = r() * Math.PI;
        const x = c === 0 ? Math.cos(t) : 1 - Math.cos(t);
        const y = c === 0 ? Math.sin(t) : 0.5 - Math.sin(t);
        pts.push({ x: (x - 0.5) * 0.9 + r.normal() * 0.06, y: (y - 0.25) * 0.9 + r.normal() * 0.06, c });
      }
      return pts;
    },
  };

  /* ------------------------------------------------------------------ */
  /* Shared demo scaffolding                                             */
  /* ------------------------------------------------------------------ */

  function scaffold(root, aspect) {
    root.innerHTML = '';
    const stage = el('div', { class: 'mlv-stage' });
    const controls = el('div', { class: 'mlv-controls' });
    const status = el('p', { class: 'mlv-status', 'aria-live': 'polite' });
    root.appendChild(stage); root.appendChild(controls); root.appendChild(status);
    const plot = new Plot(stage, aspect || 1.6);
    return { plot, controls, status, stage };
  }

  // Animation loop helper that stops when the element is off-screen.
  function animator(step) {
    let running = false, raf = 0;
    const loop = () => {
      if (!running) return;
      const keep = step();
      if (keep === false) { running = false; return; }
      raf = requestAnimationFrame(loop);
    };
    return {
      start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } },
      stop() { running = false; cancelAnimationFrame(raf); },
      get running() { return running; },
    };
  }

  const regionFromProb = (p) => {
    const k = p > 0.5 ? 1 : 0, rgb = CLASS_RGB[k];
    return [rgb[0], rgb[1], rgb[2], 0.1 + Math.abs(p - 0.5) * 0.5];
  };

  /* ------------------------------------------------------------------ */
  /* 1. Linear regression (gradient descent)                             */
  /* ------------------------------------------------------------------ */

  function linreg(root) {
    const { plot, controls, status } = scaffold(root);
    let pts, w, b, iter;
    const lr = 0.15;

    function newData() {
      const r = rng(nextSeed());
      const a = r() * 1.4 - 0.7, c = r() * 0.6 - 0.3;
      pts = [];
      for (let i = 0; i < 28; i++) { const x = r() * 1.8 - 0.9; pts.push({ x, y: clamp(a * x + c + r.normal() * 0.15, -1, 1), c: null }); }
      reset();
    }
    function reset() { w = -0.6; b = 0.5; iter = 0; anim.stop(); draw(); }
    function mse() { return pts.reduce((s, p) => s + (w * p.x + b - p.y) ** 2, 0) / pts.length; }
    function step() {
      let gw = 0, gb = 0;
      pts.forEach((p) => { const e = w * p.x + b - p.y; gw += e * p.x; gb += e; });
      w -= (lr * 2 * gw) / pts.length; b -= (lr * 2 * gb) / pts.length; iter++;
    }
    function draw() {
      plot.clear(); plot.grid();
      const t = theme();
      pts.forEach((p) => plot.line(p.x, p.y, p.x, w * p.x + b, CLASS_COLORS[1], 1.2, [3, 3]));
      plot.line(-1.1, w * -1.1 + b, 1.1, w * 1.1 + b, CLASS_COLORS[0], 3);
      plot.points(pts);
      plot.label('ŷ = ' + fmt(w, 2) + '·x + ' + fmt(b, 2), 10, plot.h - 24, { color: t.text, size: 13 });
      status.textContent = 'Iteration ' + iter + ' · mean squared error = ' + fmt(mse(), 4) + '. Dashed lines are the residuals the model is minimising. Click the chart to add a point.';
    }
    const anim = animator(() => { for (let i = 0; i < 2; i++) step(); draw(); return iter < 400; });

    plot.canvas.setAttribute('aria-label', 'Scatter plot with a regression line fitted by gradient descent');
    plot.canvas.addEventListener('click', (e) => {
      const rect = plot.canvas.getBoundingClientRect();
      const [x, y] = plot.inv(e.clientX - rect.left, e.clientY - rect.top);
      pts.push({ x: clamp(x, -1, 1), y: clamp(y, -1, 1), c: null });
      iter = Math.min(iter, 200); draw(); if (!anim.running) anim.start();
    });
    controls.append(button('Train', () => anim.start(), true), button('Reset model', reset), button('New data', newData));
    newData();
    return { redraw: () => { plot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 2. Logistic regression                                              */
  /* ------------------------------------------------------------------ */

  function logreg(root) {
    const { plot, controls, status } = scaffold(root);
    let pts, w0, w1, b, iter;
    function newData() {
      const r = rng(nextSeed());
      const a = r() * Math.PI;
      const d = 0.42;
      pts = data.blobs(80, [[Math.cos(a) * d, Math.sin(a) * d], [-Math.cos(a) * d, -Math.sin(a) * d]], 0.28, nextSeed());
      reset();
    }
    function reset() { w0 = 0.3; w1 = -0.2; b = 0; iter = 0; anim.stop(); draw(); }
    const prob = (x, y) => sigmoid(w0 * x + w1 * y + b);
    function step() {
      let g0 = 0, g1 = 0, gb = 0;
      pts.forEach((p) => { const e = prob(p.x, p.y) - p.c; g0 += e * p.x; g1 += e * p.y; gb += e; });
      const lr = 1.5 / pts.length;
      w0 -= lr * g0; w1 -= lr * g1; b -= lr * gb; iter++;
    }
    function stats() {
      let loss = 0, acc = 0;
      pts.forEach((p) => { const q = clamp(prob(p.x, p.y), 1e-7, 1 - 1e-7); loss -= p.c ? Math.log(q) : Math.log(1 - q); acc += (q > 0.5 ? 1 : 0) === p.c ? 1 : 0; });
      return [loss / pts.length, acc / pts.length];
    }
    function draw() {
      plot.clear();
      plot.regions((x, y) => regionFromProb(prob(x, y)), 48);
      plot.implicitLine(w0, w1, b, 0, theme().text, 2);
      plot.points(pts);
      const [loss, acc] = stats();
      status.textContent = 'Iteration ' + iter + ' · log-loss = ' + fmt(loss, 3) + ' · accuracy = ' + Math.round(acc * 100) + '%. Shading shows the predicted probability; the line is where p = 0.5.';
    }
    const anim = animator(() => { for (let i = 0; i < 3; i++) step(); draw(); return iter < 900; });
    plot.canvas.setAttribute('aria-label', 'Two classes of points separated by a logistic regression decision boundary');
    controls.append(button('Train', () => anim.start(), true), button('Reset model', reset), button('New data', newData));
    newData();
    return { redraw: () => { plot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 3. k-nearest neighbours                                             */
  /* ------------------------------------------------------------------ */

  function knn(root) {
    const { plot, controls, status } = scaffold(root);
    let pts, k = 5, query = null, cache = null;
    function newData() {
      pts = data.blobs(90, [[-0.45, 0.4], [0.45, 0.35], [0, -0.45]], 0.3, nextSeed());
      cache = null; draw();
    }
    function neighbours(x, y) {
      const best = [];
      for (const p of pts) {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (best.length < k || d < best[best.length - 1].d) {
          best.push({ p, d }); best.sort((a, b) => a.d - b.d);
          if (best.length > k) best.pop();
        }
      }
      return best;
    }
    function vote(nb) {
      const counts = [0, 0, 0];
      nb.forEach((n) => counts[n.p.c]++);
      let c = 0; for (let i = 1; i < 3; i++) if (counts[i] > counts[c]) c = i;
      return { c, share: counts[c] / nb.length, counts };
    }
    function draw() {
      if (!cache || cache.w !== plot.w || cache.k !== k || cache.theme !== theme().bg) {
        plot.clear();
        plot.regions((x, y) => { const v = vote(neighbours(x, y)); const rgb = CLASS_RGB[v.c]; return [rgb[0], rgb[1], rgb[2], 0.08 + 0.22 * v.share]; }, 44);
        const snap = document.createElement('canvas'); snap.width = plot.canvas.width; snap.height = plot.canvas.height; snap.getContext('2d').drawImage(plot.canvas, 0, 0);
        cache = { img: snap, w: plot.w, k, theme: theme().bg };
      } else {
        plot.ctx.save(); plot.ctx.setTransform(1, 0, 0, 1, 0, 0); plot.ctx.drawImage(cache.img, 0, 0); plot.ctx.restore();
      }
      plot.points(pts);
      if (query) {
        const nb = neighbours(query[0], query[1]), v = vote(nb);
        nb.forEach((n) => plot.line(query[0], query[1], n.p.x, n.p.y, theme().text, 1.2));
        const c = plot.ctx;
        c.beginPath(); c.arc(plot.sx(query[0]), plot.sy(query[1]), 8, 0, Math.PI * 2);
        c.fillStyle = CLASS_COLORS[v.c]; c.fill(); c.lineWidth = 2.5; c.strokeStyle = theme().text; c.stroke();
        status.textContent = 'Neighbour votes: ' + v.counts.map((n, i) => ['teal', 'orange', 'purple'][i] + ' ' + n).join(', ') + ' → predicted class: ' + ['teal', 'orange', 'purple'][v.c] + '.';
      } else {
        status.textContent = 'Move your pointer (or tap) over the chart to classify a new point by majority vote of its k nearest neighbours.';
      }
    }
    function setQuery(e) {
      const rect = plot.canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      query = plot.inv(t.clientX - rect.left, t.clientY - rect.top); draw();
    }
    plot.canvas.addEventListener('mousemove', setQuery);
    plot.canvas.addEventListener('click', setQuery);
    plot.canvas.addEventListener('touchmove', (e) => { setQuery(e); e.preventDefault(); }, { passive: false });
    plot.canvas.addEventListener('mouseleave', () => { query = null; draw(); });
    plot.canvas.setAttribute('aria-label', 'Three classes of points with k-nearest-neighbour decision regions');
    controls.append(slider('k =', 1, 25, 1, k, (v) => { k = v; cache = null; draw(); }), button('New data', newData));
    newData();
    return { redraw: () => { plot.resize(); cache = null; draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 4. Decision tree (CART, Gini impurity)                              */
  /* ------------------------------------------------------------------ */

  function gini(counts, n) { let g = 1; counts.forEach((c) => { g -= (c / n) ** 2; }); return g; }
  function classCounts(pts, nc) { const c = new Array(nc).fill(0); pts.forEach((p) => c[p.c]++); return c; }
  function buildTree(pts, depth, maxDepth, nc) {
    const counts = classCounts(pts, nc);
    const major = counts.indexOf(Math.max.apply(null, counts));
    const leaf = { leaf: true, c: major, purity: counts[major] / pts.length, n: pts.length };
    if (depth >= maxDepth || pts.length < 4 || counts[major] === pts.length) return leaf;
    let best = null;
    const parentG = gini(counts, pts.length);
    ['x', 'y'].forEach((f) => {
      const s = pts.slice().sort((a, b) => a[f] - b[f]);
      const left = new Array(nc).fill(0), right = counts.slice();
      for (let i = 0; i < s.length - 1; i++) {
        left[s[i].c]++; right[s[i].c]--;
        if (s[i][f] === s[i + 1][f]) continue;
        const nl = i + 1, nr = s.length - nl;
        const g = (nl * gini(left, nl) + nr * gini(right, nr)) / s.length;
        if (!best || g < best.g) best = { f, t: (s[i][f] + s[i + 1][f]) / 2, g };
      }
    });
    if (!best || best.g >= parentG - 1e-9) return leaf;
    const L = pts.filter((p) => p[best.f] <= best.t), R = pts.filter((p) => p[best.f] > best.t);
    return { f: best.f, t: best.t, left: buildTree(L, depth + 1, maxDepth, nc), right: buildTree(R, depth + 1, maxDepth, nc) };
  }
  function predictTree(node, x, y) {
    while (!node.leaf) node = (node.f === 'x' ? x : y) <= node.t ? node.left : node.right;
    return node;
  }
  function countLeaves(n) { return n.leaf ? 1 : countLeaves(n.left) + countLeaves(n.right); }

  function tree(root) {
    const { plot, controls, status } = scaffold(root);
    let pts, depth = 3, model;
    function newData() { pts = data.blobs(120, [[-0.5, 0.5], [0.5, 0.45], [0.05, -0.5], [-0.55, -0.35]], 0.25, nextSeed()).map((p) => ({ x: p.x, y: p.y, c: p.c % 3 })); fit(); }
    function fit() { model = buildTree(pts, 0, depth, 3); draw(); }
    function drawSplits(node, x0, x1, y0, y1) {
      if (node.leaf) return;
      const col = theme().text;
      if (node.f === 'x') { plot.line(node.t, y0, node.t, y1, col, 1.5); drawSplits(node.left, x0, node.t, y0, y1); drawSplits(node.right, node.t, x1, y0, y1); }
      else { plot.line(x0, node.t, x1, node.t, col, 1.5); drawSplits(node.left, x0, x1, y0, node.t); drawSplits(node.right, x0, x1, node.t, y1); }
    }
    function draw() {
      plot.clear();
      plot.regions((x, y) => { const l = predictTree(model, x, y); const rgb = CLASS_RGB[l.c]; return [rgb[0], rgb[1], rgb[2], 0.1 + 0.25 * l.purity]; }, 64);
      const L = 1 + plot.pad;
      drawSplits(model, -L, L, -L, L);
      plot.points(pts);
      const acc = pts.filter((p) => predictTree(model, p.x, p.y).c === p.c).length / pts.length;
      status.textContent = 'Max depth ' + depth + ' · ' + countLeaves(model) + ' leaves · training accuracy ' + Math.round(acc * 100) + '%. Each line is a yes/no question on one feature. Deep trees fit the training data perfectly but overfit.';
    }
    plot.canvas.setAttribute('aria-label', 'Axis-aligned decision regions produced by a decision tree');
    controls.append(slider('Max depth', 1, 10, 1, depth, (v) => { depth = v; fit(); }), button('New data', newData));
    newData();
    return { redraw: () => { plot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 5. Support vector machine (linear, hinge loss + L2)                 */
  /* ------------------------------------------------------------------ */

  function svm(root) {
    const { plot, controls, status } = scaffold(root);
    let pts, w0, w1, b, iter, lambda = 0.01;
    function newData() {
      const r = rng(nextSeed()), a = r() * Math.PI;
      pts = data.blobs(60, [[Math.cos(a) * 0.5, Math.sin(a) * 0.5], [-Math.cos(a) * 0.5, -Math.sin(a) * 0.5]], 0.2, nextSeed());
      reset();
    }
    function reset() { w0 = 0.5; w1 = 0.5; b = 0; iter = 0; anim.stop(); draw(); }
    const f = (p) => w0 * p.x + w1 * p.y + b;
    const ysign = (p) => (p.c === 1 ? 1 : -1);
    function step() {
      // full-batch sub-gradient descent on  λ/2·|w|² + mean(max(0, 1 − y·f(x)))
      let g0 = lambda * w0, g1 = lambda * w1, gb = 0;
      pts.forEach((p) => { const y = ysign(p); if (y * f(p) < 1) { g0 -= (y * p.x) / pts.length; g1 -= (y * p.y) / pts.length; gb -= y / pts.length; } });
      const lr = 0.5 / Math.sqrt(1 + iter * 0.05);
      w0 -= lr * g0; w1 -= lr * g1; b -= lr * gb; iter++;
    }
    function draw() {
      plot.clear();
      plot.regions((x, y) => regionFromProb(sigmoid(3 * (w0 * x + w1 * y + b))), 40);
      const t = theme();
      plot.implicitLine(w0, w1, b, 0, t.text, 2.5);
      plot.implicitLine(w0, w1, b, 1, t.text, 1.2, [6, 5]);
      plot.implicitLine(w0, w1, b, -1, t.text, 1.2, [6, 5]);
      const sv = pts.filter((p) => ysign(p) * f(p) <= 1.02);
      plot.points(pts);
      const c = plot.ctx;
      sv.forEach((p) => { c.beginPath(); c.arc(plot.sx(p.x), plot.sy(p.y), 8, 0, Math.PI * 2); c.lineWidth = 2; c.strokeStyle = t.text; c.stroke(); });
      const margin = 2 / Math.hypot(w0, w1);
      status.textContent = 'Iteration ' + iter + ' · margin width = ' + fmt(margin, 2) + ' · ' + sv.length + ' support vectors (circled). Dashed lines mark the margin; only points on or inside it shape the boundary.';
    }
    const anim = animator(() => { for (let i = 0; i < 4; i++) step(); draw(); return iter < 1200; });
    plot.canvas.setAttribute('aria-label', 'Linear support vector machine with margin lines and highlighted support vectors');
    controls.append(button('Train', () => anim.start(), true), button('Reset model', reset), button('New data', newData),
      select('Regularisation λ', [['0.001', '0.001 (hard margin)'], ['0.01', '0.01'], ['0.1', '0.1 (soft margin)']], '0.01', (v) => { lambda = parseFloat(v); iter = 0; anim.start(); }));
    newData();
    return { redraw: () => { plot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 6. k-means clustering                                               */
  /* ------------------------------------------------------------------ */

  function kmeans(root) {
    const { plot, controls, status } = scaffold(root);
    let pts, k = 4, cents, iter, phase, inertia;
    function newData() {
      const r = rng(nextSeed()), centers = [];
      [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]].forEach(([cx, cy]) => centers.push([cx + (r() - 0.5) * 0.3, cy + (r() - 0.5) * 0.3]));
      pts = data.blobs(140, centers, 0.16, nextSeed()).map((p) => ({ x: p.x, y: p.y, c: null }));
      reset();
    }
    function reset() {
      const r = rng(nextSeed());
      cents = [];
      for (let i = 0; i < k; i++) { const p = pts[Math.floor(r() * pts.length)]; cents.push({ x: p.x, y: p.y }); }
      iter = 0; phase = 'assign'; inertia = null; pts.forEach((p) => (p.c = null)); anim.stop(); draw();
    }
    const nearest = (x, y) => { let bi = 0, bd = Infinity; cents.forEach((c, i) => { const d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < bd) { bd = d; bi = i; } }); return [bi, bd]; };
    function step() {
      if (phase === 'assign') {
        let changed = false; inertia = 0;
        pts.forEach((p) => { const [c, d] = nearest(p.x, p.y); if (p.c !== c) changed = true; p.c = c; inertia += d; });
        phase = 'update';
        return changed;
      }
      cents = cents.map((c, i) => {
        const m = pts.filter((p) => p.c === i);
        return m.length ? { x: m.reduce((s, p) => s + p.x, 0) / m.length, y: m.reduce((s, p) => s + p.y, 0) / m.length } : c;
      });
      phase = 'assign'; iter++;
      return true;
    }
    function draw() {
      plot.clear();
      if (pts.some((p) => p.c != null)) plot.regions((x, y) => { const rgb = CLASS_RGB[nearest(x, y)[0]]; return [rgb[0], rgb[1], rgb[2], 0.14]; }, 48);
      else plot.grid();
      plot.points(pts);
      const c = plot.ctx, t = theme();
      cents.forEach((m, i) => {
        const x = plot.sx(m.x), y = plot.sy(m.y);
        c.save(); c.translate(x, y); c.rotate(Math.PI / 4);
        c.fillStyle = CLASS_COLORS[i]; c.fillRect(-8, -8, 16, 16);
        c.lineWidth = 2.5; c.strokeStyle = t.text; c.strokeRect(-8, -8, 16, 16);
        c.restore();
      });
      status.textContent = 'Iteration ' + iter + (inertia != null ? ' · inertia (within-cluster squared distance) = ' + fmt(inertia, 2) : '') + '. Next step: ' + (phase === 'assign' ? 'assign each point to its nearest centroid ◆.' : 'move each centroid ◆ to the mean of its points.');
    }
    let lastTick = 0, stable = 0;
    const anim = animator(() => {
      const now = performance.now();
      if (now - lastTick < 450) return true;
      lastTick = now;
      const changed = step(); draw();
      if (phase === 'update' && !changed) stable++; else if (phase === 'update') stable = 0;
      if (stable >= 1) { status.textContent += ' Converged: assignments no longer change.'; return false; }
      return iter < 50;
    });
    plot.canvas.setAttribute('aria-label', 'k-means clustering with centroids moving towards cluster means');
    controls.append(button('Run', () => { stable = 0; anim.start(); }, true), button('Step', () => { anim.stop(); step(); draw(); }), button('New centroids', reset), button('New data', newData),
      slider('k =', 2, 6, 1, k, (v) => { k = v; reset(); }));
    newData();
    return { redraw: () => { plot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 7. Principal component analysis                                     */
  /* ------------------------------------------------------------------ */

  function pca(root) {
    const { plot, controls, status } = scaffold(root);
    let pts, proj = 0, target = 0, comp;
    function newData() {
      const r = rng(nextSeed()), a = r() * Math.PI, s1 = 0.45, s2 = 0.12;
      pts = [];
      for (let i = 0; i < 90; i++) {
        const u = r.normal() * s1, v = r.normal() * s2;
        pts.push({ x0: clamp(u * Math.cos(a) - v * Math.sin(a), -1, 1), y0: clamp(u * Math.sin(a) + v * Math.cos(a), -1, 1) });
      }
      fit(); draw();
    }
    function fit() {
      const n = pts.length;
      const mx = pts.reduce((s, p) => s + p.x0, 0) / n, my = pts.reduce((s, p) => s + p.y0, 0) / n;
      let sxx = 0, syy = 0, sxy = 0;
      pts.forEach((p) => { const dx = p.x0 - mx, dy = p.y0 - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
      sxx /= n - 1; syy /= n - 1; sxy /= n - 1;
      // eigen-decomposition of the 2×2 covariance matrix
      const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
      let v1 = Math.abs(sxy) > 1e-12 ? [l1 - syy, sxy] : sxx >= syy ? [1, 0] : [0, 1];
      const nv = Math.hypot(v1[0], v1[1]); v1 = [v1[0] / nv, v1[1] / nv];
      comp = { mx, my, l1, l2, v1, v2: [-v1[1], v1[0]] };
    }
    function draw() {
      plot.clear(); plot.grid();
      const { mx, my, l1, l2, v1, v2 } = comp, t = theme();
      const L = 1.3;
      plot.line(mx - v1[0] * L, my - v1[1] * L, mx + v1[0] * L, my + v1[1] * L, CLASS_COLORS[0], 1, [4, 4]);
      const disp = pts.map((p) => {
        const d = (p.x0 - mx) * v1[0] + (p.y0 - my) * v1[1];
        const px = mx + d * v1[0], py = my + d * v1[1];
        return { x: p.x0 + (px - p.x0) * proj, y: p.y0 + (py - p.y0) * proj, c: null, px, py };
      });
      if (proj > 0) disp.forEach((p, i) => plot.line(pts[i].x0, pts[i].y0, p.x, p.y, t.light, 0.8));
      plot.points(disp, { r: 4 });
      const arrow = (v, len, col, name) => {
        const x2 = mx + v[0] * len, y2 = my + v[1] * len;
        plot.line(mx, my, x2, y2, col, 3.5);
        plot.label(name, plot.sx(x2) + 6, plot.sy(y2) - 6, { color: col, size: 13 });
      };
      arrow(v1, 2 * Math.sqrt(l1), CLASS_COLORS[0], 'PC1');
      arrow(v2, 2 * Math.sqrt(l2), CLASS_COLORS[1], 'PC2');
      const ev = l1 / (l1 + l2);
      status.textContent = 'PC1 explains ' + Math.round(ev * 100) + '% of the variance, PC2 ' + Math.round((1 - ev) * 100) + '%. ' + (target ? 'Projected onto PC1: 2 dimensions → 1 while keeping most of the information.' : 'Arrows are the eigenvectors of the covariance matrix, scaled by 2 standard deviations.');
    }
    const anim = animator(() => { proj += (target - proj) * 0.12; if (Math.abs(target - proj) < 0.003) proj = target; draw(); return proj !== target; });
    plot.canvas.setAttribute('aria-label', 'Correlated 2D data with principal component arrows and projection onto the first component');
    controls.append(button('Project onto PC1', () => { target = target ? 0 : 1; anim.start(); }, true), button('New data', () => { target = 0; proj = 0; newData(); }));
    newData();
    return { redraw: () => { plot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 8. Neural network playground (MLP + Adam, from scratch)             */
  /* ------------------------------------------------------------------ */

  class MLP {
    constructor(sizes, act, seed) {
      const r = rng(seed);
      this.sizes = sizes; this.act = act; this.W = []; this.b = []; this.m = []; this.v = []; this.t = 0;
      for (let l = 0; l < sizes.length - 1; l++) {
        const nin = sizes[l], nout = sizes[l + 1], scale = act === 'relu' ? Math.sqrt(2 / nin) : Math.sqrt(1 / nin);
        const W = new Float64Array(nin * nout); for (let i = 0; i < W.length; i++) W[i] = r.normal() * scale;
        this.W.push(W); this.b.push(new Float64Array(nout).fill(act === 'relu' ? 0.05 : 0));
        this.m.push([new Float64Array(nin * nout), new Float64Array(nout)]);
        this.v.push([new Float64Array(nin * nout), new Float64Array(nout)]);
      }
    }
    forward(x, y) {
      const a = [new Float64Array([x, y])], L = this.sizes.length - 1;
      for (let l = 0; l < L; l++) {
        const nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], out = new Float64Array(nout), prev = a[l];
        for (let j = 0; j < nout; j++) {
          let z = this.b[l][j];
          for (let i = 0; i < nin; i++) z += W[j * nin + i] * prev[i];
          out[j] = l === L - 1 ? sigmoid(z) : this.act === 'relu' ? (z > 0 ? z : 0) : Math.tanh(z);
        }
        a.push(out);
      }
      return a;
    }
    predict(x, y) { const a = this.forward(x, y); return a[a.length - 1][0]; }
    train(pts, lr) {
      const L = this.sizes.length - 1;
      const gW = this.W.map((W) => new Float64Array(W.length)), gb = this.b.map((b) => new Float64Array(b.length));
      let loss = 0;
      for (const p of pts) {
        const a = this.forward(p.x, p.y), out = a[L][0];
        const q = clamp(out, 1e-7, 1 - 1e-7);
        loss -= p.c ? Math.log(q) : Math.log(1 - q);
        let delta = new Float64Array([out - p.c]); // sigmoid + cross-entropy
        for (let l = L - 1; l >= 0; l--) {
          const nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], prev = a[l];
          for (let j = 0; j < nout; j++) {
            gb[l][j] += delta[j];
            for (let i = 0; i < nin; i++) gW[l][j * nin + i] += delta[j] * prev[i];
          }
          if (l > 0) {
            const nd = new Float64Array(nin);
            for (let i = 0; i < nin; i++) {
              let s = 0; for (let j = 0; j < nout; j++) s += W[j * nin + i] * delta[j];
              nd[i] = s * (this.act === 'relu' ? (prev[i] > 0 ? 1 : 0) : 1 - prev[i] * prev[i]);
            }
            delta = nd;
          }
        }
      }
      // Adam
      this.t++;
      const b1 = 0.9, b2 = 0.999, eps = 1e-8, n = pts.length;
      const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
      for (let l = 0; l < L; l++) {
        [[this.W[l], gW[l], 0], [this.b[l], gb[l], 1]].forEach(([P, G, k]) => {
          const M = this.m[l][k], V = this.v[l][k];
          for (let i = 0; i < P.length; i++) {
            const g = G[i] / n;
            M[i] = b1 * M[i] + (1 - b1) * g; V[i] = b2 * V[i] + (1 - b2) * g * g;
            P[i] -= (lr * (M[i] / c1)) / (Math.sqrt(V[i] / c2) + eps);
          }
        });
      }
      return loss / n;
    }
  }

  function neuralnet(root) {
    root.innerHTML = '';
    const layout = el('div', { class: 'mlv-nn' });
    const left = el('div', { class: 'mlv-nn__plot' }), right = el('div', { class: 'mlv-nn__side' });
    layout.append(left, right); root.appendChild(layout);
    const plot = new Plot(left, 1);
    const netBox = el('div', { class: 'mlv-nn__net', role: 'img', 'aria-label': 'Diagram of the neural network with weights coloured by sign and thickness by magnitude' });
    const lossCanvasBox = el('div', { class: 'mlv-nn__loss' });
    right.append(netBox, lossCanvasBox);
    const lossPlot = new Plot(lossCanvasBox, 2.6);
    const controls = el('div', { class: 'mlv-controls' }), status = el('p', { class: 'mlv-status', 'aria-live': 'polite' });
    root.append(controls, status);

    let datasetName = 'circle', arch = '6,6', act = 'tanh', lr = 0.03, net, pts, epoch, losses;
    const gen = { circle: data.circle, xor: data.xor, spiral: data.spiral, moons: data.moons };
    function newData() { pts = gen[datasetName](datasetName === 'spiral' ? 200 : 160, nextSeed()); reset(); }
    function reset() {
      const hidden = arch.split(',').map(Number);
      net = new MLP([2].concat(hidden, [1]), act, nextSeed());
      epoch = 0; losses = []; anim.stop(); draw();
    }
    function accuracy() { return pts.filter((p) => (net.predict(p.x, p.y) > 0.5 ? 1 : 0) === p.c).length / pts.length; }

    function drawNet() {
      const sizes = net.sizes, W = 300, H = 170, padX = 22, padY = 16;
      const xs = sizes.map((_, l) => padX + (l * (W - 2 * padX)) / (sizes.length - 1));
      const ys = (n) => Array.from({ length: n }, (_, i) => (n === 1 ? H / 2 : padY + (i * (H - 2 * padY)) / (n - 1)));
      let maxW = 1e-6; net.W.forEach((w) => w.forEach((v) => (maxW = Math.max(maxW, Math.abs(v)))));
      let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      for (let l = 0; l < sizes.length - 1; l++) {
        const y0 = ys(sizes[l]), y1 = ys(sizes[l + 1]);
        for (let j = 0; j < sizes[l + 1]; j++) for (let i = 0; i < sizes[l]; i++) {
          const w = net.W[l][j * sizes[l] + i];
          svg += '<line x1="' + xs[l] + '" y1="' + y0[i] + '" x2="' + xs[l + 1] + '" y2="' + y1[j] + '" stroke="' + (w > 0 ? CLASS_COLORS[0] : CLASS_COLORS[1]) + '" stroke-width="' + (0.3 + 3 * Math.abs(w) / maxW).toFixed(2) + '" stroke-opacity="' + (0.25 + 0.6 * Math.abs(w) / maxW).toFixed(2) + '"/>';
        }
      }
      sizes.forEach((n, l) => ys(n).forEach((y) => { svg += '<circle cx="' + xs[l] + '" cy="' + y + '" r="6" class="mlv-node"/>'; }));
      svg += '<text x="' + xs[0] + '" y="' + (H - 1) + '" text-anchor="middle" class="mlv-svgtext">input</text>';
      svg += '<text x="' + xs[xs.length - 1] + '" y="' + (H - 1) + '" text-anchor="middle" class="mlv-svgtext">output</text>';
      svg += '</svg>';
      netBox.innerHTML = svg;
    }
    function drawLoss() {
      const p = lossPlot, c = p.ctx, t = theme();
      p.clear();
      if (losses.length < 2) { p.label('loss', 6, 4, { color: t.light }); return; }
      const max = Math.max.apply(null, losses), n = losses.length;
      c.strokeStyle = CLASS_COLORS[0]; c.lineWidth = 2; c.beginPath();
      losses.forEach((v, i) => { const x = 4 + (i / (n - 1)) * (p.w - 8), y = p.h - 4 - (v / max) * (p.h - 22); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.stroke();
      p.label('training loss: ' + fmt(losses[n - 1], 3), 6, 4, { color: t.text });
    }
    function draw() {
      plot.clear();
      plot.regions((x, y) => regionFromProb(net.predict(x, y)), 50);
      plot.points(pts, { r: 3.6 });
      drawNet(); drawLoss();
      status.textContent = 'Epoch ' + epoch + ' · accuracy ' + Math.round(accuracy() * 100) + '% · architecture 2 → ' + arch.replace(/,/g, ' → ') + ' → 1 (' + act + '). Teal weights are positive, orange negative; thickness is magnitude.';
    }
    const anim = animator(() => {
      for (let i = 0; i < 4; i++) { const l = net.train(pts, lr); epoch++; if (epoch % 5 === 0) { losses.push(l); if (losses.length > 300) losses.shift(); } }
      draw();
      return epoch < 3000;
    });
    plot.canvas.setAttribute('aria-label', 'Decision boundary learned by a neural network on a 2D dataset');
    controls.append(
      button('Train', () => (anim.running ? null : anim.start()), true),
      button('Pause', () => anim.stop()),
      button('Reset weights', reset),
      select('Data', [['circle', 'Circle'], ['xor', 'XOR'], ['moons', 'Two moons'], ['spiral', 'Spiral']], datasetName, (v) => { datasetName = v; newData(); }),
      select('Hidden layers', [['1', '1 neuron (linear-ish)'], ['3', '3'], ['6,6', '6 → 6'], ['8,8,8', '8 → 8 → 8']], arch, (v) => { arch = v; reset(); }),
      select('Activation', [['tanh', 'tanh'], ['relu', 'ReLU']], act, (v) => { act = v; reset(); }),
      select('Learning rate', [['0.003', '0.003'], ['0.01', '0.01'], ['0.03', '0.03'], ['0.1', '0.1']], String(lr), (v) => { lr = parseFloat(v); })
    );
    newData();
    return { redraw: () => { plot.resize(); lossPlot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 9. Convolution (the core operation of a CNN)                        */
  /* ------------------------------------------------------------------ */

  const KERNELS = {
    vertical: { name: 'Vertical edges', k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
    horizontal: { name: 'Horizontal edges', k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
    outline: { name: 'Outline (Laplacian)', k: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
    blur: { name: 'Blur', k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]] },
    sharpen: { name: 'Sharpen', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
  };

  function convolution(root) {
    root.innerHTML = '';
    const stage = el('div', { class: 'mlv-stage' });
    const controls = el('div', { class: 'mlv-controls' }), status = el('p', { class: 'mlv-status', 'aria-live': 'polite' });
    root.append(stage, controls, status);
    const plot = new Plot(stage, 2.4);
    const N = 12, M = N - 2;
    let img, kernelKey = 'vertical', pos = -1, relu = false;
    function resetImage() {
      img = Array.from({ length: N }, () => new Array(N).fill(0));
      for (let i = 2; i < 10; i++) { img[2][i] = 1; img[9][i] = 1; img[i][2] = 1; img[i][9] = 1; } // square
      for (let i = 4; i < 8; i++) img[i][i] = 1; // diagonal
    }
    function conv() {
      const k = KERNELS[kernelKey].k, out = [];
      for (let r = 0; r < M; r++) { out.push([]); for (let c = 0; c < M; c++) {
        let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += img[r + i][c + j] * k[i][j];
        out[r].push(relu ? Math.max(0, s) : s);
      } }
      return out;
    }
    function geometry() {
      const KS = 1.7, total = N + 3 * KS + M + 4; // cells incl. gaps (kernel cells are KS× larger)
      const cell = Math.min(plot.w / total, (plot.h - 22) / N);
      const x0 = (plot.w - total * cell) / 2;
      return { cell, kc: cell * KS, inX: x0, kX: x0 + (N + 2) * cell, outX: x0 + (N + 2 + 3 * KS + 2) * cell, y0: 20, kY: 20 + ((N - 3 * KS) / 2) * cell };
    }
    function divergent(v, max) {
      const a = Math.min(1, Math.abs(v) / (max || 1)), rgb = v >= 0 ? CLASS_RGB[0] : CLASS_RGB[1], bg = [255, 255, 255];
      return 'rgb(' + rgb.map((c, i) => Math.round(bg[i] + (c - bg[i]) * a)).join(',') + ')';
    }
    function draw() {
      plot.clear();
      const g = geometry(), c = plot.ctx, t = theme(), out = conv(), k = KERNELS[kernelKey].k;
      let max = 0; out.forEach((r) => r.forEach((v) => (max = Math.max(max, Math.abs(v)))));
      const pr = pos >= 0 ? Math.floor(pos / M) : -1, pc = pos >= 0 ? pos % M : -1;
      plot.label('Input image (click to edit)', g.inX, 2, { size: 12 });
      plot.label('Kernel', g.kX, 2, { size: 12 });
      plot.label('Feature map', g.outX, 2, { size: 12 });
      for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) {
        c.fillStyle = img[r][q] ? t.text : t.bg; c.fillRect(g.inX + q * g.cell, g.y0 + r * g.cell, g.cell, g.cell);
        c.strokeStyle = t.border; c.lineWidth = 0.5; c.strokeRect(g.inX + q * g.cell, g.y0 + r * g.cell, g.cell, g.cell);
      }
      c.font = Math.max(9, g.kc * 0.38) + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const x = g.kX + j * g.kc, y = g.kY + i * g.kc;
        c.fillStyle = divergent(k[i][j], 8); c.fillRect(x, y, g.kc, g.kc);
        c.strokeStyle = t.text; c.lineWidth = 0.8; c.strokeRect(x, y, g.kc, g.kc);
        c.fillStyle = '#222'; c.fillText(Math.abs(k[i][j] - 1 / 9) < 1e-9 ? '⅑' : String(k[i][j]), x + g.kc / 2, y + g.kc / 2);
      }
      for (let r = 0; r < M; r++) for (let q = 0; q < M; q++) {
        c.fillStyle = divergent(out[r][q], max); c.fillRect(g.outX + q * g.cell, g.y0 + (r + 1) * g.cell, g.cell, g.cell);
        c.strokeStyle = t.border; c.lineWidth = 0.5; c.strokeRect(g.outX + q * g.cell, g.y0 + (r + 1) * g.cell, g.cell, g.cell);
      }
      if (pos >= 0) {
        c.lineWidth = 3; c.strokeStyle = CLASS_COLORS[2];
        c.strokeRect(g.inX + pc * g.cell, g.y0 + pr * g.cell, 3 * g.cell, 3 * g.cell);
        c.strokeRect(g.outX + pc * g.cell, g.y0 + (pr + 1) * g.cell, g.cell, g.cell);
        status.textContent = 'Output[' + pr + ',' + pc + '] = sum of (3×3 input patch × kernel) = ' + fmt(out[pr][pc], 2) + '. The same 9 weights are reused at every position: weight sharing.';
      } else {
        status.textContent = KERNELS[kernelKey].name + ' kernel. Teal = positive response, orange = negative. Press "Slide kernel" to watch it scan the image, or click pixels to draw.';
      }
    }
    const anim = animator((() => { let last = 0; return () => { const now = performance.now(); if (now - last < 70) return true; last = now; pos++; if (pos >= M * M) { pos = -1; draw(); return false; } draw(); return true; }; })());
    plot.canvas.addEventListener('click', (e) => {
      const rect = plot.canvas.getBoundingClientRect(), g = geometry();
      const q = Math.floor((e.clientX - rect.left - g.inX) / g.cell), r = Math.floor((e.clientY - rect.top - g.y0) / g.cell);
      if (r >= 0 && r < N && q >= 0 && q < N) { img[r][q] = img[r][q] ? 0 : 1; draw(); }
    });
    plot.canvas.setAttribute('aria-label', 'A 3 by 3 convolution kernel sliding over a 12 by 12 binary image to produce a feature map');
    controls.append(
      button('Slide kernel', () => { pos = -1; anim.start(); }, true),
      select('Kernel', Object.keys(KERNELS).map((key) => [key, KERNELS[key].name]), kernelKey, (v) => { kernelKey = v; draw(); }),
      select('Activation', [['none', 'None'], ['relu', 'ReLU']], 'none', (v) => { relu = v === 'relu'; draw(); }),
      button('Reset image', () => { resetImage(); draw(); }),
      button('Clear image', () => { img = img.map((r) => r.map(() => 0)); draw(); })
    );
    resetImage(); draw();
    return { redraw: () => { plot.resize(); draw(); } };
  }

  /* ------------------------------------------------------------------ */
  /* 10. Self-attention (illustrative weights)                           */
  /* ------------------------------------------------------------------ */

  function attention(root) {
    root.innerHTML = '';
    const tokens = ['The', 'patient', 'took', 'the', 'drug', 'because', 'it', 'reduced', 'the', 'fever'];
    // Hand-set raw scores to illustrate typical attention patterns (not from a trained model).
    const focus = {
      0: { 1: 3 }, 1: { 2: 2, 4: 1.5 }, 2: { 1: 2.5, 4: 2.5 }, 3: { 4: 3 }, 4: { 2: 2.5, 1: 1.5 },
      5: { 2: 1.5, 7: 2 }, 6: { 4: 4, 1: 1.6 }, 7: { 6: 2.5, 9: 2.5, 4: 1.5 }, 8: { 9: 3 }, 9: { 7: 3, 1: 1.2 },
    };
    const weights = tokens.map((_, i) => {
      const s = tokens.map((__, j) => (focus[i][j] || 0) + (i === j ? 1 : 0) - Math.abs(i - j) * 0.08);
      const m = Math.max.apply(null, s), e = s.map((v) => Math.exp(v - m)), z = e.reduce((a, b) => a + b, 0);
      return e.map((v) => v / z);
    });
    const wrap = el('div', { class: 'mlv-attn' });
    const svgBox = el('div', { class: 'mlv-attn__arcs' });
    const row = el('div', { class: 'mlv-attn__tokens', role: 'group', 'aria-label': 'Tokens of the example sentence' });
    const status = el('p', { class: 'mlv-status', 'aria-live': 'polite' });
    wrap.append(svgBox, row); root.append(wrap, status);
    const btns = tokens.map((t, i) => el('button', { type: 'button', class: 'mlv-token', text: t, onmouseenter: () => select(i), onfocus: () => select(i), onclick: () => select(i) }));
    btns.forEach((b) => row.appendChild(b));
    let current = 6;
    function select(i) {
      current = i;
      btns.forEach((b, j) => { b.classList.toggle('is-active', j === i); b.style.setProperty('--w', weights[i][j].toFixed(3)); });
      const rects = btns.map((b) => b.offsetLeft + b.offsetWidth / 2), W = row.scrollWidth, H = 90;
      let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg">';
      weights[i].forEach((w, j) => {
        if (j === i || w < 0.03) return;
        const x1 = rects[i], x2 = rects[j], h = Math.min(H - 6, 18 + Math.abs(x2 - x1) * 0.35);
        svg += '<path d="M' + x1 + ',' + H + ' C' + x1 + ',' + (H - h) + ' ' + x2 + ',' + (H - h) + ' ' + x2 + ',' + H + '" fill="none" stroke="' + CLASS_COLORS[0] + '" stroke-width="' + (1 + w * 14).toFixed(1) + '" stroke-opacity="' + (0.25 + w * 1.3).toFixed(2) + '" stroke-linecap="round"/>';
      });
      svg += '</svg>';
      svgBox.innerHTML = svg;
      svgBox.scrollLeft = row.scrollLeft;
      const top = weights[i].map((w, j) => [w, j]).filter(([, j]) => j !== i).sort((a, b) => b[0] - a[0]).slice(0, 2);
      status.textContent = '"' + tokens[i] + '" attends most to "' + tokens[top[0][1]] + '" (' + Math.round(top[0][0] * 100) + '%) and "' + tokens[top[1][1]] + '" (' + Math.round(top[1][0] * 100) + '%). Weights in each row are a softmax and sum to 100%. Illustrative values, not from a trained model.';
    }
    row.addEventListener('scroll', () => { svgBox.scrollLeft = row.scrollLeft; });
    requestAnimationFrame(() => select(current));
    return { redraw: () => select(current) };
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  const DEMOS = { linreg, logreg, knn, tree, svm, kmeans, pca, neuralnet, convolution, attention };

  function boot() {
    const instances = [];
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const node = en.target; io.unobserve(node);
        const fn = DEMOS[node.dataset.demo];
        if (fn) { node.classList.add('is-ready'); instances.push(fn(node)); }
      });
    }, { rootMargin: '200px' }) : null;
    document.querySelectorAll('.mlv-demo[data-demo]').forEach((node) => {
      if (io) io.observe(node);
      else { const fn = DEMOS[node.dataset.demo]; if (fn) instances.push(fn(node)); }
    });
    let lastW = window.innerWidth, t;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastW) return; lastW = window.innerWidth;
      clearTimeout(t); t = setTimeout(() => instances.forEach((i) => i && i.redraw()), 150);
    });
    // Redraw when the site's light/dark theme toggles.
    new MutationObserver(() => instances.forEach((i) => i && i.redraw()))
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
