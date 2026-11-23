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
const devScene = Number(params.get('sahne')) || 0; // yalnızca geliştirme: önceki sahneleri tamamlamadan aç (?sahne=2|3)
const app = createApp({ canLeaveScene1: () => devScene >= 2 || store.view().completed, canLeaveScene2: () => devScene >= 3 || exam.view().completed });
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
const ui3 = createUI3(store3, viewer, app, { test: mrgTest });
exam.subscribe(() => ui3.render()); store.subscribe(() => ui3.render());
const b3 = document.getElementById('bekleme3');
b3.muted = true; b3.defaultMuted = true; b3.volume = 0; b3.loop = true;
const patient3 = { idleEl: b3 };
b3.addEventListener('error', () => { b3.hidden = true; const y = document.getElementById('yedek3'); y.src = SAHNE_03.video.yedekKare; y.hidden = false; });
b3.src = SAHNE_03.video.bekleme;
document.getElementById('btn-s3').hidden = true;

for (const id of ['btn-skip1', 'btn-skip2']) document.getElementById(id).addEventListener('click', () => app.goto(3, true));
const sc = { 1: document.getElementById('sahne1'), 2: document.getElementById('sahne2'), 3: document.getElementById('sahne3') };
const heads = { 1: 'sahne-baslik', 2: 's2-baslik', 3: 's3-baslik' };
function applyScene() {
  for (const k of [1, 2, 3]) sc[k].hidden = app.scene !== k;
  document.title = 'Klinik Simülasyon — Sahne 0' + app.scene;
  if (app.scene !== 1) iEl.pause(); else if (store.view().idle) iEl.play().catch(() => {});
  if (app.scene === 3) { b3.play?.().catch(() => {}); ui3.render(); } else { b3.pause?.(); viewer.pause(); }
  if (app.scene === 2) ui2.render();
  document.getElementById(heads[app.scene]).focus();
  window.scrollTo(0, 0);
}
app.subscribe(applyScene);
if (devScene >= 2) app.goto(devScene);

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
    vrScene = vrMod.createVRScene({ store, exam, app, store3, viewer }, patient, { patient2, patient3, fallbackImage: data.video.yedekKare, firstFrame: data.video.ilkKare });
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
      try { await xr.enter(); } catch (e) { const t = app.scene === 2 ? ui2.el.bitti : app.scene === 3 ? document.getElementById('btn-geri3') : ui.el.status; t.textContent = 'VR oturumu başlatılamadı: ' + (e.message || e); }
    };
    for (const id of ['btn-vr', 'btn-vr2', 'btn-vr3']) { const b = document.getElementById(id); b.hidden = false; b.addEventListener('click', enterVR); }
  }
})();

window.__sahne = { store, data, app, exam, store3, viewer, ui3, cfg3 }; // yalnızca hata ayıklama / test
