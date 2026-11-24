// Sahne 03 VR panelleri: s3-model'i tuvale çizer (sayfalı). Bağımlılıklar vr.js'den enjekte edilir.
import { buildModel, perform } from './s3-model.js';
import { drawMrg } from './mrg-viewer.js';
import { drawOkb, drawFormula } from './visuals.js';

const CARD = {
  yanit: ['#8f9bb0', '#c9d1de'], bulgu: ['#0070C0', '#7cc4ff'], egitici: ['#d99a00', '#d99a00'], egitmen: ['#2e9d5b', '#7fe0a8'],
  ipucu: ['#e04040', '#ff8a8a'], uyari: ['#7cc4ff', '#7cc4ff'], rapor: ['#7cc4ff', '#7cc4ff'], aciklama: ['#8f9bb0', '#c9d1de'], istem: ['#0070C0', '#7cc4ff'],
};

export function createS3Panels({ CanvasPanel, C, rr }, { store3, viewer, app, test, n = 3, adapter = null }) {
  const D = store3.data;
  const A = adapter || { buildModel: (v) => buildModel(v, store3, viewer), perform: (id, fx) => perform(store3, viewer, id, fx) };
  const page = { rctx: 0, lcards: 0, ltable: 0 };
  let lastKey = '';

  // ---- parçacık ölçü/çizim: draw=false ise yalnızca yükseklik döner ----
  function place(ui, g, w, x, y, W, draw) {
    const pad = 12;
    switch (w.t) {
      case 'h': { const hh = ui.height(w.text, W, 28, 700, 1.25) + 20; if (draw) ui.wrap(w.text, x, y + 6, W, 28, C.text, 700, 1.25); return hh; }
      case 'p': { const col = { warn: C.warn, ok: '#7fe0a8', bad: '#ff8a8a', muted: C.muted }[w.tone] || C.text; const hh = ui.height(w.text, W, 24, 400, 1.3) + 10; if (draw) ui.wrap(w.text, x, y, W, 24, col, 400, 1.3); return hh; }
      case 'row': {
        const n = w.btns.length, bw = (W - 10 * (n - 1)) / n;
        const hh = Math.max(64, Math.max(...w.btns.map((b) => ui.height(b.label, bw - 40 - (b.badge ? 150 : 0), 24, 600, 1.2))) + 32);
        if (draw) w.btns.forEach((b, i) => ui.button('s3:' + b.id, x + i * (bw + 10), y, bw, hh, b.label + (b.caret ? (b.on ? '  ▾' : '  ▸') : ''),
          { size: 24, padL: 18, padR: b.badge ? 170 : 14, badge: b.badge || '', disabled: b.disabled, fill: b.primary ? C.red : b.on ? '#06143a' : undefined, stroke: b.primary ? '#e04040' : b.on ? C.focus : b.ok ? C.ok : undefined }));
        return hh + 10;
      }
      case 'check': {
        const hh = Math.max(60, ui.height(w.label, W - 96, 24, 500, 1.2) + 30);
        if (draw) ui.button('s3:' + w.id, x, y, W, hh, (w.on ? '☑  ' : '☐  ') + w.label, { size: 24, padL: 18, disabled: w.disabled, fill: w.on ? '#06143a' : undefined, stroke: w.on ? C.focus : undefined });
        return hh + 8;
      }
      case 'table': return tableBlock(ui, g, w.head, w.rows, x, y, W, draw) + 8;
      case 'canvas': { if (draw) { const g2 = ui.g; g2.save(); g2.translate(x, y); g2.beginPath(); g2.roundRect(0, 0, W, 300, 10); g2.clip(); if (w.draw === 'okb') drawOkb(g2, W, 300, w.tip, w.etiket); else drawFormula(g2, W, 300, w.f); g2.restore(); g2.strokeStyle = C.line; g2.lineWidth = 2; g2.beginPath(); g2.roundRect(x, y, W, 300, 10); g2.stroke(); } return 310; }
      case 'scrub': {
        if (draw) {
          ui.wrap(w.label, x, y, W, 22, C.muted, 400);
          const by = y + 36; rr(g, x, by, W, 26, 13); g.fillStyle = '#0b1633'; g.fill(); g.lineWidth = 2; g.strokeStyle = C.line; g.stroke();
          rr(g, x, by, Math.max(26, W * (w.frac || 0)), 26, 13); g.fillStyle = C.blue; g.fill();
          ui.panel.rects.push({ id: 's3:scrub', x, y: by - 14, w: W, h: 54, disabled: false });
        }
        return 82;
      }
      case 'text': { const t = w.value ? `Yanıtınız: ${w.value}` : 'Yanıt: aşağıdaki cümlelerden seçin (VR’de klavye yok).'; const hh = ui.height(t, W, 22, 400, 1.3) + 12; if (draw) ui.wrap(t, x, y, W, 22, w.value ? C.text : C.dim, 400, 1.3); return hh; }
      case 'card': {
        const [bar, kc] = CARD[w.kind] || CARD.uyari; const inner = W - 52;
        const body = w.list?.length && w.kind !== 'rapor' ? w.list.map((s) => '• ' + s).join('  ') : w.kind === 'yanit' ? '“' + w.text + '”' : w.text;
        const wt = w.kind === 'yanit' || w.kind === 'bulgu' ? 600 : 400, bs = 24;
        const title = (w.title || D.kartTurleri[w.kind].baslik).toUpperCase();
        const bh = ui.height(body, inner, bs, wt, 1.28) + (w.kaynak ? ui.height(w.kaynak, inner, 17, 400, 1.3) + 4 : 0), hh = bh + 56;
        if (draw) { rr(g, x, y, W, hh, 14); g.fillStyle = '#000'; g.fill(); g.lineWidth = 2; g.strokeStyle = C.line; g.stroke(); g.fillStyle = bar; g.fillRect(x, y + 6, 8, hh - 12);
          ui.wrap(title + (w.rozet ? '  ·  ' + w.rozet : ''), x + 26, y + 12, inner, 18, kc, 700); const ye = ui.wrap(body, x + 26, y + 38, inner, bs, C.text, wt, 1.28); if (w.kaynak) ui.wrap(w.kaynak, x + 26, ye + 2, inner, 17, C.dim, 400); }
        return hh + 12;
      }
      default: return 0;
    }
    void pad;
  }

  // Tablo (başlık + satırlar); satır içeriği sarılır, hiçbir hücre kesilmez
  function tableBlock(ui, g, head, rows, x, y, W, draw, onlyRows) {
    const fr = head.length === 2 ? [0.4, 0.6] : [0.42, 0.26, 0.32]; const cw = fr.map((f) => W * f - 16);
    let cy = y;
    const rowH = (r) => Math.max(...r.map((c, i) => ui.height(String(c || ' '), cw[i], 22, 500, 1.2))) + 18;
    if (!onlyRows) { if (draw) head.forEach((hd, i) => ui.wrap(hd.toUpperCase(), x + fr.slice(0, i).reduce((a, b) => a + b, 0) * W + 8, cy + 6, cw[i], 18, C.focus, 700)); cy += 38; if (draw) { g.fillStyle = C.line; g.fillRect(x, cy - 4, W, 2); } }
    for (const r of rows) {
      const hh = rowH(r);
      if (draw) { r.forEach((c, i) => ui.wrap(String(c || ''), x + fr.slice(0, i).reduce((a, b) => a + b, 0) * W + 8, cy + 8, cw[i], 22, i === 1 ? C.text : C.muted, i === 1 ? 700 : 500, 1.2)); g.fillStyle = '#111d38'; g.fillRect(x, cy + hh - 1, W, 1); }
      cy += hh;
    }
    return cy - y;
  }
  const rowsHeights = (ui, head, rows, W) => { const fr = head.length === 2 ? [0.4, 0.6] : [0.42, 0.26, 0.32]; const cw = fr.map((f) => W * f - 16); return rows.map((r) => Math.max(...r.map((c, i) => ui.height(String(c || ' '), cw[i], 22, 500, 1.2))) + 18); };

  function paginate(heights, avail) {
    const pages = [[]]; let used = 0;
    heights.forEach((h, i) => { if (used + h > avail && pages[pages.length - 1].length) { pages.push([]); used = 0; } pages[pages.length - 1].push(i); used += h; });
    return pages;
  }
  const pager = (ui, g, id, x, y, w, pg, n) => {
    if (n < 2) return;
    ui.button(`pg:${id}:-1`, x, y, 150, 52, '‹ Önceki', { size: 22, padL: 22, disabled: pg <= 0 });
    ui.wrap(`Sayfa ${pg + 1} / ${n}`, x + w / 2 - 70, y + 12, 160, 24, C.muted, 600);
    ui.button(`pg:${id}:+1`, x + w - 150, y + 12 - 12, 150, 52, 'Sonraki ›', { size: 22, padL: 20, disabled: pg >= n - 1 });
  };

  let M = null; // son model
  const model = () => { const v = store3.view(); M = A.buildModel(v); const key = v.active + '|' + M.left.kind + '|' + (v.mrg ? v.mrg.tab : ''); if (key !== lastKey) { lastKey = key; page.rctx = page.lcards = page.ltable = 0; } return { v, M }; };

  // ================= SOL: görünüm (MRG / tablo / önceki muayene) + kartlar =================
  const left = new CanvasPanel('s3sol', 1.3, 1.75, (ui, g, w, h) => {
    const { v, M } = model(); ui.bg();
    const pad = 24, W = w - pad * 2, vh = 560;
    g.save(); g.beginPath(); g.roundRect(pad, pad, W, vh, 16); g.clip(); g.fillStyle = '#000'; g.fillRect(pad, pad, W, vh);
    if (M.left.kind === 'mrg' && viewer) {
      const tab = v.mrg.tab; drawMrg(g, pad, pad, W, vh, { viewer, tab, slice: v.mrg.slice[tab], v, data: D, test });
    } else if (M.left.kind === 'lab') {
      const L = M.left, rows = [...L.rows, ...(L.extra || []).map((x) => [x.ad, x.durum, ''])];
      ui.wrap(L.baslik, pad + 16, pad + 10, W - 32, 28, C.text, 700); ui.wrap(L.etiket, pad + 16, pad + 48, W - 32, 20, C.warn, 700);
      const hs = rowsHeights(ui, L.head, rows, W - 32), pages = paginate(hs, vh - 170); const pg = Math.min(page.ltable, pages.length - 1);
      tableBlock(ui, g, L.head, pages[pg].map((i) => rows[i]), pad + 16, pad + 84, W - 32, true);
      pager(ui, g, 'ltable', pad + 16, pad + vh - 62, W - 32, pg, pages.length);
    } else {
      ui.wrap(D.oncekiMuayene.baslik.toUpperCase(), pad + 20, pad + 24, W - 40, 22, C.focus, 700);
      ui.wrap(D.olguBaglami, pad + 20, pad + 64, W - 40, 28, C.text, 500, 1.3);
      ui.wrap(M.prev.note || D.oncekiMuayene.bos, pad + 20, pad + 230, W - 40, 28, C.muted, 400, 1.3);
    }
    g.restore();
    g.strokeStyle = C.line; g.lineWidth = 3; g.beginPath(); g.roundRect(pad, pad, W, vh, 16); g.stroke();
    // kartlar (sayfalı)
    const cards = M.widgets.filter((x) => x.t === 'card');
    const y0 = pad + vh + 20, avail = h - y0 - 84;
    if (!cards.length) { ui.wrap(v.active ? '' : 'Sağdan bir eylem seçin; sonuç kartları burada görünür.', pad + 8, y0, W - 16, 28, C.dim); return; }
    const hs = cards.map((c) => place(ui, g, c, 0, 0, W, false)), pages = paginate(hs, avail); const pg = Math.min(page.lcards, pages.length - 1);
    let y = y0; pages[pg].forEach((i) => { y += place(ui, g, cards[i], pad, y, W, true); });
    pager(ui, g, 'lcards', pad, h - 76, W, pg, pages.length);
  });

  // ================= SAĞ: zaman + eylemler + bağlam denetimleri =================
  const right = new CanvasPanel('s3sag', 1.3, 1.75, (ui, g, w, h) => {
    const { v, M } = model(); ui.bg(C.blue);
    const pad = 32, W = w - pad * 2; let y = 28;
    ui.wrap(D.panelBaslik, pad, y + 8, 420, 36, C.text, 700);
    ui.button('back', w - pad - 470, y, 470, 58, D.geriDugme, { size: 24, padL: 18 }); y += 74;
    if (M.time) { ui.wrap(`${M.time.label}: ${M.time.day}`, pad + 4, y + 14, 460, 28, C.focus, 700);
      y += 44; }
    M.ops.forEach((o, i) => {
      ui.button('s3:op:' + o.id, pad, y, W, 78, `${i + 1}. ${o.ad}`, { size: 23, padL: 18, padR: o.status ? 210 : 14, badge: o.status || '', badgeColor: /Sonuçlandı|Doz/.test(o.status) ? C.ok : C.warn, fill: o.on ? '#06143a' : undefined, stroke: o.on ? C.focus : undefined });
      y += 84;
    });
    (M.extraOps || []).forEach((o) => { ui.button('s3:op:' + o.id, pad, y, W, 64, o.ad, { size: 24, padL: 18, fill: o.on ? '#06143a' : undefined, stroke: o.on ? C.focus : undefined }); y += 74; });
    y += 4;
    g.fillStyle = C.line; g.fillRect(pad, y, W, 2); y += 14;
    const items = M.widgets.filter((x) => x.t !== 'card');
    const avail = h - y - 78;
    const hs = items.map((c) => place(ui, g, c, 0, 0, W, false)), pages = paginate(hs, avail); const pg = Math.min(page.rctx, pages.length - 1);
    pages[pg].forEach((i) => { y += place(ui, g, items[i], pad, y, W, true); });
    pager(ui, g, 'rctx', pad, h - 72, W, pg, pages.length);
  });

  function act(id, fx) {
    if (id === 'back') { app.goto(n - 1); return; }
    if (id.startsWith('pg:')) { const [, k, d] = id.split(':'); page[k] = Math.max(0, page[k] + Number(d)); left.dirty = right.dirty = true; return; }
    if (id.startsWith('s3:')) A.perform(id.slice(3), fx);
  }
  // her karede: MRG videosu / ölçüm zamanı için yeniden çiz
  function tick() { if (viewer && store3.view().active === 'mrg') { left.dirty = true; if (viewer.isVideo(store3.view().mrg.tab)) right.dirty = true; } }
  return { left, right, act, tick };
}
