/* ============================================================
   Ordinary Departures — the presentation site.
   Stage 1: landing, premise, the image wall, the map rising.
   One page, one scene, scroll-driven, a guided camera. js/ride.js adds the rest.
   ============================================================ */
(() => {
'use strict';
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// ---------- constants -------------------------------------------------------
const S = 60;                                   // sheet px per world unit
const FOV = 40, TAN = Math.tan(FOV * Math.PI / 360);
const LK = 1.3;                                 // map text above its print size, so the terms read
const TK = 1.2;                                 // titles
const DK = 1.5;                                 // dots larger than the print, so the nodes read
const TCOL = {M: '#c4a4df', V: '#86b5df', P: '#87c9bc', F: '#d3b288'};
const TNAME = {M: 'Meaning', V: 'Value', P: 'Practice', F: 'Form'};
const PC = {L: '#f0b95e', W: '#8cc0f5', M: '#f29273', A: '#c9ccd3'};
const PN = {L: 'the one leaving', W: 'the one watching', M: 'the one preparing', A: 'shared'};
const RK = {ali: {c: '#9a9ea8', on: 1, off: 0}, opp: {c: '#c9ccd3', on: 1, off: 2}, bec: {c: '#f29273', on: 2, off: 1}, ten: {c: '#b3a3f0', on: 3, off: 1}};
const BERA = {'Preliterate': 1, 'Ancient': 2, 'Pilgrimage': 3, 'Sail': 4, 'Industry and flight': 5, 'Heroic space age': 6, 'Reckoning': 7, 'Now': 8, 'Futures, in film': 9};
const BDATE = {'Preliterate': 'initiation, the sacred centre', 'Ancient': 'to c. 500 CE', 'Pilgrimage': 'c. 500–1400', 'Sail': '1400s–1900', 'Industry and flight': '1900–1957', 'Heroic space age': '1957–1986', 'Reckoning': '1986–2011', 'Now': '2011–2026', 'Futures, in film': 'projected'};
const FSZ = [0, 12.5, 15, 20, 34], RRZ = [0, 2.8, 4, 6, 11], LWT = [0, 400, 400, 500, 600], LCL = [0, '#858993', '#bfc2c9', '#eceef1', '#ffffff'];

const rnd = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const $ = (s) => document.querySelector(s);

const VER = (document.querySelector('script[src*="site.js"]') || {src: ''}).src.split('?v=')[1] || '';   // the data follows the scripts' version, so a new build is never read from cache
Promise.all(['map', 'board', 'spines', 'cases', 'refs', 'covers'].map(n => fetch('data/' + n + '.json' + (VER ? '?v=' + VER : '')).then(r => r.ok ? r.json() : {})))
  .then(([MAP, BOARD, SPINES, CASES, REFS, COVERS]) => build(MAP, BOARD, SPINES, CASES, REFS, COVERS || {}))
  .catch(err => { console.error('site: could not load data', err); const h = $('#landing .st'); if (h) h.textContent = 'Could not load the data. Serve the folder with python3 -m http.server and reload.'; });

function build(MAP, BOARD, SPINES, CASES, REFS, COVERS) {
  const L = MAP.layout, W = L.W, H = L.H;
  const wx = px => px / S - W / (2 * S), wy = py => H / (2 * S) - py / S;
  const HALFW = W / (2 * S), HALFH = H / (2 * S);
  const ERAN = {}; L.ERAS.forEach(e => ERAN[e[0]] = e[1]); ERAN[9] = 'Future';

  // ---------- renderer, scene, camera --------------------------------------
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 1);
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.5, 4000);
  const cam = {x: 0, y: 0, z: 200, tx: 0, ty: 0, tz: 0};
  const prog = {time: 0, conn: 0, fut: 0, claim: 0, band: {M: 0, V: 0, P: 0, F: 0}, tier: {M: 0, V: 0, P: 0, F: 0}};
  const sdim = {v: 0};                                      // the map dimmed under the list of questions

  // ---------- labels: DOM elements projected from world points --------------
  const labelRoot = $('#labels'), labels = [];
  function mkLabel(cls, html, x, y, z, b, ax, ay, dx, dy, o) {
    const el = document.createElement('div');
    el.className = 'lb ' + cls; el.innerHTML = html; el.style.fontSize = b + 'px';
    if (o && o.style) Object.assign(el.style, o.style);
    if (o && o.data) Object.assign(el.dataset, o.data);
    labelRoot.appendChild(el);
    const l = {el, x, y, z, b, ax, ay, dx: dx || 0, dy: dy || 0, ref: o && o.ref, af: o && o.af, maxs: (o && o.maxs) || 1.25, mins: (o && o.mins) || 0, keep: !!(o && o.keep), vis: false};
    labels.push(l); return l;
  }

  // ---------- the wall of images ---------------------------------------------
  const TW = 5, TH = 3.75, TCAP = 0.7, TG = 0.5, ROWS = 5, CW = TW + TG, CH = TH + TCAP + TG;
  const eras = [];
  BOARD.forEach(t => { let e = eras.find(x => x.name === t.era); if (!e) { e = {name: t.era, tiles: []}; eras.push(e); } e.tiles.push(t); });
  let col0 = 0; const cells = [];
  eras.forEach(e => { e.col0 = col0; e.ncol = Math.ceil((e.tiles.length + 1) / ROWS);
    e.tiles.forEach((t, i) => { const k = i + 1; cells.push({t, col: col0 + Math.floor(k / ROWS), row: k % ROWS, era: e}); });
    col0 += e.ncol; });
  const NCOL = col0, WALLW = NCOL * CW - TG, WALLH = ROWS * CH - TG;
  const WR = 260, WC = new THREE.Vector3(0, 0, 40 + WR), SPAN = WALLW / WR;
  const uOf = c => c * CW + TW / 2 - WALLW / 2, vOf = r => WALLH / 2 - r * CH - TH / 2;
  const wallPt = (u, v, out) => { const th = u / WR; return out.set(WC.x + WR * Math.sin(th), WC.y + v, WC.z - WR * Math.cos(th)); };
  const tileGeo = new THREE.PlaneGeometry(TW, TH);
  const loader = new THREE.TextureLoader();
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const imgByLabel = {}; MAP.imgs.forEach(i => imgByLabel[i.label.toLowerCase()] = i);
  const tileByName = {}; BOARD.forEach(t => tileByName[t.name.toLowerCase()] = t);
  const hoverables = [];                                       // meshes that reveal their name on hover
  const tiles = cells.map(c => {
    const t = c.t, u = uOf(c.col), v = vOf(c.row), th = u / WR;
    const mat = new THREE.MeshBasicMaterial({color: 0x0a0b0d, transparent: true, opacity: 0, depthWrite: false});
    const mesh = new THREE.Mesh(tileGeo, mat); mesh.renderOrder = 1; mesh.visible = false; scene.add(mesh);
    loader.load('img/tiles/' + t.file, tex => { tex.anisotropy = maxAniso; if (renderer.initTexture) renderer.initTexture(tex); mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; });
    const wp = wallPt(u, v, new THREE.Vector3());
    const era = BERA[t.era] || 9, mi = imgByLabel[t.name.toLowerCase()];
    let mp, msc;
    if (mi) { mp = new THREE.Vector3(wx(mi.x + mi.w / 2), wy(mi.y + mi.h / 2), -0.3); msc = mi.w / S / TW; }
    else { const cx = era === 9 ? L.scX.f : L.colX[era], cw = era === 9 ? L.SCW : L.colW[era], ry = L.rowY[t.layer], rh = L.ROWH[t.layer];
      const px = cx + 30 + Math.max(0, cw - 260) * rnd(t.name + 'x'), py = ry + 110 + Math.max(0, rh - 290) * rnd(t.name + 'y');
      mp = new THREE.Vector3(wx(px + 100), wy(py + 75), -0.3); msc = 200 / S / TW; }
    const T = {t, mesh, mat, u, v, th, wp, mp, msc, mi, st: {r: 0, d: 0}, a: 0, layer: t.layer, era, hov: 0};
    mesh.userData.hover = {rec: T, kind: 'tile', id: t.i, name: t.name, sub: t.date || ''}; hoverables.push(mesh);
    return T;
  });
  eras.forEach(e => { const p = wallPt(uOf(e.col0) - TW / 2, vOf(0) + TH / 2, new THREE.Vector3()); const first = tiles.find(T => T.t === e.tiles[0]);
    mkLabel('era', `${esc(e.name)}<small>${esc(BDATE[e.name] || '')}</small>`, p.x, p.y, p.z, 24 * 1.9, 0, 0, 0, 0, {af: () => first.a}); });
  function updateTiles() {
    for (const T of tiles) {
      const r = T.st.r, d = T.st.d, m = T.mesh;
      if (r <= 0.001) { if (m.visible) m.visible = false; T.a = 0; continue; }
      const rise = (1 - r) * -9;
      m.position.set(lerp(T.wp.x, T.mp.x, d), lerp(T.wp.y + rise, T.mp.y, d), lerp(T.wp.z, T.mp.z, d));
      m.rotation.y = lerp(-T.th, 0, d);
      const sc = lerp(1, T.msc, d); m.scale.set(sc, sc, 1);
      const fade = T.era === 9 ? prog.fut : prog.tier[T.mi ? T.mi.tier : T.layer];
      const o = r * lerp(1, 0.38, d) * (1 - clamp(fade * 1.6, 0, 1)) * mapMul * (1 - .7 * T.hov);
      T.mat.opacity = o; m.visible = o > .003;
      T.a = r * (1 - clamp(d * 1.5, 0, 1)) * mapMul;
    }
  }

  // ---------- the map -----------------------------------------------------------
  const bands = {};
  ['M', 'V', 'P', 'F'].forEach((k, i) => {
    const y0 = L.rowY[k] + 3, h = L.ROWH[k] - 6;
    const mat = new THREE.MeshBasicMaterial({color: new THREE.Color(L.TFILL[k]), transparent: true, opacity: 0, depthWrite: false});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W / S, h / S), mat);
    m.position.set(0, wy(y0 + h / 2), -0.06); m.renderOrder = 0; m.visible = false; scene.add(m);
    bands[k] = {mesh: m, mat, y: wy(y0 + h / 2), yc: wy(L.rowY[k] + L.ROWH[k] / 2)};
    mkLabel('row', `${TNAME[k]}<small>${esc(L.TIERS[i][2])}</small>`, wx(120), wy(L.rowY[k] + 12), 0.1, 50 * 1.1, 0, 0, 0, 0, {af: () => prog.band[k]});
  });
  const mapImgs = MAP.imgs.map(i => {
    const mat = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0, depthWrite: false});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(i.w / S, i.h / S), mat);
    m.position.set(wx(i.x + i.w / 2), wy(i.y + i.h / 2), -0.03); m.renderOrder = 1; m.visible = false; scene.add(m);
    loader.load('img/map/' + i.file + '.jpg', tex => { tex.anisotropy = maxAniso; if (renderer.initTexture) renderer.initTexture(tex); mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; });
    const rec = {i, mat, m, hov: 0};
    m.userData.hover = {rec, kind: 'img', id: 'img:' + i.id, name: i.label, sub: i.dt}; hoverables.push(m);
    return rec;
  });
  function makeLines(segs, z, order) {
    const n = segs.length * 2, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    segs.forEach((s, i) => { const c = rgb(s.c), a = s.a; pos.set([s.p[0], s.p[1], z, s.p[2], s.p[3], z], i * 6); col.set([c[0] * a, c[1] * a, c[2] * a, c[0] * a, c[1] * a, c[2] * a], i * 6); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setDrawRange(0, 0);
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}));
    m.renderOrder = order || 2; m.frustumCulled = false; scene.add(m);
    return {m, n, set(p) { g.setDrawRange(0, Math.floor(clamp(p, 0, 1) * segs.length) * 2); }};
  }
  const colSegs = [];
  for (let i = 0; i < 24; i++) { const xa = 120 + (W - 180) * i / 24, xb = 120 + (W - 180) * (i + 1) / 24; colSegs.push({x: xa, p: [wx(xa), wy(30), wx(xb), wy(30)], c: '#ffffff', a: .7}); }
  Object.keys(L.colX).forEach(e => { const x = L.colX[e]; colSegs.push({x, p: [wx(x), wy(44), wx(x), wy(L.SB)], c: '#2a2c32', a: 1}); });
  colSegs.sort((a, b) => a.x - b.x);
  const colLines = makeLines(colSegs, 0.02);
  const futSegs = []; { const x = L.SX0 - 22; for (let y = 16; y < L.SB + 40; y += 16) futSegs.push({p: [wx(x), wy(y), wx(x), wy(Math.min(y + 8, L.SB + 40))], c: '#c3c6cd', a: .55}); }
  const futLines = makeLines(futSegs, 0.02);
  L.ERAS.forEach(([e, n, dt], i) => mkLabel('era', `${esc(n)}<small>${esc(dt)}</small>`, wx(L.colX[e] + 14), wy(40), 0.1, 38 * TK, 0, 0, 0, 0, {af: () => clamp((prog.time - i * .07) / .3, 0, 1)}));
  mkLabel('era', 'Future<small>projected</small>', wx(L.scX.f + 14), wy(40), 0.1, 38 * TK, 0, 0, 0, 0, {af: () => clamp(prog.fut / .3, 0, 1)});
  mkLabel('mono', 'Projected from the same vocabulary', wx(L.SX0), wy(8), 0.1, 15 * 1.2, 0, 0, 0, 0, {af: () => clamp(prog.fut / .3, 0, 1)});
  mkLabel('evh', 'Events', wx(120), wy(L.RAIL0 - 16), 0.1, 26 * 1.2, 0, 0, 0, 0, {af: () => clamp(prog.time / .25, 0, 1)});

  // ---------- points: terms, echoes, events -------------------------------------
  // kind 0 disc, 1 ring with black fill (core), 2 diamond (event), 3 dashed ring (echo), 4 hollow ring (halo), 5 square (a spine step), 6 soft glow
  const pts = [], node = {};
  MAP.terms.forEach(t => node[t.id] = t); MAP.events.forEach(e => node[e.id] = e);
  const X0 = L.colX[1], X1 = L.SX0;
  const addPt = (p) => { pts.push(p); return p; };
  MAP.terms.forEach(t => {
    const w = t.w, r = RRZ[w], fut = t.era === 9;
    const xn = fut ? (t.x - L.SX0) / L.SCW : (t.x - X0) / (X1 - X0);
    const off = 0.04 + 0.62 * clamp(xn, 0, 1) + 0.16 * rnd(t.id), len = .3, core = t.lens === 'core';
    const p = addPt({x: wx(t.x), y: wy(t.y), tier: t.tier, group: fut ? 'fut' : 'tier', off, len, amax: w === 1 && !core ? .7 : 1, a: 0, ry: 0,
      size: 2 * (core ? r + 2 : r) * DK / S, kind: core ? 1 : 0, stroke: core ? 3 / (r + 2) : 0, c: PC[t.person] || PC.A});
    if (w === 4) addPt({x: p.x, y: p.y, tier: t.tier, group: p.group, off, len, amax: .5, a: 0, ry: 0, size: 2 * (r + 6) * DK / S, kind: 4, stroke: 1.5 / (r + 6), c: p.c});
    t._p = p;
    t._l = mkLabel('t', esc(t.label), p.x, p.y, 0.15, FSZ[w] * LK, 0, -50, (r * DK + (w === 4 ? 12 : 6)) / S, 0, {ref: p, data: {k: 'term', id: t.id}, style: {color: LCL[w], fontWeight: LWT[w]}});
  });
  MAP.echoes.forEach(e => {
    const xn = (e.x - L.SX0) / L.SCW, off = 0.1 + 0.6 * clamp(xn, 0, 1) + 0.15 * rnd(e.id);
    const p = addPt({x: wx(e.x), y: wy(e.y), tier: e.tier, group: 'fut', off, len: .3, amax: 1, a: 0, ry: 0, size: 10 * DK / S, kind: 3, stroke: 1.6 / 5, c: PC[e.person] || PC.A});
    e._p = p; e._l = mkLabel('ec', esc(e.label), p.x, p.y, 0.15, 14.5 * LK, 0, -50, 11 / S, 0, {ref: p, data: {k: 'echo', id: e.id}});
  });
  MAP.events.forEach(e => {
    const xn = (e.x - X0) / (X1 - X0), off = 0.08 + 0.7 * clamp(xn, 0, 1), len = .22;
    const p = addPt({x: wx(e.x), y: wy(e.y), group: 'time', off, len, amax: 1, a: 0, ry: 0, size: 11 * DK / S, kind: 2, stroke: 0, c: PC[e.person] || PC.A});
    e._p = p; e._l = mkLabel('ev', esc(e.txt), p.x, p.y, 0.15, 13 * LK, 0, -50, 9 / S, 0, {ref: p, data: {k: 'event', id: e.id}});
  });
  const NP = pts.length;
  const aPos = new Float32Array(NP * 3), aCol = new Float32Array(NP * 3), aSize = new Float32Array(NP), aKind = new Float32Array(NP), aStroke = new Float32Array(NP), aAlpha = new Float32Array(NP), aRise = new Float32Array(NP);
  pts.forEach((p, i) => { p.i = i; p.a0 = 0; p.ry0 = -2.4; aPos.set([p.x, p.y, 0.12], i * 3); aCol.set(rgb(p.c), i * 3); aSize[i] = p.size; aKind[i] = p.kind; aStroke[i] = p.stroke; });
  const VERT = `
      attribute vec3 col; attribute float size; attribute float kind; attribute float stroke; attribute float alpha; attribute float rise;
      uniform float uScale;
      varying vec3 vC; varying float vA; varying float vK; varying float vS; varying float vPx;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position + vec3(0.0, rise, 0.0), 1.0);
        float px = size * uScale / max(0.001, -mv.z);
        px = max(px, 2.0);
        gl_PointSize = px; vPx = px; vC = col; vA = alpha; vK = kind; vS = stroke;
        gl_Position = projectionMatrix * mv;
      }`;
  const FRAG = `
      varying vec3 vC; varying float vA; varying float vK; varying float vS; varying float vPx;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float e = 1.6 / vPx;
        float d = (vK == 2.0) ? (abs(p.x) + abs(p.y)) * 2.0 : (vK == 5.0) ? max(abs(p.x), abs(p.y)) * 2.0 : length(p) * 2.0;
        float outer = 1.0 - smoothstep(1.0 - 2.0 * e, 1.0, d);
        vec3 col = vC; float a = outer;
        if (vK == 1.0) { float s = smoothstep(1.0 - vS - 2.0 * e, 1.0 - vS, d); col = mix(vec3(0.0), vC, s); }
        else if (vK == 3.0) { float s = smoothstep(1.0 - vS - 2.0 * e, 1.0 - vS, d); float ang = atan(p.y, p.x); float dash = step(0.42, fract(ang * 1.2732)); a = outer * s * dash; }
        else if (vK == 4.0) { float s = smoothstep(1.0 - vS - 2.0 * e, 1.0 - vS, d); a = outer * s; }
        else if (vK == 5.0) { float dc = length(p) * 2.0; float dot = 1.0 - smoothstep(0.32 - e, 0.32 + e, dc); col = mix(vC, vec3(0.0), dot); }
        else if (vK == 6.0) { float q = clamp(1.0 - d, 0.0, 1.0); a = q * q * q; }
        a *= vA; if (a < 0.006) discard;
        gl_FragColor = vec4(col, a);
      }`;
  const pg = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(aPos, 3), colAttr = new THREE.BufferAttribute(aCol, 3), sizeAttr = new THREE.BufferAttribute(aSize, 1), kindAttr = new THREE.BufferAttribute(aKind, 1);
  pg.setAttribute('position', posAttr); pg.setAttribute('col', colAttr); pg.setAttribute('size', sizeAttr); pg.setAttribute('kind', kindAttr);
  pg.setAttribute('stroke', new THREE.BufferAttribute(aStroke, 1));
  const alphaAttr = new THREE.BufferAttribute(aAlpha, 1), riseAttr = new THREE.BufferAttribute(aRise, 1);
  pg.setAttribute('alpha', alphaAttr); pg.setAttribute('rise', riseAttr);
  const pmat = new THREE.ShaderMaterial({uniforms: {uScale: {value: 1}}, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false});
  const glowMat = new THREE.ShaderMaterial({uniforms: pmat.uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
  const points = new THREE.Points(pg, pmat); points.renderOrder = 4; points.frustumCulled = false; scene.add(points);
  const lastProg = {};
  function updatePoints(mul) {
    const key = [prog.time, prog.fut, prog.tier.M, prog.tier.V, prog.tier.P, prog.tier.F].join('|');
    if (lastProg.key !== key) { lastProg.key = key;
      for (let i = 0; i < NP; i++) { const p = pts[i];
        const P = p.group === 'time' ? prog.time : p.group === 'fut' ? prog.fut : prog.tier[p.tier];
        const k = clamp((P - p.off) / p.len, 0, 1), e = 1 - Math.pow(1 - k, 3);
        p.a0 = e * p.amax; p.ry0 = -2.4 * (1 - e); } }
    for (let i = 0; i < NP; i++) { const p = pts[i];
      if (p.ovrOn) { const o = p.ovr; aPos[i * 3] = o.x; aPos[i * 3 + 1] = o.y; aPos[i * 3 + 2] = o.z; p.a = o.a; p.ry = 0; p.moved = true; }
      else { if (p.moved) { aPos[i * 3] = p.x; aPos[i * 3 + 1] = p.y; aPos[i * 3 + 2] = 0.12; p.moved = false; } p.a = p.a0 * mul * (p.mapMul == null ? 1 : p.mapMul); p.ry = p.ry0; }
      aAlpha[i] = p.a; aRise[i] = p.ry; }
    posAttr.needsUpdate = true; alphaAttr.needsUpdate = true; riseAttr.needsUpdate = true;
  }

  // ---------- connections ------------------------------------------------------------
  const wtOf = n => n.w || (n.tier === 'E' ? 2 : 1);
  function bez(a, b) {
    const dx = Math.abs(b.x - a.x); let c1, c2;
    if (dx < 40) { const bb = Math.max(40, Math.abs(b.y - a.y) * .3); c1 = [a.x - bb, a.y]; c2 = [b.x - bb, b.y]; }
    else { const m = Math.max(dx * .45, 60), dir = b.x > a.x ? 1 : -1; c1 = [a.x + dir * m, a.y]; c2 = [b.x - dir * m, b.y]; }
    return t => { const u = 1 - t, A = u * u * u, B = 3 * u * u * t, C = 3 * u * t * t, D = t * t * t;
      return [wx(A * a.x + B * c1[0] + C * c2[0] + D * b.x), wy(A * a.y + B * c1[1] + C * c2[1] + D * b.y)]; };
  }
  const BR = .9;
  function curveSegs(a, b, k, oMul, chain) {
    const K = chain ? {c: RK.bec.c, on: 1, off: 0} : RK[k], hi = Math.max(wtOf(a), wtOf(b)), lo = Math.min(wtOf(a), wtOf(b));
    const len = Math.hypot(a.x - b.x, a.y - b.y), lf = clamp(1 - (len - 900) / 3000, .3, 1);
    let o;
    if (chain) o = Math.min(1, (.55 + .1 * (hi - 1)) * Math.max(.65, lf)) * .95;
    else { o = k === 'ali' ? (hi === 1 ? .035 : .07 + .07 * (hi - 1) + .06 * (lo - 1)) * lf : (.22 + .07 * (hi - 1) + .05 * (lo - 1)) * lf; o = o * BR * (oMul || 1); }
    o = clamp(o, 0, 1);
    const f = bez(a, b), N = K.off ? 48 : 24, out = [], per = K.on + K.off;
    for (let i = 0; i < N; i++) { if (K.off && (i % per) >= K.on) continue; const p0 = f(i / N), p1 = f((i + 1) / N); out.push({x: Math.min(a.x, b.x), p: [p0[0], p0[1], p1[0], p1[1]], c: K.c, a: o}); }
    return out;
  }
  const isFut = n => n.era === 9;
  const connSegs = [], futRelSegs = [];
  [...MAP.rels].map(r => ({r, a: node[r.s], b: node[r.t]})).filter(x => x.a && x.b).sort((p, q) => Math.min(p.a.x, p.b.x) - Math.min(q.a.x, q.b.x))
    .forEach(({r, a, b}) => { const segs = curveSegs(a, b, r.k, 1, !!r.ch); (isFut(a) || isFut(b) ? futRelSegs : connSegs).push(...segs); });
  MAP.echoes.forEach(e => { const s = node[e.src]; if (!s) return; futRelSegs.push(...curveSegs(s, {x: e.x, y: e.y, w: 1}, 'bec', .55)); });
  futRelSegs.sort((p, q) => p.x - q.x);
  const connLines = makeLines(connSegs, 0.05, 3), futRelLines = makeLines(futRelSegs, 0.05, 3);

  // ---------- the numbered claims, small -----------------------------------------------
  const claimByNum = {}; MAP.args.forEach(a => claimByNum[a.num] = a);
  MAP.notePos.forEach((n, i) => mkLabel('cl', String(n.num), wx(n.x), wy(n.y), 0.15, 11, -50, -50, 0, 0,
    {af: () => clamp((prog.claim - (i / MAP.notePos.length) * .7) / .3, 0, 1) * .7, data: {k: 'claim', id: n.num}, mins: .38}));

  // ---------- the camera views --------------------------------------------------------
  const fitD = (w, h, m) => Math.max(h * m / (2 * TAN), w * m / (2 * TAN * camera.aspect));
  const V = {};
  function views() {
    const FD = fitD(2 * HALFW, 2 * HALFH, 1.1);
    V.whole = {p: [0, 0, 44 + fitD(WALLW, WALLH, 1.04)], t: [0, 0, 44]};
    V.oblique = {p: [-48, -26, FD * 1.25], t: [-4, 2, 0]};
    V.timeIn = {p: [-40, 24, 30], t: [-30, 21.5, 0]};
    V.timeOut = {p: [14, 24, 30], t: [22, 21.5, 0]};
    V.bandIn = k => ({p: [-40, bands[k].yc + 3, 24], t: [-32, bands[k].yc - .3, 0]});
    V.bandOut = k => ({p: [14, bands[k].yc + 3, 24], t: [22, bands[k].yc - .3, 0]});
    V.full = {p: [0, 0, FD], t: [0, 0, 0]};
    V.futIn = {p: [30, 16, 30], t: [33.5, 14, 0]};
    V.futOut = {p: [30, -14, 30], t: [33.5, -16, 0]};
    V.claims = {p: [-6, -5, FD * .98], t: [0, 0, 0]};
    V.FD = FD;
  }
  const wall = {phi: -SPAN / 2 - 0.05, mix: 1, dist: 110};
  const LEAD = 0.045, wv = {};
  function wallView(phi) {
    const RC = WR - wall.dist;
    wv.x = WC.x + RC * Math.sin(phi); wv.y = 2.0 + (wall.dist - 48) * .08; wv.z = WC.z - RC * Math.cos(phi);
    const a = phi + LEAD; wv.tx = WC.x + WR * Math.sin(a); wv.ty = -1.0; wv.tz = WC.z - WR * Math.cos(a);
  }

  // ---------- the ride: one timeline, scrubbed by scroll -------------------------------
  const T = {land: 0, p1: 1.2, p23: 2.6, q: 4.2, wall: 5.8, whole: 12.2, loose: 14.4, time: 16.6, d1: 18.0, d2: 19.8, conn: 21.6, fut: 23.0, claim: 24.4, end: 25.4, qs: 26.6, q1: 28.8, total: 28.8};
  let STOPS = [];
  const STOPS1 = [['land', 0, ''], ['p1', T.p1 + .5, 'Thesis'], ['p23', T.p23 + .6, 'Thesis'], ['q', T.q + .6, 'Central question'],
    ['wall', T.wall + 1.0, 'Departure, in images'], ['whole', T.whole + 1.9, 'Departure, in images'], ['loose', T.loose + 2.0, 'Departure, mapped'], ['time', T.time + .8, 'Timeline'],
    ['d1', T.d1 + 1.0, 'Meaning and Value'], ['d2', T.d2 + 1.0, 'Practice and Form'], ['conn', T.conn + 1.0, 'Connections'], ['fut', T.fut + .9, 'Future'], ['claim', T.claim + .7, 'Claims'], ['end', T.end + .6, 'Departure, mapped'], ['qs', T.qs + .9, 'Thesis questions']];

  // ---------- stages 2 and 3: the ride, from js/ride.js ----------
  const ride = window.ODRide ? ODRide.build({THREE, scene, camera, cam, MAP, SPINES, CASES, S, wx, wy, mkLabel, node, rgb, clamp, lerp, esc, PC, ERAN, TNAME, L, loader, maxAniso, aKind, aSize, aCol, kindAttr, sizeAttr, colAttr, makeLines, $, glowMat, VERT, FRAG, hoverables, pts}) : null;

  let tl = null;
  function buildTimeline() {
    const keep = tl && tl.scrollTrigger ? tl.scrollTrigger.progress : 0;
    if (tl) { const st = tl.scrollTrigger; try { tl.revert(); } catch (e) { tl.kill(); } try { st && st.kill(); } catch (e) {} tl = null; }
    Object.assign(prog, {time: 0, conn: 0, fut: 0, claim: 0}); sdim.v = 0; Object.assign(prog.band, {M: 0, V: 0, P: 0, F: 0}); Object.assign(prog.tier, {M: 0, V: 0, P: 0, F: 0});
    wall.phi = -SPAN / 2 - 0.05; wall.mix = 1; wall.dist = 110; tiles.forEach(t => { t.st.r = 0; t.st.d = 0; });
    if (ride) ride.reset();
    views();
    Object.assign(cam, {x: V.whole.p[0], y: V.whole.p[1], z: V.whole.p[2], tx: V.whole.t[0], ty: V.whole.t[1], tz: V.whole.t[2]});
    tl = gsap.timeline({defaults: {ease: 'none'}, scrollTrigger: {trigger: '#scroll', start: 'top top', end: 'bottom bottom', scrub: 1.0,
      onUpdate: st => headerState(st.progress * T.total)}});
    const camTo = (v, t, dur, ease) => tl.to(cam, {x: v.p[0], y: v.p[1], z: v.p[2], tx: v.t[0], ty: v.t[1], tz: v.t[2], duration: dur, ease: ease || 'power1.inOut'}, t);
    const fade = (sel, t0, t1, hold) => { tl.fromTo(sel, {autoAlpha: 0, y: 10}, {autoAlpha: 1, y: 0, duration: .5, ease: 'power1.out', immediateRender: false}, t0 - .15);
                                          if (!hold) tl.to(sel, {autoAlpha: 0, y: -10, duration: .5, ease: 'power1.in'}, t1 - .35); };
    // landing and premise
    tl.to('#landing', {autoAlpha: 0, y: -14, duration: .5, ease: 'power1.in'}, .6);
    tl.to('#hd, #arrows', {autoAlpha: 1, duration: .4}, .9);
    fade('#p1', T.p1, T.p23); fade('#p23', T.p23, T.q); fade('#pq', T.q, T.wall - .2);
    // the wall: approached slowly, rising era by era as the camera travels along it, then seen whole
    tl.to(wall, {dist: 48, duration: 1.8, ease: 'power1.inOut'}, T.wall);
    tl.fromTo(wall, {phi: -SPAN / 2 - 0.05}, {phi: SPAN / 2 - 0.02, duration: T.whole - T.wall - .5, ease: 'none', immediateRender: false}, T.wall + .5);
    tl.to(tiles.map(t => t.st), {r: 1, duration: .9, stagger: {amount: 5.6}, ease: 'power2.out'}, T.wall + .3);
    tl.to(wall, {mix: 0, duration: 2.0, ease: 'power1.inOut'}, T.whole);
    // the wall loosens onto the map
    camTo(V.oblique, T.loose, 2.1);
    tl.to(tiles.map(t => t.st), {d: 1, duration: 1.3, stagger: {amount: .7}, ease: 'power1.inOut'}, T.loose);
    // the timeline, then the layers in two diagonals: Meaning to Value, then Value to Form
    camTo(V.timeIn, T.time, .6); camTo(V.timeOut, T.time + .6, T.d1 - T.time - .6, 'none');
    tl.to(prog, {time: 1, duration: 1.1}, T.time + .3);
    const yM = bands.M.yc, yV = bands.V.yc, yP = bands.P.yc, yF = bands.F.yc, DZ = 24;
    camTo({p: [-38, yM + 3, DZ], t: [-30, yM - .3, 0]}, T.d1, .6);
    camTo({p: [26, yV + 3, DZ], t: [34, yV - .3, 0]}, T.d1 + .6, T.d2 - T.d1 - .6, 'none');
    tl.to(prog.band, {M: 1, duration: .4, ease: 'power1.out'}, T.d1 + .1); tl.to(prog.tier, {M: 1, duration: 1.2}, T.d1 + .2);
    tl.to(prog.band, {V: 1, duration: .4, ease: 'power1.out'}, T.d1 + .7); tl.to(prog.tier, {V: 1, duration: 1.1}, T.d1 + .8);
    camTo({p: [-38, yF + 3, DZ], t: [-30, yF - .3, 0]}, T.d2, T.conn - T.d2, 'none');
    tl.to(prog.band, {P: 1, duration: .4, ease: 'power1.out'}, T.d2 + .1); tl.to(prog.tier, {P: 1, duration: 1.1}, T.d2 + .2);
    tl.to(prog.band, {F: 1, duration: .4, ease: 'power1.out'}, T.d2 + .7); tl.to(prog.tier, {F: 1, duration: 1.1}, T.d2 + .8);
    // out to the whole, the connections; the future; the claims
    camTo(V.full, T.conn, 1.2); tl.to(prog, {conn: 1, duration: 1.2}, T.conn + .3);
    camTo(V.futIn, T.fut, .6); camTo(V.futOut, T.fut + .6, T.claim - T.fut - .6, 'none'); tl.to(prog, {fut: 1, duration: 1.2}, T.fut + .2);
    camTo(V.claims, T.claim, .8); tl.to(prog, {claim: 1, duration: .9}, T.claim + .1);
    // the six questions, listed, over the dimmed map
    tl.to(sdim, {v: .88, duration: .7, ease: 'power1.inOut'}, T.qs); fade('#qlist', T.qs + .3, T.q1 - .05); tl.to(sdim, {v: 0, duration: .8, ease: 'power1.inOut'}, T.q1 - .2);
    // stages 2 and 3
    if (ride) { const T2 = ride.timeline(tl, camTo, fade, T, V); T.total = T2.total; }
    STOPS = STOPS1.concat(ride ? ride.stops : []);
    tl.to({}, {duration: .01}, T.total);
    $('#scroll').style.height = (T.total * 100) + 'vh';
    ScrollTrigger.refresh();
    if (keep > 0) { const st = tl.scrollTrigger; st.scroll(st.start + keep * (st.end - st.start)); tl.progress(keep); }
  }

  // ---------- header: dashes and the current step ------------------------------------
  const SECTIONS = [['Thesis', 'p1'], ['Images', 'wall'], ['Map', 'time'], ['Questions', 'qs'], ['Q1', 'Q1'], ['Q2', 'Q2'], ['Q3', 'Q3'], ['Q4', 'Q4'], ['Q5', 'Q5'], ['Q6', 'Q6'], ['Framework', 'fw'], ['Position', 'pos'], ['Discussion', 'disc'], ['Dictionary', 'act:dict'], ['References', 'act:refs']];
  const dashRoot = $('#hd .dashes'), curEl = $('#hd .cur');
  let curTitle = '';
  const dashes = SECTIONS.map(([name, go]) => { const d = document.createElement('div'); d.className = 'dash'; d.innerHTML = '<i></i>'; d.dataset.go = go; d.title = '';
    d.addEventListener('mouseenter', () => { curEl.textContent = name; curEl.classList.add('hover'); });
    d.addEventListener('mouseleave', () => { curEl.textContent = curTitle; curEl.classList.remove('hover'); });
    d.addEventListener('click', () => { if (go.startsWith('act:')) { if (!window.ODOverlays) return; go === 'act:dict' ? ODOverlays.openDictionary() : ODOverlays.openReferences(); return; }
      const s = STOPS.find(x => x[0] === go); if (s) scrollToT(s[1], 2.2); });
    dashRoot.appendChild(d); return {el: d, go, name}; });
  function headerState(t) {
    let cur = null, best = -1;
    dashes.forEach(d => { if (d.go.startsWith('act:')) return; const s = STOPS.find(x => x[0] === d.go); if (s && s[1] - .3 <= t && s[1] > best) { best = s[1]; cur = d; } });
    dashes.forEach(d => d.el.classList.toggle('on', d === cur));
    let title = ''; for (const s of STOPS) { if (s[1] - .25 <= t) title = s[2] || title; else break; }
    if (title !== curTitle) { curTitle = title; if (!curEl.classList.contains('hover')) curEl.textContent = title; }
  }
  function scrollToT(t, dur) { const st = tl.scrollTrigger; const y = st.start + clamp(t / T.total, 0, 1) * (st.end - st.start); gsap.to(window, {scrollTo: y, duration: dur == null ? 1.6 : dur, ease: 'power2.inOut', overwrite: true}); }
  const curT = () => tl.scrollTrigger.progress * T.total;
  // the arrows: one stop at a time, except inside a question, where they take two steps at once (cases and ends are never skipped)
  const isStep = s => s && /^Q\d:[1-9]\d*$/.test(s[0]);
  function step(dir) { const t = curT(), list = dir > 0 ? STOPS : [...STOPS].reverse();
    const i = list.findIndex(x => dir > 0 ? x[1] > t + .08 : x[1] < t - .08); let s = list[i];
    if (isStep(s) && isStep(list[i + 1])) s = list[i + 1];
    scrollToT(s ? s[1] : dir > 0 ? T.total : 0); }
  $('#arrows .prev').addEventListener('click', () => step(-1)); $('#arrows .next').addEventListener('click', () => step(1));
  addEventListener('keydown', e => {
    if (window.ODOverlays && ODOverlays.isOpen()) return;
    if (ov.classList.contains('on')) { closeOv(); if (e.key === 'Escape') return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); scrollToT(0); } else if (e.key === 'End') { e.preventDefault(); scrollToT(T.total); }
  });

  // ---------- the card: opens in place, near what was clicked ------------------------------
  const ov = $('#card'); let cardAt = [innerWidth / 2, innerHeight / 2];
  function openOv(h, img, wide) {
    ov.innerHTML = (img ? `<img src="${img.src}" alt="${esc(img.alt || '')}">` : '') + `<div class="tx">${h}</div>`;
    ov.classList.toggle('wide', !!wide); ov.classList.add('on');
    const w = ov.offsetWidth, hgt = ov.offsetHeight;
    const x = clamp(cardAt[0] + 14, 12, innerWidth - w - 12), y = clamp(cardAt[1] + 14, 70, innerHeight - hgt - 40);
    ov.style.left = x + 'px'; ov.style.top = y + 'px';
  }
  function closeOv() { ov.classList.remove('on'); }
  addEventListener('pointerdown', e => { if (!ov.classList.contains('on')) return; if (e.target.closest('#card')) return; closeOv(); }, true);
  const termImage = (label) => { const t = tileByName[label.toLowerCase()]; if (t) return {src: 'img/tiles/' + t.file, alt: t.name, cap: [t.name, t.date, t.credit].filter(Boolean).join(' · ')};
                                 const i = imgByLabel[label.toLowerCase()]; if (i) return {src: 'img/map/' + i.file + '.jpg', alt: i.label, cap: i.label + ' · ' + i.dt}; return null; };
  function showTerm(t) { openOv(`<div class="eb">${ERAN[t.era]} · ${TNAME[t.tier]} · ${PN[t.person] || 'shared'}</div><h2>${esc(t.label)}</h2><p>${esc(t.d)}</p><div class="src">${esc(t.src)}</div>`, termImage(t.label)); }
  function open(k, id) {
    if (k === 'case') { const cs = CASES.cases.find(x => x.key === id || x.n === String(id)); if (cs) openOv(`<div class="eb">Case · ${esc(cs.q)}</div><h2>${esc(cs.name)}</h2><div class="meta">${esc(cs.meta)}</div><p>${esc(cs.take)}</p>`, {src: 'img/cases/' + cs.imgs[0][0] + '.jpg', alt: cs.imgs[0][1]}); return; }
    if (k === 'term' && node[id] && node[id].tier === 'E') k = 'event';
    if (k === 'term') { if (String(id).startsWith('img:')) { const i = MAP.imgs.find(x => x.id === id.slice(4)); if (i) openOv(`<div class="eb">${ERAN[i.era]} · ${TNAME[i.tier]}</div><h2>${esc(i.label)}</h2><p>${esc(i.dt)}</p>`, {src: 'img/map/' + i.file + '.jpg', alt: i.label}); return; }
                        const t = node[id]; if (t) showTerm(t); }
    else if (k === 'echo') { const e = MAP.echoes.find(x => x.id === id), s = e && node[e.src]; if (s) openOv(`<div class="eb">Future · projected from ${ERAN[s.era]} · ${TNAME[s.tier]} · ${PN[s.person] || 'shared'}</div><h2>${esc(s.label)}</h2><p>${esc(s.d)}</p><div class="src">${esc(s.src)}</div>`, termImage(s.label)); }
    else if (k === 'event') { const e = node[id]; if (e) openOv(`<div class="eb">Event · ${ERAN[e.era]}</div><h2>${esc(e.txt)}</h2><p>${esc(e.d)}</p><div class="src">${esc(e.src)}</div>`, termImage(e.label)); }
    else if (k === 'claim') { const a = claimByNum[Number(id)]; if (a) openOv(`<div class="eb">Claim ${a.num} · ${esc(MAP.narr[a.n] || a.n)}</div><h2>${esc(a.anchor || '')}</h2><p>${esc(a.claim)}</p><div class="src">${esc(a.src)}</div>`, null); }
    else if (k === 'tile') { const t = BOARD.find(x => x.i === Number(id)); if (t) openOv(`<div class="eb">${esc(t.era)} · ${TNAME[t.layer]} · ${PN[t.p] || 'shared'}</div><h2>${esc(t.name)}</h2><p>${esc(t.date || '')}</p><div class="src">${esc(t.credit || '')}</div>`, {src: 'img/tiles/' + t.file, alt: t.name}); }
    else if (k === 'simg') { const h = id; openOv(`<div class="eb">${esc(h.sub || '')}</div><h2>${esc(h.name)}</h2>`, {src: h.src, alt: h.name}); }
  }
  labelRoot.addEventListener('click', e => { const el = e.target.closest('.lb'); if (!el) return; cardAt = [e.clientX, e.clientY];
    if (el.classList.contains('ccard')) { const opening = !el.classList.contains('open'); document.querySelectorAll('.lb.ccard.open').forEach(o => o.classList.remove('open')); if (opening) { el.classList.add('open'); if (window.sketchSVGs) sketchSVGs(el); } return; }
    if (el.dataset.k) open(el.dataset.k, el.dataset.id); });
  // hover: the first sentence of a definition
  const tip = $('#tip');
  labelRoot.addEventListener('mouseover', e => { const el = e.target.closest('.lb.t, .lb.ec, .lb.ev'); if (!el) return;
    const n = el.dataset.k === 'echo' ? node[(MAP.echoes.find(x => x.id === el.dataset.id) || {}).src] : node[el.dataset.id]; if (!n || !n.d) return;
    tip.textContent = n.d.split(/(?<=\.)\s/)[0]; tip.classList.add('on'); });
  labelRoot.addEventListener('mouseout', e => { if (e.target.closest('.lb')) tip.classList.remove('on'); });
  addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; mouseMoved = true; if (!tip.classList.contains('on')) return; const x = Math.min(e.clientX + 16, innerWidth - tip.offsetWidth - 12), y = Math.min(e.clientY + 18, innerHeight - tip.offsetHeight - 12); tip.style.transform = `translate(${x}px,${y}px)`; });
  // images reveal their name on hover, open on click
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let mouseX = -1, mouseY = -1, mouseMoved = false, hovered = null, downAt = null;
  const hoverEl = $('#tileHover'), hv = new THREE.Vector3();
  function updateHover() {
    if (!mouseMoved) { if (hovered) placeHover(); return; } mouseMoved = false;
    mouse.set(mouseX / innerWidth * 2 - 1, -(mouseY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
    const cands = hoverables.filter(m => m.visible && m.material.opacity > .25);
    const hit = ray.intersectObjects(cands)[0];
    const m = hit ? hit.object : null;
    if (m !== hovered) { if (hovered) hovered.userData.hover.rec.hov = 0; hovered = m; if (m) { m.userData.hover.rec.hov = 1; const h = m.userData.hover; hoverEl.innerHTML = `${esc(h.name)}<small>${esc(h.sub || '')}</small>`; hoverEl.classList.add('on'); } else hoverEl.classList.remove('on'); }
    if (hovered) placeHover();
  }
  function placeHover() { hv.setFromMatrixPosition(hovered.matrixWorld).project(camera); hoverEl.style.left = ((hv.x + 1) / 2 * innerWidth) + 'px'; hoverEl.style.top = ((1 - hv.y) / 2 * innerHeight) + 'px'; }
  canvas.addEventListener('pointerdown', e => downAt = [e.clientX, e.clientY]);
  canvas.addEventListener('pointerup', e => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return; downAt = null; cardAt = [e.clientX, e.clientY];
    if (hovered) { const h = hovered.userData.hover; if (h.kind === 'tile') open('tile', h.id); else if (h.kind === 'img') open('term', h.id); else if (h.kind === 'simg') open('simg', h); } });
  canvas.addEventListener('pointerleave', () => { if (hovered) { hovered.userData.hover.rec.hov = 0; hovered = null; hoverEl.classList.remove('on'); } });

  // ---------- the text screens of stages 2 and 3 ----------
  $('#pos').innerHTML = `<div class="eb">Position</div>${esc(CASES.framework.position)}`;
  $('#prop').innerHTML = `<div class="eb">Proposition</div>${esc(CASES.framework.proposition)}`;
  // the six questions listed; each row goes to its question
  const goStop = (id, dur) => { const s = STOPS.find(x => x[0] === id); if (s) scrollToT(s[1], dur == null ? 2.2 : dur); };
  { const ol = $('#qlist ol'); Object.keys(MAP.flows).filter(k => /^Q\d$/.test(k)).forEach(k => { const li = document.createElement('li'); li.innerHTML = `<span class="k">${k}</span><p>${esc(MAP.flows[k].question)}</p>`; li.addEventListener('click', () => goStop(k)); ol.appendChild(li); }); }
  document.querySelectorAll('#tbc .links button').forEach(b => b.addEventListener('click', () => goStop(b.dataset.go, 2.6)));
  if (window.ODDiscussion) { try { ODDiscussion.build(CASES.discussion, $('#disc')); } catch (e) { console.error('discussion', e); } }
  if (window.ODOverlays) { try { ODOverlays.build({terms: MAP.terms, events: MAP.events, refs: REFS, covers: Object.fromEntries(Object.entries(COVERS).map(([k, v]) => [k, 'img/covers/' + v])), eraName: e => ERAN[e] || '', tierName: k => TNAME[k] || 'Event', personName: p => PN[p] || 'shared', openTerm: id => open('term', id)}); } catch (e) { console.error('overlays', e); } }

  // ---------- per frame ---------------------------------------------------------------
  const v3 = new THREE.Vector3(); let mapMul = 1; const colList = [];
  // labels on the spine keep out of each other's way: steps first, then tied terms, then branches
  function resolveLabels(list) {
    list.sort((p, q) => (q.col - p.col) || (q._op - p._op));
    const acc = [];
    for (const l of list) { const sc = l._sc, order = l._last != null ? [l._last, ...l.alts.map((_, i) => i).filter(i => i !== l._last)] : l.alts.map((_, i) => i); let placed = null;
      for (const ai of order) { const [ax, ay, dx, dy] = l.alts[ai];
        const x0 = l._sx + dx * sc * S + ax / 100 * l.ew * sc, y0 = l._sy - dy * sc * S + ay / 100 * l.eh * sc, x1 = x0 + l.ew * sc, y1 = y0 + l.eh * sc;
        let hit = false; for (const r of acc) { if (x0 < r[2] + 3 && r[0] < x1 + 3 && y0 < r[3] + 2 && r[1] < y1 + 2) { hit = true; break; } }
        if (!hit) { placed = [x0, y0, x1, y1, ai]; break; } }
      if (!placed) { l._last = null; if (l.op !== '0') { l.el.style.opacity = '0'; l.op = '0'; } continue; }
      acc.push(placed); l._last = placed[4]; const [ax, ay, dx, dy] = l.alts[placed[4]];
      const tr = `translate3d(${(l._sx + dx * sc * S).toFixed(1)}px,${(l._sy - dy * sc * S).toFixed(1)}px,0) scale(${sc.toFixed(3)}) translate(${ax}%,${ay}%)`;
      if (tr !== l.tr) { l.el.style.transform = tr; l.tr = tr; }
      const op = l._op.toFixed(2); if (op !== l.op) { l.el.style.opacity = op; l.op = op; } }
  }
  function updateLabels() {
    const w = innerWidth, h = innerHeight, k0 = h / (2 * TAN), inv = camera.matrixWorldInverse, pm = camera.projectionMatrix;
    colList.length = 0;
    for (let i = 0; i < labels.length; i++) { const l = labels[i];
      let a = l.ref ? l.ref.a : l.af ? l.af() : 1; if (!l.ref && !l.keep) a *= mapMul;
      if (a <= .004) { if (l.vis) { l.el.classList.remove('on'); l.vis = false; } continue; }
      v3.set(l.x, l.y + (l.ref ? l.ref.ry : 0), l.z).applyMatrix4(inv);
      const depth = -v3.z;
      if (depth < 2) { if (l.vis) { l.el.classList.remove('on'); l.vis = false; } continue; }
      const ppu = k0 / depth; let sc = ppu / S; const fs = l.b * sc;
      v3.applyMatrix4(pm);
      if ((fs < 4.5 && !l.mins) || v3.x < -1.3 || v3.x > 1.3 || v3.y < -1.3 || v3.y > 1.3) { if (l.vis) { l.el.classList.remove('on'); l.vis = false; } continue; }
      const fade = l.mins ? 1 : clamp((fs - 4.5) / 3.5, 0, 1); if (sc > l.maxs) sc = l.maxs; if (sc < l.mins) sc = l.mins;
      if (l.col != null) { if (!l.vis) { l.el.classList.add('on'); l.vis = true; } if (!l.ew) { l.ew = l.el.offsetWidth; l.eh = l.el.offsetHeight; }
        l._sx = (v3.x + 1) / 2 * w; l._sy = (1 - v3.y) / 2 * h; l._sc = sc; l._op = a * fade; colList.push(l); continue; }
      let sx = (v3.x + 1) / 2 * w + l.dx * sc * S, sy = (1 - v3.y) / 2 * h - l.dy * sc * S;
      if (l.keep && l.el.classList.contains('open')) { const eh = l.el.offsetHeight, ew = l.el.offsetWidth; if (sy - eh < 72) sy = 72 + eh; if (sx - ew < 12) sx = 12 + ew; if (sy > h - 12) sy = h - 12; }   // an open card stays inside the screen
      const tr = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) scale(${sc.toFixed(3)}) translate(${l.ax}%,${l.ay}%)`;
      if (tr !== l.tr) { l.el.style.transform = tr; l.tr = tr; }
      const op = (a * fade).toFixed(2); if (op !== l.op) { l.el.style.opacity = op; l.op = op; }
      if (!l.vis) { l.el.classList.add('on'); l.vis = true; }
    }
    if (colList.length) resolveLabels(colList);
  }
  function frame(now) {
    const t = now / 1000;
    mapMul = (ride ? ride.mul() : 1) * (1 - sdim.v);
    updateTiles(); if (ride) ride.frame(); updatePoints(mapMul); if (ride) ride.after();
    colLines.set(prog.time); connLines.set(prog.conn); futLines.set(clamp(prog.fut / .35, 0, 1)); futRelLines.set(clamp((prog.fut - .3) / .7, 0, 1));
    [colLines, connLines, futLines, futRelLines].forEach(o => { o.m.material.opacity = mapMul; });
    for (const k in bands) { const b = bands[k], p = prog.band[k] * mapMul; b.mat.opacity = p; b.mesh.visible = p > .003; b.mesh.position.y = b.y - (1 - prog.band[k]) * 2.2; }
    for (const mi of mapImgs) { const p = clamp((prog.tier[mi.i.tier] - .1) / .4, 0, 1) * mapMul * (1 - .7 * mi.hov); mi.mat.opacity = p; mi.m.visible = p > .003; }
    let px = cam.x, py = cam.y, pz = cam.z, tx = cam.tx, ty = cam.ty, tz = cam.tz;
    if (wall.mix > 0) { wallView(wall.phi); const m = wall.mix;
      px = lerp(px, wv.x, m); py = lerp(py, wv.y, m); pz = lerp(pz, wv.z, m); tx = lerp(tx, wv.tx, m); ty = lerp(ty, wv.ty, m); tz = lerp(tz, wv.tz, m); }
    px += Math.sin(t * .31) * .3; py += Math.sin(t * .23 + 1.3) * .24;
    camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); camera.updateMatrixWorld();
    renderer.render(scene, camera);
    updateLabels(); updateHover();
    requestAnimationFrame(frame);
  }
  function onResize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); pmat.uniforms.uScale.value = innerHeight * renderer.getPixelRatio() / (2 * TAN); if (ride) ride.resize(); }
  let rsT = null;
  addEventListener('resize', () => { onResize(); clearTimeout(rsT); rsT = setTimeout(buildTimeline, 250); });
  onResize(); buildTimeline(); scrollTo(0, 0);
  requestAnimationFrame(frame);
  window.OD = {T, get STOPS() { return STOPS; }, tl: () => tl, prog, cam, scrollToT, tiles, labels, ride, open};
}
})();
