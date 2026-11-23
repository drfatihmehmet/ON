// Sahne 02 masaüstü arayüzü. Yalnızca exam store'u okur ve eylem çağırır.
import { drawVisual } from './visuals.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createUI2(exam, app, { basvuru }) {
  const data = exam.data;
  const root = $('sahne2');
  const el = {
    baslik: $('s2-baslik'), gorev: $('s2-gorev'), geri: $('btn-geri'), gruplar: $('s2-gruplar'), kutu: $('s2-visual-kutu'),
    canvas: $('s2-canvas'), aciklama: $('s2-aciklama'), task: $('s2-gorev-alani'), kartlar: $('s2-kartlar'),
    notBtn: $('s2-not-btn'), not: $('s2-not'), bitti: $('s2-bitti'), oyku: $('s2-oyku'), oykuBaslik: $('s2-oyku-baslik'),
    video: $('bekleme2'), yedek: $('yedek2'),
  };
  const g = el.canvas.getContext('2d');

  el.baslik.textContent = data.baslik;
  el.gorev.textContent = 'Göreviniz: ' + data.gorev;
  $('s2-panel-baslik').textContent = data.panelBaslik;
  el.geri.textContent = data.geriDugme;
  el.oykuBaslik.textContent = data.oykuBaslik;
  root.querySelector('.b-yer').textContent = basvuru.yer;
  root.querySelector('.b-hasta').textContent = basvuru.hasta;
  root.querySelector('.b-soz').textContent = '“' + basvuru.soz + '”';
  el.geri.addEventListener('click', () => app.goto(1));

  // ---- işlem düğmeleri (bir kez kurulur) ----
  const ops = {}, groups = {};
  data.gruplar.forEach((gr) => {
    const box = document.createElement('div'); box.className = 'grup'; box.dataset.grup = gr.id;
    box.innerHTML = `<h3>${esc(gr.baslik)}</h3><div class="islemler"></div>`;
    gr.islemler.forEach((op) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'op'; b.dataset.op = op.id;
      b.innerHTML = `<span class="ad">${esc(op.ad)}</span><span class="ok" aria-hidden="true"></span>`;
      b.addEventListener('click', () => exam.run(op.id));
      box.querySelector('.islemler').appendChild(b); ops[op.id] = b;
    });
    el.gruplar.appendChild(box); groups[gr.id] = box;
  });
  el.notBtn.addEventListener('click', () => exam.toggleNotes());

  // Odağı koruyarak yeniden yaz (etkileşimli düğmeler içeren alan)
  function setHTML(node, html) {
    const k = document.activeElement && node.contains(document.activeElement) ? document.activeElement.dataset.k : null;
    node.innerHTML = html;
    if (k) node.querySelector(`[data-k="${k}"]`)?.focus();
  }
  const bind = (node, sel, fn) => node.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => fn(b.dataset.v)));

  let lastDesc = '';
  function render() {
    const v = exam.view();
    // işlem işaretleri
    const mark = (id, done, current) => {
      const b = ops[id]; if (!b) return;
      b.classList.toggle('done', !!done); b.classList.toggle('current', !!current);
      b.querySelector('.ok').textContent = done ? '✓ Yapıldı' : '';
      b.setAttribute('aria-label', data.gruplar.flatMap((x) => x.islemler).find((o) => o.id === id).ad + (done ? ' — yapıldı' : ''));
    };
    mark('gorme', v.done.gorme, v.active === 'gorme');
    mark('renk', v.done.renk, v.active === 'renk');
    mark('sol', v.pupil.observedSol, v.active === 'pupilla' && v.pupil.lit === 'sol');
    mark('sag', v.pupil.observedSag, v.active === 'pupilla' && v.pupil.lit === 'sag');
    mark('fundus', v.done.fundus, v.active === 'fundus');
    mark('plan', v.done.plan, v.active === 'plan');
    mark('birlestir', v.integCorrect, v.active === 'birlestir');
    groups.birlestir.hidden = !v.integAvail;

    // görsel kutusu
    el.kutu.hidden = !v.visual;
    if (v.visual && v.visual.aciklama !== lastDesc) { lastDesc = v.visual.aciklama; el.aciklama.textContent = lastDesc; el.canvas.setAttribute('aria-label', lastDesc); }

    // görev alanı
    setHTML(el.task, renderTask(v));
    bind(el.task, '[data-k^="pq"]', (id) => exam.answerPupil(id));
    bind(el.task, '[data-k^="pl"]', (id) => exam.togglePlan(id));
    bind(el.task, '[data-k^="iq"]', (id) => exam.answerInteg(id));

    // kartlar (türleri ayrı)
    el.kartlar.innerHTML = v.cards.map(card).join('');

    // muayene notu
    el.notBtn.setAttribute('aria-expanded', String(v.notesOpen));
    el.not.hidden = !v.notesOpen;
    if (v.notesOpen) {
      el.not.innerHTML = `<h3>${esc(data.notBaslik)}</h3>` + (v.note.lines.length ? `<p>${esc(v.note.paragraph)}</p>` : `<p class="empty">${esc(data.notBos)}</p>`);
    }
    el.bitti.textContent = v.completed ? data.tamamlandi : '';

    // Sahne 01 öyküsü
    el.oyku.textContent = v.history || data.oykuYok;
  }

  function card(c) {
    const kt = data.kartTurleri[c.kind].baslik;
    let body;
    if (c.kind === 'yanit') body = `<blockquote>“${esc(c.text)}”</blockquote>`;
    else if (c.list?.length) body = `<ul>${c.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    else body = `<p class="t">${esc(c.text)}</p>`;
    return `<article class="card ${c.kind}"><p class="k">${esc(kt)}</p>${body}</article>`;
  }

  function renderTask(v) {
    if (v.active === 'pupilla') {
      if (!v.pupil.questionAvailable) {
        const s = (ok) => (ok ? '✓ gözlendi' : 'henüz yeterince izlenmedi');
        return `<p class="hint2">${esc(data.pupilla.yonerge)}</p><p class="hint2">Hastanın solu: ${s(v.pupil.observedSol)} · Hastanın sağı: ${s(v.pupil.observedSag)}</p>`;
      }
      return `<p class="q-text">${esc(data.pupilla.soru)}</p><div class="opts" role="group" aria-label="${esc(data.pupilla.soru)}">` +
        data.pupilla.secenekler.map((o) => `<button type="button" class="opt" data-k="pq-${o.id}" data-v="${o.id}" aria-pressed="${v.pupil.answer === o.id}">${esc(o.ad)}</button>`).join('') + '</div>';
    }
    if (v.active === 'plan') {
      return `<p class="q-text">${esc(data.plan.soru)}</p><div class="opts" role="group" aria-label="Muayene başlıkları">` +
        data.plan.secenekler.map((o) => { const on = v.planSelected.includes(o.id);
          return `<button type="button" class="opt" role="checkbox" data-k="pl-${o.id}" data-v="${o.id}" aria-checked="${on}"><span class="box" aria-hidden="true">${on ? '✓' : ''}</span>${esc(o.ad)}</button>`; }).join('') + '</div>';
    }
    if (v.active === 'birlestir') {
      return `<p class="q-text">${esc(data.birlestir.soru)}</p><div class="opts" role="group" aria-label="Seçenekler">` +
        data.birlestir.secenekler.map((o) => `<button type="button" class="opt" data-k="iq-${o.id}" data-v="${o.id}" aria-pressed="${v.integChoice === o.id}">${esc(o.ad)}</button>`).join('') + '</div>';
    }
    if (!v.active) return '<p class="hint2">Bir muayene işlemi seçin. İşlemleri istediğiniz sırada yapabilir, tekrar inceleyebilirsiniz.</p>';
    return '';
  }

  // ---- animasyon döngüsü: yalnızca Sahne 02 görünürken ----
  function frame() {
    if (app.scene === 2) {
      exam.tick();
      const v = exam.view();
      if (v.visual) {
        if (v.visual.aciklama !== lastDesc) { lastDesc = v.visual.aciklama; el.aciklama.textContent = lastDesc; el.canvas.setAttribute('aria-label', lastDesc); }
        drawVisual(g, el.canvas.width, el.canvas.height, v.visual, data);
      }
      if (v.pupil.lit && !v.pupil.questionAvailable) {
        // gözlem ilerledikçe yönerge satırını güncelle (yalnızca durum değişince exam.tick emit eder)
      }
    }
    requestAnimationFrame(frame);
  }

  exam.subscribe(render);
  render();
  requestAnimationFrame(frame);

  return { el, render };
}
