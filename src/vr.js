// WebXR (Meta Quest 3) sahnesi. Masaüstüyle AYNI store'u kullanır; kendi durumu yoktur.
// Video yüzeyi, metin ve düğmeler sahnedeki canvas dokulu panellerdir (HTML katmanına bağımlı değil).
import * as THREE from 'three';
import { drawVisual } from './visuals.js';
import { createS3Panels } from './vr-s3.js';

const PPM = 800; // panel dokusu: metre başına piksel
const C = { bg: '#000000', line: '#22345c', navy: '#002060', blue: '#0070C0', red: '#C00000',
  text: '#ffffff', muted: '#c9d1de', dim: '#8f9bb0', ok: '#2e9d5b', warn: '#d99a00', focus: '#7cc4ff' };
const FONT = '"Segoe UI", system-ui, Arial, sans-serif';

class CanvasPanel {
  constructor(name, wM, hM, drawFn) {
    this.name = name; this.w = Math.round(wM * PPM); this.h = Math.round(hM * PPM);
    this.canvas = document.createElement('canvas'); this.canvas.width = this.w; this.canvas.height = this.h;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true }));
    this.mesh.userData.panel = this;
    this.drawFn = drawFn; this.rects = []; this.dirty = true;
  }
  redraw(hoverId) {
    const g = this.ctx; g.clearRect(0, 0, this.w, this.h); this.rects = [];
    const ui = makeUI(g, this, hoverId);
    this.drawFn(ui, g, this.w, this.h);
    this.tex.needsUpdate = true; this.dirty = false;
  }
  hit(uv) {
    const x = uv.x * this.w, y = (1 - uv.y) * this.h;
    const r = this.rects.find((q) => !q.disabled && x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
    return r ? { ...r, fx: (x - r.x) / r.w } : null;
  }
}

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// Çizim yardımcıları: metin kaydırma, düğme (tıklanabilir dikdörtgen kaydı)
function makeUI(g, panel, hoverId) {
  const ui = {
    g, panel,
    bg(border = C.line) { rr(g, 2, 2, panel.w - 4, panel.h - 4, 26); g.fillStyle = C.bg; g.fill(); g.lineWidth = 4; g.strokeStyle = border; g.stroke(); },
    wrap(text, x, y, maxW, size, color, weight = 400, lh = 1.35, style = '') {
      g.font = `${style} ${weight} ${size}px ${FONT}`; g.fillStyle = color; g.textBaseline = 'top';
      const words = text.split(' '); let line = '', yy = y;
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += size * lh; } else line = t;
      }
      if (line) { g.fillText(line, x, yy); yy += size * lh; }
      return yy; // sonraki satırın y'si
    },
    height(text, maxW, size, weight = 400, lh = 1.35) {
      g.font = `${weight} ${size}px ${FONT}`; let n = 1, line = '';
      for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { n++; line = w; } else line = t; }
      return n * size * lh;
    },
    button(id, x, y, w, h, label, o = {}) {
      const hov = hoverId === id && !o.disabled;
      rr(g, x, y, w, h, 18);
      g.fillStyle = o.disabled ? '#101826' : o.fill || (hov ? '#0a3a8a' : C.navy); g.fill();
      g.lineWidth = hov ? 6 : 3; g.strokeStyle = o.disabled ? '#26324a' : hov ? C.focus : o.stroke || C.blue; g.stroke();
      const size = o.size || 32, padL = o.padL || 28, padR = o.padR || 20;
      g.globalAlpha = o.disabled ? 0.5 : 1;
      ui.wrap(label, x + padL, y + (h - ui.height(label, w - padL - padR, size, 600, 1.25)) / 2, w - padL - padR, size, C.text, 600, 1.25);
      if (o.badge) { g.font = `700 ${size - 4}px ${FONT}`; g.fillStyle = o.badgeColor || C.ok; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(o.badge, x + w - 20, y + h / 2); g.textAlign = 'left'; }
      g.globalAlpha = 1;
      panel.rects.push({ id, x, y, w, h, disabled: !!o.disabled });
    },
  };
  return ui;
}

const CARD_STYLE = {
  yanit: { bg: '#000000', bar: '#8f9bb0', ink: '#ffffff', k: '#c9d1de' },
  bulgu: { bg: '#000000', bar: '#0070C0', ink: '#ffffff', k: '#7cc4ff' },
  egitici: { bg: '#000000', bar: '#d99a00', ink: '#ffffff', k: '#d99a00' },
  egitmen: { bg: '#000000', bar: '#2e9d5b', ink: '#ffffff', k: '#7fe0a8' },
  ipucu: { bg: '#000000', bar: '#e04040', ink: '#ffffff', k: '#ff8a8a' },
  plan: { bg: '#000000', bar: '#8f9bb0', ink: '#ffffff', k: '#c9d1de' },
};

// Kartları (tür başına ayrı renk) verilen alana dizer; sonraki y döner.
function drawCards(ui, g, cards, kartTurleri, x, y, w, size = 26) {
  for (const c of cards) {
    const st = CARD_STYLE[c.kind]; const inner = w - 56;
    const body = c.list?.length ? c.list.map((s) => '• ' + s).join('  ') : c.kind === 'yanit' ? '“' + c.text + '”' : c.text;
    const bs = c.kind === 'yanit' ? size + 6 : size;
    const wt = c.kind === 'yanit' || c.kind === 'bulgu' ? 600 : 400;
    const bh = ui.height(body, inner, bs, wt, 1.28);
    const h = bh + 58;
    rr(g, x, y, w, h, 14); g.fillStyle = st.bg; g.fill(); g.lineWidth = 2; g.strokeStyle = C.line; g.stroke(); g.fillStyle = st.bar; g.fillRect(x, y + 6, 8, h - 12);
    ui.wrap(kartTurleri[c.kind].baslik.toUpperCase(), x + 28, y + 14, inner, 19, st.k, 700);
    ui.wrap(body, x + 28, y + 42, inner, bs, st.ink, wt, 1.28);
    y += h + 14;
  }
  return y;
}

export function createVRScene({ store, exam, app, scenes }, video, { patient2, patients, fallbackImage, firstFrame } = {}) {
  const data = store.data;
  const d2 = exam.data;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 50);
  camera.position.set(0, 1.6, 0);

  // zemin (hastanın ayağının bastığı yüzey)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshBasicMaterial({ color: 0x07090f }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  // hasta video yüzeyi (yaşam boyu ölçekli). Sahne 01: giriş + bekleme; Sahne 02: yalnızca bekleme.
  const VH = 1.9, VW = VH * 16 / 9;
  const vtex = new THREE.VideoTexture(video.el); vtex.colorSpace = THREE.SRGBColorSpace;
  const itex = new THREE.VideoTexture(video.idleEl); itex.colorSpace = THREE.SRGBColorSpace;
  const itexN = {}; for (const n of Object.keys(patients)) { itexN[n] = new THREE.VideoTexture(patients[n]); itexN[n].colorSpace = THREE.SRGBColorSpace; }
  const imgTex = (url) => { const t = new THREE.Texture(); t.colorSpace = THREE.SRGBColorSpace;
    if (url) { const i = new Image(); i.onload = () => { t.image = i; t.needsUpdate = true; }; i.src = url; } return t; };
  const firstTex = imgTex(firstFrame), lastTex = imgTex(fallbackImage), examTex = imgTex(patient2.imageUrl);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(VW, VH), new THREE.MeshBasicMaterial({ map: firstTex }));
  screen.position.set(0, VH / 2, -2.8); scene.add(screen);
  function syncScreen() {
    let want;
    if (app.scene === 2) want = examTex;
    else if (app.scene >= 3) want = itexN[app.scene];
    else { const v = store.view(); want = v.videoMissing ? lastTex : v.idle ? itex : v.started ? vtex : firstTex; }
    if (screen.material.map !== want) { screen.material.map = want; screen.material.needsUpdate = true; }
    // Sahne 02 görseli 2:1 ve daha küçük: panellerin arasında yüzler görünür kalsın
    if (app.scene === 2) { screen.scale.set(1.9 * 2 / VW * 0.58, 0.58, 1); screen.position.set(0, 1.45, -3.2); }
    else { screen.scale.set(1, 1, 1); screen.position.set(0, VH / 2, -2.8); }
  }
  const useFallback = syncScreen;

  // ================= Sahne 01 panelleri =================
  let notePos = 0; // yana kayan not sayfaları: animasyonlu sayfa konumu
  const refPanel = new CanvasPanel('basvuru', 1.3, 0.42, (ui, g, w, h) => {
    ui.bg(C.red);
    g.fillStyle = C.red; g.fillRect(14, 30, 8, h - 60);
    ui.wrap(data.basvuru.yer.toUpperCase(), 50, 28, w - 80, 26, C.focus, 700);
    ui.wrap(data.basvuru.hasta, 50, 72, w - 80, 36, C.text, 700);
    ui.wrap('“' + data.basvuru.soz + '”', 50, 124, w - 80, 34, C.muted, 400, 1.3, 'italic');
  });

  const contentPanel = new CanvasPanel('icerik', 1.3, 1.2, (ui, g, w, h) => {
    const v = store.view(); ui.bg();
    const pad = 48, maxW = w - pad * 2; let y = 40;
    if (v.completed) {
      ui.wrap('Topladığınız öykü', pad, y, maxW, 28, '#7fe0a8', 700); y += 48;
      y = ui.wrap(v.summary, pad, y, maxW, 32, C.text, 400, 1.38) + 20;
      g.fillStyle = '#1f4a35'; g.fillRect(pad, y, maxW, 3); y += 20;
      y = ui.wrap(data.sonuc.sonrakiSahne, pad, y, maxW, 34, C.focus, 700) + 24;
      ui.button('next', pad, y, maxW, 100, data.sonuc.gecisDugme, { fill: C.red, stroke: '#e04040', size: 34 });
    } else if (v.notesOpen) {
      // sekmeler + oklar (sabit), sayfalar yatay kayar
      const tabW = 330, tabs = [['np:0', 'Öykü notları'], ['np:1', 'Eğitici not']];
      tabs.forEach(([id, label], i) => {
        if (i === 1 && !v.teachingAvailable) return;
        ui.button(id, pad + i * (tabW + 12), 28, tabW, 64, label, { size: 28, padL: 18, fill: v.notePage === i ? '#06143a' : undefined, stroke: v.notePage === i ? C.focus : undefined });
      });
      if (v.notePages.length > 1) {
        ui.button('np:prev', w - pad - 2 * 76 - 12, 28, 76, 64, '‹', { size: 40, padL: 26, disabled: v.notePage === 0 });
        ui.button('np:next', w - pad - 76, 28, 76, 64, '›', { size: 40, padL: 26, disabled: v.notePage >= v.notePages.length - 1 });
      }
      g.fillStyle = C.line; g.fillRect(pad, 108, maxW, 2);
      g.save(); g.beginPath(); g.rect(0, 112, w, h - 112 - 40); g.clip();
      const pos = notePos;
      // sayfa 0: öykü notları
      { const x = pad + (0 - pos) * w; let yy = 130;
        if (!v.askedCount) ui.wrap('Henüz öğrenilen bir bilgi yok.', x, yy, maxW, 30, C.dim);
        for (const n of v.timeline) { ui.wrap(n.etiket, x, yy, 260, 30, C.warn, 700); yy = Math.max(ui.wrap(n.metin, x + 280, yy, maxW - 280, 30, C.text, 400, 1.3), yy + 40) + 12; }
        for (const n of v.facts) { ui.wrap(n.etiket, x, yy, 260, 30, C.focus, 700, 1.3); yy = Math.max(ui.wrap(n.metin, x + 280, yy, maxW - 280, 30, C.text, 400, 1.3), yy + 40) + 12; } }
      // sayfa 1: eğitici not
      if (v.teachingAvailable) { const x = pad + (1 - pos) * w;
        ui.wrap(data.egiticiNot.baslik.toUpperCase(), x, 130, maxW, 28, C.warn, 700);
        ui.wrap(data.egiticiNot.metin, x, 176, maxW, 34, C.text, 400, 1.4); }
      g.restore();
      // sayfa noktaları
      if (v.notePages.length > 1) v.notePages.forEach((_, i) => { g.fillStyle = i === v.notePage ? C.focus : C.line; g.beginPath(); g.arc(w / 2 + (i - (v.notePages.length - 1) / 2) * 30, h - 24, 8, 0, Math.PI * 2); g.fill(); });
    } else if (v.current) {
      const q = v.current, ink = '#ffffff', sub = '#7cc4ff';
      rr(g, pad - 10, 24, maxW + 20, h - 48, 20); g.fillStyle = '#000000'; g.fill(); g.lineWidth = 3; g.strokeStyle = C.line; g.stroke(); g.fillStyle = C.focus; g.fillRect(pad - 10, 40, 7, h - 80);
      const x = pad + 14, mw = maxW - 28; let yy = 46;
      ui.wrap((q.tur === 'egitici' ? 'EĞİTMEN YANITI — AYIRICI TANI' : 'HASTANIN YANITI'), x, yy, mw, 22, sub, 700); yy += 34;
      yy = ui.wrap(q.soru, x, yy, mw, 26, C.muted, 400, 1.25) + 10;
      if (q.tur === 'egitici') { for (const it of q.liste) yy = ui.wrap('• ' + it, x, yy, mw, 25, ink, 500, 1.22) + 5; }
      else yy = ui.wrap('“' + q.yanit + '”', x, yy, mw, 40, ink, 600, 1.3) + 14;
      if (q.teori) {
        const th = ui.height(q.teori, mw - 36, 24, 400, 1.28) + 56;
        rr(g, x, yy, mw, th, 10); g.fillStyle = '#000000'; g.fill(); g.lineWidth = 2; g.strokeStyle = C.line; g.stroke(); g.fillStyle = C.blue; g.fillRect(x, yy, 6, th);
        ui.wrap('TEORİK BİLGİ', x + 22, yy + 12, mw - 36, 19, C.blue, 700);
        ui.wrap(q.teori, x + 22, yy + 40, mw - 36, 24, C.muted, 400, 1.28);
      }
    } else {
      ui.wrap('Bir soru seçin; yanıt burada görünür.', pad, 60, maxW, 32, C.dim);
    }
  });

  const qPanel = new CanvasPanel('sorular', 1.3, 1.75, (ui, g, w, h) => {
    const v = store.view(); ui.bg(C.blue);
    const pad = 36; let y = 34;
    ui.wrap('Hastaya soru sor', pad, y, w - pad * 2, 38, C.text, 700); y += 62;
    const bh = 108, gap = 12;
    data.sorular.forEach((q, i) => {
      const asked = v.asked.has(q.id);
      ui.button('q:' + q.id, pad, y, w - pad * 2, bh, `${i + 1}. ${q.soru}`, {
        size: 28, padR: asked ? 150 : 20, badge: asked ? '✓ Soruldu' : '', fill: v.current?.id === q.id ? '#0a2a66' : undefined, stroke: asked ? C.ok : q.zorunlu === false ? C.warn : undefined });
      y += bh + gap;
    });
    y += 6;
    ui.button('notes', pad, y, w - pad * 2, 90, 'Notlar ' + (v.notesOpen ? '▾' : '▸') + (v.askedCount ? ` (${v.askedCount}/${v.total})` : ''), { size: 28, badge: v.teachingNew ? 'Yeni' : '', badgeColor: C.warn });
    y += 90 + 18;
    if (!v.completed) ui.button('finish', pad, y, w - pad * 2, 96, v.canComplete ? 'Öyküyü tamamla' : `Öyküyü tamamla (${v.askedCount}/${v.total})`, { disabled: !v.canComplete, fill: v.canComplete ? C.red : undefined, stroke: '#e04040', size: 32 });
  });

  // ================= Sahne 02 panelleri =================
  // Sol: muayene görünümü (iki göz / eşel / hedef / fundus) + altında kartlar ya da muayene notu
  const examLeft = new CanvasPanel('s2sol', 1.3, 1.75, (ui, g, w, h) => {
    const v = exam.view(); ui.bg();
    const pad = 24, vw = w - pad * 2, vh = 560;
    g.save(); g.beginPath(); g.roundRect(pad, pad, vw, vh, 16); g.clip(); g.translate(pad, pad);
    drawVisual(g, vw, vh, v.visual, d2); g.restore();
    g.strokeStyle = C.line; g.lineWidth = 3; g.beginPath(); g.roundRect(pad, pad, vw, vh, 16); g.stroke();
    const y = pad + vh + 24; const cw = w - pad * 2;
    if (v.notesOpen) {
      ui.wrap(d2.notBaslik.toUpperCase(), pad + 8, y, cw, 26, C.focus, 700);
      if (v.note.lines.length) ui.wrap(v.note.paragraph, pad + 8, y + 46, cw - 16, 32, C.text, 400, 1.4);
      else ui.wrap(d2.notBos, pad + 8, y + 46, cw - 16, 30, C.dim);
    } else if (v.cards.length) {
      drawCards(ui, g, v.cards, d2.kartTurleri, pad, y, cw, 26);
    } else if (v.completed) {
      ui.wrap(d2.tamamlandi, pad + 8, y, cw, 32, '#7fe0a8', 700);
    } else if (!v.active) {
      ui.wrap('Sağdan bir muayene işlemi seçin; bulgu burada görünür.', pad + 8, y, cw - 16, 30, C.dim);
    }
  });

  // Sağ: işlem düğmeleri + etkin işlemin görev alanı
  const examRight = new CanvasPanel('s2sag', 1.3, 1.75, (ui, g, w, h) => {
    const v = exam.view(); ui.bg(C.blue);
    const pad = 32, iw = w - pad * 2; let y = 30;
    ui.wrap(d2.panelBaslik, pad, y + 6, 420, 38, C.text, 700);
    ui.button('back', w - pad - 470, y, 470, 60, d2.geriDugme, { size: 26, padL: 18 });
    y += 84;
    const opMeta = { gorme: v.done.gorme, renk: v.done.renk, sol: v.pupil.observedSol, sag: v.pupil.observedSag, fundus: v.done.fundus, plan: v.done.plan, birlestir: v.integCorrect };
    for (const gr of d2.gruplar) {
      if (gr.id === 'birlestir' && !v.integAvail) continue;
      ui.wrap(gr.baslik.toUpperCase(), pad + 4, y, iw, 22, C.focus, 700); y += 30;
      const n = gr.islemler.length, bw = (iw - 12 * (n - 1)) / n;
      gr.islemler.forEach((op, i) => {
        const cur = (op.id === 'sol' || op.id === 'sag') ? v.active === 'pupilla' && v.pupil.lit === op.id : v.active === op.id;
        const done = opMeta[op.id];
        ui.button('x:' + op.id, pad + i * (bw + 12), y, bw, 70, op.ad, { size: 25, padL: 18, padR: done ? 150 : 14, badge: done ? '✓ Yapıldı' : '', fill: cur ? '#0a2a66' : undefined, stroke: cur ? C.focus : done ? C.ok : undefined });
      });
      y += 70 + 14;
    }
    y += 4; g.fillStyle = C.line; g.fillRect(pad, y, iw, 2); y += 16;
    // etkin işlemin görev alanı
    if (v.active === 'pupilla') {
      if (!v.pupil.questionAvailable) {
        y = ui.wrap(d2.pupilla.yonerge, pad + 4, y, iw - 8, 25, C.muted, 400, 1.3) + 8;
        ui.wrap(`Hastanın solu: ${v.pupil.observedSol ? '✓' : '…'}   Hastanın sağı: ${v.pupil.observedSag ? '✓' : '…'}`, pad + 4, y, iw - 8, 25, C.warn, 700);
      } else {
        y = ui.wrap(d2.pupilla.soru, pad + 4, y, iw - 8, 28, C.text, 600, 1.3) + 10;
        d2.pupilla.secenekler.forEach((o) => { ui.button('x:pq:' + o.id, pad, y, iw, 70, o.ad, { size: 28, fill: v.pupil.answer === o.id ? '#0a2a66' : undefined, stroke: v.pupil.answer === o.id ? C.focus : undefined }); y += 80; });
      }
    } else if (v.active === 'plan') {
      y = ui.wrap(d2.plan.soru, pad + 4, y, iw - 8, 25, C.text, 600, 1.3) + 10;
      const bw = (iw - 12) / 2;
      d2.plan.secenekler.forEach((o, i) => {
        const on = v.planSelected.includes(o.id), col = i % 2, row = Math.floor(i / 2);
        ui.button('x:pl:' + o.id, pad + col * (bw + 12), y + row * 70, bw, 62, (on ? '☑ ' : '☐ ') + o.ad, { size: 25, padL: 16, fill: on ? '#0a2a66' : undefined, stroke: on ? C.focus : undefined });
      });
    } else if (v.active === 'birlestir') {
      y = ui.wrap(d2.birlestir.soru, pad + 4, y, iw - 8, 24, C.text, 600, 1.28) + 10;
      d2.birlestir.secenekler.forEach((o) => { ui.button('x:iq:' + o.id, pad, y, iw, 72, o.ad, { size: 25, padL: 18, fill: v.integChoice === o.id ? '#0a2a66' : undefined, stroke: v.integChoice === o.id ? (v.integCorrect ? C.ok : C.red) : undefined }); y += 80; });
    } else if (!v.active) {
      ui.wrap('Bir muayene işlemi seçin. İşlemleri istediğiniz sırada yapabilir, tekrar inceleyebilirsiniz.', pad + 4, y, iw - 8, 25, C.muted, 400, 1.3);
    }
    if (v.completed) ui.button('x:s3', pad, h - 186, iw, 72, 'Tetkik ve tedaviye geç', { size: 28, fill: C.red, stroke: '#e04040' });
    ui.button('x:not', pad, h - 100, iw, 72, 'Muayene notu ' + (v.notesOpen ? '▾' : '▸'), { size: 28 });
  });

  const L = -1.05, R = 1.05, PZ = -1.9, YAW = 0.4;
  refPanel.mesh.position.set(L, 0.5, PZ); refPanel.mesh.rotation.y = YAW;
  contentPanel.mesh.position.set(L, 1.5, PZ); contentPanel.mesh.rotation.y = YAW;
  qPanel.mesh.position.set(R, 1.35, PZ); qPanel.mesh.rotation.y = -YAW;
  examLeft.mesh.position.set(L, 1.3, PZ); examLeft.mesh.rotation.y = YAW;
  examRight.mesh.position.set(R, 1.3, PZ); examRight.mesh.rotation.y = -YAW;
  // Sahne 03–06: aynı bildirimsel modeli çizen sayfalı paneller (her sahne kendi store ve adaptörüyle)
  const extra = {}; const groups = { 1: [refPanel, contentPanel, qPanel], 2: [refPanel, examLeft, examRight] };
  const panels = [refPanel, contentPanel, qPanel, examLeft, examRight];
  for (const [n, sc] of Object.entries(scenes)) {
    const inst = createS3Panels({ CanvasPanel, C, rr }, { store3: sc.store, viewer: sc.viewer || null, app, test: false, n: Number(n), adapter: sc.adapter });
    inst.left.mesh.position.set(L, 1.3, PZ); inst.left.mesh.rotation.y = YAW;
    inst.right.mesh.position.set(R, 1.3, PZ); inst.right.mesh.rotation.y = -YAW;
    extra[n] = inst; groups[n] = [inst.left, inst.right]; panels.push(inst.left, inst.right);
  }
  panels.forEach((p) => scene.add(p.mesh));
  const activePanels = () => groups[app.scene] || groups[1];
  function showScene() { const on = new Set(activePanels()); panels.forEach((p) => { p.mesh.visible = on.has(p); p.dirty = true; }); syncScreen(); }

  // eylemler → ortak store'lar (masaüstüyle aynı nesneler)
  function act(id, fx) {
    if (id === 'back' || id.startsWith('s3:') || id.startsWith('pg:')) { extra[app.scene]?.act(id, fx); return; }
    if (id === 'x:s3') { app.goto(3); return; }
    if (id === 'notes') store.toggleNotes();
    else if (id === 'np:0') store.setNotePage(0);
    else if (id === 'np:1') store.setNotePage(1);
    else if (id === 'np:prev') store.stepNotePage(-1);
    else if (id === 'np:next') store.stepNotePage(1);
    else if (id === 'finish') store.complete();
    else if (id === 'next') app.goto(2);
    else if (id === 'back') app.goto(1);
    else if (id.startsWith('q:')) store.ask(id.slice(2));
    else if (id === 'x:not') exam.toggleNotes();
    else if (id.startsWith('x:pq:')) exam.answerPupil(id.slice(5));
    else if (id.startsWith('x:pl:')) exam.togglePlan(id.slice(5));
    else if (id.startsWith('x:iq:')) exam.answerInteg(id.slice(5));
    else if (id.startsWith('x:')) exam.run(id.slice(2));
  }

  const markDirty = () => { panels.forEach((p) => (p.dirty = true)); syncScreen(); };
  store.subscribe(markDirty); exam.subscribe(markDirty); Object.values(scenes).forEach((sc) => sc.store.subscribe(markDirty)); app.subscribe(showScene);
  showScene();

  // ---- ışın (ray) ----
  const ray = new THREE.Raycaster(); const hover = { id: null, panel: null };
  const tmpM = new THREE.Matrix4();
  function castFrom(origin, dir) {
    ray.set(origin, dir);
    const hits = ray.intersectObjects(activePanels().map((p) => p.mesh), false);
    if (!hits.length) return null;
    const p = hits[0].object.userData.panel;
    const r = p.hit(hits[0].uv);
    return r ? { panel: p, id: r.id, fx: r.fx, dist: hits[0].distance } : { panel: p, id: null, dist: hits[0].distance };
  }
  function castController(c) {
    tmpM.identity().extractRotation(c.matrixWorld);
    const o = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld);
    const d = new THREE.Vector3(0, 0, -1).applyMatrix4(tmpM);
    return castFrom(o, d);
  }
  function setHover(id) {
    if ((hover.id || null) === (id || null)) return;
    hover.id = id; panels.forEach((p) => (p.dirty = true));
  }

  function update() {
    extra[app.scene]?.tick();
    if (app.scene === 1) {
      const tgt = store.view().notePage;
      if (Math.abs(notePos - tgt) > 0.002) { notePos += (tgt - notePos) * 0.22; if (Math.abs(notePos - tgt) <= 0.002) notePos = tgt; contentPanel.dirty = true; }
    }
    if (app.scene === 2) {
      exam.tick(); // pupilla / ölçüm animasyonları ve gözlem süresi XR karesinden de ilerler
      if (exam.view().animating) examLeft.dirty = true;
    }
    activePanels().forEach((p) => { if (p.dirty) p.redraw(hover.id); });
  }

  // ---- kontrolcüler (yalnızca XR oturumunda) ----
  const controllers = [];
  function setupControllers(renderer) {
    for (let i = 0; i < 2; i++) {
      const c = renderer.xr.getController(i);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -4)]),
        new THREE.LineBasicMaterial({ color: 0x7cc4ff }));
      line.scale.z = 1; c.add(line); c.userData.line = line;
      c.addEventListener('selectstart', () => { const h = castController(c); if (h?.id) act(h.id, h.fx); });
      scene.add(c); controllers.push(c);
    }
  }
  function updateHover() {
    let best = null;
    for (const c of controllers) {
      if (!c.visible) continue;
      const h = castController(c);
      c.userData.line.scale.z = h ? Math.min(h.dist, 4) / 4 : 1;
      if (h?.id && (!best || h.dist < best.dist)) best = h;
    }
    setHover(best?.id || null);
  }

  return { THREE, scene, camera, panels, update, updateHover, setupControllers, act, castFrom, setHover, useFallback, screen, hover, examLeft, examRight };
}

// Gözlük olmadan aynı sahneyi düz tarayıcıda gösteren önizleme (fareyle ışın). Aynı çizim ve isabet kodunu çalıştırır.
export function mountPreview(vr, host) {
  const { THREE, scene, camera } = vr;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.prepend(renderer.domElement);
  const mouse = new THREE.Vector2();
  let running = true;
  const size = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h); camera.aspect = w / h;
    camera.fov = Math.min(100, (2 * Math.atan(Math.tan((100 * Math.PI) / 360) / camera.aspect) * 180) / Math.PI); /* yatayda ~100° */ camera.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  renderer.domElement.addEventListener('pointermove', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const rc = new THREE.Raycaster(); rc.setFromCamera(mouse, camera);
    const h = vr.castFrom(rc.ray.origin, rc.ray.direction); vr.setHover(h?.id || null);
  });
  renderer.domElement.addEventListener('click', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const rc = new THREE.Raycaster(); rc.setFromCamera(mouse, camera);
    const h = vr.castFrom(rc.ray.origin, rc.ray.direction); if (h?.id) vr.act(h.id, h.fx);
  });
  renderer.setAnimationLoop(() => { if (!running) return; vr.update(); renderer.render(scene, camera); });
  return { stop() { running = false; renderer.setAnimationLoop(null); renderer.domElement.remove(); removeEventListener('resize', size); renderer.dispose(); } };
}

// Gerçek WebXR oturumu
export async function xrSupported() {
  try { return !!(navigator.xr && (await navigator.xr.isSessionSupported('immersive-vr'))); } catch { return false; }
}

export function createXRSession(vr, { onStart, onEnd } = {}) {
  const { THREE, scene, camera } = vr;
  let renderer = null;
  return {
    async enter() {
      if (!renderer) {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.xr.enabled = true;
        renderer.xr.setReferenceSpaceType('local-floor');
        vr.setupControllers(renderer);
      }
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
      session.addEventListener('end', () => { renderer.setAnimationLoop(null); onEnd?.(); });
      await renderer.xr.setSession(session);
      renderer.setAnimationLoop(() => { vr.update(); vr.updateHover(); renderer.render(scene, camera); });
      onStart?.();
    },
  };
}
