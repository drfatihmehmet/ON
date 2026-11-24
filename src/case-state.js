// Sahne 03 durumu: simülasyon günü, örnek alımı, doz kayıtları, raporlar. DOM / Three.js bilmez.
// Masaüstü ve VR aynı nesneyi kullanır.

export const fmt = (n, d = 0) => Number(n).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function createCaseStore(data, cfg, { prev = () => ({ note: '', history: '' }) } = {}) {
  const s = {
    day: 1,
    active: null,
    lab: { opened: false },
    mrg: { tab: 'beyin', slice: { beyin: 0, servikal: 0 }, report: { beyin: false, servikal: false }, viewed: false,
      eduA: false, eduB: false, orbita: false, karar: null, markers: false },
    lp: { checks: {}, serum: {}, sampleDay: null },
    tx: { q: null, ordered: false, startDay: null, doses: [], purpose: false, poor: false, explain: false, preMon: {}, open: null },
    bos: { reportOpen: false, tip: 2, okbA: false, iggB: false, sel: [], sent: false },
    kayit: { answers: ['', '', ''], saved: false },
    seq: 0,
  };
  const listeners = new Set();
  const emit = () => { s.seq++; listeners.forEach((fn) => fn()); };
  const cfgOk = (k) => cfg.mrg[k] && (cfg.mrg[k].dosyalar?.length || cfg.mrg[k].dosya);

  const bloodGlucose = () => data.kan.satirlar.find((r) => r.id === 'glukoz');
  const pairsDone = () => data.lp.esler.every((e) => s.lp.serum[e.id]);
  const checksDone = () => data.lp.onKart.maddeler.every((m) => s.lp.checks[m.id]);
  const dueDay = () => (s.lp.sampleDay == null ? null : s.lp.sampleDay + data.zaman.kontrolGun);
  const bosReady = () => dueDay() != null && s.day >= dueDay();

  function routine() {
    if (s.lp.sampleDay == null) return null;
    const rows = data.lp.rutin.map((r) => (r.metin
      ? { id: r.id, ad: r.ad, metin: r.metin, aciklama: r.birimAciklama }
      : { id: r.id, ad: r.ad, deger: r.deger, birim: r.birim, ondalik: r.ondalik, aciklama: r.aciklama }));
    const bg = data.lp.rutin.find((r) => r.id === 'bosGlukoz').deger;
    const sg = bloodGlucose().deger;
    const paired = !!s.lp.serum.glukoz;
    rows.push(paired
      ? { id: 'esGlukoz', ad: data.lp.esGlukozAd, deger: sg, birim: bloodGlucose().birim, ondalik: 0 }
      : { id: 'esGlukoz', ad: data.lp.esGlukozAd, metin: data.lp.esGlukozYok });
    // Oran: BOS glukozu / eş zamanlı serum glukozu. Eksik veya sıfır paydada üretilmez.
    const ratio = paired && sg > 0 ? bg / sg : null;
    rows.push(ratio != null
      ? { id: 'oran', ad: data.lp.oranAd, deger: ratio, birim: data.lp.oranBirim, ondalik: 2 }
      : { id: 'oran', ad: data.lp.oranAd, metin: data.lp.oranYok });
    return rows;
  }

  function mrgReport(tabId) {
    const ek = cfg.mrgRaporEki;
    const lines = [data.mrg.rapor];
    const extra = [];
    for (const k of Object.keys(data.mrg.raporEkEtiketleri)) if (ek[k] != null && ek[k] !== '') extra.push(`${data.mrg.raporEkEtiketleri[k]}: ${ek[k]}`);
    return { lines, extra, eksik: extra.length === 0 ? data.mrg.eksikNot : '' };
  }

  function boxes() {
    const n = s.tx.doses.length, today = s.tx.doses.some((d) => d.day === s.day);
    return Array.from({ length: data.izlem.doz }, (_, i) => {
      const dose = s.tx.doses[i];
      let durum = data.izlem.planli, kod = 'planli';
      if (dose) { durum = data.izlem.uygulandi; kod = 'uygulandi'; }
      else if (s.tx.ordered && i === n && !today) { durum = data.izlem.bekliyor; kod = 'bugun'; }
      else if (s.tx.ordered && i === n && today) { durum = data.izlem.planli; kod = 'yarin'; }
      return { no: i + 1, ad: data.izlem.kutu(i + 1), durum, kod, day: dose?.day ?? null, monitor: dose?.monitor ?? {} };
    });
  }

  function view() {
    const prevInfo = prev();
    const asked = s.lp.sampleDay != null;
    const due = dueDay();
    const rows = routine();
    const nDose = s.tx.doses.length;
    const sets = data.bos.okbA;
    const bosOpenAllowed = bosReady();
    const okbVal = cfg.bos14gun.okbPatern, iggVal = cfg.bos14gun.iggIndeksi;

    const status = {
      lab: data.durum.sonuclandi,
      mrg: s.mrg.report.beyin || s.mrg.report.servikal ? data.durum.sonuclandi : s.mrg.viewed ? data.durum.istendi : '',
      lp: asked ? data.durum.ornek : Object.values(s.lp.serum).some(Boolean) ? data.durum.istendi : '',
      tx: nDose ? `${data.durum.doz} (${nDose}/${data.izlem.doz})` : s.tx.ordered ? data.durum.istendi : '',
      izlem: nDose ? `${data.durum.doz} (${nDose}/${data.izlem.doz})` : '',
      bos: asked ? (bosOpenAllowed ? data.durum.sonuclandi : data.durum.bekleniyor) : '',
    };

    // BOS 14. gün raporu
    const bosRapor = {
      okb: okbVal ? { var: true, metin: `${data.bos.okbSatir}: Tip ${okbVal}`, not: cfg.bos14gun.okbNotu } : { var: false, metin: data.bos.girilmedi },
      igg: iggVal != null ? { var: true, metin: `${data.bos.iggSatir}: ${fmt(iggVal, 2)}`, not: data.bos.iggNot } : { var: false, metin: data.bos.girilmedi },
    };

    // Önceki muayene / öykü
    const prevCard = { note: prevInfo.note, history: prevInfo.history };

    // Özet
    const answersFilled = s.kayit.answers.every((a) => a.trim().length > 0);
    const summary = s.kayit.saved ? buildSummary() : null;

    // Etkin işleme göre sol görünüm
    const left = s.active === 'mrg' ? 'mrg' : (s.active === 'lab' || (s.active === 'lp' && rows) || s.active === 'bos') ? 'lab' : 'hasta';

    return {
      day: s.day, sampleDay: s.lp.sampleDay, dueDay: due, bosReady: bosOpenAllowed,
      active: s.active, left, status, prevCard, olgu: data.olguBaglami,
      canJump: asked && s.day < due,
      jumpDay: due,
      lab: { opened: s.lab.opened },
      mrg: {
        tab: s.mrg.tab, slice: s.mrg.slice, asset: { beyin: !!cfgOk('beyin'), servikal: !!cfgOk('servikal') },
        reportOpen: s.mrg.report[s.mrg.tab], report: s.mrg.report[s.mrg.tab] ? mrgReport(s.mrg.tab) : null,
        eduA: s.mrg.eduA, eduB: s.mrg.eduB, orbita: s.mrg.orbita,
        karar: s.mrg.karar, kararDogru: s.mrg.karar === data.mrg.karar.dogru,
        markersAvailable: (cfg.isaretler[s.mrg.tab] || []).length > 0, markers: s.mrg.markers,
      },
      lp: {
        checks: s.lp.checks, checksDone: checksDone(), serum: s.lp.serum, pairsDone: pairsDone(),
        missingPairs: data.lp.esler.filter((e) => !s.lp.serum[e.id]).map((e) => e.serum),
        canSample: checksDone() && !asked, sampled: asked, routine: rows,
        pending: asked ? data.lp.bekleyen.map((p) => ({ ...p, hazir: bosOpenAllowed })) : [],
      },
      tx: {
        q: s.tx.q, qDogru: s.tx.q === data.tx.dogru, ordered: s.tx.ordered, startDay: s.tx.startDay,
        purpose: s.tx.purpose, explain: s.tx.explain, preMon: s.tx.preMon,
        preCard: !s.tx.ordered ? false : (!s.mrg.viewed || !asked), // ilk dozdan önce MRG/örnek istenmediyse bilgi
      },
      izlem: {
        open: s.tx.open, boxes: boxes(), given: nDose, today: s.tx.doses.some((d) => d.day === s.day),
        canGive: s.tx.ordered && nDose < data.izlem.doz && !s.tx.doses.some((d) => d.day === s.day),
        complete: nDose >= data.izlem.doz, poor: s.tx.poor,
        kontrol: kontrolMetni(), ordered: s.tx.ordered,
      },
      bos: {
        ready: bosOpenAllowed, reportOpen: s.bos.reportOpen && bosOpenAllowed, rapor: bosRapor,
        pending: asked ? data.lp.bekleyen.map((p) => p.ad) : [],
        okbA: s.bos.okbA, iggB: s.bos.iggB, tip: s.bos.tip, sel: s.bos.sel, sent: s.bos.sent,
        selDogru: sameSet(s.bos.sel, sets.dogru),
      },
      kayit: { answers: s.kayit.answers, canSave: answersFilled, saved: s.kayit.saved, summary },
      seq: s.seq,
    };
  }

  // kontrol görme: yalnız 5 doz tamamlandıktan ve kontrol gününe (15. gün) gelindikten sonra gösterilir
  function kontrolMetni() { return cfg.klinik.kontrolGorme && s.tx.doses.length >= data.izlem.doz && s.day >= 15 ? cfg.klinik.kontrolGorme : data.izlem.kontrolYok; }
  const sameSet = (a, b) => a.length === b.length && b.every((x) => a.includes(x));

  function buildSummary() {
    const g = data.kayit.etiketler, p = prev();
    const sections = [];
    sections.push({ baslik: 'Olgu', tur: 'gercek', satirlar: [data.olguBaglami, p.note ? `Önceki muayene: ${p.note}` : data.oncekiMuayene.bos] });
    const mrgSat = [data.mrg.rapor];
    for (const k of Object.keys(data.mrg.raporEkEtiketleri)) if (cfg.mrgRaporEki[k] != null && cfg.mrgRaporEki[k] !== '') mrgSat.push(`${data.mrg.raporEkEtiketleri[k]}: ${cfg.mrgRaporEki[k]}`);
    sections.push({ baslik: 'MRG raporu', tur: 'gercek', satirlar: mrgSat });
    sections.push({ baslik: 'Laboratuvar (temsili değerler)', tur: 'temsili', satirlar: [
      'Rutin kan tetkikleri belirgin anormallik göstermedi.',
      s.lp.sampleDay != null ? `Rutin BOS (Gün ${s.lp.sampleDay}): hücre, protein ve glukoz normal sınırlarda.` : 'BOS örneği alınmadı.',
    ] });
    const days = s.tx.doses.map((d) => d.day);
    sections.push({ baslik: 'Akut tedavi', tur: 'gercek', satirlar: [
      s.tx.ordered ? `Metilprednizolon 1 g IV: ${s.tx.doses.length}/${data.izlem.doz} doz uygulandı${days.length ? ` (günler: ${days.join(', ')})` : ''}.` : 'Akut tedavi başlatılmadı.',
      `${data.izlem.kontrolEtiket}${kontrolMetni()}`,
    ] });
    const bekl = [];
    if (s.lp.sampleDay == null) bekl.push('BOS/serum OKB ve IgG indeksi: örnek alınmadı.');
    else if (!bosReady()) bekl.push(`OKB ve IgG indeksi: Sonuç bekleniyor (Gün ${dueDay()}).`);
    else {
      bekl.push(cfg.bos14gun.okbPatern ? `OKB paterni: Tip ${cfg.bos14gun.okbPatern}` : `OKB paterni: ${data.bos.girilmedi}`);
      bekl.push(cfg.bos14gun.iggIndeksi != null ? `IgG indeksi: ${fmt(cfg.bos14gun.iggIndeksi, 2)}` : `IgG indeksi: ${data.bos.girilmedi}`);
    }
    sections.push({ baslik: 'Sonuçlar', tur: 'bekleyen', satirlar: bekl });
    sections.push({ baslik: 'Öğrenci yanıtları', tur: 'ogrenci', satirlar: data.kayit.sorular.map((q, i) => `${q.soru} — ${s.kayit.answers[i].trim()}`) });
    return { baslik: data.kayit.ozetBaslik, etiketler: g, sections };
  }

  const guard = (fn) => (...a) => { const r = fn(...a); return r; };

  return {
    data, cfg, view,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setActive(id) { if (!data.eylemler.some((e) => e.id === id) && id !== 'kayit') return false; s.active = id; if (id === 'lab') s.lab.opened = true; if (id === 'mrg') s.mrg.viewed = true; emit(); return true; },

    // ---- zaman ----
    nextDay() { s.day++; emit(); return s.day; },
    jumpToFollowup() {
      const due = dueDay(); if (due == null) return false;
      if (s.day < due) s.day = due;
      s.active = 'bos'; emit(); return true;
    },

    // ---- MRG ----
    mrgTab(t) { if (!['beyin', 'servikal'].includes(t)) return false; s.mrg.tab = t; emit(); return true; },
    mrgSlice(i, tab = s.mrg.tab) { s.mrg.slice[tab] = Math.max(0, i); emit(); },
    mrgReport() { s.mrg.report[s.mrg.tab] = !s.mrg.report[s.mrg.tab]; emit(); },
    mrgToggle(k) { if (!['eduA', 'eduB', 'orbita', 'markers'].includes(k)) return false; s.mrg[k] = !s.mrg[k]; emit(); return true; },
    mrgKarar(a) { if (!data.mrg.karar.secenekler.some((o) => o.id === a)) return false; s.mrg.karar = a; emit(); return true; },

    // ---- LP ----
    lpCheck(id) { if (!data.lp.onKart.maddeler.some((m) => m.id === id)) return false; s.lp.checks[id] = !s.lp.checks[id]; emit(); return true; },
    lpSerum(id) { if (!data.lp.esler.some((e) => e.id === id)) return false; if (s.lp.sampleDay != null) return false; s.lp.serum[id] = !s.lp.serum[id]; emit(); return true; },
    lpSample() {
      if (!checksDone() || s.lp.sampleDay != null) return false;
      s.lp.sampleDay = s.day; s.active = 'lp'; emit(); return true;
    },

    // ---- Tedavi ----
    txAnswer(a) { if (!data.tx.secenekler.some((o) => o.id === a)) return false; s.tx.q = a; emit(); return true; },
    txOrder() { if (s.tx.ordered) return false; s.tx.ordered = true; s.tx.startDay = s.day; emit(); return true; }, // hiçbir sonuç koşulu aranmaz
    txToggle(k) { if (!['purpose', 'poor', 'explain'].includes(k)) return false; s.tx[k] = !s.tx[k]; emit(); return true; },
    txPreMon(id) { s.tx.preMon[id] = !s.tx.preMon[id]; emit(); },
    giveDose() {
      const n = s.tx.doses.length;
      if (!s.tx.ordered || n >= data.izlem.doz || s.tx.doses.some((d) => d.day === s.day)) return false; // aynı gün ikinci doz yok
      s.tx.doses.push({ day: s.day, monitor: {} }); if (s.tx.doses.length < data.izlem.doz) s.day++; // bir sonraki doz ertesi gün; ayrı "sonraki gün" düğmesi yok
      emit(); return true;
    },
    // 5 günlük pulse'ı tek seferde uygular: kalan dozlar ardışık günlere yazılır (günde en fazla bir doz), gün son doza ilerler.
    giveAllDoses() {
      if (!s.tx.ordered || s.tx.doses.length >= data.izlem.doz) return false;
      if (s.tx.doses.some((d) => d.day === s.day)) s.day++;
      while (s.tx.doses.length < data.izlem.doz) { s.tx.doses.push({ day: s.day, monitor: {} }); if (s.tx.doses.length < data.izlem.doz) s.day++; }
      emit(); return true;
    },
    openBox(i) { s.tx.open = s.tx.open === i ? null : i; emit(); },
    doseMonitor(i, key) { const d = s.tx.doses[i]; if (!d) return false; d.monitor[key] = !d.monitor[key]; emit(); return true; },

    // ---- BOS 14. gün ----
    bosOpen() { if (!bosReady()) return false; s.bos.reportOpen = true; emit(); return true; },
    bosToggle(k) { if (!['okbA', 'iggB'].includes(k)) return false; s.bos[k] = !s.bos[k]; emit(); return true; },
    bosTip(t) { if (!data.bos.okbA.tipler.some((x) => x.id === t)) return false; s.bos.tip = t; emit(); return true; },
    bosSel(t) { s.bos.sel = s.bos.sel.includes(t) ? s.bos.sel.filter((x) => x !== t) : [...s.bos.sel, t].sort(); s.bos.sent = false; emit(); },
    bosSend() { s.bos.sent = true; emit(); return sameSet(s.bos.sel, data.bos.okbA.dogru); },

    // ---- Kayıt ----
    setAnswer(i, text, silent = false) { if (i < 0 || i > 2) return false; s.kayit.answers[i] = String(text); s.kayit.saved = false; if (!silent) emit(); return true; },
    toggleChip(i, text) {
      const cur = s.kayit.answers[i]; const parts = cur ? cur.split(' ').length : 0; void parts;
      const has = cur.includes(text);
      s.kayit.answers[i] = has ? cur.replace(text, '').replace(/\s{2,}/g, ' ').trim() : (cur ? cur + ' ' : '') + text;
      s.kayit.saved = false; emit(); return !has;
    },
    save() { if (!s.kayit.answers.every((a) => a.trim())) return false; s.kayit.saved = true; s.active = 'kayit'; emit(); return true; },
  };
}
