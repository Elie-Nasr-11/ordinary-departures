// Turns the clean case diagrams into hand sketches: every line, box, circle and path is
// redrawn with rough.js with a graphite grain; labels keep the normal type.
(function () {
  let s = 7, counter = 0;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const A = (el, k, d = 0) => parseFloat(el.getAttribute(k) ?? d);
  // sketch(svg): redraw one clean SVG as a pencil sketch. Safe to call on SVGs added later:
  // window.sketchSVGs(root) processes every unsketched `.dg svg` under root (or the document).
  const sketch = (svg, si) => {
    const rc = rough.svg(svg);
    [...svg.querySelectorAll('line,rect,circle,path,polygon,polyline')].forEach((el, i) => {
      const stroke = el.getAttribute('stroke') || 'none';
      const fill = el.getAttribute('fill');
      const sw = A(el, 'stroke-width', 1.5);
      const dash = el.getAttribute('stroke-dasharray');
      const bb = el.getBBox();
      const small = Math.max(bb.width, bb.height) < 40;
      const o = { seed: 1 + si * 211 + i, roughness: small ? 0.55 : 1.05, bowing: small ? 0.6 : 1.4,
                  stroke: stroke, strokeWidth: Math.max(0.9, sw * 0.62), disableMultiStroke: false };
      if (dash) { o.strokeLineDash = dash.split(/[ ,]+/).map(Number); o.disableMultiStroke = true; }
      if (fill && fill !== 'none') {
        o.fill = fill;
        if (el.tagName === 'circle' && A(el, 'r') <= 12) { o.fillStyle = 'hachure'; o.hachureGap = 1.7; o.fillWeight = 0.7; o.hachureAngle = -50 + rnd() * 30; o.roughness = 0.9; if (stroke === 'none') { o.stroke = fill; o.strokeWidth = 0.8; } }
        else { o.fillStyle = 'hachure'; o.hachureGap = 5; o.hachureAngle = -41; o.fillWeight = 0.8; if (stroke === 'none') o.stroke = 'none'; }
      }
      let n;
      switch (el.tagName) {
        case 'line': n = rc.line(A(el, 'x1'), A(el, 'y1'), A(el, 'x2'), A(el, 'y2'), o); break;
        case 'rect': n = rc.rectangle(A(el, 'x'), A(el, 'y'), A(el, 'width'), A(el, 'height'), o); break;
        case 'circle': n = rc.circle(A(el, 'cx'), A(el, 'cy'), 2 * A(el, 'r'), o); break;
        case 'path': n = rc.path(el.getAttribute('d'), o); break;
        case 'polygon':
        case 'polyline': {
          const pts = el.getAttribute('points').trim().split(/\s+/).map(p => p.split(',').map(Number));
          n = el.tagName === 'polygon' ? rc.polygon(pts, o) : rc.linearPath(pts, o); break;
        }
      }
      const op = el.getAttribute('opacity');
      if (op) n.setAttribute('opacity', op);
      n.setAttribute('stroke-linecap', 'round');
      el.replaceWith(n);
    });
    // graphite grain: noise eats into every stroke and letter, with a slight wobble
    const NS = 'http://www.w3.org/2000/svg', id = 'pencil' + si;
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `<filter id="${id}" x="-3%" y="-8%" width="106%" height="116%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="1.35" numOctaves="2" seed="${3 + si}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.5" result="g"/>
      <feComposite in="SourceGraphic" in2="g" operator="in" result="p"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${9 + si}" result="w"/>
      <feDisplacementMap in="p" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('filter', `url(#${id})`);
    g.setAttribute("opacity", "1");
    // lines and dots get the pencil grain; labels stay in the sheet's normal type, crisp, on top
    const texts = [...svg.querySelectorAll('text')];
    while (svg.firstChild) g.appendChild(svg.firstChild);
    svg.appendChild(defs); svg.appendChild(g);
    texts.forEach(t => svg.appendChild(t));
  };
  window.sketchSVGs = (root) => { [...(root || document).querySelectorAll('.dg svg')].forEach(svg => { if (svg.dataset.sk) return; svg.dataset.sk = '1'; sketch(svg, counter++); }); };
  window.sketchSVGs(document);
  document.body.dataset.sketched = '1';
})();
