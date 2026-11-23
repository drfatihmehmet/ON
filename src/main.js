import { SAHNE_01 } from './scene-data.js';
import { createStore } from './state.js';
import { createUI } from './ui.js';
import { SAHNE_02 } from './scene02-data.js';
import { createApp, createExamStore } from './exam-state.js';
import { createUI2 } from './ui2.js';

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
const dev2 = params.get('sahne') === '2'; // yalnızca geliştirme: öykü tamamlanmadan Sahne 02'yi aç
const app = createApp({ canLeaveScene1: () => dev2 || store.view().completed });
const exam = createExamStore(SAHNE_02, { history: () => (store.view().completed ? store.view().summary : '') });

const ui = createUI(store, patient, { onNext: () => app.goto(2) });
store.start(); // karşılaşma kendiliğinden başlar

// Sahne 02'nin hasta görüntüsü: bekleme videosu (giriş yürüyüşü yeniden oynamaz)
const b2 = document.getElementById('bekleme2');
b2.muted = true; b2.defaultMuted = true; b2.volume = 0; b2.loop = true;
const patient2 = { idleEl: b2, missing: false };
b2.addEventListener('error', () => {
  patient2.missing = true; b2.hidden = true;
  const y = document.getElementById('yedek2'); y.src = SAHNE_02.video.yedekKare; y.hidden = false; exam.tick(); app.notify?.();
});
b2.src = params.get('bekleme') === 'yok' ? 'assets/__yok__.mp4' : SAHNE_02.video.bekleme;
const ui2 = createUI2(exam, app, { basvuru: data.basvuru });
store.subscribe(() => ui2.render());

const s1 = document.getElementById('sahne1'), s2 = document.getElementById('sahne2');
function applyScene() {
  const two = app.scene === 2;
  s1.hidden = two; s2.hidden = !two;
  document.title = 'Klinik Simülasyon — Sahne 0' + app.scene;
  if (two) { iEl.pause(); b2.play?.().catch(() => {}); ui2.render(); document.getElementById('s2-baslik').focus(); }
  else { b2.pause(); if (store.view().idle) iEl.play().catch(() => {}); document.getElementById('sahne-baslik').focus(); }
  window.scrollTo(0, 0);
}
app.subscribe(applyScene);
if (dev2) app.goto(2);

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
    vrScene = vrMod.createVRScene({ store, exam, app }, patient, { patient2, fallbackImage: data.video.yedekKare, firstFrame: data.video.ilkKare });
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
      try { await xr.enter(); } catch (e) { const t = app.scene === 2 ? ui2.el.bitti : ui.el.status; t.textContent = 'VR oturumu başlatılamadı: ' + (e.message || e); }
    };
    for (const id of ['btn-vr', 'btn-vr2']) { const b = document.getElementById(id); b.hidden = false; b.addEventListener('click', enterVR); }
  }
})();

window.__sahne = { store, data, app, exam }; // yalnızca hata ayıklama / test
