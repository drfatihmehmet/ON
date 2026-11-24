// Sahne 03 masaüstü arayüzü: s3-model'i HTML olarak çizer; eylemler ortak `perform` üzerinden store'a gider.
import { buildModel, perform } from './s3-model.js';
import { drawMrg } from './mrg-viewer.js';
import { drawOkb, drawFormula } from './visuals.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createUI3(store, viewer, app, { test = false, n = 3, adapter = null } = {}) {
  const A = adapter || { buildModel: (v) => buildModel(v, store, viewer), perform: (id, frac) => perform(store, viewer, id, frac) };
  const data = store.data;
  const el = { baslik: $(`s${n}-baslik`), gorev: $(`s${n}-gorev`), geri: $(`btn-geri${n}`), time: $(`s${n}-time`), ops: $(`s${n}-ops`), ctx: $(`s${n}-ctx`),
    hasta: $(`s${n}-hasta`), infuzyon: $(`s${n}-infuzyon`), dmf: $(`s${n}-dmf`), mrg: $(`s${n}-mrg`), lab: $(`s${n}-lab`), canvas: $(`s${n}-mrg-canvas`), onceki: $(`s${n}-onceki`), panel: $(`panel${n}`) };
  const g = el.canvas.getContext('2d');
  el.baslik.textContent = data.baslik; el.gorev.textContent = 'Göreviniz: ' + data.gorev; $(`s${n}-panel-baslik`).textContent = data.panelBaslik;
  el.geri.textContent = data.geriDugme; el.geri.addEventListener('click', () => app.goto(n - 1));

  let model = null, lastDraw = [];

  const cardHtml = (c) => {
    const title = c.title || data.kartTurleri[c.kind].baslik;
    const ROZET = { UZL: 'Uzlaşı veya kılavuz metni', DER: 'Derleme, kayıt veya deneyim verisi', 'KÜB': 'Kısa ürün bilgisiyle doğrulanmalı', KURGU: 'Eğitim amaçlı kurgu veri', '?': 'Bilinmeyen veya girilmedi' };
    const tag = c.rozet || c.kaynak ? `<span class="tag">${c.rozet ? `<b title="${esc(ROZET[c.rozet] || c.rozet)}">${esc(c.rozet)}</b> ` : ''}${esc(c.kaynak || '')}</span>` : '';
    const body = c.kind === 'yanit' ? `<blockquote>“${esc(c.text)}”</blockquote>`
      : c.list?.length && c.kind !== 'rapor' ? `<ul>${c.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
      : `<p class="t">${esc(c.text)}</p>`;
    return `<article class="card ${c.kind}${c.rozet === 'KURGU' ? ' kurgu' : ''}"><p class="k">${esc(title)}</p>${body}${tag}</article>`;
  };
  const btnHtml = (b) => `<button type="button" class="op${b.on ? ' on' : ''}${b.primary ? ' prim' : ''}" data-act="${esc(b.id)}" ${b.disabled ? 'disabled' : ''} aria-pressed="${!!b.on}">` +
    `<span class="ad">${esc(b.label)}${b.caret ? `<span class="caret" aria-hidden="true">${b.on ? '▾' : '▸'}</span>` : ''}</span>${b.badge ? `<span class="st ok">${esc(b.badge)}</span>` : ''}</button>`;

  function widgetHtml(w) {
    switch (w.t) {
      case 'h': return `<h3>${esc(w.text)}</h3>`;
      case 'p': return `<p class="w-p ${w.tone || ''}">${esc(w.text)}</p>`;
      case 'card': return cardHtml(w);
      case 'row': return `<div class="wrow">${w.btns.map(btnHtml).join('')}</div>`;
      case 'check': return `<button type="button" class="opt${w.on ? ' on' : ''}" role="checkbox" aria-checked="${!!w.on}" data-act="${esc(w.id)}" ${w.disabled ? 'disabled' : ''}><span class="box" aria-hidden="true">${w.on ? '✓' : ''}</span>${esc(w.label)}</button>`;
      case 'table': return `<table class="w-table"><thead><tr>${w.head.map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${w.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      case 'canvas': return `<canvas class="w-canvas" width="900" height="450" data-draw="${w.draw}" role="img" aria-label="${w.draw === 'okb' ? `Öğretici örnek: OKB Tip ${w.tip}` : 'IgG indeksi formülü'}"></canvas>`;
      case 'scrub': return `<div class="w-scrub"><input type="range" min="0" max="1000" value="${Math.round((w.frac || 0) * 1000)}" data-scrub aria-label="Zaman çubuğu"><span class="w-p muted" data-scrub-label>${esc(w.label)}</span></div>`;
      case 'text': return `<label class="w-p muted" for="t-${esc(w.id)}">${esc(w.label)}</label><textarea class="w-text" id="t-${esc(w.id)}" data-ans="${esc(w.id.split(':')[1])}">${esc(w.value)}</textarea>`;
      default: return '';
    }
  }

  function leftHtml(L) {
    const rows = L.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('');
    const extra = L.extra?.length ? `<ul class="ex">${L.extra.map((x) => `<li><span>${esc(x.ad)}</span><span class="dur${x.durum === data.durum.sonuclandi ? ' ok' : ''}">${esc(x.durum)}</span></li>`).join('')}</ul>` : '';
    return `<div class="labtable"><h3>${esc(L.baslik)}</h3><p class="et">${esc(L.etiket)}</p><table><thead><tr>${L.head.map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>${extra}</div>`;
  }

  function render() {
    const v = store.view();
    model = A.buildModel(v);
    // sol görünüm
    el.hasta.hidden = model.left.kind !== 'hasta'; if (el.infuzyon) el.infuzyon.hidden = model.left.kind !== 'infuzyon'; if (el.dmf) el.dmf.hidden = model.left.kind !== 'dmf'; el.mrg.hidden = model.left.kind !== 'mrg'; el.lab.hidden = model.left.kind !== 'lab';
    if (model.left.kind === 'lab') el.lab.innerHTML = leftHtml(model.left);
    // önceki muayene
    const pv = model.prev;
    el.onceki.innerHTML = `<p class="k">${esc(data.oncekiMuayene.baslik)}</p><p>${esc(data.olguBaglami)}</p><p>${esc(pv.note || data.oncekiMuayene.bos)}</p>`;
    // zaman ve eylemler
    el.time.hidden = !model.time;
    if (model.time) el.time.innerHTML = `<span>${esc(model.time.label)}: <b>${model.time.day}</b></span>`;
    el.ops.innerHTML = model.ops.map((o, i) => `<button type="button" class="op${o.on ? ' current' : ''}" data-act="op:${o.id}" aria-pressed="${o.on}"><span class="ad">${i + 1}. ${esc(o.ad)}</span>${o.status ? `<span class="st${/Sonuçlandı|Doz/.test(o.status) ? ' ok' : ''}">${esc(o.status)}</span>` : ''}</button>`).join('') +
      (model.extraOps || []).map((o) => `<button type="button" class="op${o.on ? ' current' : ''}" data-act="op:${o.id}"><span class="ad">${esc(o.ad)}</span></button>`).join('');
    // bağlam (odağı koru)
    const ae = document.activeElement; const key = ae && el.panel.contains(ae) ? (ae.dataset.act || (ae.dataset.ans != null ? 'ans' + ae.dataset.ans : null)) : null;
    const typing = ae && ae.tagName === 'TEXTAREA';
    if (!typing) {
      el.ctx.innerHTML = model.widgets.map(widgetHtml).join('');
      el.ctx.querySelectorAll('canvas[data-draw]').forEach((c, i) => {
        const w = model.widgets.filter((x) => x.t === 'canvas')[i]; const cg = c.getContext('2d');
        if (w.draw === 'okb') drawOkb(cg, c.width, c.height, w.tip, w.etiket); else drawFormula(cg, c.width, c.height, w.f);
      });
      if (key) (el.panel.querySelector(`[data-act="${CSS.escape(key)}"]`) || el.panel.querySelector(`[data-ans="${key.replace('ans', '')}"]`))?.focus();
    }
    document.dispatchEvent(new CustomEvent('s3-render'));
  }

  // ---- olaylar (delegasyon) ----
  el.panel.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; A.perform(b.dataset.act); });
  el.panel.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-scrub]')) { A.perform('scrub', Number(t.value) / 1000); return; }
    if (t.matches('[data-ans]')) { store.setAnswer(Number(t.dataset.ans), t.value, true); const b = el.panel.querySelector('[data-act="save"]'); if (b) b.disabled = !store.view().kayit.canSave; }
  });
  // MRG klavye: ← → kesit, boşluk oynat/duraklat
  el.mrg.addEventListener('keydown', () => {});
  document.addEventListener('keydown', (e) => {
    if (!viewer || app.scene !== n || store.view().active !== 'mrg' || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const tab = store.view().mrg.tab;
    if (e.key === 'ArrowRight') { viewer.isVideo(tab) ? viewer.seekBy(tab, 1) : A.perform('sl:+1'); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { viewer.isVideo(tab) ? viewer.seekBy(tab, -1) : A.perform('sl:-1'); e.preventDefault(); }
    else if (e.key === ' ' && viewer.isVideo(tab)) { viewer.toggle(tab); e.preventDefault(); }
  });

  // ---- tuval döngüsü ----
  function frame() {
    if (viewer && app.scene === n && model?.left.kind === 'mrg') {
      const v = store.view(), tab = v.mrg.tab;
      drawMrg(g, 0, 0, el.canvas.width, el.canvas.height, { viewer, tab, slice: v.mrg.slice[tab], v, data, test });
      const sc = el.ctx.querySelector('[data-scrub]');
      if (sc && viewer.isVideo(tab) && document.activeElement !== sc) {
        const r = viewer.range(tab); if (r && r.hi > r.lo) { sc.value = Math.round(((viewer.time(tab) - r.lo) / (r.hi - r.lo)) * 1000); }
        const lab = el.ctx.querySelector('[data-scrub-label]'); if (lab) lab.textContent = `${(viewer.time(tab) - r.lo).toFixed(1).replace('.', ',')} / ${(r.hi - r.lo).toFixed(1).replace('.', ',')} sn`;
        const pb = el.ctx.querySelector('[data-act="play"] .ad'); if (pb) { const t = viewer.playing(tab) ? 'Duraklat' : 'Oynat'; if (pb.textContent !== t) pb.textContent = t; }
      }
    }
    requestAnimationFrame(frame);
  }
  store.subscribe(render); render(); requestAnimationFrame(frame);
  return { el, render, getModel: () => model };
}
