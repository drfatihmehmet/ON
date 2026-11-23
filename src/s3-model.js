// Sahne 03 bildirimsel arayüz modeli. Masaüstü (HTML) ve VR (tuval) AYNI modeli çizer; eylemler `perform` ile ortak store'a gider.
import { fmt } from './case-state.js';

const num = (r) => (r.metin != null ? r.metin : `${fmt(r.deger, r.ondalik ?? 0)}`);

export function buildModel(v, store, viewer) {
  const D = store.data, cfg = store.cfg;
  const W = []; // sağ bağlam parçacıkları (denetimler + kartlar)
  const card = (kind, text, extra = {}) => W.push({ t: 'card', kind, text, ...extra });
  const h = (text) => W.push({ t: 'h', text });
  const p = (text, tone) => W.push({ t: 'p', text, tone });
  const btn = (id, label, o = {}) => ({ t: 'btn', id, label, ...o });
  const row = (...btns) => W.push({ t: 'row', btns });

  let left = { kind: 'hasta' };

  // ---- 1. kan tetkikleri ----
  if (v.active === 'lab') {
    left = { kind: 'lab', baslik: D.kan.baslik, etiket: D.kan.etiket, head: ['Tetkik', 'Sonuç', 'Birim'],
      rows: D.kan.satirlar.map((r) => [r.ad, fmt(r.deger, r.ondalik), r.birim]), extra: [] };
    card('egitici', D.kan.yorum, { title: 'Yorum' });
  }

  // ---- 2. MRG ----
  if (v.active === 'mrg') {
    const m = v.mrg, tab = m.tab;
    left = { kind: 'mrg', tab };
    row(...D.mrg.sekmeler.map((s) => btn('tab:' + s.id, s.ad, { on: tab === s.id })));
    const n = viewer.count(tab);
    if (viewer.isVideo(tab)) {
      const r = viewer.range(tab) || { lo: 0, hi: 0 };
      row(btn('vseek:-2', '« 2 sn'), btn('play', viewer.playing(tab) ? 'Duraklat' : 'Oynat', { on: viewer.playing(tab) }), btn('vseek:2', '2 sn »'));
      W.push({ t: 'scrub', id: 'scrub', frac: r.hi > r.lo ? (viewer.time(tab) - r.lo) / (r.hi - r.lo) : 0, label: `${fmt(viewer.time(tab) - r.lo, 1)} / ${fmt(r.hi - r.lo, 1)} sn`, live: true });
    } else if (n > 1) {
      row(btn('sl:-1', '‹ Önceki kesit', { disabled: m.slice[tab] <= 0 }), btn('sl:+1', 'Sonraki kesit ›', { disabled: m.slice[tab] >= n - 1 }));
      W.push({ t: 'p', text: `Kesit ${m.slice[tab] + 1} / ${n}`, tone: 'muted' });
    }
    if (m.markersAvailable) row(btn('toggle:markers', D.mrg.isaretDugme, { on: m.markers }));
    if (!m.asset[tab]) p(D.mrg.gorselYok, 'warn');
    if (!m.reportOpen) p(D.mrg.onizlemeUyari, 'muted');
    row(btn('rapor', m.reportOpen ? 'Raporu gizle' : D.mrg.raporDugme, { on: m.reportOpen, primary: !m.reportOpen }));
    if (m.report) {
      m.report.lines.forEach((l) => card('rapor', l, { title: D.mrg.raporBaslik }));
      if (m.report.extra.length) card('rapor', m.report.extra.join(' · '), { title: 'Rapor eki (doğrulanmış)' });
      if (m.report.eksik) card('uyari', m.report.eksik);
    }
    // eğitici A
    row(btn('toggle:eduA', D.mrg.egitA.baslik, { on: m.eduA, caret: true }));
    if (m.eduA) {
      D.mrg.egitA.maddeler.forEach((t) => card('egitici', t, { title: 'MRG ve tanı' }));
      h(D.mrg.egitA.mevcutEksik.baslik);
      D.mrg.egitA.mevcutEksik.secenekler.forEach((o) => {
        const cur = m.mevcutEksik[o.id];
        row(btn(`me:${o.id}:mevcut`, `${o.ad} → Mevcut`, { on: cur === 'mevcut' }), btn(`me:${o.id}:eksik`, 'Eksik', { on: cur === 'eksik' }));
      });
      row(btn('me:send', 'Yanıtı kontrol et', { primary: true }));
      if (m.mevcutEksikSent) card(m.mevcutEksikDogru ? 'egitmen' : 'ipucu', m.mevcutEksikDogru ? D.mrg.egitA.mevcutEksik.dogruGeri : D.mrg.egitA.mevcutEksik.yanlisGeri);
    }
    // eğitici B
    row(btn('toggle:eduB', D.mrg.egitB.baslik, { on: m.eduB, caret: true }));
    if (m.eduB) {
      p(D.mrg.egitB.etiket, 'warn');
      D.mrg.egitB.maddeler.forEach((it) => card('egitici', it.t, { title: it.b }));
      row(btn('toggle:orbita', D.mrg.egitB.orbitaDugme, { on: m.orbita }));
      if (m.orbita) card('egitici', D.mrg.egitB.orbita, { title: 'Orbita MRG' });
    }
    // karar
    h(D.mrg.karar.soru);
    row(...D.mrg.karar.secenekler.map((o) => btn('mk:' + o.id, o.ad, { on: m.karar === o.id })));
    if (m.karar) card(m.kararDogru ? 'egitmen' : 'ipucu', m.kararDogru ? D.mrg.karar.dogruGeri : D.mrg.karar.yanlisGeri);
  }

  // ---- 3. LP ----
  if (v.active === 'lp') {
    const l = v.lp;
    h(D.lp.soru);
    D.lp.esler.forEach((e) => W.push({ t: 'check', id: 'ls:' + e.id, label: `${e.bos} ↔ ${e.serum}`, on: !!l.serum[e.id], disabled: l.sampled }));
    if (Object.values(l.serum).some(Boolean)) card(l.pairsDone ? 'egitmen' : 'ipucu', l.pairsDone ? D.lp.tamEs : D.lp.eksikEs + l.missingPairs.join('; ') + '.');
    h(D.lp.onKart.baslik); p(D.lp.onKart.aciklama, 'muted');
    D.lp.onKart.maddeler.forEach((c) => W.push({ t: 'check', id: 'lc:' + c.id, label: c.ad, on: !!l.checks[c.id], disabled: l.sampled }));
    row(btn('lsample', D.lp.alDugme, { primary: true, disabled: !l.canSample, badge: l.sampled ? D.durum.ornek : '' }));
    if (!l.checksDone && !l.sampled) p(D.lp.alKilit, 'muted');
    if (l.sampled) {
      p(`Örnek alındı: Gün ${v.sampleDay}. Rutin BOS aynı gün sonuçlandı; OKB ve IgG indeksi Gün ${v.dueDay} için bekleniyor.`, 'ok');
      card('egitici', D.lp.egitici, { title: 'Geri bildirim' });
      left = routineLeft(v, D);
    }
  }

  // ---- 4. akut tedavi ----
  if (v.active === 'tx') {
    const t = v.tx;
    h(D.tx.soru);
    row(...D.tx.secenekler.map((o) => btn('txq:' + o.id, o.ad, { on: t.q === o.id })));
    if (t.q) card(t.qDogru ? 'egitmen' : 'ipucu', t.qDogru ? D.tx.dogruGeri : D.tx.yanlisGeri);
    W.push({ t: 'table', head: [D.tx.istem.baslik, ''], rows: D.tx.istem.satirlar.map((r) => [r.ad, r.deger]), wide: true });
    if (t.preCard) card('uyari', D.tx.onKartMetni);
    row(btn('txorder', D.tx.baslatDugme, { primary: !t.ordered, disabled: t.ordered, badge: t.ordered ? (v.izlem.given ? `${D.durum.doz} (${v.izlem.given}/${D.izlem.doz})` : D.durum.istendi) : '' }));
    row(btn('txt:purpose', D.tx.amacDugme, { on: t.purpose }));
    if (t.purpose) card('egitici', D.tx.amac, { title: 'Tedavinin amacı' });
    h(D.tx.izlemBaslik);
    D.tx.izlemMaddeleri.forEach((m) => W.push({ t: 'check', id: 'txpm:' + m.id, label: m.ad, on: !!t.preMon[m.id] }));
    row(btn('txt:explain', 'Hastaya açıklama örneği', { on: t.explain }));
    if (t.explain) card('aciklama', D.tx.hastaAciklama);
  }

  // ---- 5. günlük doz izlemi ----
  if (v.active === 'izlem') {
    const z = v.izlem;
    if (!z.ordered) p(D.izlem.tedaviYok, 'warn');
    p(`${D.zaman.gunEtiket}: ${v.day}`, 'muted');
    z.boxes.forEach((b, i) => {
      const label = `${b.ad} — ${b.kod === 'uygulandi' ? `${b.durum} (Gün ${b.day})` : b.durum}`;
      row(btn('box:' + i, label, { on: z.open === i, caret: true, ok: b.kod === 'uygulandi' }));
      if (z.open === i) {
        if (b.kod === 'bugun') row(btn('dose', D.izlem.uygulaDugme, { primary: true }));
        else if (b.kod === 'yarin') p(D.izlem.bugunVar, 'muted');
        else if (b.kod === 'uygulandi') {
          p('İzlem kaydı', 'muted');
          D.tx.izlemMaddeleri.forEach((m) => W.push({ t: 'check', id: `dm:${i}:${m.id}`, label: m.ad, on: !!b.monitor[m.id] }));
        } else p(D.izlem.planli, 'muted');
      }
    });
    if (z.complete) { card('egitmen', D.izlem.tamam); card('bulgu', D.izlem.kontrolEtiket + z.kontrol, { title: 'Kontrol' }); }
    row(btn('txt:poor', D.izlem.yetersizDugme, { on: z.poor }));
    if (z.poor) card('egitici', D.izlem.yetersiz, { title: 'Yetersiz yanıt' });
  }

  // ---- 6. İki hafta sonra ----
  if (v.active === 'bos') {
    const b = v.bos;
    h(D.bos.bekleyenBaslik);
    if (!v.sampleDay) p(D.zaman.kontrolKilit, 'warn');
    b.pending.forEach((a) => p(`${a}: ${v.bosReady ? D.durum.sonuclandi : D.durum.bekleniyor + '.'}`, v.bosReady ? 'ok' : 'muted'));
    p(`${D.zaman.gunEtiket}: ${v.day}${v.dueDay ? ` · rapor günü: ${v.dueDay}` : ''}`, 'muted');
    row(btn('jump', D.zaman.kontrolEylem, { disabled: !v.canJump, primary: v.canJump }));
    if (v.sampleDay && !v.bosReady) p(D.bos.hazirDegil, 'muted');
    row(btn('bosopen', D.bos.raporDugme, { disabled: !v.bosReady, primary: v.bosReady && !b.reportOpen, on: b.reportOpen }));
    left = b.reportOpen
      ? { kind: 'lab', baslik: 'BOS raporu (14. gün)', etiket: D.bos.olguEtiket, head: ['İnceleme', 'Sonuç', 'Not'],
          rows: [[D.bos.okbSatir, b.rapor.okb.var ? b.rapor.okb.metin.split(': ')[1] : b.rapor.okb.metin, b.rapor.okb.not || ''], [D.bos.iggSatir, b.rapor.igg.var ? b.rapor.igg.metin.split(': ')[1] : b.rapor.igg.metin, b.rapor.igg.not || '']], extra: [] }
      : (v.sampleDay ? routineLeft(v, D) : { kind: 'hasta' });
    // eğitici A (öğretici örnek; hasta sonucundan ayrı)
    const A = D.bos.okbA;
    row(btn('bt:okbA', A.baslik, { on: b.okbA, caret: true }));
    if (b.okbA) {
      card('egitici', A.giris, { title: 'OKB' });
      row(...A.tipler.map((x) => btn('btip:' + x.id, x.ad, { on: b.tip === x.id })));
      W.push({ t: 'canvas', draw: 'okb', tip: b.tip, etiket: D.bos.ogreticiEtiket });
      card('egitici', A.tipler.find((x) => x.id === b.tip).t, { title: `${D.bos.ogreticiEtiket} · Tip ${b.tip}` });
      h(A.soru);
      row(...A.tipler.map((x) => btn('bsel:' + x.id, x.ad, { on: b.sel.includes(x.id) })));
      row(btn('bsend', 'Yanıtı kontrol et', { primary: true, disabled: !b.sel.length }));
      if (b.sent) card(b.selDogru ? 'egitmen' : 'ipucu', b.selDogru ? A.dogruGeri : A.yanlisGeri);
    }
    const B = D.bos.iggB;
    row(btn('bt:iggB', B.baslik, { on: b.iggB, caret: true }));
    if (b.iggB) {
      W.push({ t: 'canvas', draw: 'formula', f: B.formul });
      card('egitici', B.metin, { title: 'IgG indeksi' });
      card('uyari', B.uyari);
    }
  }

  // ---- Kayıt ----
  if (v.active === 'kayit' || v.active === 'bos' && false) { /* yer tutucu */ }
  if (v.active === 'kayit') {
    h(D.kayit.baslik);
    D.kayit.sorular.forEach((q, i) => {
      p(`${i + 1}. ${q.soru}`, 'muted');
      W.push({ t: 'text', id: 'ans:' + i, value: v.kayit.answers[i], label: q.soru });
      q.oneriler.forEach((o, j) => W.push({ t: 'check', id: `chip:${i}:${j}`, label: o, on: v.kayit.answers[i].includes(o) }));
    });
    row(btn('save', D.kayit.dugme, { primary: true, disabled: !v.kayit.canSave }));
    if (!v.kayit.canSave) p(D.kayit.ipucu, 'muted');
    if (v.kayit.saved) {
      const s = v.kayit.summary; h(s.baslik);
      s.sections.forEach((sec) => card(sec.tur === 'temsili' ? 'uyari' : sec.tur === 'bekleyen' ? 'ipucu' : sec.tur === 'ogrenci' ? 'yanit' : 'rapor', sec.satirlar.join(' '), { title: `${sec.baslik} · ${s.etiketler[sec.tur]}`, list: sec.satirlar }));
    }
  }

  if (!v.active) p('Bir eylem seçin. Tetkik ve tedavi kararları paralel yürüyebilir; sonuç kartlarını sırayla açmanız gerekmez.', 'muted');

  return {
    ops: D.eylemler.map((e) => ({ id: e.id, ad: e.ad, status: v.status[e.id], on: v.active === e.id })),
    time: { day: v.day, label: D.zaman.gunEtiket, next: D.zaman.gunDugme },
    left, widgets: W,
    prev: v.prevCard,
  };
}

function routineLeft(v, D) {
  return {
    kind: 'lab', baslik: D.lp.rutinBaslik, etiket: D.lp.rutinEtiket, head: ['Parametre', 'Sonuç', 'Birim / açıklama'],
    rows: v.lp.routine.map((r) => [r.ad, num(r), r.metin != null ? (r.aciklama || '') : [r.birim, r.aciklama].filter(Boolean).join(', ')]),
    extra: v.lp.pending.map((pd) => ({ ad: `${pd.ad}`, durum: v.bosReady ? D.durum.sonuclandi : pd.durum })),
  };
}

// Eylem yönlendirme (masaüstü ve VR ortak)
export function perform(store, viewer, id, frac) {
  const [k, a, b] = id.split(':');
  const tab = store.view().mrg.tab;
  switch (k) {
    case 'op': return store.setActive(a);
    case 'day': return store.nextDay();
    case 'jump': return store.jumpToFollowup();
    case 'tab': viewer.pause(); return store.mrgTab(a);
    case 'sl': { const n = viewer.count(tab); const cur = store.view().mrg.slice[tab]; return store.mrgSlice(Math.max(0, Math.min(n - 1, cur + Number(a))), tab); }
    case 'vseek': return viewer.seekBy(tab, Number(a));
    case 'play': return viewer.toggle(tab);
    case 'scrub': return viewer.seekFrac(tab, frac ?? Number(a));
    case 'rapor': return store.mrgReport();
    case 'toggle': return store.mrgToggle(a);
    case 'me': return a === 'send' ? store.mrgMevcutEksikSent() : store.mrgMevcutEksik(a, b);
    case 'mk': return store.mrgKarar(a);
    case 'lc': return store.lpCheck(a);
    case 'ls': return store.lpSerum(a);
    case 'lsample': return store.lpSample();
    case 'txq': return store.txAnswer(a);
    case 'txorder': return store.txOrder();
    case 'txt': return store.txToggle(a);
    case 'txpm': return store.txPreMon(a);
    case 'box': return store.openBox(Number(a));
    case 'dose': return store.giveDose();
    case 'dm': return store.doseMonitor(Number(a), b);
    case 'bosopen': return store.bosOpen();
    case 'bt': return store.bosToggle(a);
    case 'btip': return store.bosTip(Number(a));
    case 'bsel': return store.bosSel(Number(a));
    case 'bsend': return store.bosSend();
    case 'chip': { const q = store.data.kayit.sorular[Number(a)]; return store.toggleChip(Number(a), q.oneriler[Number(b)]); }
    case 'save': return store.save();
    default: return false;
  }
}
