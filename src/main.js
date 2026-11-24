import { SAHNE_01 } from './scene-data.js';
import { createStore } from './state.js';
import { createUI } from './ui.js';
import { SAHNE_02 } from './scene02-data.js';
import { createApp, createExamStore } from './exam-state.js';
import { createUI2 } from './ui2.js';
import { SAHNE_03 } from './scene03-data.js';
import { OLGU_YAPILANDIRMA } from './scene03-config.js';
import { createCaseStore } from './case-state.js';
import { createMrgViewer } from './mrg-viewer.js';
import { createUI3 } from './ui3.js';
import { buildModel, perform } from './s3-model.js';
import { createDecisionStore } from './ds-engine.js';
import { SAHNE_04 } from './scene04-data.js';
import { SAHNE_05 } from './scene05-data.js';
import { SAHNE_06 } from './scene06-data.js';

const params = new URLSearchParams(location.search);
const data = SAHNE_01;
const store = createStore(data);

// Test için: ?video=yok → video dosyası bulunmuyormuş gibi davranır.
const videoSrc = params.get('video') === 'yok' ? 'assets/__yok__.mp4' : data.video.src;

// ---- hasta videosu: bir kez, sessiz, özgün hız; bitince son kare kalır ----
const vEl = document.getElementById('hasta');
vEl.muted = true; vEl.defaultMuted = true; vEl.volume = 0;
vEl.loop = false; vEl.controls = false; vEl.playbackRate = 1;
vEl.poster = data.video.ilkKare;
// Bekleme klibi: karşılaşma bitince aynı yerde döngüyle oynar (sessiz). Yoksa son kare kalır.
const iEl = document.getElementById('bekleme');
iEl.muted = true; iEl.defaultMuted = true; iEl.volume = 0; iEl.loop = true;
const idleSrc = params.get('bekleme') === 'yok' ? 'assets/__yok__.mp4' : data.video.bekleme;
let idleBroken = false;
iEl.addEventListener('error', () => { idleBroken = true; });
iEl.src = idleSrc;
const patient = {
  el: vEl,
  idleEl: iEl,
  start() { store.start(); },
};
function startIdle() {
  if (idleBroken) return; // son kare ekranda kalır
  const p = iEl.play();
  const swap = () => { vEl.style.visibility = 'hidden'; store.setIdle(true); };
  if (p && p.then) p.then(swap).catch(() => {}); else swap();
}
store.hooks.play = () => {
  vEl.currentTime = 0;
  const p = vEl.play();
  if (p && p.catch) p.catch((e) => {
    // Otomatik oynatma engellenirse ilk kullanıcı etkileşiminde başlat; başka hatada akışı kilitleme.
    if (e && e.name === 'NotAllowedError') {
      const again = () => { removeEventListener('pointerdown', again); removeEventListener('keydown', again); vEl.play().catch(() => store.setVideoMissing()); };
      addEventListener('pointerdown', again); addEventListener('keydown', again);
    } else store.setVideoMissing();
  });
};
vEl.addEventListener('ended', () => { store.videoEnded(); startIdle(); }); // currentTime sıfırlanmaz → son kare ekranda kalır
vEl.addEventListener('error', () => { ui.setMedia({ mode: 'yedek' }); store.setVideoMissing(); loadFallback(); });
vEl.src = videoSrc;

// ---- Sahne 02 ve yönlendirme ----
const devScene = Number(params.get('sahne')) || 0; // yalnızca geliştirme: önceki sahneleri tamamlamadan aç (?sahne=2…6)
const stores = {}; // 4–6: karar sahnesi store'ları
const app = createApp({ gates: {
  2: () => devScene >= 2 || store.view().completed,
  3: () => devScene >= 3 || exam.view().completed,
  4: () => devScene >= 4 || store3.view().kayit.saved,
  5: () => devScene >= 5 || stores[4].saved(),
  6: () => devScene >= 6 || stores[5].saved(),
} });
const exam = createExamStore(SAHNE_02, { history: () => (store.view().completed ? store.view().summary : '') });

const ui = createUI(store, patient, { onNext: () => app.goto(2) });
store.start(); // karşılaşma kendiliğinden başlar

// Sahne 02'nin görseli: yarık lamba muayenesi (statik görüntü)
const img2 = document.getElementById('yedek2');
const patient2 = { imageUrl: SAHNE_02.video.gorsel, missing: false };
img2.addEventListener('error', () => { patient2.missing = true; });
const ui2 = createUI2(exam, app, { basvuru: data.basvuru, gecisMetni: SAHNE_03.gecisDugme });
store.subscribe(() => ui2.render());

// ---- Sahne 03: tetkik, akut tedavi, izlem ----
// ?mrgtest=1 → MRG görüntüleyiciyi TEST DESENİYLE dener (hastaya ait görüntü DEĞİLDİR; arayüzde etiketlenir).
const mrgTest = params.has('mrgtest');
const cfg3 = mrgTest ? {
  ...OLGU_YAPILANDIRMA,
  mrg: { beyin: { tur: 'kesit', dosyalar: [1, 2, 3, 4, 5].map((i) => 'tests/fixtures/mrg-test/k0' + i + '.png') }, servikal: { tur: 'video', dosya: 'tests/fixtures/mrg-test/video.mp4' } },
  isaretler: { beyin: [{ kesit: 2, x: 0.5, y: 0.5, etiket: 'test işareti' }], servikal: [] },
} : OLGU_YAPILANDIRMA;
const store3 = createCaseStore(SAHNE_03, cfg3, { prev: () => ({ note: exam.view().note.paragraph, history: store.view().completed ? store.view().summary : '' }) });
const viewer = createMrgViewer(store3);
viewer.markers = cfg3.isaretler;
const adapter3 = { buildModel: (v) => buildModel(v, store3, viewer), perform: (id, frac) => (id === 'goto4' ? app.goto(4) : perform(store3, viewer, id, frac)) };
const ui3 = createUI3(store3, viewer, app, { test: mrgTest, adapter: adapter3 });
const uis = { 3: ui3 };
exam.subscribe(() => ui3.render()); store.subscribe(() => ui3.render());
const videos = {}, scenes = { 3: { store: store3, adapter: adapter3, viewer } };
function hastaVideo(n) {
  const el = document.getElementById('bekleme' + n);
  el.muted = true; el.defaultMuted = true; el.volume = 0; el.loop = true;
  el.addEventListener('error', () => { el.hidden = true; const y = document.getElementById('yedek' + n); y.src = SAHNE_03.video.yedekKare; y.hidden = false; });
  el.src = SAHNE_03.video.bekleme; videos[n] = el;
}
hastaVideo(3);
document.getElementById('btn-s3').hidden = true;

// ---- Sahne 04–06: karar sahneleri (veri tanımı + ortak motor) ----
const defs = { 4: SAHNE_04, 5: SAHNE_05, 6: SAHNE_06 };
const tpl = document.getElementById('sahne3').outerHTML;
for (const n of [4, 5, 6]) {
  const html = tpl.replace(/(id|aria-labelledby|aria-controls|for)="s3-/g, '$1="s' + n + '-')
    .replace('id="sahne3"', 'id="sahne' + n + '"').replace('id="panel3"', 'id="panel' + n + '"')
    .replace('id="btn-geri3"', 'id="btn-geri' + n + '"').replace('id="btn-vr3"', 'id="btn-vr' + n + '"')
    .replace('id="bekleme3"', 'id="bekleme' + n + '"').replace('id="yedek3"', 'id="yedek' + n + '"');
  document.getElementById('sahne' + (n - 1)).insertAdjacentHTML('afterend', html);
}
for (const n of [4, 5, 6]) {
  const def = defs[n];
  const st = createDecisionStore(def, cfg3, { prev: () => ({ note: exam.view().note.paragraph }), onNext: n < 6 ? () => app.goto(n + 1) : null });
  stores[n] = st;
  const adapter = { buildModel: () => st.model(), perform: (id) => st.perform(id) };
  uis[n] = createUI3(st, null, app, { n, adapter });
  scenes[n] = { store: st, adapter };
  hastaVideo(n);
  exam.subscribe(() => uis[n].render());
}
// Sahne geçişi gezinme çubuğu (her zaman kullanılabilir)
const nav = document.getElementById('sahne-nav');
nav.innerHTML = [1, 2, 3, 4, 5, 6].map((n) => '<button type="button" class="nb" data-n="' + n + '" aria-label="Sahne ' + n + '">' + n + '</button>').join('');
nav.addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) app.goto(Number(b.dataset.n), true); });

const sc = { 1: document.getElementById('sahne1'), 2: document.getElementById('sahne2') };
const heads = { 1: 'sahne-baslik', 2: 's2-baslik' };
for (const n of [3, 4, 5, 6]) { sc[n] = document.getElementById('sahne' + n); heads[n] = 's' + n + '-baslik'; }
const SAHNE_SAYISI = 6;
function applyScene() {
  for (let k = 1; k <= SAHNE_SAYISI; k++) sc[k].hidden = app.scene !== k;
  document.title = 'Klinik Simülasyon — Sahne 0' + app.scene;
  nav.querySelectorAll('.nb').forEach((b) => (Number(b.dataset.n) === app.scene ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  if (app.scene !== 1) iEl.pause(); else if (store.view().idle) iEl.play().catch(() => {});
  for (const k of Object.keys(videos)) { if (Number(k) === app.scene) videos[k].play?.().catch(() => {}); else videos[k].pause?.(); }
  if (app.scene !== 3) viewer.pause();
  if (uis[app.scene]) uis[app.scene].render();
  if (app.scene === 2) ui2.render();
  document.getElementById(heads[app.scene]).focus();
  window.scrollTo(0, 0);
}
app.subscribe(applyScene);
if (devScene >= 2) app.goto(devScene);
applyScene();

function loadFallback() {
  const img = document.getElementById('yedek');
  img.onerror = () => ui.setMedia({ mode: 'yok' });
  img.src = data.video.yedekKare;
}
ui.setMedia({ mode: 'video' });

// ---- VR (Three.js yalnızca gerektiğinde yüklenir) ----
let vrMod = null, vrScene = null;
async function getVR() {
  if (!vrScene) {
    vrMod = await import('./vr.js');
    vrScene = vrMod.createVRScene({ store, exam, app, scenes }, patient, { patient2, patients: videos, fallbackImage: data.video.yedekKare, firstFrame: data.video.ilkKare });
    window.__sahne.vr = vrScene; // hata ayıklama / test
  }
  return vrScene;
}

(async () => {
  if (params.has('vronizleme')) {
    // Gözlüksüz 3B önizleme: aynı VR sahnesi, fareyle ışın
    const host = document.getElementById('vr-onizleme');
    const vr = await getVR();
    host.hidden = false;
    const pv = vrMod.mountPreview(vr, host);
    document.getElementById('vr-onizleme-kapat').addEventListener('click', () => { pv.stop(); host.hidden = true; });
  }
  const mod = await import('./vr.js');
  if (await mod.xrSupported()) {
    const enterVR = async () => {
      const vr = await getVR();
      const xr = mod.createXRSession(vr, { onEnd: () => {} });
      try { await xr.enter(); } catch (e) { const t = app.scene === 2 ? ui2.el.bitti : app.scene >= 3 ? document.getElementById('btn-geri' + app.scene) : ui.el.status; t.textContent = 'VR oturumu başlatılamadı: ' + (e.message || e); }
    };
    for (const id of ['btn-vr', 'btn-vr2', 'btn-vr3', 'btn-vr4', 'btn-vr5', 'btn-vr6']) { const b = document.getElementById(id); b.hidden = false; b.addEventListener('click', enterVR); }
  }
})();

window.__sahne = { store, data, app, exam, store3, viewer, ui3, cfg3, stores, uis }; // yalnızca hata ayıklama / test
