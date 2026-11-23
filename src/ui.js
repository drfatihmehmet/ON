// Masaüstü / dar ekran HTML arayüzü. Yalnızca store'u okur ve eylem çağırır.

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createUI(store, video, { onNext } = {}) {
  const data = store.data;
  const el = {
    video: $('hasta'), yedek: $('yedek'), bos: $('bos'), vr: $('btn-vr'), status: $('status'),
    lock: $('lock'), body: $('panel-body'), qlist: $('qlist'), answer: $('answer'),
    notesBtn: $('btn-notes'), notesCount: $('notes-count'), notesNew: $('notes-yeni'),
    notes: $('notes'), pages: $('pages'), pgOyku: $('page-oyku'), pgEgitici: $('page-egitici'),
    tabOyku: $('tab-oyku'), tabEgitici: $('tab-egitici'), prev: $('pg-prev'), next: $('pg-next'), dots: $('pdots'), finish: $('btn-finish'), finishHint: $('finish-hint'), summary: $('summary'),
  };

  $('sahne-baslik').textContent = data.baslik;
  $('gorev').textContent = 'Göreviniz: ' + data.gorev;
  document.querySelector('.b-yer').textContent = data.basvuru.yer;
  document.querySelector('.b-hasta').textContent = data.basvuru.hasta;
  document.querySelector('.b-soz').textContent = '“' + data.basvuru.soz + '”';

  // Soru düğmeleri bir kez kurulur; sonraki güncellemeler yerinde yapılır (odak kaybolmaz).
  const qbtns = data.sorular.map((q, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'q' + (q.zorunlu === false ? ' ek' : ''); b.dataset.id = q.id;
    b.innerHTML = `<span class="num" aria-hidden="true">${i + 1}</span><span class="qt">${esc(q.soru)}</span><span class="mark" aria-hidden="true"></span>`;
    b.addEventListener('click', () => store.ask(q.id));
    li.appendChild(b); el.qlist.appendChild(li);
    return b;
  });

  el.notesBtn.addEventListener('click', () => store.toggleNotes());
  el.tabOyku.addEventListener('click', () => store.setNotePage(0));
  el.tabEgitici.addEventListener('click', () => store.setNotePage(1));
  el.prev.addEventListener('click', () => store.stepNotePage(-1));
  el.next.addEventListener('click', () => store.stepNotePage(1));
  // Yana kaydırma (dokunma / izleme dörtgeni / tekerlek): kaydırma bitince sayfa durumu güncellenir
  let scrollTimer = null;
  el.pages.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const w = el.pages.clientWidth; if (!w) return;
      const idx = Math.round(el.pages.scrollLeft / w);
      if (idx !== store.view().notePage) { shownPage = idx; store.setNotePage(idx); }
    }, 90);
  });
  el.pages.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { store.stepNotePage(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { store.stepNotePage(-1); e.preventDefault(); }
  });
  let shownPage = -1, wasOpen = false;
  el.finish.addEventListener('click', () => {
    if (store.complete()) { el.summary.tabIndex = -1; el.summary.focus(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= data.sorular.length && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
      if (store.ask(data.sorular[n - 1].id)) e.preventDefault();
    }
  });

  let lastSeq = -1;
  function render() {
    const v = store.view();

    // sahne durumu
    el.status.textContent = v.phase !== 'ready' ? ''
      : v.videoMissing ? 'Hasta videosu bulunamadı; öykü almaya yine de devam edebilirsiniz.'
      : 'Hasta yanınızda. Öykü almaya başlayabilirsiniz.';

    // panel
    el.body.hidden = false; // panel baştan açık
    el.lock.hidden = true;

    qbtns.forEach((b, i) => {
      const id = data.sorular[i].id, asked = v.asked.has(id);
      b.classList.toggle('asked', asked);
      b.classList.toggle('current', v.current?.id === id);
      b.querySelector('.mark').textContent = asked ? '✓ Soruldu' : '';
      b.setAttribute('aria-label', `${i + 1}. ${data.sorular[i].soru}${asked ? ' — soruldu, yanıtı tekrar okumak için seçin' : ''}`);
      if (v.current?.id === id) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });

    // hasta yanıtı (yalnızca seçim değişince yeniden yaz → ekran okuyucu tekrar okur)
    if (v.current && v.seq !== lastSeq) {
      lastSeq = v.seq;
      el.answer.innerHTML = renderAnswer(v.current);
    }

    // birleşik Notlar paneli: yana kayan sayfalar (Öykü notları · Eğitici not)
    el.notesBtn.setAttribute('aria-expanded', String(v.notesOpen));
    el.notesCount.textContent = v.askedCount ? `(${v.askedCount}/${v.total})` : '';
    el.notesNew.hidden = !v.teachingNew;
    el.notes.hidden = !v.notesOpen;
    el.tabEgitici.hidden = !v.teachingAvailable;
    el.pgEgitici.hidden = !v.teachingAvailable;
    el.pgOyku.innerHTML = renderNotes(v);
    el.pgEgitici.innerHTML = v.teachingAvailable ? `<h3>${esc(data.egiticiNot.baslik)}</h3><p>${esc(data.egiticiNot.metin)}</p>` : '';
    [el.tabOyku, el.tabEgitici].forEach((t, i) => { t.setAttribute('aria-selected', String(v.notePage === i)); t.tabIndex = v.notePage === i ? 0 : -1; t.classList.toggle('on', v.notePage === i); });
    el.prev.disabled = v.notePage === 0; el.next.disabled = v.notePage >= v.notePages.length - 1;
    el.prev.hidden = el.next.hidden = v.notePages.length < 2;
    el.dots.innerHTML = v.notePages.map((_, i) => `<span class="d${i === v.notePage ? ' on' : ''}"></span>`).join('');
    el.dots.hidden = v.notePages.length < 2;
    if (v.notesOpen && (!wasOpen || shownPage !== v.notePage)) {
      const go = () => { const w = el.pages.clientWidth; if (w) el.pages.scrollTo({ left: v.notePage * w, behavior: wasOpen ? 'smooth' : 'auto' }); shownPage = v.notePage; };
      requestAnimationFrame(go);
    }
    wasOpen = v.notesOpen;

    // tamamla
    el.finish.disabled = !v.canComplete;
    el.finish.hidden = v.completed;
    el.finishHint.hidden = v.completed;
    el.finishHint.textContent = v.canComplete ? 'Tüm sorular soruldu.' : `${v.askedCount}/${v.total} soru soruldu. Tamamlamak için öykü sorularının hepsini sorun.`;

    el.summary.hidden = !v.completed;
    if (v.completed) {
      el.summary.innerHTML = `<h3>Topladığınız öykü</h3><p>${esc(v.summary)}</p><p class="next">${esc(data.sonuc.sonrakiSahne)}</p><button type="button" class="btn primary go" id="btn-next">${esc(data.sonuc.gecisDugme)}</button>`;
    }
  }

  function renderAnswer(q) {
    const head = `<p class="a-q">${esc(q.soru)}</p>`;
    const theory = q.teori ? `<div class="theory"><p class="t-label">Teorik bilgi</p><p>${esc(q.teori)}</p></div>` : '';
    if (q.tur === 'egitici') {
      return `<p class="a-label">${esc(q.baslikEtiketi || 'Eğitmen yanıtı')}</p>${head}<ul class="dx">${q.liste.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${theory}`;
    }
    return `<p class="a-label">Hastanın yanıtı</p>${head}<blockquote>“${esc(q.yanit)}”</blockquote>${theory}`;
  }

  function renderNotes(v) {
    if (!v.askedCount) return '<p class="empty">Henüz öğrenilen bir bilgi yok. Hastaya soru sordukça burada kısa klinik notlar birikir.</p>';
    let h = '';
    if (v.timeline.length) {
      h += '<h3>Zaman çizelgesi</h3><ul>' +
        v.timeline.map((n) => `<li class="tl"><b>${esc(n.etiket)}</b><span>${esc(n.metin)}</span></li>`).join('') + '</ul>';
    }
    if (v.facts.length) {
      h += '<h3>Öykü bilgileri</h3><ul>' +
        v.facts.map((n) => `<li class="fk"><b>${esc(n.etiket)}:</b> ${esc(n.metin)}</li>`).join('') + '</ul>';
    }
    return h;
  }

  el.summary.addEventListener('click', (e) => { if (e.target.closest('#btn-next')) onNext?.(); });
  store.subscribe(render);
  render();

  return {
    el,
    showVRButton(fn) { el.vr.hidden = false; el.vr.addEventListener('click', fn); },
    setMedia({ mode }) {
      // mode: 'video' | 'yedek' | 'yok'
      el.video.hidden = mode !== 'video' || el.video.dataset.gizli === '1';
      el.yedek.hidden = mode !== 'yedek';
      el.bos.hidden = mode !== 'yok';
    },
  };
}
