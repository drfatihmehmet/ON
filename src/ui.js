// Masaüstü / dar ekran HTML arayüzü. Yalnızca store'u okur ve eylem çağırır.

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createUI(store, video) {
  const data = store.data;
  const el = {
    video: $('hasta'), yedek: $('yedek'), bos: $('bos'), vr: $('btn-vr'), status: $('status'),
    lock: $('lock'), body: $('panel-body'), qlist: $('qlist'), answer: $('answer'),
    notesBtn: $('btn-notes'), notesCount: $('notes-count'), teachBtn: $('btn-teach'),
    notes: $('notes'), teach: $('teach'), finish: $('btn-finish'), finishHint: $('finish-hint'), summary: $('summary'),
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
  el.teachBtn.addEventListener('click', () => store.toggleTeaching());
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

    // öykü notları
    el.notesBtn.setAttribute('aria-expanded', String(v.notesOpen));
    el.notesCount.textContent = v.askedCount ? `(${v.askedCount}/${v.total})` : '';
    el.notes.hidden = !v.notesOpen;
    if (v.notesOpen) el.notes.innerHTML = renderNotes(v);

    // eğitici not
    el.teachBtn.hidden = !v.teachingAvailable;
    el.teachBtn.setAttribute('aria-expanded', String(v.teachingOpen));
    el.teach.hidden = !v.teachingOpen;
    if (v.teachingOpen) el.teach.innerHTML = `<h3>${esc(data.egiticiNot.baslik)}</h3><p>${esc(data.egiticiNot.metin)}</p>`;

    // tamamla
    el.finish.disabled = !v.canComplete;
    el.finish.hidden = v.completed;
    el.finishHint.hidden = v.completed;
    el.finishHint.textContent = v.canComplete ? 'Tüm sorular soruldu.' : `${v.askedCount}/${v.total} soru soruldu. Tamamlamak için öykü sorularının hepsini sorun.`;

    el.summary.hidden = !v.completed;
    if (v.completed) {
      el.summary.innerHTML = `<h3>Topladığınız öykü</h3><p>${esc(v.summary)}</p><p class="next">${esc(data.sonuc.sonrakiSahne)}</p>`;
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
