// Discussion screens, three of them: the text (odd-a), the graph (odd-g), what follows (odd-c).
// The graph mirrors cases/build_disc.py: four panels on one time axis, 1957 to 2026, projected to the right.
// It is built in five groups (g.odd-p, data-panel 0 to 4) so the host can reveal them one by one.
// Public API: window.ODDiscussion.build(discussion, root)
(function () {
  'use strict';

  // colours as in cases/diagrams.py
  var LN = '#e6e8ec', MU = '#9a9ea7', SO = '#c3c6cd', DK = '#3a3c43', W = '#ffffff';
  var GOLD = '#f0b95e', SALMON = '#f29273';
  var NS = 'http://www.w3.org/2000/svg';

  // ---- small DOM helpers
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function s(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function f1(v) { return String(Math.round(v * 10) / 10); }

  // ---- the graph: viewBox 1400 x 760, the left 200 units for the panel titles
  var VW = 1400, VH = 760;
  var X0 = 240, X1 = 1190, XP = 1380;      // 1957 at X0, 2026 at X1, projected to XP
  function xr(y) { return X0 + (y - 1957) / (2026 - 1957) * (X1 - X0); }

  // one panel group: <g.odd-p><g.odd-ink> lines and dots </g><g.odd-txt> labels </g></g>
  // The ink and the text are kept apart so the pencil filter can be put on the ink alone.
  function panel(svg, idx, textHome) {
    var g = s('g', { 'class': 'odd-p', 'data-panel': idx }, svg);
    var ink = s('g', { 'class': 'odd-ink' }, g);
    var txt = s('g', { 'class': 'odd-txt' }, g);
    var p = {};
    p.T = function (x, y, str, anchor, size, fill, mono, weight) {
      var t = s('text', { x: f1(x), y: f1(y), 'text-anchor': anchor || 'start', 'font-size': size || 13, fill: fill || SO,
        'class': mono ? 'm' : 'n', 'font-weight': weight || 400 }, txt);
      t.textContent = str;
      textHome.push([t, txt]);
      return t;
    };
    p.L = function (x1, y1, x2, y2, c, w, dash, op) {
      var a = { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2), stroke: c || LN, 'stroke-width': w || 1.5, fill: 'none' };
      if (dash) a['stroke-dasharray'] = dash;
      if (op != null) a.opacity = op;
      return s('line', a, ink);
    };
    p.C = function (cx, cy, r, fill, stroke, w, dash) {
      var a = { cx: f1(cx), cy: f1(cy), r: r, fill: fill || 'none' };
      if (stroke) { a.stroke = stroke; a['stroke-width'] = w || 1.5; }
      if (dash) a['stroke-dasharray'] = dash;
      return s('circle', a, ink);
    };
    p.P = function (dPath, stroke, w, dash, fill, op) {
      var a = { d: dPath, fill: fill || 'none', stroke: stroke || 'none', 'stroke-width': w || 1.5 };
      if (dash) a['stroke-dasharray'] = dash;
      if (op != null) a.opacity = op;
      return s('path', a, ink);
    };
    p.R = function (x, y, w, hh, attrs) {
      var a = { x: f1(x), y: f1(y), width: f1(w), height: f1(hh) };
      for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) a[k] = attrs[k];
      return s('rect', a, ink);
    };
    p.D = function (cx, cy, r, fill) {   // a diamond
      var pts = f1(cx) + ',' + f1(cy - r) + ' ' + f1(cx + r) + ',' + f1(cy) + ' ' + f1(cx) + ',' + f1(cy + r) + ' ' + f1(cx - r) + ',' + f1(cy);
      return s('polygon', { points: pts, fill: fill, stroke: 'none' }, ink);
    };
    // the panel title block in the left column: title, subtitle lines (mono), tag lines
    p.labels = function (y0, title, sub, tag) {
      p.T(0, y0 + 8, title, 'start', 20, W, false, 400);
      var y = y0 + 26, i;
      for (i = 0; i < sub.length; i++) { p.T(0, y, sub[i], 'start', 12, MU, true); y += 15; }
      y += 8;
      for (i = 0; i < tag.length; i++) { p.T(0, y, tag[i], 'start', 12, SO, false); y += 15; }
    };
    p.note = function (x, y, str, anchor, fill, size) { return p.T(x, y, str, anchor || 'start', size || 13, fill || SO, false); };
    p.g = g; p.ink = ink; p.txt = txt;
    return p;
  }

  function graph(d, textHome) {
    var ALL = d.ALL, CREW = d.CREW, BEO = d.BEO, NATIONS = d.NATIONS, FIRMS = d.FIRMS;
    var svg = s('svg', { viewBox: '0 0 ' + VW + ' ' + VH, preserveAspectRatio: 'xMidYMid meet' });
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Orbital launches, who launches, crewed launches and crews beyond Earth orbit, 1957 to 2026');

    // ---- panel A: all orbital launches
    var yA0 = 70, yA1 = 250, Amax = 340;
    function ya(v) { return yA1 - (v / Amax) * (yA1 - yA0); }
    // ---- panel D: who launches, cumulative
    var yD0 = 300, yD1 = 410, Dmax = 25;
    function yd(v) { return yD1 - (v / Dmax) * (yD1 - yD0); }
    // ---- panel B: crewed launches
    var yB0 = 460, yB1 = 570, Bmax = 13;
    function yb(v) { return yB1 - (v / Bmax) * (yB1 - yB0); }
    // ---- panel C: crews beyond Earth orbit
    var yC = 640;
    // ---- the time axis
    var yE = 700;
    var y, i, v;

    // ---- group 0: the time axis, the eras, today's column
    var ax = panel(svg, 0, textHome);
    ax.R(xr(2024.5), yA0 - 14, xr(2026.5) - xr(2024.5), (yC + 22) - (yA0 - 14), { fill: DK, stroke: 'none', opacity: '.5' });
    ax.L(X1, yA0 - 14, X1, yC + 22, SO, 1.2, '6 6', '.7');
    ax.T(X1 - 8, yA0 - 26, '2025–26 · all three, at once', 'end', 12, W, true);
    ax.L(X0, yE, XP, yE, LN, 1.5);
    [1957, 1986, 2011, 2026].forEach(function (yr) { ax.L(xr(yr), yE - 8, xr(yr), yE + 8, LN, 1.5); });
    [[1957, 1986, 'Heroic space age'], [1986, 2011, 'Reckoning'], [2011, 2026, 'Now']].forEach(function (e) {
      var xm = (xr(e[0]) + xr(e[1])) / 2;
      ax.T(xm, yE + 22, e[2], 'middle', 13, SO);
      ax.T(xm, yE + 38, e[0] + '–' + e[1], 'middle', 12, MU, true);
    });
    ax.T((X1 + XP) / 2, yE + 22, 'Future', 'middle', 13, SO);
    for (y = 1960; y < 2030; y += 10) { ax.L(xr(y), yE - 4, xr(y), yE + 4, MU, 1); ax.T(xr(y), yE - 9, String(y), 'middle', 12, MU, true); }

    // ---- group 1: Frequent, orbital launches a year
    var pa = panel(svg, 1, textHome);
    pa.labels(yA0, 'Frequent', ['orbital launches a year'], ['the work: the preparers alone']);
    [100, 200, 300].forEach(function (g) { pa.L(X0, ya(g), X1, ya(g), DK, 1); pa.T(X0 - 8, ya(g) + 4, String(g), 'end', 12, MU, true); });
    pa.L(X0, yA1, X1, yA1, LN, 1.5); pa.L(X0, yA0 - 8, X0, yA1, LN, 1.5);
    var pts = [];
    for (y = 1957; y <= 2025; y++) pts.push([xr(y), ya(ALL[String(y)])]);
    var area = 'M' + f1(X0) + ',' + yA1 + ' ' + pts.map(function (p) { return 'L' + f1(p[0]) + ',' + f1(p[1]); }).join(' ') + ' L' + f1(pts[pts.length - 1][0]) + ',' + yA1 + ' Z';
    pa.P(area, 'none', 0, null, '#8a8f99', '.45');
    pa.P('M' + pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' L'), LN, 2);
    pts.forEach(function (p) { pa.C(p[0], p[1], 2.6, LN); });
    // 2026 so far, open
    pa.C(xr(2026), ya(ALL['2026']), 4.5, 'none', LN, 1.5);
    pa.T(xr(2026) + 10, ya(ALL['2026']) + 4, '2026 so far: ' + ALL['2026'], 'start', 12, MU, true);
    // projected, dashed, ending in a question
    pa.P('M' + f1(xr(2025)) + ',' + f1(ya(ALL['2025'])) + ' C' + (X1 + 60) + ',' + f1(ya(340)) + ' ' + (X1 + 100) + ',' + (yA0 + 20) + ' ' + (XP - 30) + ',' + (yA0 - 8), SO, 1.5, '6 6');
    pa.T(XP - 20, yA0 - 14, '?', 'middle', 20, SO);
    pa.note(xr(1967), ya(ALL['1967']) - 10, '1967: ' + ALL['1967'] + ', the Cold War peak', 'middle');
    pa.note(xr(2025) - 10, ya(ALL['2025']) - 4, '2025: ' + ALL['2025'] + ', one every ' + Math.round(8760 / ALL['2025']) + ' hours', 'end', W);

    // ---- group 2: Who launches, cumulative
    var pd = panel(svg, 2, textHome);
    pd.labels(yD0, 'Who launches', ['with their own rocket', 'to orbit, cumulative'], ['the parties: no longer', 'one nation’s gate']);
    [10, 20].forEach(function (g) { pd.L(X0, yd(g), X1, yd(g), DK, 1); pd.T(X0 - 8, yd(g) + 4, String(g), 'end', 12, MU, true); });
    pd.L(X0, yD1, X1, yD1, LN, 1.5); pd.L(X0, yD0 - 8, X0, yD1, LN, 1.5);
    function steps(series, col) {
      var dp = 'M' + f1(xr(series[0][0])) + ',' + yD1, cur = 0;
      series.forEach(function (r) { dp += ' L' + f1(xr(r[0])) + ',' + f1(yd(cur)) + ' L' + f1(xr(r[0])) + ',' + f1(yd(r[1])); cur = r[1]; });
      dp += ' L' + X1 + ',' + f1(yd(cur));
      pd.P(dp, col, 2);
      series.forEach(function (r) { pd.C(xr(r[0]), yd(r[1]), 3.2, col); });
      return cur;
    }
    var nEnd = steps(NATIONS, W);
    var fEnd = steps(FIRMS, SALMON);
    pd.note(xr(1957) + 8, yd(2) - 22, '1957: two countries', 'start');
    pd.note(xr(1990), yD1 + 17, '1990: the first company, Orbital Sciences', 'middle', SALMON);
    pd.note(xr(2023) - 10, yd(15) - 32, '2023: companies pass countries', 'end', SALMON);
    pd.T(X1 + 10, yd(nEnd) + 4, String(nEnd), 'start', 13, W, true);
    pd.T(X1 + 10, yd(fEnd) + 4, String(fEnd), 'start', 13, SALMON, true);

    // ---- group 3: Regular, crewed launches a year
    var pb = panel(svg, 3, textHome);
    pb.labels(yB0, 'Regular', ['crewed launches a year'], ['the rite: the same day,', 'repeated']);
    [5, 10].forEach(function (g) { pb.L(X0, yb(g), X1, yb(g), DK, 1); pb.T(X0 - 8, yb(g) + 4, String(g), 'end', 12, MU, true); });
    pb.L(X0, yB1, X1, yB1, LN, 1.5); pb.L(X0, yB0 - 8, X0, yB1, LN, 1.5);
    var bw = 9;
    for (y = 1961; y <= 2026; y++) {
      v = CREW[String(y)];
      if (v == null) continue;
      if (y === 2026) pb.R(xr(y) - bw / 2, yb(v), bw, yB1 - yb(v), { fill: 'none', stroke: GOLD, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' });
      else pb.R(xr(y) - bw / 2, yb(v), bw, yB1 - yb(v), { fill: GOLD, stroke: 'none', opacity: '.9' });
    }
    pb.note(xr(1985), yb(CREW['1985']) - 8, '1985: ' + CREW['1985'] + ' launches, 62 people', 'middle');
    pb.note(xr(2025) - 12, yb(9) - 10, '2025: ' + CREW['2025'] + ' launches, 28 people', 'end', W);

    // ---- group 4: Rare, crews beyond Earth orbit
    var pc = panel(svg, 4, textHome);
    pc.labels(yC - 36, 'Rare', ['crews beyond Earth orbit'], ['the event: the crowd comes']);
    pc.L(X0, yC, X1, yC, LN, 1.5);
    BEO.forEach(function (b) { pc.D(xr(b[0]), yC, 5, GOLD); });
    var g0 = xr(1973.3), g1 = xr(2025.9);
    pc.L(g0, yC - 16, g1, yC - 16, MU, 1.5, '5 5');
    pc.L(g0, yC - 21, g0, yC - 11, MU, 1.5); pc.L(g1, yC - 21, g1, yC - 11, MU, 1.5);
    pc.note((g0 + g1) / 2, yC - 24, 'fifty-three years without', 'middle');
    pc.note(xr(1971), yC + 22, 'Apollo 8 to 17: nine crews in five years', 'middle');
    pc.note(xr(2026.25) - 10, yC + 22, 'Artemis II, 1 April 2026', 'end', W);
    pc.C(XP - 50, yC, 6, 'none', SO, 1.5, '3 3');
    pc.T(XP - 50, yC - 12, '?', 'middle', 18, SO);

    return svg;
  }

  // sketch.js wraps everything in one <g filter> and lifts the labels to the svg root.
  // Put the five panels back as direct children of the svg, the pencil filter on each panel's ink,
  // and every label back in its own panel, so the host can animate the panels one by one.
  function regroup(svg, textHome) {
    var wrap = null, k;
    for (k = 0; k < svg.childNodes.length; k++) {
      var c = svg.childNodes[k];
      if (c.nodeType === 1 && c.tagName === 'g' && c.getAttribute('filter')) { wrap = c; break; }
    }
    if (!wrap) return;
    var filt = wrap.getAttribute('filter');
    var panels = [];
    for (k = 0; k < wrap.childNodes.length; k++) {
      var n = wrap.childNodes[k];
      if (n.nodeType === 1 && /\bodd-p\b/.test(n.getAttribute('class') || '')) panels.push(n);
    }
    panels.forEach(function (p) {
      svg.appendChild(p);
      var ink = p.querySelector('.odd-ink');
      if (ink) ink.setAttribute('filter', filt);
    });
    textHome.forEach(function (pair) { pair[1].appendChild(pair[0]); });
    if (!wrap.childNodes.length) svg.removeChild(wrap);
  }

  // ---- screens
  function hide(sec) { sec.style.opacity = '0'; sec.style.visibility = 'hidden'; return sec; }

  function screenA(d) {
    var sec = hide(h('section', 'odd-a'));
    var grid = h('div', 'odd-grid');
    var head = h('div', 'odd-head');
    head.appendChild(h('p', 'odd-eb', 'Discussion'));
    head.appendChild(h('h2', 'odd-h1', d.C1_H));
    grid.appendChild(head);
    grid.appendChild(h('p', 'odd-lead', d.C1_P1));
    var ul = h('ul', 'odd-rhy');
    (d.RHY || []).forEach(function (r) {
      var li = h('li');
      li.appendChild(h('b', null, r[0] + ':'));
      li.appendChild(document.createTextNode(' ' + r[1]));
      ul.appendChild(li);
    });
    grid.appendChild(ul);
    sec.appendChild(grid);
    return sec;
  }

  function screenG(d, textHome) {
    var sec = hide(h('section', 'odd-g'));
    var fig = h('div', 'odd-fig');
    var dg = h('div', 'dg odd-dg');
    dg.appendChild(graph(d, textHome));
    fig.appendChild(dg);
    fig.appendChild(h('p', 'odd-src', d.SRC));
    sec.appendChild(fig);
    return sec;
  }

  function screenC(d) {
    var sec = hide(h('section', 'odd-c'));
    var row = h('div', 'odd-row');
    (d.C3 || []).forEach(function (blk) {
      var col = h('div', 'odd-col');
      col.appendChild(h('h3', 'odd-h3', blk[0]));
      (blk[1] || []).forEach(function (p) { col.appendChild(h('p', 'odd-para', p)); });
      row.appendChild(col);
    });
    sec.appendChild(row);
    return sec;
  }

  function build(discussion, root) {
    if (!discussion || !root) throw new Error('ODDiscussion.build(discussion, root): both arguments are required');
    root.classList.add('odd');
    while (root.firstChild) root.removeChild(root.firstChild);
    var textHome = [];
    var a = screenA(discussion), g = screenG(discussion, textHome), c = screenC(discussion);
    root.appendChild(a);
    root.appendChild(g);
    root.appendChild(c);
    // the pencil look: sketch.js needs the SVG in the document and laid out (not display:none)
    if (typeof window.sketchSVGs === 'function' && root.isConnected !== false) {
      try { window.sketchSVGs(root); regroup(g.querySelector('svg'), textHome); }
      catch (e) { if (window.console) console.warn('ODDiscussion: sketch skipped', e); }
    }
    return { a: a, g: g, c: c };
  }

  window.ODDiscussion = { build: build };
})();
