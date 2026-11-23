// Sahne yönlendirme + Sahne 02 muayene durumu. DOM / Three.js bilmez; masaüstü ve VR aynı nesneyi kullanır.

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);

// ---- yönlendirme ----
export function createApp({ canLeaveScene1 = () => true, canLeaveScene2 = () => true } = {}) {
  let scene = 1;
  const listeners = new Set();
  return {
    get scene() { return scene; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // force: kullanıcı "Sahne 3'e geç" ile önceki sahneleri atlayabilir
    goto(n, force = false) {
      if (n === scene) return true;
      if (!force && n >= 2 && !canLeaveScene1()) return false;
      if (!force && n >= 3 && !canLeaveScene2()) return false;
      scene = n; listeners.forEach((fn) => fn()); return true;
    },
  };
}

// ---- pupilla modeli: tek durumdan iki pupilla (her zaman eşit çap) ----
// p = { lit: null|'sol'|'sag', since, from }  (sol/sag = HASTANIN tarafı)
export function pupilTarget(cfg, lit) {
  return lit === 'sol' ? cfg.boyut.solAydinlik : lit === 'sag' ? cfg.boyut.sagAydinlik : cfg.boyut.karanlik;
}
export function pupilSize(p, t, cfg) {
  const k = ease(clamp01((t - p.since) / cfg.gecisMs));
  return p.from + (pupilTarget(cfg, p.lit) - p.from) * k;
}

export function createExamStore(data, { history = () => '', clock = () => performance.now() } = {}) {
  const cfgP = data.pupilla;
  const s = {
    active: null,
    notesOpen: false,
    gorme: { t0: null, finished: false, opened: false },
    renk: { t0: null, finished: false, opened: false },
    pupil: { lit: null, since: 0, from: cfgP.boyut.karanlik, last: 0, watch: { sol: 0, sag: 0 }, answer: null, correct: false },
    fundus: { opened: false },
    plan: [],
    integ: { choice: null, correct: false },
    seq: 0,
  };
  const listeners = new Set();
  const emit = () => { s.seq++; listeners.forEach((fn) => fn()); };

  const eyeDone = () => ({
    gorme: s.gorme.opened, renk: s.renk.opened, pupilla: s.pupil.correct, fundus: s.fundus.opened,
  });
  const allEyeDone = () => data.gozMuayeneleri.every((id) => eyeDone()[id]);
  const observed = (side) => s.pupil.watch[side] >= cfgP.gozlemMs;

  function tick(t = clock()) {
    let changed = false;
    for (const key of ['gorme', 'renk']) {
      const st = s[key];
      if (st.t0 !== null && !st.finished && t - st.t0 >= data[key].sureMs) { st.finished = true; st.opened = true; changed = true; }
    }
    const p = s.pupil;
    if (p.lit) {
      const dt = Math.min(Math.max(0, t - p.last), 500); // arka plan sekmesi sıçramasına karşı sınır
      const before = observed(p.lit);
      p.watch[p.lit] += dt;
      if (!before && observed(p.lit)) changed = true;
    }
    p.last = t;
    if (changed) emit();
  }

  function view(t = clock()) {
    const done = eyeDone();
    const p = s.pupil;
    const size = pupilSize(p, t, cfgP);
    const settled = t - p.since >= cfgP.gecisMs;
    const askAvail = observed('sol') && observed('sag');
    const gormeProg = s.gorme.t0 === null ? 0 : s.gorme.finished ? 1 : clamp01((t - s.gorme.t0) / data.gorme.sureMs);
    const renkProg = s.renk.t0 === null ? 0 : s.renk.finished ? 1 : clamp01((t - s.renk.t0) / data.renk.sureMs);
    const integAvail = allEyeDone();

    // Seçilen nörolojik başlıklar ve (yalnız onlar için) sonuçları
    const planOpts = data.plan.secenekler.filter((o) => s.plan.includes(o.id));
    // Muayene notu: yalnızca açılmış bulgular, sabit sırayla; yorum içermez
    const lines = data.notSirasi.filter((id) => done[id]).map((id) => data[id].not);
    if (planOpts.length) lines.push(data.plan.noroNotBas + planOpts.map((o) => `${o.ad}: ${o.sonuc}`).join(' '));

    // Etkin işlemin kartları (kart türleri ayrı)
    const cards = [];
    const addAll = (list) => list.forEach((c) => cards.push({ kind: c.tur, text: c.metin }));
    if (s.active === 'gorme' && s.gorme.opened) addAll(data.gorme.sonuc);
    if (s.active === 'renk' && s.renk.opened) addAll(data.renk.sonuc);
    if (s.active === 'pupilla') {
      if (p.correct) addAll(cfgP.sonuc);
      else if (p.answer) cards.push({ kind: 'ipucu', text: cfgP.yanlisIpucu });
    }
    if (s.active === 'fundus' && s.fundus.opened) addAll(data.fundus.sonuc);
    if (s.active === 'plan') {
      const names = planOpts.map((o) => o.ad);
      cards.push({ kind: 'plan', text: names.length ? names.join(', ') + '.' : data.plan.bosMetin, list: names });
      if (planOpts.length) {
        const res = planOpts.map((o) => `${o.ad}: ${o.sonuc}`);
        cards.push({ kind: 'bulgu', text: res.join(' '), list: res });
        if (planOpts.length < data.plan.secenekler.length) cards.push({ kind: 'plan', text: data.plan.secilmeyenMetni });
        if (planOpts.some((o) => o.anormal)) cards.push({ kind: 'egitici', text: data.plan.egitici });
      }
    }
    if (s.active === 'birlestir') {
      if (s.integ.correct) cards.push({ kind: 'egitmen', text: data.birlestir.geriBildirim });
      else if (s.integ.choice) cards.push({ kind: 'ipucu', text: data.birlestir.ipuclari[s.integ.choice] });
    }

    // Görsel durumu (DOM tuvali ve VR paneli aynı bilgiyi çizer)
    let visual = null;
    if (s.active === 'gorme') visual = { kind: 'gorme', p: gormeProg, finished: s.gorme.finished };
    else if (s.active === 'renk') visual = { kind: 'renk', p: renkProg, finished: s.renk.finished, started: s.renk.t0 !== null };
    else if (s.active === 'pupilla') visual = { kind: 'pupilla', size, lit: p.lit, settled };
    else if (s.active === 'fundus') visual = { kind: 'fundus' };
    if (visual) visual.aciklama = describe(visual, data);

    const animating = !!(visual && (
      (visual.kind === 'gorme' && !s.gorme.finished && s.gorme.t0 !== null) ||
      (visual.kind === 'renk' && !s.renk.finished && s.renk.t0 !== null) ||
      (visual.kind === 'pupilla' && (!settled || p.lit))));

    return {
      active: s.active,
      notesOpen: s.notesOpen,
      done: { ...done, plan: s.plan.length > 0 },
      eyeDoneCount: data.gozMuayeneleri.filter((id) => done[id]).length,
      integAvail,
      integChoice: s.integ.choice,
      integCorrect: s.integ.correct,
      completed: s.integ.correct,
      pupil: {
        lit: p.lit, size, settled,
        watchSol: p.watch.sol, watchSag: p.watch.sag,
        observedSol: observed('sol'), observedSag: observed('sag'),
        questionAvailable: askAvail, answer: p.answer, correct: p.correct,
      },
      planSelected: [...s.plan],
      cards, visual, animating,
      note: { lines, paragraph: lines.join(' ') },
      history: history(),
      seq: s.seq,
    };
  }

  function setActive(id) { s.active = id; }

  return {
    data, view, tick,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    // İşlem düğmeleri: gorme | renk | sol | sag | fundus | plan | birlestir
    run(id, t = clock()) {
      if (id === 'sol' || id === 'sag') {
        const p = s.pupil;
        if (s.active !== 'pupilla') setActive('pupilla');
        if (p.lit !== id) {
          p.from = pupilSize(p, t, cfgP); p.lit = id; p.since = t; p.last = t;
        }
        emit(); return true;
      }
      if (id === 'gorme' || id === 'renk') {
        setActive(id); s[id].t0 = t; s[id].finished = false; emit(); return true; // tekrar çalıştırma animasyonu yeniden oynatır, açılmış bulgu kalır
      }
      if (id === 'fundus') { setActive('fundus'); s.fundus.opened = true; emit(); return true; }
      if (id === 'plan') { setActive('plan'); emit(); return true; }
      if (id === 'birlestir') { if (!allEyeDone()) return false; setActive('birlestir'); emit(); return true; }
      return false;
    },
    togglePlan(id) {
      if (!data.plan.secenekler.some((o) => o.id === id)) return false;
      s.plan = s.plan.includes(id) ? s.plan.filter((x) => x !== id) : [...s.plan, id];
      if (s.active !== 'plan') setActive('plan');
      emit(); return true;
    },
    answerPupil(choice) {
      if (!(observed('sol') && observed('sag'))) return false;
      if (!cfgP.secenekler.some((o) => o.id === choice)) return false;
      s.pupil.answer = choice; s.pupil.correct = choice === cfgP.dogru; // yanlışta değiştirmeye izin
      emit(); return true;
    },
    answerInteg(choice) {
      if (!allEyeDone() || !data.birlestir.secenekler.some((o) => o.id === choice)) return false;
      s.integ.choice = choice; s.integ.correct = choice === data.birlestir.dogru;
      emit(); return true;
    },
    toggleNotes() { s.notesOpen = !s.notesOpen; emit(); },
  };
}

function describe(v, data) {
  if (v.kind === 'pupilla') {
    if (!v.lit) return 'Karşıdan görünüm. Işık yok; iki pupilla eşit çapta.';
    const who = v.lit === 'sol' ? 'hastanın solunda' : 'hastanın sağında';
    if (!v.settled) return `Işık ${who}; pupillalar yanıt veriyor.`;
    return v.lit === 'sol'
      ? `Işık ${who}: iki pupilla da belirgin biçimde dar.`
      : `Işık ${who}: iki pupilla da, sol aydınlatılmaya göre daha geniş.`;
  }
  if (v.kind === 'gorme') return v.finished ? 'Temsili Snellen eşeli; hasta sağ gözle 20/200 satırını okuyor, sol göz kapalı.' : 'Sol göz kapatıcıyla örtülüyor; sağ göz test ediliyor.';
  if (v.kind === 'renk') return v.finished ? 'Kırmızı hedefin iki gözle algısı yan yana: sağ gözle daha soluk, sol gözle doygun (temsili örnek).' : 'Kırmızı hedef gözler sırayla karşılaştırılıyor (temsili örnek).';
  if (v.kind === 'fundus') return 'Temsili sağ fundus: optik disk nazalde, makula temporalde.';
  return '';
}
