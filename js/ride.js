/* ============================================================
   Ordinary Departures — stages 2 and 3 of the ride.
   Each question: its route shown on the map, then its terms lift onto a
   track in space and flow past through a haze of the layers' colours; the
   cases meet the ride as cards beside their step. Then the framework and
   findings, position and proposition, the discussion, and
   "To be continued". Plugs into the scene built by site.js.
   ============================================================ */
(() => {
'use strict';
window.ODRide = {build};

function build(c) {
  const {THREE, scene, camera, MAP, SPINES, CASES, S, wx, wy, mkLabel, node, rgb, clamp, lerp, esc, ERAN, L, loader, maxAniso,
         aKind, aSize, aCol, kindAttr, sizeAttr, colAttr, makeLines, $, glowMat, hoverables} = c;
  const QK = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
  const TFc = ['#9d95f0', '#7f9fe0', '#6fbdb2', '#cfa66e'].map(rgb);
  const KY = 0.85, XS = 1.25 / S, KI = 0.42;   // across, along, and the images pulled toward the spine
  const OPd = [1, 1, .75], OPr = [.6, .4, .28, .18, .1, .06];
  const RC = {ali: ['#b4b8c1', 1], bec: ['#f29273', 1], opp: ['#c9ccd3', 1.2], ten: ['#b3a3f0', 1]};
  const CASE_AT = {Q1: {'__end': 'ksc'}, Q2: {'Procession': 'bab', 'Walkout': 'spa'}, Q3: {'Testimony': 'vvm'}, Q4: {'Transmission of skills': 'ise'}, Q5: {'Non-place': 'air', 'Routine': 'spa'}, Q6: {'Anthropological place': 'bai'}};
  const SHORT = {ksc: 'Kennedy, LC-39', bai: 'Baikonur', bab: 'Babylon', ise: 'Ise Jingu', vvm: 'Vietnam Veterans Memorial', air: 'TWA to Roissy', spa: 'Spaceport America'};
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const rnd = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };
  const gauss = (s) => (rnd(s + 'a') + rnd(s + 'b') + rnd(s + 'c') - 1.5) * 1.6;

  // ---------- the track ------------------------------------------------------------------
  const A = new THREE.Vector3(8, -4, 36), F = new THREE.Vector3(-28, 12, -2);
  const U = new THREE.Vector3(1, -0.4, 0.55).normalize(), TFv = new THREE.Vector3(-1, 0.45, -1).normalize();
  const C1 = new THREE.Vector3(), C2 = new THREE.Vector3(); let SFAR = 1;
  function layoutTrack(aspect) { const k = clamp(aspect / 1.6, .6, 1.25); A.set(8 * k, -4, 36); F.set(-28 * k, 12, -2); C1.copy(A).addScaledVector(U, -34); C2.copy(F).addScaledVector(TFv, -34); SFAR = A.distanceTo(F); }
  layoutTrack(camera.aspect);
  function P(su, out) {
    if (su >= 0) return out.copy(A).addScaledVector(U, su);
    const t = -su / SFAR;
    if (t <= 1) { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t;
      return out.set(a * A.x + b * C1.x + cc * C2.x + d * F.x, a * A.y + b * C1.y + cc * C2.y + d * F.y, a * A.z + b * C1.z + cc * C2.z + d * F.z); }
    return out.copy(F).addScaledVector(TFv, -su - SFAR);
  }
  const fadeAt = su => su > 0 ? clamp(1 - su / 11, 0, 1) : clamp(1 - (-su - SFAR * .5) / (SFAR * .35), 0, 1);       // what is near the current step
  const hazeAt = su => su > 0 ? clamp(1 - su / 16, 0, 1) : clamp(1 - (-su - SFAR * .7) / (SFAR * .4), 0, 1);
  const RIDE = {p: [0, 0, 58], t: [0, 0, 0]};

  // ---------- the questions --------------------------------------------------------------
  const Qs = QK.map((k, qi) => {
    const D = SPINES[k];
    const steps = D.steps.map(s => ({...s, n0: node[s.id]}));
    const terms = D.terms.filter(t => t.d <= 2 || t.tied).map(t => { const n = node[t.id]; return n && n._p ? {...t, p: n._p, l: n._l, n, pos: new THREE.Vector3(), su: 0} : null; }).filter(Boolean);
    const byId = {}; terms.forEach(t => byId[t.id] = t);
    const stepById = {}; steps.forEach(s => stepById[s.id] = s);
    const rels = []; MAP.rels.forEach(r => { const a = byId[r.s], b = byId[r.t]; if (!a || !b) return;
      const dm = Math.min(a.d, b.d), dM = Math.max(a.d, b.d), tier = dm === 0 ? (dM <= 1 ? 0 : 1) : dm === 1 ? (dM <= 2 ? 2 : 3) : 4;
      const len = Math.hypot(a.x - b.x, a.y - b.y), lf = clamp(1 - (len - 450) / 1650, 0, 1); if (lf < .03) return;
      const [col, m] = RC[r.k] || RC.ali, o = OPr[tier] * lf * m, cc = rgb(col); rels.push({a, b, c: [cc[0] * o, cc[1] * o, cc[2] * o]}); });
    const spurs = terms.filter(t => t.tied && byId[t.root] && byId[t.root].d === 0).map(t => ({t, s: byId[t.root]}));
    const xEnd = D.W - D.R0 + 30;
    // the spine's layer as a smooth function of x, for the haze's colour
    const TI = {M: 0, V: 1, P: 2, F: 3}, sx = steps.map(s => s.x), sti = steps.map(s => TI[s.tier] ?? 1);
    const tiAt = x => { if (x <= sx[0]) return sti[0]; if (x >= sx[sx.length - 1]) return sti[sti.length - 1]; let i = 0; while (sx[i + 1] < x) i++; const t = (x - sx[i]) / (sx[i + 1] - sx[i]), u = (1 - Math.cos(Math.PI * t)) / 2; return sti[i] + (sti[i + 1] - sti[i]) * u; };
    const haze = []; for (let i = 0; i < 1100; i++) { const s = k + i; const x = D.L0 - 100 + rnd(s) * (xEnd + 100 - D.L0 + 100); const ti = tiAt(x), c0 = TFc[Math.floor(ti)], c1 = TFc[Math.min(3, Math.ceil(ti))], f = ti - Math.floor(ti);
      haze.push({x, yo: gauss(s + 'y') * 2.4, zo: gauss(s + 'z') * 1.6, c: [lerp(c0[0], c1[0], f), lerp(c0[1], c1[1], f), lerp(c0[2], c1[2], f)], size: 1.3 + rnd(s + 's') * 2.6, a: .08 + rnd(s + 'o') * .11}); }
    // the route on the map through the step terms (a centripetal spline)
    const mp = steps.map(s => s.n0 && s.n0._p).filter(Boolean).map(p => new THREE.Vector3(p.x, p.y, 0.14));
    const route = []; if (mp.length > 1) { const cr = new THREE.CatmullRomCurve3(mp, false, 'centripetal', .5); cr.getSpacedPoints(200).forEach(v => route.push(v)); }
    // the route as a solid line; frame() lights it with the glow cloud
    let line = null; if (route.length > 1) { line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(route), new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})); line.renderOrder = 5; line.frustumCulled = false; line.visible = false; scene.add(line); }
    const Q = {k, qi, D, steps, terms, rels, spurs, xEnd, byId, stepById, st: {a: 0, x: steps[0].x, r: 0}, q: (MAP.flows[k] || {}).question || '', end: D.end, imgs: [], haze, route, line, mp, cards: []};
    D.imgs.forEach((im, j) => {
      const mat = new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0, depthWrite: false});
      const m = new THREE.Mesh(new THREE.PlaneGeometry(im.w / S, im.h / S), mat); m.visible = false; m.renderOrder = 6; scene.add(m);
      loader.load('img/spines/' + im.href, tex => { tex.anisotropy = maxAniso; mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true; });
      const meta = D.images[j] || [];
      const rec = {im, m, mat, a: 0, hov: 0, x: im.x + im.w / 2, y: im.y + im.h / 2};
      m.userData.hover = {rec, kind: 'simg', src: 'img/spines/' + im.href, name: meta[2] || '', sub: meta[3] || ''}; hoverables.push(m);
      Q.imgs.push(rec); });
    return Q;
  });
  // the case cards, beside their step
  Qs.forEach(Q => { const at = CASE_AT[Q.k] || {}; Object.entries(at).forEach(([label, key]) => { const cs = CASES.cases.find(x => x.key === key); if (!cs) return;
    const anchor = label === '__end' ? null : Q.steps.find(s => s.label === label); if (label !== '__end' && !anchor) return;
    const ims = (cs.imgs || []).map(([f, cap]) => `<img src="img/cases/${f}.jpg" alt="${esc(cap)}">`).join('');
    const rec = {a: 0, ry: 0, cs, x: anchor ? anchor.x : Q.xEnd + 34};
    rec.l = mkLabel('ccard', `<div class="n">Case · ${esc(cs.name)}</div><div class="m">${esc(cs.meta)}</div><div class="ims">${ims}</div><div class="t">${esc(cs.take)}</div><div class="more"><div class="dg">${cs.sketch_svg}</div><div class="ctx"><div><div class="lab">Theory</div><p>${esc(cs.theory)}</p><div class="lab">Method</div><p>${esc(cs.method)}</p></div><div><div class="lab">Outcome</div><p>${esc(cs.outcome)}</p><div class="lab">Source</div><p class="src">${esc(cs.src)}</p></div></div></div>`, 0, 0, 0, 12, -100, -100, -.5, .9, {ref: rec, keep: true, mins: 1, maxs: 1, data: {k: 'case', id: cs.key}});
    Q.cards.push(rec); }); });
  // the question cards
  const qroot = $('#qcards');
  Qs.forEach(Q => { const el = document.createElement('div'); el.className = 'qcard'; el.id = 'qcard' + Q.qi; el.innerHTML = `<div class="eb">${Q.k} · ${Q.steps.length} steps</div><p>${esc(Q.q)}</p>`; qroot.appendChild(el); gsap.set(el, {yPercent: -50}); });

  // ---------- shared geometry, refilled every frame ------------------------------------------
  const maxRels = Math.max(...Qs.map(Q => Q.rels.length)), maxSpurs = Math.max(...Qs.map(Q => Q.spurs.length));
  const addMat = () => new THREE.LineBasicMaterial({vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false});
  function segs(n, order, line) {
    const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setDrawRange(0, 0);
    const m = line ? new THREE.Line(g, addMat()) : new THREE.LineSegments(g, addMat()); m.renderOrder = order; m.frustumCulled = false; m.visible = false; scene.add(m);
    return {m, g, pos, col, n};
  }
  const spineL = segs(300, 5, true), relL = segs(maxRels * 2, 3), spurL = segs(maxSpurs * 10, 4), routeL = segs(2 * 170, 5, true);
  const upd = (o, n) => { o.g.attributes.position.needsUpdate = true; o.g.attributes.color.needsUpdate = true; o.g.setDrawRange(0, n); o.m.visible = n > 0; };
  // the glow cloud: the haze, the spine's light, the steps, the routes on the map
  const NG = 2400, gPos = new Float32Array(NG * 3), gCol = new Float32Array(NG * 3), gSize = new Float32Array(NG), gKind = new Float32Array(NG).fill(6), gStroke = new Float32Array(NG), gAlpha = new Float32Array(NG), gRise = new Float32Array(NG);
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.BufferAttribute(gPos, 3)); gg.setAttribute('col', new THREE.BufferAttribute(gCol, 3)); gg.setAttribute('size', new THREE.BufferAttribute(gSize, 1));
  gg.setAttribute('kind', new THREE.BufferAttribute(gKind, 1)); gg.setAttribute('stroke', new THREE.BufferAttribute(gStroke, 1)); gg.setAttribute('alpha', new THREE.BufferAttribute(gAlpha, 1)); gg.setAttribute('rise', new THREE.BufferAttribute(gRise, 1));
  gg.setDrawRange(0, 0);
  const glow = new THREE.Points(gg, glowMat); glow.renderOrder = 3; glow.frustumCulled = false; scene.add(glow);
  let gn = 0;
  const gput = (x, y, z, col, size, a) => { if (gn >= NG || a < .004) return; gPos[gn * 3] = x; gPos[gn * 3 + 1] = y; gPos[gn * 3 + 2] = z; gCol[gn * 3] = col[0]; gCol[gn * 3 + 1] = col[1]; gCol[gn * 3 + 2] = col[2]; gSize[gn] = size; gAlpha[gn] = a; gn++; };
  const WHITE = [1, 1, 1], ORANGE = rgb('#f0a24b');
  const endRec = {a: 0, ry: 0}; endRec.l = mkLabel('endm', '', 0, 0, 0, 26, 0, -50, 0, 0, {ref: endRec, keep: true}); endRec.l.col = 3; endRec.l.alts = [[0, -50, .5, 0], [-50, -100, 0, .6]];

  // ---------- activation --------------------------------------------------------------------
  const styleFor = t => t.d === 0 ? {b: 22, col: '#fff', w: 500} : (t.d === 1 || t.tied) ? {b: 15, col: '#fff', w: 400} : {b: 12, col: '#8a8e97', w: 400};
  let active = null;
  function activate(Q) {
    Q.terms.forEach(t => { const l = t.l, p = t.p;
      if (l) { if (l.b0 == null) { l.b0 = l.b; l.col0 = l.el.style.color; l.w0 = l.el.style.fontWeight; l.html0 = l.el.innerHTML; l.ax0 = l.ax; l.ay0 = l.ay; l.dx0 = l.dx; l.dy0 = l.dy; l.mx = l.x; l.my = l.y; l.mz = l.z; }
        const s = styleFor(t); l.b = s.b; l.el.style.fontSize = s.b + 'px'; l.el.style.color = s.col; l.el.style.fontWeight = s.w; l.ew = 0; l._last = null;
        if (t.d === 0) { const st = Q.stepById[t.id]; l.el.innerHTML = `${esc(t.label)}<small>${String(st.n).padStart(2, '0')} · ${esc(ERAN[t.n.era] || '')}</small>`; l.ax = -50; l.ay = -100; l.dx = 0; l.dy = .5; l.el.classList.add('stp');
          l.col = 3; l.alts = [[-50, -100, 0, .5], [-50, 0, 0, -.5], [0, -50, .5, 0]]; }
        else { const g = l.dx0; l.col = t.tied ? 2 : t.d === 1 ? 1 : 0; l.alts = [[0, -50, g, 0], [-100, -50, -g, 0], [-50, -100, 0, .3], [-50, 0, 0, -.3]]; } }
      if (p.k0 == null) { p.k0 = aKind[p.i]; p.s0 = aSize[p.i]; p.c0 = [aCol[p.i * 3], aCol[p.i * 3 + 1], aCol[p.i * 3 + 2]]; }
      if (t.d === 0) { aKind[p.i] = 5; aSize[p.i] = 22 / S; aCol.set([1, 1, 1], p.i * 3); } });
    kindAttr.needsUpdate = sizeAttr.needsUpdate = colAttr.needsUpdate = true;
    endRec.l.el.innerHTML = `<i></i>${esc(Q.end[0])}<small>${esc(Q.end[1])}</small>`; endRec.l.ew = 0;
  }
  function deactivate(Q) {
    Q.terms.forEach(t => { const l = t.l, p = t.p; p.ovrOn = false;
      if (l && l.b0 != null) { l.b = l.b0; l.el.style.fontSize = l.b0 + 'px'; l.el.style.color = l.col0; l.el.style.fontWeight = l.w0; l.el.innerHTML = l.html0; l.ax = l.ax0; l.ay = l.ay0; l.dx = l.dx0; l.dy = l.dy0; l.x = l.mx; l.y = l.my; l.z = l.mz; l.el.classList.remove('stp'); l.col = null; l.alts = null; l.ew = 0; }
      if (p.k0 != null) { aKind[p.i] = p.k0; aSize[p.i] = p.s0; aCol.set(p.c0, p.i * 3); } });
    kindAttr.needsUpdate = sizeAttr.needsUpdate = colAttr.needsUpdate = true;
    Q.imgs.forEach(r => { r.a = 0; r.m.visible = false; }); Q.cards.forEach(r => r.a = 0); endRec.a = 0;
    [spineL, relL, spurL].forEach(o => { o.m.visible = false; });
  }

  // ---------- per frame -----------------------------------------------------------------------
  const v = new THREE.Vector3(), v2 = new THREE.Vector3();
  let rideFade = 0, routeR = 0;
  function frame() {
    let Q = null; Qs.forEach(q => { if (q.st.a > 0.0005 && (!Q || q.st.a > Q.st.a)) Q = q; });
    if (Q !== active) { if (active) deactivate(active); active = Q; if (Q) activate(Q); }
    rideFade = Q ? Q.st.a : 0; routeR = Math.max(...Qs.map(q => q.st.r));
    gn = 0;
    // the routes on the map, for any question whose route is showing
    const now = performance.now() / 1000;
    Qs.forEach(q => { const w = q.st.r * (1 - q.st.a); if (q.line) { q.line.material.opacity = .85 * w; q.line.visible = w > .005; } if (w < .005) return;
      q.route.forEach(p => gput(p.x, p.y, p.z, WHITE, 2.0, .12 * w));                 // the light along the line
      q.mp.forEach(p => gput(p.x, p.y, p.z + .02, WHITE, 2.6, .9 * w));               // the steps
      { const n = q.route.length, head = Math.floor(((now * .07) % 1) * (n - 1));   // a light travelling the route
        for (let k = 0; k < 14; k++) { const i = head - k * 2; if (i < 0) break; const p = q.route[i]; gput(p.x, p.y, p.z + .03, WHITE, 3.0 - k * .12, .55 * w * (1 - k / 14)); } }
      // the step terms of the question stay bright on the dimmed map
      q.steps.forEach(s => { if (s.n0 && s.n0._p) s.n0._p.mapMul = 1 / Math.max(.05, 1 - .5 * routeR); }); });
    Qs.forEach(q => { if (q.st.r * (1 - q.st.a) < .005) q.steps.forEach(s => { if (s.n0 && s.n0._p) s.n0._p.mapMul = null; }); });
    if (Q) {
      const a = Q.st.a, ea = ease(a), xc = Q.st.x, D = Q.D;
      for (const t of Q.terms) { const p = t.p, su = (t.x - xc) * XS; P(su, v); v.y -= t.y / S * KY;
        const fa = fadeAt(su), sa = OPd[Math.min(t.d, 2)] * (t.d === 2 ? fa * fa * fa : t.d === 1 && !t.tied ? fa * fa : fa);   // branches thin out sooner than the steps
        t.pos.set(lerp(p.x, v.x, ea), lerp(p.y, v.y, ea), lerp(0.12, v.z, ea)); t.su = su;
        const o = p.ovr || (p.ovr = {}); o.x = t.pos.x; o.y = t.pos.y; o.z = t.pos.z; o.a = lerp(p.a0 * (1 - .5 * routeR), sa, ea); p.ovrOn = true;
        if (t.l) { t.l.x = t.pos.x; t.l.y = t.pos.y; t.l.z = t.pos.z + 0.02; } }
      // the haze of the layers' colours around the track
      for (const h of Q.haze) { const su = (h.x - xc) * XS; const f = hazeAt(su) * a; if (f < .01) continue; P(su, v); gput(v.x, v.y + h.yo, v.z + h.zo, h.c, h.size, h.a * f); }
      // the spine: a thin line and its light, the steps' glow, the end
      { let n = 0; for (let x = Q.steps[0].x; x <= Q.xEnd + 24; x += 24) { if (n >= spineL.n) break; const su = (Math.min(x, Q.xEnd) - xc) * XS; P(su, v); const f = fadeAt(su) * a;
          spineL.pos.set([v.x, v.y, v.z + 0.01], n * 3); spineL.col.set([f * .5, f * .5, f * .5], n * 3); n++; gput(v.x, v.y, v.z, WHITE, .9, .14 * f); } upd(spineL, n); }
      for (const t of Q.terms) if (t.d === 0) gput(t.pos.x, t.pos.y, t.pos.z, WHITE, 2.6, .45 * ea * fadeAt(t.su));
      { const su = (Q.xEnd - xc) * XS; P(su, v); gput(v.x, v.y, v.z, ORANGE, 2.4, .6 * ea * fadeAt(su)); const su2 = (Q.xEnd + 34 - xc) * XS; P(su2, v2); endRec.l.x = v2.x; endRec.l.y = v2.y; endRec.l.z = v2.z + 0.02; endRec.a = ea * fadeAt(su2); }
      // relations and spurs among what is near
      { let n = 0; for (const r of Q.rels) { const f = ea * Math.min(fadeAt(r.a.su), fadeAt(r.b.su)); if (f < .01) continue;
          relL.pos.set([r.a.pos.x, r.a.pos.y, r.a.pos.z, r.b.pos.x, r.b.pos.y, r.b.pos.z], n * 3); relL.col.set([r.c[0] * f, r.c[1] * f, r.c[2] * f, r.c[0] * f, r.c[1] * f, r.c[2] * f], n * 3); n += 2; } upd(relL, n); }
      { let n = 0; for (const sp of Q.spurs) { const f = ea * fadeAt(sp.s.su) * .5; if (f < .01) continue;
          for (let d = 0; d < 5; d++) { const t0 = d / 5, t1 = t0 + .1; v.lerpVectors(sp.t.pos, sp.s.pos, t0); v2.lerpVectors(sp.t.pos, sp.s.pos, t1);
            spurL.pos.set([v.x, v.y, v.z, v2.x, v2.y, v2.z], n * 3); spurL.col.set([f, f, f, f, f, f], n * 3); n += 2; } } upd(spurL, n); }
      // the images beside their steps, facing the viewer; the cards beside their step
      for (const r of Q.imgs) { const su = (r.x - xc) * XS; P(su, v); v.y -= r.y / S * KI; const f = ea * fadeAt(su) * .92 * (1 - .7 * r.hov);
        r.m.position.copy(v); r.m.quaternion.copy(camera.quaternion); r.mat.opacity = f; r.m.visible = f > .01; r.a = f; }
      for (const r of Q.cards) { const su = (r.x - xc) * XS; P(su, v); r.l.x = v.x; r.l.y = v.y; r.l.z = v.z + .05; r.a = su > 3 ? 0 : ea * clamp(1 - Math.abs(su) / 7, 0, 1); }
    }
    gg.attributes.position.needsUpdate = gg.attributes.col.needsUpdate = gg.attributes.size.needsUpdate = gg.attributes.alpha.needsUpdate = true;
    gg.setDrawRange(0, gn); glow.visible = gn > 0;
  }

  // ---------- the framework: the cases placed on the faded map, what carries forward, the two findings ----------
  const fw = {p: 0, lines: 0, f1: 0, f2: 0, on: 0};
  const fwLabels = []; let hoverCase = null;
  {
    const G = L, ERA = [null, [-100000, -3000], [-3000, 500], [500, 1400], [1400, 1900], [1900, 1957], [1957, 1986], [1986, 2011], [2011, 2026]];
    const X = y => { for (let e = 1; e <= 8; e++) { const [a, b] = ERA[e]; if (y >= a && y <= b) return G.colX[e] + 40 + (y - a) / (b - a) * (G.colW[e] - 80); } return G.SX0; };
    const Y = (k, f) => G.rowY[k] + 100 + f * (G.ROWH[k] - 130);
    const caseSegs = [], flowSegs = [], findSegs = [];
    const seg = (arr, x1, y1, x2, y2, col, al, dash) => { if (!dash) { arr.push({x: Math.min(x1, x2), p: [x1, y1, x2, y2], c: col, a: al}); return; }
      const [on, off] = dash, len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.floor(len / (on + off)));
      for (let i = 0; i < n; i++) { const t0 = i * (on + off) / len, t1 = Math.min(1, (i * (on + off) + on) / len); arr.push({x: Math.min(x1, x2), p: [x1 + (x2 - x1) * t0, y1 + (y2 - y1) * t0, x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1], c: col, a: al}); } };
    const bez = (arr, x0, y0, x1, y1, x2, y2, x3, y3, col, al, dash) => { const N = 60; let px = x0, py = y0;
      for (let i = 1; i <= N; i++) { const t = i / N, u = 1 - t, a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t, x = a * x0 + b * x1 + cc * x2 + d * x3, y = a * y0 + b * y1 + cc * y2 + d * y3;
        if (!dash || i % 2) arr.push({x: Math.min(px, x), p: [px, py, x, y], c: col, a: al}); px = x; py = y; } };
    const head = (arr, x, y, col, s = 16) => { seg(arr, x - s, y - s * .6, x, y, col, 1); seg(arr, x - s, y + s * .6, x, y, col, 1); };
    const stx = x => clamp((x - G.colX[1]) / (G.W - G.colX[1]), 0, 1) * .5;
    const caseA = (cs, x) => clamp((fw.p - stx(x)) / .2, 0, 1) * (hoverCase ? (hoverCase === cs ? 1 : .25) : 1);
    const hoverOn = (l, cs) => { l.el.addEventListener('mouseenter', () => hoverCase = cs); l.el.addEventListener('mouseleave', () => { if (hoverCase === cs) hoverCase = null; }); };
    // a label beside a mark: the case's name, then what the case shows there; placed clear of the others each frame
    const R = [0, -50, .4, 0], Lf = [-100, -50, -.4, 0], Tp = [-50, -100, 0, .4], Bt = [-50, 0, 0, -.4], DIAG = [[0, -100, .35, .3], [0, 0, .35, -.3], [-100, -100, -.35, .3], [-100, 0, -.35, -.3]];
    const ALT = {r: [R, Lf, Tp, Bt, ...DIAG], l: [Lf, R, Tp, Bt, ...DIAG], b: [Bt, Tp, R, Lf, ...DIAG], t: [Tp, Bt, R, Lf, ...DIAG]};
    const lab = (x, y, cs, s, side, o = {}) => { const alts = ALT[side || 'r'], name = o.name != null ? o.name : cs ? SHORT[cs] : '';
      const l = mkLabel('bx' + (o.mono ? ' mono2' : ''), (name ? `<b>${esc(name)}</b>` : '') + esc(s), wx(x), wy(y), 0.2, o.sz || 17, alts[0][0], alts[0][1], 0, 0,
        {keep: true, mins: .8, maxs: 1, af: o.af || (() => caseA(cs, x)), data: cs ? {k: 'case', id: cs} : null});
      l.col = o.col == null ? 1 : o.col; l.alts = alts; if (cs) hoverOn(l, cs); fwLabels.push(l); return l; };
    const mark = (x, y, cs, on = true) => { const l = mkLabel('mk' + (on ? '' : ' hollow'), '', wx(x), wy(y), 0.25, 13, -50, -50, 0, 0, {keep: true, mins: .8, maxs: 1, af: () => caseA(cs, x), data: {k: 'case', id: cs}}); hoverOn(l, cs); fwLabels.push(l); return l; };
    const xB = X(-575), xI = X(690), x61 = X(1961), x62 = X(1962), x67 = X(1967), x74 = X(1974), x82 = X(1982), x91 = X(1991), x11 = X(2011);
    const xT = G.scX.f + G.SCW / 2, yT = Y('F', .5), XN = G.SX0 - 22;
    const Pp = {i: Y('P', .86), b: Y('P', .62), k: Y('P', .38), t: Y('P', .12)};
    const RL = '#4a9c92', SO = '#c3c6cd';
    // the cases: a mark in each layer they sit in, linked; hollow where the case holds the meaning back
    [[xB, Y('M', .5), Y('F', .45)], [xI, Pp.i, Y('F', .45)], [x61, Y('M', .5), Pp.b], [x67, Pp.k, Y('F', .75)], [x74, Pp.t, Y('F', .22)], [x82, Y('V', .5), Y('F', .75)]].forEach(([x, a, b]) => seg(caseSegs, x, a, x, b, '#6b6f78', .9, [3, 7]));
    seg(caseSegs, x62 + 30, Y('F', .22), x74 - 36, Y('F', .22), SO, 1); head(caseSegs, x74 - 32, Y('F', .22), SO);
    mark(xB, Y('M', .5), 'bab'); mark(xB, Y('F', .45), 'bab'); mark(xI, Y('F', .45), 'ise'); mark(xI, Pp.i, 'ise');
    mark(x61, Y('M', .5), 'bai'); mark(x61, Pp.b, 'bai'); mark(x67, Pp.k, 'ksc'); mark(x67, Y('F', .75), 'ksc', false);
    mark(x62, Y('F', .22), 'air'); mark(x74, Y('F', .22), 'air', false); mark(x74, Pp.t, 'air', false);
    mark(x82, Y('V', .5), 'vvm'); mark(x82, Y('F', .75), 'vvm');
    mark(x11, Y('F', .6), 'spa');
    lab(xB, Y('M', .5), 'bab', 'the walk transforms the walker', 'r');
    lab(x61, Y('M', .5), 'bai', 'one man’s day becomes the rite', 'r');
    lab(x82, Y('V', .5), 'vvm', 'an honest account of loss', 'l');
    lab(x91, Y('V', .5), 'vvm', 'Kennedy, 1991', 'r', {name: 'Space Mirror'});
    lab(xI, Pp.i, 'ise', 'rebuilt every twenty years, since c. 690', 't');
    lab(x61, Pp.b, 'bai', 'Gagarin’s day, repeated by every crew', 'l');
    lab(x67, Pp.k, 'ksc', 'walkout and rites, every launch', 't');
    lab(x74, Pp.t, 'air', 'the hall becomes a process', 'r');
    lab(xB, Y('F', .45), 'bab', 'the route', 'b');
    lab(xI, Y('F', .45), 'ise', 'the shrine', 'b');
    lab((x62 + x74) / 2, Y('F', .22), 'air', '12 years', 't', {mono: true, name: '', sz: 14, col: 0});
    lab(x67, Y('F', .75), 'ksc', 'built for the vehicle', 'l');
    lab(x82, Y('F', .75), 'vvm', 'the wall of names', 'r');
    lab(x11, Y('F', .6), 'spa', 'a route cut into the land', 'l');
    // what carries forward: the practices repeated to this day, and what the thesis takes from the cases, or guards against
    [[xI, Pp.i], [x61, Pp.b], [x67, Pp.k]].forEach(([x, y]) => { [-2, 0, 2].forEach(dy => seg(flowSegs, x, y + dy, XN - 8, y + dy, RL, .9)); head(flowSegs, XN - 6, y, RL);
      bez(flowSegs, XN + 8, y, xT - 60, y, xT - 90, yT - 120, xT - 30, yT - 30, '#ffffff', .8, true); });
    seg(flowSegs, x82 + 30, Y('V', .5), x91 - 12, Y('V', .5), '#ffffff', 1);
    bez(flowSegs, x91 + 16, Y('V', .5) + 10, xT + 80, Y('V', .5) + 60, xT + 70, yT - 200, xT + 22, yT - 38, '#ffffff', .8, true);
    const yB = Y('F', .45), yR = Y('F', .22), yLow = Y('F', .97);
    bez(flowSegs, xB + 20, yB + 20, xB + 260, yLow, xT - 520, yLow, xT - 26, yT + 22, '#ffffff', .8, true); head(flowSegs, xT - 24, yT + 21, '#ffffff', 12);
    bez(flowSegs, x74 + 26, yR, x74 + 700, yR, xT - 360, yT - 8, xT - 36, yT - 4, '#9a9ea7', 1, true); head(flowSegs, xT - 36, yT - 4, '#9a9ea7', 12);
    bez(flowSegs, x11 + 28, Y('F', .6), x11 + 300, Y('F', .6), xT - 220, yT + 6, xT - 36, yT + 8, '#ffffff', .8, true);
    for (let i = 0; i < 28; i++) { const a0 = i / 28 * Math.PI * 2, a1 = (i + .55) / 28 * Math.PI * 2; seg(flowSegs, xT + 34 * Math.cos(a0), yT + 34 * Math.sin(a0), xT + 34 * Math.cos(a1), yT + 34 * Math.sin(a1), '#ffffff', 1); }
    const linesA = x0 => () => clamp((fw.lines - stx(x0) * .9) / .35, 0, 1) * (hoverCase ? .25 : 1);
    lab(xT - 330, yT + 96, null, 'precedent', 't', {mono: true, sz: 14, col: 0, af: linesA(xT - 400)});
    lab(xT - 330, yT - 44, null, 'warning', 't', {mono: true, sz: 14, col: 0, af: linesA(xT - 700)});
    const qA = () => clamp((fw.lines - .62) / .3, 0, 1);
    const qm = mkLabel('qm', '?', wx(xT), wy(yT), 0.2, 46, -50, -50, 0, 0, {keep: true, mins: .6, maxs: .8, af: qA});
    qm.col = 3; qm.alts = [[-50, -50, 0, 0]]; fwLabels.push(qm);
    const qt = mkLabel('qt', 'The launch complex: form for where the meaning went', wx(xT), wy(yT), 0.2, 15, 0, -50, 0, 0, {keep: true, mins: .8, maxs: 1, af: qA});
    qt.col = 2; qt.alts = [[0, -50, .8, 0], [-50, -100, 0, .8], [-50, 0, 0, -.8], [-100, -50, -.8, 0]]; fwLabels.push(qt);
    fwLabels.push(mkLabel('dot', '', wx(x91), wy(Y('V', .5)), 0.2, 16, -50, -50, 0, 0, {keep: true, mins: .8, maxs: 1, af: () => clamp((fw.lines - .5) / .25, 0, 1)}));
    // the two findings along the base, one bracket each
    const yA = G.SB + 64;
    [[G.colX[1], G.colX[6], '1', 'Before the heroic age, form carries the rite', () => fw.f1], [G.colX[6], XN, '2', 'From the heroic age, form goes to the vehicle, and the meaning moves to ritual and testimony', () => fw.f2]].forEach(([a, b, n, t, fv]) => {
      for (let i = 0; i < 12; i++) { const xa = a + 16 + (b - a - 32) * i / 12, xb = a + 16 + (b - a - 32) * (i + 1) / 12; findSegs.push({x: xa, p: [xa, yA, xb, yA], c: '#ffffff', a: 1}); }
      [a + 16, b - 16].forEach(x => findSegs.push({x, p: [x, yA - 10, x, yA + 10], c: '#ffffff', a: 1}));
      fwLabels.push(mkLabel('arg', `${n}&nbsp;&nbsp;${esc(t)}`, wx(a + 24), wy(yA + 22), 0.2, 22, 0, 0, 0, 0, {keep: true, mins: .6, maxs: 1, af: () => clamp(fv() / .4, 0, 1)})); });
    caseSegs.sort((p, q) => p.x - q.x); flowSegs.sort((p, q) => p.x - q.x); findSegs.sort((p, q) => p.x - q.x);
    const toWorld = arr => arr.map(s => ({...s, p: [wx(s.p[0]), wy(s.p[1]), wx(s.p[2]), wy(s.p[3])]}));
    fw.caseLines = makeLines(toWorld(caseSegs), 0.18, 5); fw.flowLines = makeLines(toWorld(flowSegs), 0.18, 5); fw.findLines = makeLines(toWorld(findSegs), 0.18, 5);
  }

  // ---------- the map's brightness under all this --------------------------------------------
  const dim = {v: 0};
  const mul = () => (1 - rideFade) * (1 - .5 * routeR) * (1 - .65 * fw.on) * (1 - dim.v);
  function reset() { Qs.forEach(Q => { Q.st.a = 0; Q.st.r = 0; Q.st.x = Q.steps[0].x; }); fw.p = 0; fw.lines = 0; fw.f1 = 0; fw.f2 = 0; fw.on = 0; dim.v = 0; hoverCase = null; }

  // ---------- the timeline, appended to the master ------------------------------------------------
  const T = {}, stops = [];
  function timeline(tl, camTo, fade, T1, V) {
    stops.length = 0;
    let t = T1.q1;
    Qs.forEach((Q, i) => {
      const st = Q.st, steps = Q.steps, n = steps.length, cases = CASE_AT[Q.k] || {};
      T[Q.k] = t;
      // the route on the map, with the question
      tl.to(st, {r: 1, duration: .9, ease: 'power1.inOut'}, t); if (i > 0) tl.to(Qs[i - 1].st, {r: 0, duration: .9, ease: 'power1.inOut'}, t);
      camTo(V.full, t, 1.0);
      fade('#qcard' + Q.qi, t + .3, t + 2.3);
      stops.push([Q.k, t + 1.2, Q.k]); t += 2.4;
      // the lift onto the track
      tl.to(st, {a: 1, duration: 1.3, ease: 'power1.inOut'}, t); camTo(RIDE, t, 1.3); t += 1.5;
      stops.push([Q.k + ':0', t, `${Q.k} · ${steps[0].label}`]);
      const caseStop = (key, t0) => { stops.push(['case:' + key + ':' + Q.k, t0 + .45, `Case · ${SHORT[key] || key}`]); return .9; };
      for (let k = 1; k < n; k++) {
        tl.to(st, {x: steps[k].x, duration: .5, ease: 'none'}, t); t += .5;
        stops.push([Q.k + ':' + k, t, `${Q.k} · ${steps[k].label}`]);
        const ck = cases[steps[k].label]; if (ck) t += caseStop(ck, t); }
      tl.to(st, {x: Q.xEnd + 420, duration: .6, ease: 'none'}, t); t += .6;
      stops.push([Q.k + ':end', t + .1, `${Q.k} · ${Q.end[0]}`]); t += .2;
      if (cases.__end) t += caseStop(cases.__end, t);
      // back to the map
      tl.to(st, {a: 0, duration: 1.1, ease: 'power1.inOut'}, t); camTo(V.full, t, 1.1); t += 1.3;
    });
    // the framework and the findings
    T.fw = t; tl.to(Qs[5].st, {r: 0, duration: .8}, t);
    camTo({p: [0, -3.2, V.FD * 1.0], t: [0, -3.2, 0]}, t, 1.0);
    tl.to(fw, {on: 1, duration: .8, ease: 'power1.inOut'}, t); tl.to(fw, {p: 1, duration: 1.8}, t + .3);
    fade('#fw1', t + .4, t + 2.8); stops.push(['fw', t + 1.8, 'Framework']); t += 2.9;
    tl.to(fw, {lines: 1, duration: 1.8}, t);
    fade('#fw2', t + .1, t + 2.9); stops.push(['fw:2', t + 1.7, 'Framework · what carries forward']); t += 3.0;
    T.find = t; tl.to(fw, {f1: 1, duration: .8}, t); camTo({p: [-5, -4.2, V.FD * .95], t: [-5, -4.2, 0]}, t, 1.2);
    fade('#fw3', t + .2, t + 2.7); stops.push(['find:1', t + 1.2, 'Finding 1']); t += 2.8;
    tl.to(fw, {f2: 1, duration: .8}, t); camTo({p: [5, -4.2, V.FD * .95], t: [5, -4.2, 0]}, t, 1.2);
    fade('#fw4', t + .2, t + 2.7); stops.push(['find:2', t + 1.2, 'Finding 2']); t += 2.8;
    // position, proposition
    T.pos = t; tl.to(dim, {v: 1, duration: .9, ease: 'power1.inOut'}, t); tl.to(fw, {on: 0, p: 0, lines: 0, f1: 0, f2: 0, duration: .9}, t);
    camTo({p: [0, 0, V.FD * 1.5], t: [0, 0, 0]}, t, 14, 'none');
    fade('#pos', t + .3, t + 2.2); stops.push(['pos', t + 1.1, 'Position']); t += 2.2;
    T.prop = t; fade('#prop', t, t + 2.2); stops.push(['prop', t + 1.0, 'Proposition']); t += 2.2;
    // the discussion: the text, then the graph rising panel by panel, then what follows
    T.disc = t; tl.to(dim, {v: 1, duration: .5}, t);
    tl.fromTo('#disc', {autoAlpha: 0}, {autoAlpha: 1, duration: .3, immediateRender: false}, t);
    const dA = document.querySelector('#disc .odd-a'), dG = document.querySelector('#disc .odd-g'), dC = document.querySelector('#disc .odd-c');
    const show = (el, t0, t1) => { if (!el) return; tl.fromTo(el, {autoAlpha: 0, y: 10}, {autoAlpha: 1, y: 0, duration: .5, ease: 'power1.out', immediateRender: false}, t0); tl.to(el, {autoAlpha: 0, y: -10, duration: .4, ease: 'power1.in'}, t1 - .4); };
    show(dA, t + .1, t + 2.4); stops.push(['disc', t + 1.2, 'Discussion']); t += 2.5;
    if (dG) { show(dG, t, t + 6.0); const panels = [...dG.querySelectorAll('g.odd-p')];
      panels.forEach(g => { const k = Number(g.dataset.panel); if (k === 0) return; gsap.set(g, {opacity: 0, y: 40}); tl.fromTo(g, {opacity: 0, y: 40}, {opacity: 1, y: 0, duration: .7, ease: 'power1.out', immediateRender: false}, t + .4 + (k - 1) * 1.15); });
      [['Frequent', 1], ['Who launches', 2], ['Regular', 3], ['Rare', 4]].forEach(([nm, k]) => stops.push(['disc:g' + k, t + .4 + (k - 1) * 1.15 + .8, 'Discussion · ' + nm])); }
    t += 6.0;
    show(dC, t, t + 2.4); stops.push(['disc:c', t + 1.1, 'Discussion · the site']); t += 2.5;
    tl.to('#disc', {autoAlpha: 0, duration: .3}, t - .3);
    // the closing note, then to be continued
    T.end = t; fade('#tbc', t, t + 2, true); stops.push(['tbc', t + .9, 'To be continued']); t += 1.8;
    T.total = t;
    return T;
  }
  function after() { fw.caseLines.set(fw.p); fw.flowLines.set(fw.lines); fw.findLines.set((fw.f1 + fw.f2) / 2); [fw.caseLines, fw.flowLines, fw.findLines].forEach(o => { o.m.material.opacity = fw.on; }); }
  return {frame, after, timeline, mul, stops, T, Qs, fw, reset, resize: () => layoutTrack(camera.aspect)};
}
})();
