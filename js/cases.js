/* Ordinary Departures: case panels.
   window.ODCases = { build(cases, root, opts), show(key), hide(), keys }
   build() fills the host's fixed container with one hidden .odc-panel per case;
   show(key) fades one in and hides the others; hide() hides all.
   Plain ES2019, no modules. Needs lib/rough.js and lib/sketch.js loaded first. */
(function () {
  'use strict';

  var FADE_MS = 350;
  var root = null;
  var panels = {};      // key -> panel element
  var timers = {};      // key -> hide timeout
  var current = null;   // key of the panel now shown
  var api = { keys: [] };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function block(label, text, cls) {
    var b = el('div', 'odc-blk' + (cls ? ' ' + cls : ''));
    b.appendChild(el('p', 'odc-lab', label));
    var p = el('p', 'odc-body', text);
    b.appendChild(p);
    return b;
  }

  function makePanel(c, opts) {
    var panel = el('section', 'odc-panel');
    panel.setAttribute('data-key', c.key);

    // head
    panel.appendChild(el('p', 'odc-eb', 'Case ' + c.n + ' · ' + c.q));
    panel.appendChild(el('h2', 'odc-name', c.name));
    panel.appendChild(el('p', 'odc-meta', c.meta));

    // the two images
    var imgs = el('div', 'odc-imgs');
    (c.imgs || []).forEach(function (pair) {
      var file = pair[0], caption = pair[1] || '';
      var src = opts.imgBase + file + '.jpg';
      var fig = el('figure');
      var im = el('img', 'odc-im' + (opts.onImage ? ' odc-click' : ''));
      im.src = src;
      im.alt = caption;
      im.width = 960; im.height = 720;
      im.loading = 'eager';   // hidden panels: fetch now so the fade shows photos, not empty boxes
      im.decoding = 'async';
      if (opts.onImage) {
        im.addEventListener('click', function (e) {
          e.preventDefault();
          opts.onImage(src, caption);
        });
      }
      fig.appendChild(im);
      fig.appendChild(el('figcaption', null, caption));
      imgs.appendChild(fig);
    });
    panel.appendChild(imgs);

    // the sketch (clean svg from the data; sketch.js redraws it in pencil)
    var dg = el('div', 'dg');
    dg.innerHTML = c.sketch_svg || '';
    panel.appendChild(dg);

    // the four texts in two columns
    var txt = el('div', 'odc-txt');
    var left = el('div', 'odc-col');
    left.appendChild(block('Theory', c.theory));
    left.appendChild(block('Method', c.method));
    var right = el('div', 'odc-col');
    right.appendChild(block('Outcome', c.outcome));
    right.appendChild(block('Takeaway', c.take, 'odc-take'));
    txt.appendChild(left);
    txt.appendChild(right);
    panel.appendChild(txt);

    // the source line
    panel.appendChild(el('p', 'odc-src', c.src));

    return panel;
  }

  function onWheel(e) {
    // the page behind must not scroll while the pointer is over a shown panel;
    // with no panel shown the wheel passes through to the scene
    if (!current || !panels[current]) return;
    e.preventDefault();
    var panel = panels[current];
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16;              // lines
    else if (e.deltaMode === 2) d *= panel.clientHeight; // pages
    panel.scrollTop += d;
  }

  function build(cases, hostRoot, opts) {
    opts = opts || {};
    if (!opts.imgBase) opts.imgBase = 'img/cases/';
    root = hostRoot;
    root.classList.add('odc');
    panels = {};
    timers = {};
    current = null;
    api.keys = [];

    while (root.firstChild) root.removeChild(root.firstChild);

    cases.forEach(function (c) {
      var panel = makePanel(c, opts);
      panels[c.key] = panel;
      api.keys.push(c.key);
      root.appendChild(panel);
    });

    // sketch while the panels are laid out (visibility:hidden, not display:none),
    // so getBBox() inside sketch.js sees real sizes; then hide them for good.
    if (typeof window.sketchSVGs === 'function') {
      try { window.sketchSVGs(root); } catch (err) { /* keep the clean svg */ }
    }
    api.keys.forEach(function (k) { panels[k].hidden = true; });

    root.removeEventListener('wheel', onWheel);
    root.addEventListener('wheel', onWheel, { passive: false });
    return api;
  }

  function hideOne(k, now) {
    var panel = panels[k];
    if (!panel) return;
    panel.classList.remove('on');
    if (timers[k]) clearTimeout(timers[k]);
    if (now) { panel.hidden = true; timers[k] = null; return; }
    timers[k] = setTimeout(function () {
      panel.hidden = true;
      timers[k] = null;
    }, FADE_MS);
  }

  function show(key) {
    var panel = panels[key];
    if (!panel) return;
    api.keys.forEach(function (k) { if (k !== key) hideOne(k); });
    current = key;
    if (panel.classList.contains('on')) return;
    if (timers[key]) { clearTimeout(timers[key]); timers[key] = null; }
    panel.hidden = false;
    panel.scrollTop = 0;
    void panel.offsetWidth;   // let the browser see it before the fade starts
    panel.classList.add('on');
  }

  function hide() {
    current = null;
    api.keys.forEach(function (k) { hideOne(k); });
  }

  api.build = build;
  api.show = show;
  api.hide = hide;
  window.ODCases = api;
})();
