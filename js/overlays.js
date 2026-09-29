/* Ordinary Departures: the dictionary and the references pages.
   Plain ES2019, no modules. Assigns one global: window.ODOverlays.

   window.ODOverlays.build({
     terms, events, refs,
     eraName(era)  -> string,
     tierName(tier) -> string,
     personName(person) -> string,
     openTerm(id, kind),     (accepted, not used: definitions open inline now)
     termOpen() -> boolean   (optional: is the host's own term overlay open?
                              default checks for "#ov.on")
   });
   window.ODOverlays.openDictionary();
   window.ODOverlays.openReferences();
   window.ODOverlays.close();
   window.ODOverlays.isOpen();  // true or false

   Both pages are appended to body, hidden until "on".
   Dictionary: one dense text. Every term is span.odo-t[data-id][data-kind];
   a click toggles span.odo-d (the definition) right after it.
*/
(function () {
  'use strict';

  var O = {};          // options given to build()
  var dict = null;     // .odo-dict element
  var refs = null;     // .odo-refs element
  var open = null;     // the page that is open, or null
  var byId = {};       // 'term:id' / 'event:id' -> {kind, src}
  var built = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // the print's key(): sort by label ignoring leading punctuation
  function key(t) {
    return String(t.label || '').replace(/^[^A-Za-z0-9À-ž]+/, '').toLowerCase();
  }

  function initial(t) {
    var k = key(t);
    var L = k.charAt(0).toUpperCase();
    if (!L) return '#';
    if (/[0-9]/.test(L)) return '#';
    if (L.normalize) L = L.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return L.charAt(0) || '#';
  }

  function call(fn, a, b) {
    return typeof fn === 'function' ? fn(a, b) : '';
  }

  function hostTermOpen() {
    if (typeof O.termOpen === 'function') { try { return !!O.termOpen(); } catch (e) { return false; } }
    var ov = document.getElementById('ov');
    return !!(ov && ov.classList.contains('on'));
  }

  // ---- page shell shared by both: top bar, then the body
  function shell(cls, name) {
    var el = document.createElement('div');
    el.className = 'odo ' + cls;
    el.setAttribute('tabindex', '-1');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', name);
    el.innerHTML =
      '<div class="odo-bar">' +
        '<span class="odo-name">' + esc(name) + '</span>' +
        '<span class="odo-esc" role="button" tabindex="0">Esc · close</span>' +
      '</div>' +
      '<div class="odo-in"></div>';

    var escEl = el.querySelector('.odo-esc');
    escEl.addEventListener('click', function (e) { e.preventDefault(); close(); });
    escEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); close(); }
    });

    // the wheel scrolls this page only; when nothing can scroll, nothing moves
    el.addEventListener('wheel', function (e) {
      e.stopPropagation();
      if (el.scrollHeight <= el.clientHeight + 1) e.preventDefault();
    }, {passive: false});
    el.addEventListener('touchmove', function (e) { e.stopPropagation(); }, {passive: true});

    return el;
  }

  // ---- dictionary: one dense text, letters in flow, definitions open inline
  function buildDictionary() {
    var el = shell('odo-dict', 'Dictionary');
    var body = el.querySelector('.odo-in');

    var items = [];
    byId = {};
    (O.terms || []).forEach(function (t) { items.push({kind: 'term', src: t}); });
    (O.events || []).forEach(function (ev) { items.push({kind: 'event', src: ev}); });
    items.sort(function (a, b) {
      var ka = key(a.src), kb = key(b.src);
      var c = ka.localeCompare(kb);
      return c !== 0 ? c : String(a.src.label || '').localeCompare(String(b.src.label || ''));
    });

    var text = document.createElement('div');
    text.className = 'odo-text';
    var html = '', cur = '';
    items.forEach(function (it, i) {
      var t = it.src;
      var L = initial(t);
      if (L !== cur) {
        cur = L;
        html += '<span class="odo-l"><span class="odo-lc">' + esc(L) + '</span><span class="odo-lr"></span></span>';
      } else if (i > 0) {
        html += '<span class="odo-dot">·</span><wbr>';
      }
      var name = it.kind === 'event' ? (t.txt || t.label) : t.label;
      byId[it.kind + ':' + t.id] = it;
      html += '<span class="odo-t" data-id="' + esc(t.id) + '" data-kind="' + it.kind + '" role="button" tabindex="0">' + esc(name) + '</span>';
    });
    text.innerHTML = html;
    body.appendChild(text);

    function toggle(n) {
      if (!n.classList.contains('open')) { text.querySelectorAll('.odo-t.open').forEach(function (o) { if (o !== n) toggle(o); }); }
      var id = n.getAttribute('data-id'), kind = n.getAttribute('data-kind');
      var next = n.nextSibling;
      if (n.classList.contains('open')) {
        n.classList.remove('open');
        if (next && next.classList && next.classList.contains('odo-d')) next.parentNode.removeChild(next);
        return;
      }
      var it = byId[kind + ':' + id];
      if (!it) return;
      var t = it.src;
      var meta = kind === 'event'
        ? 'Event · ' + call(O.eraName, t.era)
        : [call(O.eraName, t.era), call(O.tierName, t.tier), call(O.personName, t.person)].filter(Boolean).join(' · ');
      var d = document.createElement('span');
      d.className = 'odo-d';
      d.innerHTML =
        '<span class="odo-m">' + esc(meta) + '</span>' +
        '<span class="odo-def">' + esc(t.d) + '</span>' +
        (t.src ? '<span class="odo-s">' + esc(t.src) + '</span>' : '');
      n.classList.add('open');
      n.parentNode.insertBefore(d, next);
    }

    function termAt(target) {
      var n = target;
      while (n && n !== text && !(n.classList && n.classList.contains('odo-t'))) n = n.parentNode;
      return n && n !== text ? n : null;
    }

    text.addEventListener('click', function (e) {
      var n = termAt(e.target);
      if (!n) return;
      e.preventDefault();
      e.stopPropagation();
      toggle(n);
    });
    text.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var n = termAt(e.target);
      if (!n) return;
      e.preventDefault();
      toggle(n);
    });

    return el;
  }

  // ---- references: the entries in dense columns
  function buildReferences() {
    var el = shell('odo-refs', 'References');
    var body = el.querySelector('.odo-in');
    var list = document.createElement('div');
    list.className = 'odo-list';
    var html = '';
    var fmt = function (r) { var re = /\. /g, m; while ((m = re.exec(r))) { var head = r.slice(0, m.index), last = head.split(/[\s,]+/).pop() || ''; if (last.replace(/\W/g, '').length > 1 && head.length < 70) return '<b>' + esc(head) + '.</b> ' + esc(r.slice(m.index + 2)); } return esc(r); };
    var covers = O.covers || {};
    (O.refs || []).forEach(function (r, i) { var c = covers[String(i + 1)];
      html += c ? '<p class="odo-bk"><img src="' + esc(c) + '" alt="" loading="lazy"><span class="odo-e"><span class="odo-n">' + (i + 1) + '</span>' + fmt(r) + '</span></p>'
               : '<p><span class="odo-n">' + (i + 1) + '</span>' + fmt(r) + '</p>'; });
    list.innerHTML = html;
    body.appendChild(list);
    return el;
  }

  // ---- keys: while a page is open, Escape closes it and nothing reaches the host
  function onKey(e) {
    if (!open) return;
    if (hostTermOpen()) return;              // the host's term overlay sits above; let it handle keys
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    e.stopPropagation();
  }

  // ---- open / close
  function show(el) {
    if (!built) return;
    if (open && open !== el) { open.classList.remove('on'); }
    open = el;
    el.classList.add('on');
    el.scrollTop = 0;
    setTimeout(function () {
      if (open !== el) return;
      try { el.focus({preventScroll: true}); } catch (err) { /* focus is a courtesy */ }
    }, 30);
  }

  function close() {
    if (!open) return;
    var el = open;
    open = null;
    el.classList.remove('on');
    var a = document.activeElement;
    if (a && el.contains(a)) { try { a.blur(); } catch (err) { /* ignore */ } }
  }

  function build(opts) {
    O = opts || {};
    // rebuild cleanly if called twice
    if (dict && dict.parentNode) dict.parentNode.removeChild(dict);
    if (refs && refs.parentNode) refs.parentNode.removeChild(refs);
    if (built) window.removeEventListener('keydown', onKey, true);
    open = null;
    dict = buildDictionary();
    refs = buildReferences();
    document.body.appendChild(dict);
    document.body.appendChild(refs);
    window.addEventListener('keydown', onKey, true);
    built = true;
    return window.ODOverlays;
  }

  window.ODOverlays = {
    build: build,
    openDictionary: function () { show(dict); },
    openReferences: function () { show(refs); },
    close: close,
    isOpen: function () { return !!open; }
  };
})();
