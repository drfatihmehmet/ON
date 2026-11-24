import assert from 'node:assert/strict';
import { mcdonald, createDecisionStore } from '../src/ds-engine.js';
import { SAHNE_04, dogrulanmisGirdi } from '../src/scene04-data.js';
import { OLGU_YAPILANDIRMA } from '../src/scene03-config.js';

const B = (o = {}) => ({ optik: 'yok', periv: 'yok', kortikal: 'yok', infra: 'yok', omurilik: 'yok', ...o });
const R = (x) => mcdonald({ aciklama: 'yok', csf: 'negatif', dit: 'yok', cvs: 'yok', prl: 'yok', ...x });
// boş (girilmemiş) eğitmen yapılandırması
const N = (o) => Object.fromEntries(Object.keys(o).map((k) => [k, null]));
const O = OLGU_YAPILANDIRMA;
const E = { ...O, kurgu: false, aktivite: N(O.aktivite), klinik: N(O.klinik), bos14gun: N(O.bos14gun), dmt: N(O.dmt), izlem: N(O.izlem), tani: { bolgeler: N(O.tani.bolgeler), dit: null, cvs: null, prl: null, kflc: null, aciklama: null, antikor: N(O.tani.antikor) } };

// ---- 2024 McDonald mantığı (IgG indeksi girdi değildir) ----
assert.equal(R({ bolgeler: B({ periv: 'var', omurilik: 'var', infra: 'var', kortikal: 'var' }) }).sonuc, 'ms', '≥4 bölge ek kanıt gerektirmez');
assert.equal(R({ bolgeler: B({ periv: 'var', omurilik: 'var' }), csf: 'pozitif' }).sonuc, 'ms', 'DIS + BOS, DIT gerekmez');
assert.equal(R({ bolgeler: B({ periv: 'var', omurilik: 'var' }), dit: 'var' }).sonuc, 'ms', 'DIS + DIT');
assert.equal(R({ bolgeler: B({ periv: 'var', omurilik: 'var' }) }).sonuc, 'konamaz', '2 bölge, ek kanıt yok, CVS yok');
assert.equal(R({ bolgeler: B({ periv: 'var', omurilik: 'var' }), cvs: 'var' }).sonuc, 'ms', '2–3 bölge + CVS');
assert.equal(R({ bolgeler: B({ periv: 'var' }), csf: 'pozitif' }).sonuc, 'konamaz', 'tek bölge: BOS tek başına yetmez, CVS/PRL gerekir');
assert.equal(R({ bolgeler: B({ periv: 'var' }), csf: 'pozitif', cvs: 'var' }).sonuc, 'ms', 'tek bölge + BOS + CVS');
assert.equal(R({ bolgeler: B() }).sonuc, 'konamaz', 'n=0');
// PRL: yalnız tek bölgede ek kanıt; ≥2 bölgede tek başına yetmez (2024 McDonald Şekil 3)
assert.equal(R({ bolgeler: B({ periv: 'var', omurilik: 'var' }), prl: 'var' }).sonuc, 'konamaz', '2 bölge + yalnız PRL → MS değil');
assert.equal(R({ bolgeler: B({ periv: 'var' }), csf: 'pozitif', prl: 'var' }).sonuc, 'ms', 'tek bölge + BOS + PRL');
assert.equal(R({ bolgeler: B({ periv: 'var' }), dit: 'var', prl: 'var' }).sonuc, 'ms', 'tek bölge + DIT + PRL');
assert.equal(R({ bolgeler: B({ periv: 'var' }), csf: 'pozitif', prl: 'bilinmiyor' }).sonuc, 'kosullu', 'tek bölge + BOS, PRL bilinmiyor');
assert.equal(mcdonald({ bolgeler: B({ periv: 'var', omurilik: 'var' }), csf: 'pozitif', dit: 'yok', cvs: 'yok', aciklama: 'var' }).sonuc, 'ertele', 'daha iyi açıklama var');
assert.equal(mcdonald({ bolgeler: B({ periv: 'var', omurilik: 'var' }), csf: 'pozitif', dit: 'yok', cvs: 'yok', aciklama: 'bilinmiyor' }).sonuc, 'kosullu', 'açıklama bilinmiyor → koşullu');
{ const r = mcdonald({ bolgeler: { optik: 'bilinmiyor', periv: 'bilinmiyor', kortikal: 'bilinmiyor', infra: 'bilinmiyor', omurilik: 'bilinmiyor' }, csf: 'bilinmiyor', dit: 'bilinmiyor', cvs: 'bilinmiyor', aciklama: 'bilinmiyor' });
  assert.equal(r.sonuc, 'kosullu'); assert.ok(r.eksik.length >= 8); assert.ok(r.eksik.some((x) => /OKB/.test(x))); }
assert.ok(!JSON.stringify(R({ bolgeler: B() })).toLowerCase().includes('igg indeksi'));

// ---- olgu doğrulanmış verisi eksik → sonuç koşullu (negatif/normal kodlanmaz) ----
{ const g = dogrulanmisGirdi(E); assert.equal(g.csf, 'bilinmiyor'); assert.equal(mcdonald(g).sonuc, 'kosullu');
  const cfg = { ...E, bos14gun: { ...E.bos14gun, okbPatern: 2 }, tani: { ...E.tani, bolgeler: B({ periv: 'var', omurilik: 'var' }), dit: 'yok', cvs: 'yok' } };
  assert.equal(dogrulanmisGirdi(cfg).csf, 'pozitif'); assert.equal(mcdonald({ ...dogrulanmisGirdi(cfg), aciklama: 'yok' }).sonuc, 'ms');
  const c2 = { ...cfg, bos14gun: { ...cfg.bos14gun, okbPatern: 4 } }; assert.equal(dogrulanmisGirdi(c2).csf, 'bilinmiyor', 'OKB negatif, kFLC bilinmiyor');
  assert.equal(dogrulanmisGirdi({ ...c2, tani: { ...c2.tani, kflc: 'çalışılmadı' } }).csf, 'negatif');
  assert.equal(dogrulanmisGirdi({ ...E, tani: { ...E.tani, kflc: 'negatif' } }).csf, 'bilinmiyor', 'yalnız kFLC negatif, OKB bekliyor'); }
// eğitim olgusu verisi: 2024 McDonald karşılanıyor
{ const g = dogrulanmisGirdi(O); assert.equal(g.csf, 'pozitif'); assert.equal(mcdonald(g).sonuc, 'ms'); }

// ---- sahne 04 motor akışı ----
const mk = (cfg = E) => createDecisionStore(SAHNE_04, cfg, { prev: () => ({ note: '' }) });
{ const s = mk(); let m = s.model(); assert.equal(m.ops.length, 6); assert.equal(m.left.kind, 'hasta');
  s.perform('op:sonuc'); m = s.model(); assert.equal(m.left.kind, 'lab'); const rows = m.left.rows.map((r) => r.join('|')).join('\n');
  assert.match(rows, /OKB paterni\|Girilmedi/); assert.match(rows, /IgG indeksi\|Girilmedi/); assert.ok(!/negatif|normal/i.test(m.left.rows.map((r) => r[1]).join(' ')), 'girilmemiş değer negatif/normal değil');
  // çoklu seçim: IgG indeksi doğru cevap değil
  ['okb', 'kflc', 'igg'].forEach((o) => s.perform(`cm:mcdBos:${o}`)); s.perform('cs:mcdBos');
  assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'ipucu'), 'IgG seçilince yanlış');
  s.perform('cm:mcdBos:igg'); s.perform('cs:mcdBos'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'egitmen')); }
{ const s = mk(); s.perform('op:pano');
  // eksik veride "var" işaretlemek uyarı üretir; "bilinmiyor" uyumlu
  s.perform('tr:bol.periv:var'); let w = s.model().widgets; assert.ok(w.some((x) => x.t === 'p' && /doğrulanmadı|Bilinmiyor/.test(x.text) && x.tone === 'warn'));
  ['optik', 'periv', 'kortikal', 'infra', 'omurilik'].forEach((k) => s.perform(`tr:bol.${k}:bilinmiyor`)); ['dit', 'csf', 'cvs', 'prl', 'aciklama'].forEach((k) => s.perform(`tr:jet.${k}:bilinmiyor`));
  const cards = s.model().widgets.filter((x) => x.t === 'card' && /sonu[cç]/i.test(x.title)); assert.equal(cards.length, 2); assert.match(cards[0].text, /Koşullu/); assert.match(cards[1].text, /Koşullu/);
  // öğrenci hepsini "var/pozitif" işaretlese bile doğrulanmış sonuç koşullu kalır
  ['optik', 'periv', 'kortikal', 'infra', 'omurilik'].forEach((k) => s.perform(`tr:bol.${k}:var`)); const c2 = s.model().widgets.filter((x) => x.t === 'card' && /sonu[cç]/i.test(x.title));
  assert.match(c2[0].text, /karşılanıyor/); assert.match(c2[1].text, /Koşullu/); }
{ const s = mk(); s.perform('op:sinif'); const bk = SAHNE_04.ekranlar.sinif[1].satirlar; bk.forEach((r) => s.perform(`bk:sentez.${r.id}:${r.dogru}`)); s.perform('bs:sentez');
  assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'egitmen')); s.perform('bk:sentez.s1:eksik'); s.perform('bs:sentez'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'ipucu')); }
{ const s = mk(); s.perform('op:karar'); s.perform('ch:tani:ms'); let w = s.model().widgets; assert.ok(w.some((x) => x.t === 'card' && x.kind === 'ipucu'), 'eksik veriyle MS tanısı yanlış');
  s.perform('ch:tani:kosullu'); w = s.model().widgets; assert.ok(w.some((x) => x.t === 'card' && x.kind === 'egitmen')); s.perform('sv:tani');
  const txt = JSON.stringify(s.model().widgets); assert.match(txt, /Tanısal sentez özeti/); assert.match(txt, /Eksik \/ girilmemiş/); }
{ const s = mk(O); s.perform('op:karar'); s.perform('ch:tani:ms'); assert.ok(s.model().widgets.some((x) => x.t === 'card' && x.kind === 'egitmen'), 'tam veriyle MS doğru');
  s.perform('ch:tani:kosullu'); assert.ok(s.model().widgets.some((x) => x.t === 'card' && x.kind === 'ipucu'), 'tam veriyle erteleme yanlış'); }
{ const s = mk(); const ops = s.model().ops; assert.ok(ops.every((o) => o.status === '')); s.perform('op:okb'); assert.equal(s.model().ops.find((o) => o.id === 'okb').status, 'Açıldı');
  s.perform('ch:tip4:b'); assert.equal(s.model().ops.find((o) => o.id === 'okb').status, 'Açıldı'); s.perform('ch:tip:2'); s.perform('ch:tip4:b'); assert.equal(s.model().ops.find((o) => o.id === 'okb').status, 'Tamamlandı'); }

console.log('ds testleri: tamam');

// ---- Sahne 05 / 06 ----
import { SAHNE_05 } from '../src/scene05-data.js';
import { SAHNE_06 } from '../src/scene06-data.js';
{ const s = createDecisionStore(SAHNE_05, { ...E, tani: { ...E.tani, bolgeler: { ...E.tani.bolgeler, omurilik: 'var' } } }, { prev: () => ({ note: 'Sağ gözde görme keskinliği 20/200 (0,1). Nörolojik muayene: Koordinasyon: Bilateral dismetri.' }) });
  s.perform('op:aktivite'); const p = s.model().widgets.filter((w) => w.t === 'p').map((w) => w.text).join('\n');
  assert.match(p, /Omurilik lezyonu.*olgu verisi: var/); assert.match(p, /Yüksek T2 lezyon yükü.*doğrulanmadı/); assert.match(p, /Piramidal veya serebellar.*olgu verisi: var/);
  s.perform('tr:akt.omurilik:yok'); assert.ok(s.model().widgets.some((w) => w.t === 'p' && w.tone === 'bad' && /uyumsuz/.test(w.text)), 'doğrulanmış omurilik lezyonunu yok işaretlemek uyumsuz');
  s.perform('op:ilaclar'); s.perform('tg:ilac-ntz'); assert.ok(s.model().widgets.some((w) => w.t === 'p' && /JCV serostatüsü.*bilinmiyor/.test(w.text)));
  s.perform('op:secim'); s.perform('ch:dmt:ntz'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'uyari' && /JCV serostatüsü bu olguda bilinmiyor/.test(w.text)), 'natalizumab: JCV bilinmiyor → bağlama bağlı');
  s.perform('ch:dmt:dmf'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'egitmen'));
  s.perform('ch:dmt:ifn'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'egitmen' && /Kabul edilebilir/.test(w.title)));
  const cfgJ = O; const t = createDecisionStore(SAHNE_05, cfgJ, { prev: () => ({ note: '' }) }); t.perform('op:secim'); t.perform('ch:dmt:ntz'); assert.ok(t.model().widgets.some((w) => w.t === 'card' && /seronegatif/.test(w.text)));
  s.perform('ck:g-omurilik'); s.perform('op:kayit'); s.perform('sv:dmt'); const j = JSON.stringify(s.model().widgets); assert.match(j, /Anti-CD20|İnterferon-β/); assert.match(j, /gerçek hasta reçetesi değildir/); assert.match(j, /DMF başlangıcı ve izlem sahnesine geç/);
  let moved = 0; const u = createDecisionStore(SAHNE_05, OLGU_YAPILANDIRMA, { onNext: () => moved++ }); u.perform('nx:go'); assert.equal(moved, 1); assert.equal(u.saved(), false); u.perform('sv:dmt'); assert.equal(u.saved(), true); }
{ const s = createDecisionStore(SAHNE_06, OLGU_YAPILANDIRMA, { prev: () => ({ note: '' }) });
  s.perform('op:titrasyon'); s.perform('ch:titre:b'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'egitmen' && /standart titrasyon/.test(w.text)));
  s.perform('ch:titre:c'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'uyari' && /KÜB/.test(w.text)));
  s.perform('op:yan'); ['food', 'egit', 'sempt'].forEach((o) => s.perform(`cm:yanyon:${o}`)); s.perform('cs:yanyon'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'egitmen')); s.perform('cm:yanyon:kes'); s.perform('cs:yanyon'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'ipucu'));
  s.perform('op:lenfosit'); s.perform('ch:lenC:rutin'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'ipucu')); s.perform('ch:lenC:kes'); assert.ok(s.model().widgets.some((w) => w.t === 'card' && w.kind === 'egitmen'));
  s.perform('ch:lenB:yakin'); assert.match(JSON.stringify(s.model().widgets), /500–800\/µL/);
  assert.ok(s.model().widgets.some((w) => w.t === 'card' && /Kaynaklar arası fark/.test(w.title)));
  s.perform('op:son'); s.perform('sv:son'); assert.match(JSON.stringify(s.model().widgets), /gerçek hasta reçetesi değildir/); }
// kaynak/rozet alanları: bilimsel kartlarda kaynak bulunur
{ const hepsi = [SAHNE_04, SAHNE_05, SAHNE_06].flatMap((d) => Object.values(d.ekranlar).flat()); let kartlar = 0, kaynaksiz = 0;
  const gez = (b) => { if (b.t === 'card' && b.kind !== 'uyari') { kartlar++; if (!b.kaynak && !b.rozet) kaynaksiz++; } (b.bloklar || []).forEach(gez); };
  hepsi.forEach(gez); assert.ok(kartlar > 40); assert.ok(kaynaksiz <= 2, 'kaynaksız bilimsel kart sayısı: ' + kaynaksiz); }
console.log('ds 05/06 testleri: tamam');
