// Sahne 02 görselleri: saf Canvas 2D. Aynı çizim hem masaüstü <canvas> hem VR panel dokusu için kullanılır.
// TARAF: hastanın SAĞ gözü ekranın SOLUNDA, hastanın SOL gözü ekranın SAĞINDA (karşıdan görünüm).

const FONT = '"Segoe UI", system-ui, Arial, sans-serif';
const font = (g, size, weight = 400, style = '') => { g.font = `${style} ${weight} ${size}px ${FONT}`; };
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function text(g, s, x, y, { size = 20, color = '#fff', weight = 400, align = 'left', base = 'alphabetic', style = '' } = {}) {
  font(g, size, weight, style); g.fillStyle = color; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y); g.textAlign = 'left';
}

// ---- iki göz (karşıdan) ----
// pup: pupilla ölçeği (1 = loş ortam çapı). Her iki gözde AYNI değer çizilir (tek animasyon durumu).
// lit: null | 'sol' | 'sag' (hastanın tarafı). occludeSol: hastanın sol gözü kapatıcıyla örtülü.
function eyes(g, cx, cy, u, { pup = 1, lit = null, occludeSol = 0, labels = true, labelSize } = {}) {
  const pos = { sag: cx - 1.75 * u, sol: cx + 1.75 * u }; // sağ göz ekranın solunda
  for (const side of ['sag', 'sol']) {
    const x = pos[side];
    // göz çevresi deri
    g.fillStyle = '#7a4f3a'; g.beginPath(); g.ellipse(x, cy, 1.38 * u, 0.92 * u, 0, 0, Math.PI * 2); g.fill();
    // sklera
    g.fillStyle = '#b9aea8'; g.beginPath(); g.ellipse(x, cy, 1.0 * u, 0.58 * u, 0, 0, Math.PI * 2); g.fill();
    // iris (iki gözde aynı renk)
    g.save(); g.beginPath(); g.ellipse(x, cy, 1.0 * u, 0.58 * u, 0, 0, Math.PI * 2); g.clip();
    const gr = g.createRadialGradient(x, cy, u * 0.05, x, cy, u * 0.5);
    gr.addColorStop(0, '#7a4a25'); gr.addColorStop(1, '#3d230f');
    g.fillStyle = gr; g.beginPath(); g.arc(x, cy, 0.5 * u, 0, Math.PI * 2); g.fill();
    // pupilla
    g.fillStyle = '#050505'; g.beginPath(); g.arc(x, cy, 0.5 * u * 0.55 * pup, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x - 0.16 * u, cy - 0.16 * u, 0.06 * u, 0, Math.PI * 2); g.fill();
    g.restore();
    // üst kapak çizgisi
    g.strokeStyle = '#2a1812'; g.lineWidth = Math.max(2, u * 0.05);
    g.beginPath(); g.ellipse(x, cy, 1.0 * u, 0.58 * u, 0, Math.PI, Math.PI * 2); g.stroke();

    // ışık hedefi: aydınlatılan göze ışın + halka
    if (lit === side) {
      const gr2 = g.createLinearGradient(x, cy - 2.7 * u, x, cy);
      gr2.addColorStop(0, 'rgba(255,236,150,0)'); gr2.addColorStop(1, 'rgba(255,236,150,.5)');
      g.fillStyle = gr2; g.beginPath(); g.moveTo(x - 0.1 * u, cy - 2.7 * u); g.lineTo(x + 0.1 * u, cy - 2.7 * u); g.lineTo(x + 0.95 * u, cy); g.lineTo(x - 0.95 * u, cy); g.closePath(); g.fill();
      g.strokeStyle = '#ffe58a'; g.lineWidth = Math.max(3, u * 0.07); g.beginPath(); g.arc(x, cy, 1.12 * u, 0, Math.PI * 2); g.stroke();
      // el feneri
      g.fillStyle = '#c9ced6'; g.fillRect(x - 0.13 * u, cy - 3.0 * u, 0.26 * u, 0.55 * u);
      g.fillStyle = '#ffe58a'; g.fillRect(x - 0.17 * u, cy - 2.5 * u, 0.34 * u, 0.1 * u);
    }
    if (labels) {
      const sz = labelSize || Math.max(14, u * 0.3);
      text(g, side === 'sag' ? 'Hastanın sağı' : 'Hastanın solu', x, cy + 1.2 * u + sz, { size: sz, weight: 700, align: 'center', color: lit === side ? '#ffe58a' : '#dbe6ff' });
    }
  }
  if (occludeSol > 0) {
    const x = pos.sol, k = clamp01(occludeSol);
    const ox = x + (1 - k) * 2.6 * u; // sağdan kayarak gelir
    g.fillStyle = '#20252e'; g.strokeStyle = '#8f9bb0'; g.lineWidth = Math.max(2, u * 0.04);
    g.beginPath(); g.roundRect(ox - 1.25 * u, cy - 0.95 * u, 2.5 * u, 1.9 * u, 0.25 * u); g.fill(); g.stroke();
    if (k > 0.9) text(g, 'Kapalı', ox, cy + 0.12 * u, { size: Math.max(12, u * 0.3), weight: 700, align: 'center', color: '#c9d1de' });
  }
  return pos;
}

// ---- görme keskinliği ----
function snellen(g, w, h, v, data) {
  const rows = data.gorme.satirlar, p = v.p;
  // eşel kartı
  const bx = w * 0.04, by = h * 0.06, bw = w * 0.5, bh = h * 0.82;
  g.fillStyle = '#000'; g.beginPath(); g.roundRect(bx, by, bw, bh, 12); g.fill(); g.strokeStyle = '#22345c'; g.lineWidth = 2; g.stroke();
  const maxSz = bh * 0.2; let y = by + bh * 0.04;
  const target = data.gorme.okunanSatir;
  const scan = v.finished ? target : Math.min(Math.floor(p * 4), target + 2);
  rows.forEach((r, i) => {
    const sz = Math.max(7, maxSz * r.boy), rh = sz * 1.45;
    if (i === target && v.finished) { g.fillStyle = 'rgba(46,157,91,.25)'; g.fillRect(bx + 6, y - rh * 0.1, bw - 12, rh * 1.0); }
    else if (!v.finished && i === scan) { g.fillStyle = 'rgba(0,112,192,.2)'; g.fillRect(bx + 6, y - rh * 0.1, bw - 12, rh * 1.0); }
    const dim = v.finished && i > target;
    text(g, r.harf, bx + bw * 0.5, y + sz, { size: sz, weight: 700, align: 'center', color: dim ? '#4a5568' : '#ffffff' });
    text(g, r.oran, bx + bw - 10, y + Math.max(10, sz * 0.55), { size: Math.max(10, h * 0.036), color: '#8f9bb0', align: 'right', weight: 600 });
    y += rh;
  });
  // göz çifti + kapatıcı
  const u = Math.min(w * 0.068, h * 0.13);
  eyes(g, w * 0.745, h * 0.34, u, { occludeSol: clamp01(p * 3), labels: true, labelSize: Math.max(13, u * 0.28) });
  const msg = v.finished ? 'Sağ göz test edildi' : 'Sağ göz test ediliyor…';
  text(g, msg, w * 0.745, h * 0.62, { size: Math.max(15, h * 0.05), weight: 700, align: 'center', color: v.finished ? '#7fe0a8' : '#c9d1de' });
  if (v.finished) text(g, 'Okunan en küçük satır: ' + rows[target].oran, w * 0.745, h * 0.71, { size: Math.max(14, h * 0.045), align: 'center', color: '#fff', weight: 600 });
  if (!v.finished) { g.fillStyle = '#22345c'; g.fillRect(w * 0.58, h * 0.78, w * 0.4, 6); g.fillStyle = '#7cc4ff'; g.fillRect(w * 0.58, h * 0.78, w * 0.4 * p, 6); }
}

// ---- renkli görme ----
function colorView(g, w, h, v, data) {
  const c = data.renk, p = v.p;
  const target = (x, y, r, fill, label) => {
    g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.stroke();
    text(g, label, x, y + r + Math.max(18, h * 0.07), { size: Math.max(14, h * 0.05), weight: 700, align: 'center' });
  };
  const R = Math.min(w, h) * 0.2, cy = h * 0.42;
  if (!v.started) {
    target(w / 2, cy, R * 1.1, c.doygun, 'Kırmızı hedef');
  } else if (!v.finished && p < 0.33) {
    target(w / 2, cy, R * 1.1, c.soluk, 'Hastanın sağ gözüyle');
  } else if (!v.finished && p < 0.66) {
    target(w / 2, cy, R * 1.1, c.doygun, 'Hastanın sol gözüyle');
  } else {
    target(w * 0.3, cy, R, c.soluk, 'Hastanın sağı');
    target(w * 0.7, cy, R, c.doygun, 'Hastanın solu');
  }
  text(g, c.gorselAltyazi, w / 2, h * 0.94, { size: Math.max(14, h * 0.05), align: 'center', color: '#c9d1de', style: 'italic' });
}

// ---- pupilla ----
function pupils(g, w, h, v, data) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h); // loş ortam
  const u = Math.min(w * 0.14, h * 0.26);
  eyes(g, w / 2, h * 0.5, u, { pup: v.size, lit: v.lit, labelSize: Math.max(15, u * 0.3) });
  const info = v.lit ? (v.lit === 'sol' ? 'Işık: hastanın solunda' : 'Işık: hastanın sağında') : 'Ortam loş · hasta uzağa bakıyor';
  text(g, info, w / 2, h * 0.09, { size: Math.max(15, h * 0.055), weight: 700, align: 'center', color: v.lit ? '#ffe58a' : '#8f9bb0', base: 'middle' });
  text(g, data.pupilla.gorselAltyazi, w / 2, h * 0.96, { size: Math.max(13, h * 0.042), align: 'center', color: '#8f9bb0', style: 'italic' });
}

// ---- fundus (şema): sağ göz; disk nazalde (ekranın sağında), makula temporalde (solunda) ----
function fundus(g, w, h, data) {
  const R = Math.min(w, h) * 0.42, cx = w / 2, cy = h * 0.5;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
  const bg = g.createRadialGradient(cx - R * 0.2, cy, R * 0.1, cx, cy, R);
  bg.addColorStop(0, '#d2643a'); bg.addColorStop(0.7, '#b04424'); bg.addColorStop(1, '#6a210f');
  g.fillStyle = bg; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  const dx = cx + R * 0.34, dy = cy - R * 0.03; // optik disk
  // damarlar: diskten üst ve alt arkuat dallar temporale
  g.lineCap = 'round';
  const vessel = (pts, wd, col) => { g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); g.moveTo(...pts[0]); g.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]); g.stroke(); };
  for (const sgn of [-1, 1]) {
    vessel([[dx, dy], [dx - R * 0.15, dy + sgn * R * 0.35], [dx - R * 0.55, dy + sgn * R * 0.45], [cx - R * 0.45, cy + sgn * R * 0.12]], R * 0.028, '#7a1010');
    vessel([[dx, dy], [dx - R * 0.05, dy + sgn * R * 0.45], [dx - R * 0.3, dy + sgn * R * 0.75], [cx - R * 0.15, cy + sgn * R * 0.8]], R * 0.02, '#8a1818');
    vessel([[dx, dy], [dx + R * 0.1, dy + sgn * R * 0.3], [dx + R * 0.25, dy + sgn * R * 0.55], [dx + R * 0.3, dy + sgn * R * 0.8]], R * 0.018, '#8a1818');
  }
  // makula (temporal) + fovea
  const mx = cx - R * 0.3, my = cy + R * 0.03;
  const mg = g.createRadialGradient(mx, my, 1, mx, my, R * 0.16); mg.addColorStop(0, 'rgba(70,15,5,.75)'); mg.addColorStop(1, 'rgba(70,15,5,0)');
  g.fillStyle = mg; g.beginPath(); g.arc(mx, my, R * 0.16, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e0a070'; g.beginPath(); g.arc(mx, my, R * 0.015, 0, Math.PI * 2); g.fill();
  // optik disk: net sınırlı, soluk pembe-sarı, santral çukur
  g.fillStyle = '#f0c98f'; g.beginPath(); g.ellipse(dx, dy, R * 0.115, R * 0.13, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(120,50,20,.7)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#f8e3c0'; g.beginPath(); g.ellipse(dx - R * 0.01, dy, R * 0.045, R * 0.055, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  g.strokeStyle = '#222'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  // etiketler
  const sz = Math.max(13, h * 0.05);
  const lab = (s, x, y, tx, ty, align) => { font(g, sz, 700); const tw = g.measureText(s).width + 12; tx = align === 'right' ? Math.max(tx, tw + 4) : Math.min(tx, w - tw - 4); g.strokeStyle = '#7cc4ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(tx, ty); g.stroke(); text(g, s, tx + (align === 'right' ? -6 : 6), ty, { size: sz, weight: 700, align, base: 'middle', color: '#7cc4ff' }); };
  lab('Makula (temporal)', mx, my, w * 0.02 + 6 + sz * 7, h * 0.12, 'right');
  lab('Optik disk (nazal)', dx, dy, w * 0.98 - sz * 7.5, h * 0.12, 'left');
  text(g, data.fundus.gorselAltyazi, w / 2, h * 0.975, { size: Math.max(13, h * 0.043), align: 'center', color: '#c9d1de', style: 'italic' });
  text(g, 'Hastanın sağ gözü', w / 2, h * 0.04, { size: sz, weight: 700, align: 'center', base: 'middle', color: '#dbe6ff' });
}

// Ana giriş: v = exam.view().visual
export function drawVisual(g, w, h, v, data) {
  g.save();
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  if (!v) { text(g, 'Muayene görünümü — bir işlem seçin', w / 2, h / 2, { size: Math.max(16, h * 0.06), align: 'center', color: '#8f9bb0', base: 'middle' }); g.restore(); return; }
  if (v.kind === 'gorme') snellen(g, w, h, v, data);
  else if (v.kind === 'renk') colorView(g, w, h, v, data);
  else if (v.kind === 'pupilla') pupils(g, w, h, v, data);
  else if (v.kind === 'fundus') fundus(g, w, h, data);
  g.restore();
}

// ---- Sahne 03: OKB öğretici şeması (Serum | BOS sütunları) ----
const OKB_BANDS = {
  1: { serum: [], bos: [] },
  2: { serum: [], bos: [0.22, 0.48, 0.7] },
  3: { serum: [0.3, 0.55], bos: [0.18, 0.3, 0.42, 0.55, 0.74] },
  4: { serum: [0.2, 0.36, 0.52, 0.68], bos: [0.2, 0.36, 0.52, 0.68] },
  5: { serum: [0.38, 0.46], bos: [0.38, 0.46] },
};
export function drawOkb(g, w, h, tip, etiket) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const lw = w * 0.28, top = h * 0.2, lh = h * 0.62, cols = [[w * 0.2, 'Serum', 'serum'], [w * 0.56, 'BOS', 'bos']];
  const spec = OKB_BANDS[tip] || OKB_BANDS[1];
  for (const [x, name, key] of cols) {
    g.strokeStyle = '#3a5288'; g.lineWidth = 2; g.beginPath(); g.roundRect(x, top, lw, lh, 10); g.stroke();
    text(g, name, x + lw / 2, top - h * 0.05, { size: Math.max(14, h * 0.07), weight: 700, align: 'center', color: '#dbe6ff' });
    for (const p of spec[key]) {
      const common = key === 'bos' && spec.serum.includes(p), mono = tip === 5;
      g.fillStyle = key === 'bos' && !spec.serum.includes(p) ? '#ffb347' : '#9fc4ff';
      g.fillRect(x + lw * 0.12, top + lh * p, lw * 0.76, Math.max(5, lh * (mono ? 0.05 : 0.035)));
      void common;
    }
  }
  text(g, `Tip ${tip}`, w / 2, h * 0.07, { size: Math.max(16, h * 0.075), weight: 700, align: 'center', color: '#fff', base: 'middle' });
  text(g, 'Turuncu: yalnız BOS’ta görülen bant', w / 2, h * 0.9, { size: Math.max(13, h * 0.045), align: 'center', color: '#ffb347' });
  text(g, etiket, w / 2, h * 0.965, { size: Math.max(13, h * 0.045), align: 'center', color: '#c9d1de', style: 'italic' });
}

// ---- IgG indeksi formülü: kesirler okunacak biçimde ----
export function drawFormula(g, w, h, f) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const fs = Math.max(16, Math.min(h * 0.17, w * 0.045)), cy = h * 0.5, bar = (x, wd) => { g.fillStyle = '#fff'; g.fillRect(x, cy - 1.5, wd, 3); };
  font(g, fs, 700); const frac = (x, up, dn) => { font(g, fs, 600); const wd = Math.max(g.measureText(up).width, g.measureText(dn).width) + fs * 0.4; text(g, up, x + wd / 2, cy - fs * 0.35, { size: fs, weight: 600, align: 'center' }); bar(x, wd); text(g, dn, x + wd / 2, cy + fs * 1.05, { size: fs, weight: 600, align: 'center' }); return wd; };
  font(g, fs, 700); const lw = g.measureText(f.sol + ' =').width;
  font(g, fs, 600); const w1 = Math.max(g.measureText(f.ust1).width, g.measureText(f.alt1).width) + fs * 0.4, w2 = Math.max(g.measureText(f.ust2).width, g.measureText(f.alt2).width) + fs * 0.4, gap = fs * 0.5, divw = fs;
  const total = lw + gap + w1 + gap + divw + gap + w2; let x = (w - total) / 2;
  text(g, f.sol + ' =', x, cy + fs * 0.35, { size: fs, weight: 700, color: '#7cc4ff' }); x += lw + gap;
  x += frac(x, f.ust1, f.alt1) + gap; text(g, '÷', x + divw / 2, cy + fs * 0.35, { size: fs, weight: 700, align: 'center' }); x += divw + gap; frac(x, f.ust2, f.alt2);
}
