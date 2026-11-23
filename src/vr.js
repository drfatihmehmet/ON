// WebXR (Meta Quest 3) sahnesi. Masaüstüyle AYNI store'u kullanır; kendi durumu yoktur.
// Video yüzeyi, metin ve düğmeler sahnedeki canvas dokulu panellerdir (HTML katmanına bağımlı değil).
import * as THREE from 'three';

const PPM = 800; // panel dokusu: metre başına piksel
const C = { bg: 'rgba(8,14,30,0.96)', line: '#22345c', navy: '#002060', blue: '#0070C0', red: '#C00000',
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
    return this.rects.find((r) => !r.disabled && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || null;
  }
}

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// Çizim yardımcıları: metin kaydırma, düğme (tıklanabilir dikdörtgen kaydı)
function makeUI(g, panel, hoverId) {
  const ui = {
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

export function createVRScene(store, video, { fallbackImage, firstFrame } = {}) {
  const data = store.data;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 50);
  camera.position.set(0, 1.6, 0);

  // zemin (hastanın ayağının bastığı yüzey)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshBasicMaterial({ color: 0x07090f }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  // hasta video yüzeyi: 16:9 videonun yalnızca ortası görünür olsun diye geniş değil, yaşam boyu ölçekli
  const VH = 1.9, VW = VH * 16 / 9;
  const vtex = new THREE.VideoTexture(video.el);
  vtex.colorSpace = THREE.SRGBColorSpace;
  const itex = new THREE.VideoTexture(video.idleEl);
  itex.colorSpace = THREE.SRGBColorSpace;
  // Video başlamadan önce ilk kare, video yoksa son (önden) kare gösterilir; video akışı aynı <video> öğesidir.
  const imgTex = (url) => { const t = new THREE.Texture(); t.colorSpace = THREE.SRGBColorSpace;
    if (url) { const i = new Image(); i.onload = () => { t.image = i; t.needsUpdate = true; }; i.src = url; } return t; };
  const firstTex = imgTex(firstFrame), lastTex = imgTex(fallbackImage);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(VW, VH), new THREE.MeshBasicMaterial({ map: firstTex }));
  screen.position.set(0, VH / 2, -2.8); scene.add(screen);
  function syncScreen() {
    const v = store.view();
    const want = v.videoMissing ? lastTex : v.idle ? itex : v.started ? vtex : firstTex;
    if (screen.material.map !== want) { screen.material.map = want; screen.material.needsUpdate = true; }
  }
  const useFallback = syncScreen;

  // ---- paneller ----
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
      ui.wrap(data.sonuc.sonrakiSahne, pad, y, maxW, 34, C.focus, 700);
    } else if (v.teachingOpen) {
      ui.wrap(data.egiticiNot.baslik.toUpperCase(), pad, y, maxW, 28, C.warn, 700); y += 48;
      ui.wrap(data.egiticiNot.metin, pad, y, maxW, 34, C.text, 400, 1.4);
    } else if (v.notesOpen) {
      ui.wrap('ÖYKÜ NOTLARI', pad, y, maxW, 28, C.focus, 700); y += 46;
      if (!v.askedCount) ui.wrap('Henüz öğrenilen bir bilgi yok.', pad, y, maxW, 30, C.dim);
      for (const n of v.timeline) { ui.wrap(n.etiket, pad, y, 260, 30, C.warn, 700); y = Math.max(ui.wrap(n.metin, pad + 280, y, maxW - 280, 30, C.text, 400, 1.3), y + 40) + 12; }
      for (const n of v.facts) { ui.wrap(n.etiket, pad, y, 260, 30, C.focus, 700, 1.3); y = Math.max(ui.wrap(n.metin, pad + 280, y, maxW - 280, 30, C.text, 400, 1.3), y + 40) + 12; }
    } else if (v.current) {
      const q = v.current, ink = '#101828', sub = '#4a5a78';
      rr(g, pad - 10, 24, maxW + 20, h - 48, 20); g.fillStyle = '#ffffff'; g.fill();
      const x = pad + 14, mw = maxW - 28; let yy = 46;
      ui.wrap((q.tur === 'egitici' ? 'EĞİTMEN YANITI — AYIRICI TANI' : 'HASTANIN YANITI'), x, yy, mw, 22, sub, 700); yy += 34;
      yy = ui.wrap(q.soru, x, yy, mw, 26, sub, 400, 1.25) + 10;
      if (q.tur === 'egitici') { for (const it of q.liste) yy = ui.wrap('• ' + it, x, yy, mw, 25, ink, 500, 1.22) + 5; }
      else yy = ui.wrap('“' + q.yanit + '”', x, yy, mw, 40, ink, 600, 1.3) + 14;
      if (q.teori) {
        const th = ui.height(q.teori, mw - 36, 24, 400, 1.28) + 56;
        rr(g, x, yy, mw, th, 10); g.fillStyle = '#eef3fb'; g.fill(); g.fillStyle = C.blue; g.fillRect(x, yy, 6, th);
        ui.wrap('TEORİK BİLGİ', x + 22, yy + 12, mw - 36, 19, C.blue, 700);
        ui.wrap(q.teori, x + 22, yy + 40, mw - 36, 24, '#1c2a44', 400, 1.28);
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
    const half = (w - pad * 2 - 16) / 2;
    ui.button('notes', pad, y, half, 90, 'Öykü notları ' + (v.notesOpen ? '▾' : '▸') + (v.askedCount ? ` (${v.askedCount}/${v.total})` : ''), { size: 28 });
    if (v.teachingAvailable) ui.button('teach', pad + half + 16, y, half, 90, 'Eğitici not ' + (v.teachingOpen ? '▾' : '▸'), { size: 28, stroke: C.warn });
    y += 90 + 18;
    if (!v.completed) ui.button('finish', pad, y, w - pad * 2, 96, v.canComplete ? 'Öyküyü tamamla' : `Öyküyü tamamla (${v.askedCount}/${v.total})`, { disabled: !v.canComplete, fill: v.canComplete ? C.red : undefined, stroke: '#e04040', size: 32 });
  });

  const L = -1.05, R = 1.05, PZ = -1.9, YAW = 0.4;
  refPanel.mesh.position.set(L, 0.5, PZ); refPanel.mesh.rotation.y = YAW;
  contentPanel.mesh.position.set(L, 1.5, PZ); contentPanel.mesh.rotation.y = YAW;
  qPanel.mesh.position.set(R, 1.35, PZ); qPanel.mesh.rotation.y = -YAW;
  const panels = [refPanel, contentPanel, qPanel];
  panels.forEach((p) => scene.add(p.mesh));

  // eylemler → ortak store
  function act(id) {
    if (id === 'notes') store.toggleNotes();
    else if (id === 'teach') store.toggleTeaching();
    else if (id === 'finish') store.complete();
    else if (id.startsWith('q:')) store.ask(id.slice(2));
  }

  store.subscribe(() => { panels.forEach((p) => (p.dirty = true)); syncScreen(); });
  syncScreen();

  // ---- ışın (ray) ----
  const ray = new THREE.Raycaster(); const hover = { id: null, panel: null };
  const tmpM = new THREE.Matrix4();
  function castFrom(origin, dir) {
    ray.set(origin, dir);
    const hits = ray.intersectObjects(panels.map((p) => p.mesh), false);
    if (!hits.length) return null;
    const p = hits[0].object.userData.panel;
    const r = p.hit(hits[0].uv);
    return r ? { panel: p, id: r.id, dist: hits[0].distance } : { panel: p, id: null, dist: hits[0].distance };
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
    // video dokusu kendi kendine güncellenir; panelleri yalnızca değişince yeniden çiz
    panels.forEach((p) => { if (p.dirty) p.redraw(hover.id); });
  }

  // ---- kontrolcüler (yalnızca XR oturumunda) ----
  const controllers = [];
  function setupControllers(renderer) {
    for (let i = 0; i < 2; i++) {
      const c = renderer.xr.getController(i);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -4)]),
        new THREE.LineBasicMaterial({ color: 0x7cc4ff }));
      line.scale.z = 1; c.add(line); c.userData.line = line;
      c.addEventListener('selectstart', () => { const h = castController(c); if (h?.id) act(h.id); });
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

  return { THREE, scene, camera, panels, update, updateHover, setupControllers, act, castFrom, setHover, useFallback, screen, hover };
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
    const h = vr.castFrom(rc.ray.origin, rc.ray.direction); if (h?.id) vr.act(h.id);
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
