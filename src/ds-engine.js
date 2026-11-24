// Karar sahnesi motoru (Sahne 04–06): sahne tanımı VERİDİR (src/scene0X-data.js); bu dosya yalnızca durum + model üretir.
// Aynı bildirimsel model (s3-model ile aynı parçacık türleri) masaüstü (ui3) ve VR (vr-s3) tarafından çizilir.
//
// Blok türleri (def.ekranlar[eylemId] içinde):
//  h / p / card / table                       : düz içerik (card: kind, text, title, kaynak, rozet, list)
//  toggle {id,label,bloklar}                  : açılır bölüm
//  choice {id,soru,secenekler,multi?,dogru?}  : tek seçim (anında geri bildirim) ya da çoklu seçim + "Yanıtı kontrol et"
//  tri {id,satirlar:[{id,ad,bilinen}]}        : üç durumlu pano (var / yok / bilinmiyor); bilinen = doğrulanmış olgu verisi
//  bucket {id,kovalar,satirlar:[{id,ad,dogru}]}: sınıflandırma + "Kontrol et"
//  check {id,label}                           : öğrencinin işaretlediği kontrol listesi
//  canvas {draw,...}                          : şema (okb / formul)
//  hesap {ad}                                 : def.hesap[ad](st) → bloklar (canlı hesaplama)
//  varsa {kosul,bloklar}                      : koşullu bloklar
//  kaydet {id,dugme}                          : öğrenci kararını kaydeder; def.ozet(st) ile özet kartları
// Hiçbir blok, doğrulanmamış olgu verisini "normal" ya da "negatif" olarak kodlamaz.

const TUR_KART = { dogru: 'egitmen', kabul: 'egitmen', bagimli: 'uyari', yanlis: 'ipucu', bilgi: 'egitici' };
const TUR_BASLIK = { dogru: 'Doğru', kabul: 'Kabul edilebilir alternatif', bagimli: 'Bağlama bağlı', yanlis: 'Yeniden bakın', bilgi: 'Bilgi' };

export function createDecisionStore(def, cfg, { prev = () => ({ note: '' }), onNext = null } = {}) {
  const s = { active: null, open: {}, sel: {}, tri: {}, bucket: {}, chk: {}, sent: {}, saved: {}, seq: 0 };
  const listeners = new Set();
  const emit = () => { s.seq++; listeners.forEach((fn) => fn()); };
  const st = () => ({ sel: s.sel, tri: s.tri, bucket: s.bucket, chk: s.chk, sent: s.sent, saved: s.saved, cfg, prev: prev() });

  // blok yürütücü: bloklar → parçacıklar (parçacık = s3-model parçacığı)
  function walk(bloklar, W) {
    for (const b of bloklar || []) {
      switch (b.t) {
        case 'h': W.push({ t: 'h', text: b.text }); break;
        case 'p': W.push({ t: 'p', text: b.text, tone: b.tone }); break;
        case 'card': W.push({ t: 'card', kind: b.kind || 'egitici', text: typeof b.text === 'function' ? b.text(st()) : b.text, title: b.title, kaynak: b.kaynak, rozet: b.rozet, list: b.list }); break;
        case 'table': W.push({ t: 'table', head: b.head, rows: typeof b.rows === 'function' ? b.rows(st()) : b.rows }); break;
        case 'canvas': W.push({ t: 'canvas', ...b }); break;
        case 'toggle': {
          W.push({ t: 'row', btns: [{ id: 'tg:' + b.id, label: b.label, on: !!s.open[b.id], caret: true }] });
          if (s.open[b.id]) walk(b.bloklar, W);
          break;
        }
        case 'check': W.push({ t: 'check', id: 'ck:' + b.id, label: b.label, on: !!s.chk[b.id] }); break;
        case 'varsa': if (b.kosul(st())) walk(b.bloklar, W); break;
        case 'hesap': walk(def.hesap[b.ad](st()), W); break;
        case 'choice': choice(b, W); break;
        case 'tri': tri(b, W); break;
        case 'bucket': bucket(b, W); break;
        case 'kaydet': kaydet(b, W); break;
        default: break;
      }
    }
  }

  function choice(b, W) {
    W.push({ t: 'h', text: b.soru });
    const sel = s.sel[b.id] || [];
    if (!b.multi) {
      b.secenekler.forEach((o) => W.push({ t: 'row', btns: [{ id: `ch:${b.id}:${o.id}`, label: o.ad, on: sel.includes(o.id) }] }));
      const o = b.secenekler.find((x) => sel.includes(x.id));
      if (o) { const g = typeof o.geri === 'function' ? o.geri(st()) : o.geri; W.push({ t: 'card', kind: TUR_KART[g.tur], title: TUR_BASLIK[g.tur], text: g.text, kaynak: g.kaynak, rozet: g.rozet }); }
    } else {
      b.secenekler.forEach((o) => W.push({ t: 'check', id: `cm:${b.id}:${o.id}`, label: o.ad, on: sel.includes(o.id) }));
      W.push({ t: 'row', btns: [{ id: 'cs:' + b.id, label: 'Yanıtı kontrol et', primary: true, disabled: !sel.length }] });
      if (s.sent[b.id]) {
        const ok = b.dogru.length === sel.length && b.dogru.every((x) => sel.includes(x));
        W.push({ t: 'card', kind: ok ? 'egitmen' : 'ipucu', title: ok ? TUR_BASLIK.dogru : TUR_BASLIK.yanlis, text: ok ? b.geriDogru : b.geriYanlis, kaynak: b.kaynak, rozet: b.rozet });
      }
    }
  }

  function tri(b, W) {
    if (b.soru) W.push({ t: 'h', text: b.soru });
    b.satirlar.forEach((r) => {
      const known = typeof r.bilinen === 'function' ? r.bilinen(cfg, prev()) : r.bilinen ?? null;
      W.push({ t: 'p', text: r.ad + (known ? `  —  olgu verisi: ${known}` : '  —  olgu verisi: doğrulanmadı'), tone: known ? 'ok' : 'warn' });
      W.push({ t: 'row', btns: ['var', 'yok', 'bilinmiyor'].map((v) => ({ id: `tr:${b.id}.${r.id}:${v}`, label: { var: 'Var', yok: 'Yok', bilinmiyor: 'Bilinmiyor' }[v], on: s.tri[`${b.id}.${r.id}`] === v })) });
      const cur = s.tri[`${b.id}.${r.id}`];
      if (cur) {
        if (known && cur !== known) W.push({ t: 'p', text: `Olgu verisiyle uyumsuz: doğrulanmış değer “${known}”.`, tone: 'bad' });
        else if (!known && cur !== 'bilinmiyor') W.push({ t: 'p', text: 'Bu olguda bu bilgi doğrulanmadı; “Bilinmiyor” olarak bırakmak daha doğrudur.', tone: 'warn' });
        else W.push({ t: 'p', text: 'Uyumlu.', tone: 'ok' });
      }
    });
  }

  function bucket(b, W) {
    W.push({ t: 'h', text: b.soru });
    const cur = s.bucket;
    b.satirlar.forEach((r) => {
      W.push({ t: 'p', text: r.ad });
      W.push({ t: 'row', btns: b.kovalar.map((k) => ({ id: `bk:${b.id}.${r.id}:${k.id}`, label: k.ad, on: cur[`${b.id}.${r.id}`] === k.id })) });
    });
    W.push({ t: 'row', btns: [{ id: 'bs:' + b.id, label: 'Kontrol et', primary: true, disabled: !b.satirlar.every((r) => cur[`${b.id}.${r.id}`]) }] });
    if (s.sent[b.id]) {
      const yanlis = b.satirlar.filter((r) => cur[`${b.id}.${r.id}`] !== r.dogru);
      if (!yanlis.length) W.push({ t: 'card', kind: 'egitmen', title: TUR_BASLIK.dogru, text: b.geriDogru, kaynak: b.kaynak });
      else W.push({ t: 'card', kind: 'ipucu', title: TUR_BASLIK.yanlis, text: `${yanlis.length} ifade farklı bir gruba ait: ` + yanlis.map((r) => `“${r.ad}” → ${b.kovalar.find((k) => k.id === r.dogru).ad}`).join(' · '), kaynak: b.kaynak });
    }
  }

  function kaydet(b, W) {
    W.push({ t: 'row', btns: [{ id: 'sv:' + b.id, label: b.dugme || 'Kararımı kaydet', primary: true }] });
    if (s.saved[b.id]) {
      const o = def.ozet(st());
      W.push({ t: 'h', text: o.baslik });
      o.bolumler.forEach((sec) => W.push({ t: 'card', kind: sec.kart || 'rapor', title: sec.baslik, text: sec.satirlar.join(' '), list: sec.satirlar, kaynak: sec.kaynak }));
      if (def.sonrakiDugme) W.push({ t: 'row', btns: [{ id: 'nx:go', label: def.sonrakiDugme, primary: true }] });
    }
  }

  // Eylemin etkileşimli bloklarını (koşulsuz) toplar → tamamlanma durumu
  function interactive(bloklar, out = []) {
    for (const b of bloklar || []) {
      if (['choice', 'tri', 'bucket', 'kaydet'].includes(b.t)) out.push(b);
      if (b.bloklar) interactive(b.bloklar, out);
    }
    return out;
  }
  const done = (b) => {
    if (b.t === 'choice') return b.multi ? !!s.sent[b.id] : !!(s.sel[b.id] || []).length;
    if (b.t === 'tri') return b.satirlar.every((r) => s.tri[`${b.id}.${r.id}`]);
    if (b.t === 'bucket') return !!s.sent[b.id];
    if (b.t === 'kaydet') return !!s.saved[b.id];
    return true;
  };
  function status(id) {
    const list = interactive(def.ekranlar[id]);
    if (!list.length) return s.open['__v' + id] ? 'Açıldı' : '';
    const n = list.filter(done).length;
    return n === list.length ? 'Tamamlandı' : n || s.open['__v' + id] ? 'Açıldı' : '';
  }
  const allDone = () => def.eylemler.every((e) => { const l = interactive(def.ekranlar[e.id]); return l.every(done); });

  function model() {
    const W = [];
    if (s.active) walk(def.ekranlar[s.active], W);
    else W.push({ t: 'p', text: def.bosMetin || 'Soldan değil, sağdaki listeden bir eylem seçin. Eylemleri istediğiniz sırada yapabilirsiniz.', tone: 'muted' });
    const solDef = s.active && def.sol?.[s.active];
    return {
      ops: def.eylemler.map((e, i) => ({ id: e.id, ad: e.ad, status: status(e.id), on: s.active === e.id })),
      time: null, extraOps: [],
      left: def.solResim?.[s.active] ? { kind: def.solResim[s.active] } : solDef ? { kind: 'lab', baslik: solDef.baslik, etiket: solDef.etiket, head: solDef.head, rows: solDef.rows(st()), extra: solDef.extra ? solDef.extra(st()) : [] } : { kind: 'hasta' },
      widgets: W,
      prev: { note: def.oncekiMetin ? def.oncekiMetin(st()) : prev().note || '', history: '' },
    };
  }

  const store = {
    data: def.veri, def, cfg,
    view: () => ({ active: s.active, seq: s.seq, done: allDone() }),
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    model,
    state: st,
    isDone: allDone,
    saved: () => Object.values(s.saved).some(Boolean),
    ozetMetni() { const o = Object.keys(s.saved).length && def.ozet ? def.ozet(st()) : null; return o ? o.bolumler.map((x) => x.satirlar.join(' ')).join(' ') : ''; },
    perform(id) {
      const [k, a, b] = id.split(':');
      switch (k) {
        case 'op': if (!def.eylemler.some((e) => e.id === a)) return false; s.active = a; s.open['__v' + a] = true; emit(); return true;
        case 'tg': s.open[a] = !s.open[a]; emit(); return true;
        case 'ck': s.chk[a] = !s.chk[a]; emit(); return true;
        case 'ch': s.sel[a] = [b]; emit(); return true;
        case 'cm': { const cur = s.sel[a] || []; s.sel[a] = cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]; s.sent[a] = false; emit(); return true; }
        case 'cs': s.sent[a] = true; emit(); return true;
        case 'tr': s.tri[a] = b; emit(); return true;
        case 'bk': s.bucket[a] = b; s.sent[a.split('.')[0]] = false; emit(); return true;
        case 'bs': s.sent[a] = true; emit(); return true;
        case 'sv': s.saved[a] = true; emit(); return true;
        case 'nx': onNext?.(); return true;
        default: return false;
      }
    },
  };
  return store;
}

// ---- 2024 McDonald: koşullu karar mantığı (md §7). IgG indeksi DAHİL DEĞİLDİR. ----
// girdi değerleri: 'var' | 'yok' | 'bilinmiyor'  (csf: 'pozitif' | 'negatif' | 'bilinmiyor')
// ≥2 bölge: + (BOS veya CVS veya DIT) ya da ≥4 bölge. Tek bölge: (BOS veya DIT) + (CVS veya PRL). PRL ≥2 bölgede tek başına ek kanıt DEĞİLDİR (R01 Şekil 3).
export function mcdonald({ bolgeler, csf, dit, cvs, prl, aciklama }) {
  const ad = { optik: 'Optik sinir', periv: 'Periventriküler', kortikal: 'Kortikal/jukstakortikal', infra: 'İnfratentoriyal', omurilik: 'Omurilik' };
  const eksik = [];
  const ids = Object.keys(ad);
  const vals = ids.map((k) => bolgeler[k] || 'bilinmiyor');
  ids.forEach((k, i) => { if (vals[i] === 'bilinmiyor') eksik.push(`${ad[k]} bölgesinde tipik lezyon durumu`); });
  const nVar = vals.filter((v) => v === 'var').length, nUnk = vals.filter((v) => v === 'bilinmiyor').length;
  const c = csf || 'bilinmiyor', d = dit || 'bilinmiyor', v = cvs || 'bilinmiyor', r = prl || 'bilinmiyor', a = aciklama || 'bilinmiyor';
  if (c === 'bilinmiyor') eksik.push('BOS’a özgü OKB (patern 2/3) veya kFLC indeksi');
  if (d === 'bilinmiyor') eksik.push('Zamanda yayılım (DIT)');
  if (v === 'bilinmiyor') eksik.push('Santral ven işareti (CVS, “select 6”)');
  if (r === 'bilinmiyor' && nVar < 2) eksik.push('Paramagnetik rim lezyonu (PRL; yalnız tek bölge durumunda ek kanıt)');
  if (a !== 'yok') eksik.push('“Daha iyi bir açıklama yok” değerlendirmesi (klinik + seroloji + kırmızı bayraklar)');

  // alt/üst sınır: bilinmeyenler en kötü ve en iyi durumda
  const tests = (nR, c1, d1, v1, r1) => (nR >= 4) || (nR >= 2 && (d1 || c1 || v1)) || (nR === 1 && (d1 || c1) && (v1 || r1));
  const pos = (x) => x === 'pozitif' || x === 'var';
  const worst = tests(nVar, pos(c), pos(d), pos(v), pos(r));
  const best = tests(nVar + nUnk, c !== 'negatif' && c !== 'yok', d !== 'yok', v !== 'yok', r !== 'yok');
  const gerekce = [];
  if (a === 'var') return { sonuc: 'ertele', baslik: 'Tanı ertelenir', gerekce: ['Daha iyi bir açıklama mevcut: ayırıcı tanı tamamlanmalı.'], eksik: [] };
  if (worst && a === 'yok') { gerekce.push(`${nVar} bölgede tipik lezyon; ek kanıt koşulu sağlanıyor.`); return { sonuc: 'ms', baslik: '2024 McDonald’a göre MS ölçütleri karşılanıyor', gerekce, eksik: [] }; }
  if (worst && a !== 'yok') return { sonuc: 'kosullu', baslik: 'Koşullu değerlendirme', gerekce: ['Ölçütler karşılanıyor görünüyor; ancak “daha iyi açıklama yok” doğrulanmadı.'], eksik };
  if (!best) return { sonuc: 'konamaz', baslik: 'Bu girdilerle MS tanısı konamaz', gerekce: ['Mevcut ve olası verilerle bile ölçüt karşılanmıyor.'], eksik: [] };
  return { sonuc: 'kosullu', baslik: 'Koşullu değerlendirme / eksik veri', gerekce: ['Kesin sonuç için eksik bilgilerin tamamlanması gerekir.'], eksik };
}
