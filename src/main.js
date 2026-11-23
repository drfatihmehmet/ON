import { SAHNE_01 } from './scene-data.js';
import { createStore } from './state.js';
import { createUI } from './ui.js';

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

const ui = createUI(store, patient);
store.start(); // karşılaşma kendiliğinden başlar

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
    vrScene = vrMod.createVRScene(store, patient, { fallbackImage: data.video.yedekKare, firstFrame: data.video.ilkKare });
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
    ui.showVRButton(async () => {
      const vr = await getVR();
      const xr = mod.createXRSession(vr, { onEnd: () => ui.el.status.focus?.() });
      try { await xr.enter(); } catch (e) { ui.el.status.textContent = 'VR oturumu başlatılamadı: ' + (e.message || e); }
    });
  }
})();

window.__sahne = { store, data }; // yalnızca hata ayıklama / test
