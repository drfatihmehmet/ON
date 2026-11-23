// Masaüstü ve VR'nin ortak kullandığı tek sahne durumu. DOM / Three.js bilmez.

export function createStore(data) {
  const s = {
    phase: 'intro', // intro → playing → ready  (tamamlanınca completed=true)
    started: false,
    videoMissing: false,
    idle: false, // bekleme döngüsü oynuyor
    asked: [], // sorulma sırasıyla soru kimlikleri
    currentId: null,
    seq: 0, // her soru seçiminde artar (yanıtı yeniden duyurmak için) // ekranda gösterilen yanıt
    notesOpen: false,
    teachingOpen: false,
    completed: false,
  };
  const listeners = new Set();
  const hooks = { play: null };
  const emit = () => listeners.forEach((fn) => fn());
  const q = (id) => data.sorular.find((x) => x.id === id);

  function view() {
    const asked = new Set(s.asked);
    const ready = s.phase === 'ready'; // video bitti
    const required = data.sorular.filter((x) => x.zorunlu !== false);
    const total = required.length;
    const askedRequired = required.filter((x) => asked.has(x.id)).length;
    const teachReq = data.kosullar.egiticiNot.gerek;
    const teachingAvailable = teachReq.every((id) => asked.has(id));
    const canComplete = askedRequired === total && !s.completed;

    const askedQs = data.sorular.filter((x) => asked.has(x.id));
    const notes = askedQs.flatMap((x) => x.notlar);
    const timeline = notes.filter((n) => n.tur === 'zaman').sort((a, b) => a.sira - b.sira);
    const facts = notes.filter((n) => n.tur === 'bilgi');

    return {
      phase: s.phase,
      ready,
      started: s.started,
      videoMissing: s.videoMissing,
      idle: s.idle,
      asked,
      askedCount: askedRequired,
      total,
      seq: s.seq,
      current: s.currentId ? q(s.currentId) : null,
      notesOpen: s.notesOpen,
      teachingOpen: s.teachingOpen && teachingAvailable,
      teachingAvailable,
      canComplete,
      completed: s.completed,
      timeline,
      facts,
      summary: s.completed ? buildSummary(data, asked) : '',
    };
  }

  return {
    data,
    view,
    hooks,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setVideoMissing() {
      if (s.videoMissing) return;
      s.videoMissing = true;
      // Başlatılmış ve video oynayamıyorsa akışı kilitleme.
      if (s.started && s.phase === 'playing') s.phase = 'ready';
      emit();
    },
    start() {
      if (s.started) return false; // video yalnızca bir kez
      s.started = true;
      s.phase = s.videoMissing ? 'ready' : 'playing';
      if (s.phase === 'playing' && hooks.play) hooks.play();
      emit();
      return true;
    },
    setIdle(on) { if (s.idle !== on) { s.idle = on; emit(); } },
    videoEnded() {
      if (s.phase === 'playing') { s.phase = 'ready'; emit(); }
    },
    ask(id) {
      if (!q(id)) return false; // panel baştan açık; video bitmesi beklenmez
      if (!s.asked.includes(id)) s.asked.push(id);
      s.seq++; s.currentId = id; // tekrar seçim: yalnızca yanıtı yeniden gösterir
      s.teachingOpen = false;
      emit();
      return true;
    },
    toggleNotes() {
      s.notesOpen = !s.notesOpen; if (s.notesOpen) s.teachingOpen = false; emit();
    },
    toggleTeaching() {
      if (!view().teachingAvailable) return;
      s.teachingOpen = !s.teachingOpen; if (s.teachingOpen) s.notesOpen = false; emit();
    },
    complete() {
      if (!view().canComplete) return false;
      s.completed = true; s.notesOpen = false; s.teachingOpen = false; emit();
      return true;
    },
  };
}

export function buildSummary(data, askedSet) {
  const parts = data.sorular.filter((x) => askedSet.has(x.id) && x.ozet).map((x) => x.ozet);
  return [data.sonuc.ozetGiris, ...parts].join(' ');
}
