// MRG görüntüleyici: kesit dizisi (PNG/JPEG) veya MP4. DOM tuvali ve VR paneli AYNI denetleyiciyi ve çizimi kullanır.
// Görüntünün en-boy oranı korunur (contain). DICOM bu sürümde desteklenmez.

export function createMrgViewer(store) {
  const cfg = store.cfg.mrg;
  const cache = {};

  function load(tab) {
    if (cache[tab] !== undefined) return cache[tab];
    const c = cfg[tab];
    if (!c) return (cache[tab] = null);
    if (c.tur === 'video' && c.dosya) {
      const el = document.createElement('video');
      el.muted = true; el.playsInline = true; el.preload = 'auto'; el.loop = false; el.src = c.dosya;
      const m = { kind: 'video', el, c, failed: false };
      el.addEventListener('error', () => { m.failed = true; });
      el.addEventListener('loadedmetadata', () => { if (c.baslangic) el.currentTime = c.baslangic; });
      el.addEventListener('timeupdate', () => { const end = c.bitis ?? el.duration; if (el.currentTime >= end) { el.pause(); el.currentTime = end; } });
      return (cache[tab] = m);
    }
    if (c.dosyalar?.length) {
      const imgs = c.dosyalar.map((u) => { const i = new Image(); const m = { i, failed: false }; i.onerror = () => { m.failed = true; }; i.src = u; return { img: i, m }; });
      return (cache[tab] = { kind: 'kesit', imgs, c });
    }
    return (cache[tab] = null);
  }

  const api = {
    media: load,
    has: (tab) => !!load(tab),
    count(tab) { const m = load(tab); return !m ? 0 : m.kind === 'kesit' ? m.imgs.length : 0; },
    isVideo: (tab) => load(tab)?.kind === 'video',
    range(tab) { const m = load(tab); if (m?.kind !== 'video') return null; const lo = m.c.baslangic || 0; const hi = m.c.bitis ?? (m.el.duration || 0); return { lo, hi }; },
    time(tab) { const m = load(tab); return m?.kind === 'video' ? m.el.currentTime : 0; },
    playing(tab) { const m = load(tab); return m?.kind === 'video' && !m.el.paused && !m.el.ended; },
    toggle(tab) { const m = load(tab); if (m?.kind !== 'video') return; if (m.el.paused) { const r = api.range(tab); if (r && m.el.currentTime >= r.hi - 0.05) m.el.currentTime = r.lo; m.el.play().catch(() => {}); } else m.el.pause(); },
    pause() { for (const k of Object.keys(cache)) cache[k]?.kind === 'video' && cache[k].el.pause(); },
    seekFrac(tab, f) { const m = load(tab); const r = api.range(tab); if (m?.kind !== 'video' || !r) return; m.el.currentTime = r.lo + Math.max(0, Math.min(1, f)) * (r.hi - r.lo); },
    seekBy(tab, d) { const m = load(tab); if (m?.kind !== 'video') return; const r = api.range(tab); m.el.pause(); m.el.currentTime = Math.max(r.lo, Math.min(r.hi, m.el.currentTime + d)); },
    // Çizilecek kare: { el, w, h } ya da null
    frame(tab, sliceIdx) {
      const m = load(tab); if (!m) return null;
      if (m.kind === 'video') { const el = m.el; return el.readyState >= 2 && el.videoWidth ? { el, w: el.videoWidth, h: el.videoHeight } : null; }
      const it = m.imgs[Math.max(0, Math.min(m.imgs.length - 1, sliceIdx))];
      return it && it.img.complete && it.img.naturalWidth ? { el: it.img, w: it.img.naturalWidth, h: it.img.naturalHeight } : null;
    },
  };
  return api;
}

const FONT = '"Segoe UI", system-ui, Arial, sans-serif';

// Tuvale çiz: siyah zemin, en-boy oranı korunur. Dönüş: görüntünün yerleştiği dikdörtgen (işaretler için)
export function drawMrg(g, x, y, w, h, { viewer, tab, slice, v, data, test }) {
  g.fillStyle = '#000'; g.fillRect(x, y, w, h);
  const note = (t, color = '#8f9bb0', dy = 0, size = Math.max(14, h * 0.045)) => { g.font = `600 ${size}px ${FONT}`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x + w / 2, y + h / 2 + dy); g.textAlign = 'left'; };
  if (!viewer.has(tab)) { note(data.mrg.gorselYok.split('. ')[0] + '.', '#c9d1de', -h * 0.04); note('Yazılı olgu raporu aşağıdaki “Raporu aç” ile erişilebilir.', '#8f9bb0', h * 0.06, Math.max(12, h * 0.036)); return null; }
  const f = viewer.frame(tab, slice);
  if (!f) { note('Görüntü yükleniyor…'); return null; }
  const s = Math.min(w / f.w, h / f.h), iw = f.w * s, ih = f.h * s, ix = x + (w - iw) / 2, iy = y + (h - ih) / 2;
  g.drawImage(f.el, ix, iy, iw, ih);
  if (test) { g.font = `700 ${Math.max(12, h * 0.036)}px ${FONT}`; g.fillStyle = '#ffb347'; g.textBaseline = 'top'; g.fillText(data.mrg.testEtiketi, x + 8, y + 6); }
  if (v.mrg.markers && v.mrg.markersAvailable) {
    for (const m of viewer.markers?.[tab] || []) {
      if (!viewer.isVideo(tab) && m.kesit !== slice) continue;
      g.strokeStyle = '#ffd34d'; g.lineWidth = 3; g.beginPath(); g.arc(ix + m.x * iw, iy + m.y * ih, Math.max(10, ih * 0.05), 0, Math.PI * 2); g.stroke();
      if (m.etiket) { g.font = `600 ${Math.max(12, h * 0.036)}px ${FONT}`; g.fillStyle = '#ffd34d'; g.textBaseline = 'top'; g.fillText(m.etiket, ix + m.x * iw + 14, iy + m.y * ih + 8); }
    }
  }
  return { x: ix, y: iy, w: iw, h: ih };
}
