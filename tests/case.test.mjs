import assert from 'node:assert/strict';
import { SAHNE_03 as D } from '../src/scene03-data.js';
import { OLGU_YAPILANDIRMA, eksikVarliklar } from '../src/scene03-config.js';
import { createCaseStore, fmt } from '../src/case-state.js';

const mk = (cfg = OLGU_YAPILANDIRMA, prev) => createCaseStore(D, cfg, prev ? { prev } : undefined);
const allChecks = (s) => D.lp.onKart.maddeler.forEach((m) => s.lpCheck(m.id));
const allPairs = (s) => D.lp.esler.forEach((e) => s.lpSerum(e.id));

// ---- biçim ----
assert.equal(fmt(7.2, 1), '7,2'); assert.equal(fmt(0.6666, 2), '0,67'); assert.equal(fmt(248, 0), '248');

// ---- kan tetkikleri: sayı ve birim ayrı alan ----
for (const r of D.kan.satirlar) { assert.equal(typeof r.deger, 'number'); assert.equal(typeof r.birim, 'string'); }
assert.equal(D.kan.satirlar.length, 10);

// ---- BOS: örnek alınmadan sonuç yok; onam/uygunluk gerekli ----
{ const s = mk(); let v = s.view();
  assert.equal(v.lp.routine, null); assert.equal(v.lp.sampled, false); assert.equal(v.lp.canSample, false);
  assert.equal(s.lpSample(), false, 'uygunluk değerlendirilmeden örnek alınamaz');
  assert.equal(s.jumpToFollowup(), false, 'örnek yokken iki hafta ilerlemesi yok'); assert.equal(s.bosOpen(), false);
  allChecks(s); assert.equal(s.view().lp.canSample, true);
  allPairs(s); assert.equal(s.lpSample(), true); v = s.view();
  assert.equal(v.sampleDay, 1); assert.equal(v.status.lp, 'Örnek alındı'); assert.equal(s.lpSample(), false, 'ikinci örnek yok');
  // rutin aynı gün sonuçlandı
  const row = (id) => v.lp.routine.find((r) => r.id === id);
  assert.equal(row('lokosit').deger, 2); assert.equal(row('lokosit').birim, 'hücre/µL'); assert.equal(row('basinc').deger, 16); assert.equal(row('basinc').aciklama, 'lateral dekübit ölçümü');
  assert.equal(row('gorunum').metin, 'Berrak');
  assert.ok(Math.abs(row('oran').deger - 64 / 96) < 1e-12); assert.equal(fmt(row('oran').deger, 2), '0,67');
  // OKB / indeks bekliyor
  assert.deepEqual(v.lp.pending.map((p) => p.durum), ['Sonuç bekleniyor.', 'Sonuç bekleniyor.']); assert.equal(v.status.bos, 'Sonuç bekleniyor'); }

// ---- eşleştirilmemiş glukoz → oran üretilmez ----
{ const s = mk(); allChecks(s); s.lpSerum('okb'); s.lpSample(); const v = s.view();
  const o = v.lp.routine.find((r) => r.id === 'oran'); assert.equal(o.deger, undefined); assert.match(o.metin, /Hesaplanamadı/);
  assert.equal(v.lp.routine.find((r) => r.id === 'esGlukoz').metin, 'Alınmadı'); assert.equal(v.lp.pairsDone, false); assert.equal(v.lp.missingPairs.length, 2); }

// ---- 14 gün örnek alım gününden hesaplanır ----
{ const s = mk(); s.nextDay(); s.nextDay(); /* gün 3 */ allChecks(s); allPairs(s); s.lpSample(); let v = s.view();
  assert.equal(v.sampleDay, 3); assert.equal(v.dueDay, 17); assert.equal(v.bosReady, false);
  for (let i = 0; i < 13; i++) s.nextDay(); v = s.view(); assert.equal(v.day, 16); assert.equal(v.bosReady, false); assert.equal(s.bosOpen(), false);
  s.nextDay(); v = s.view(); assert.equal(v.day, 17); assert.equal(v.bosReady, true); assert.equal(v.status.bos, 'Sonuçlandı'); assert.equal(s.bosOpen(), true);
  // eğitmen değeri girilmemişse negatif/normal kodlanmaz
  const r = s.view().bos.rapor; assert.equal(r.okb.var, false); assert.equal(r.igg.var, false);
  assert.match(r.okb.metin, /olgu sonucu eğitmen tarafından henüz girilmedi/); assert.ok(!/negatif|normal|Tip/i.test(r.okb.metin + r.igg.metin)); }
{ const s = mk(); allChecks(s); s.lpSample(); s.nextDay(); assert.equal(s.jumpToFollowup(), true); assert.equal(s.view().day, 15); assert.equal(s.view().active, 'bos'); }

// ---- eğitmen değerleri girilince kullanılır ----
{ const cfg = { ...OLGU_YAPILANDIRMA, bos14gun: { okbPatern: 2, okbNotu: null, iggIndeksi: 0.81 } };
  const s = mk(cfg); allChecks(s); s.lpSample(); s.jumpToFollowup(); s.bosOpen(); const r = s.view().bos.rapor;
  assert.equal(r.okb.metin, 'OKB paterni: Tip 2'); assert.equal(r.igg.metin, 'IgG indeksi: 0,81'); }

// ---- tedavi: sonuç beklemeden başlar; 5 ayrı gün; çift tıklama ek doz üretmez ----
{ const s = mk(); assert.equal(s.view().lp.sampled, false); assert.equal(s.giveDose(), false, 'istem yokken doz yok');
  assert.equal(s.txOrder(), true, 'OKB/BOS olmadan başlatılabilir'); assert.equal(s.txOrder(), false);
  assert.equal(s.giveDose(), true); assert.equal(s.giveDose(), false, 'aynı gün ikinci doz yok'); assert.equal(s.giveDose(), false);
  assert.equal(s.view().izlem.given, 1); assert.equal(s.view().status.tx, 'Doz uygulandı (1/5)');
  for (let d = 2; d <= 5; d++) { s.nextDay(); assert.equal(s.view().izlem.canGive, true); assert.equal(s.giveDose(), true); assert.equal(s.giveDose(), false); }
  let v = s.view(); assert.equal(v.izlem.given, 5); assert.equal(v.izlem.complete, true); assert.deepEqual(v.izlem.boxes.map((b) => b.day), [1, 2, 3, 4, 5]);
  assert.deepEqual(v.izlem.boxes.map((b) => b.ad), ['1. gün · 1 g IV', '2. gün · 1 g IV', '3. gün · 1 g IV', '4. gün · 1 g IV', '5. gün · 1 g IV']);
  s.nextDay(); assert.equal(s.giveDose(), false, 'beşten fazla doz yok'); assert.equal(s.view().izlem.given, 5);
  assert.equal(v.izlem.kontrol, 'Henüz kaydedilmedi'); }

// ---- atlanan gün: dozlar günde birer kez, sıralı ----
{ const s = mk(); s.txOrder(); s.giveDose(); s.nextDay(); s.nextDay(); assert.equal(s.giveDose(), true); const v = s.view(); assert.deepEqual(v.izlem.boxes.slice(0, 2).map((b) => b.day), [1, 3]); }

// ---- dozlar sahne değiştirince korunur (durum nesnesi aynı) ----
{ const s = mk(); s.txOrder(); s.giveDose(); const again = s.view(); assert.equal(again.izlem.given, 1); }

// ---- MRG: görüntü yokken rapor erişilebilir; ek veri yalnız doğrulanmışsa ----
{ const s = mk(); let v = s.view(); assert.equal(v.mrg.asset.beyin, false); assert.equal(v.mrg.report, null);
  s.mrgReport(); v = s.view(); assert.equal(v.mrg.report.lines[0], 'Beyin ve servikal omurilik MRG’de MS ile uyumlu demiyelinizan plaklar izlenmektedir.');
  assert.equal(v.mrg.report.extra.length, 0); assert.match(v.mrg.report.eksik, /doğrulanmamıştır/);
  s.mrgTab('servikal'); assert.equal(s.view().mrg.reportOpen, false, 'rapor sekme başına'); assert.equal(s.view().mrg.markersAvailable, false);
  const cfg = { ...OLGU_YAPILANDIRMA, mrg: { beyin: { tur: 'video', dosya: 'x.mp4' }, servikal: null }, mrgRaporEki: { ...OLGU_YAPILANDIRMA.mrgRaporEki, lezyonSayisi: 'X' }, isaretler: { beyin: [{ kesit: 0, x: 0.5, y: 0.5, etiket: 't' }], servikal: [] } };
  const t = mk(cfg); t.mrgReport(); const w = t.view(); assert.equal(w.mrg.asset.beyin, true); assert.equal(w.mrg.asset.servikal, false); assert.deepEqual(w.mrg.report.extra, ['Lezyon sayısı: X']); assert.equal(w.mrg.markersAvailable, true); }
{ const s = mk(); s.mrgKarar('evet'); assert.equal(s.view().mrg.kararDogru, false); s.mrgKarar('hayir'); assert.equal(s.view().mrg.kararDogru, true);
  D.mrg.egitA.mevcutEksik.secenekler.forEach((o) => s.mrgMevcutEksik(o.id, o.dogru)); assert.equal(s.mrgMevcutEksikSent(), true); s.mrgMevcutEksik('kontrast', 'mevcut'); assert.equal(s.view().mrg.mevcutEksikDogru, false); }

// ---- BOS OKB sorusu: Tip 2 ve 3 ----
{ const s = mk(); s.bosSel(3); s.bosSel(2); assert.equal(s.bosSend(), true); s.bosSel(4); assert.equal(s.bosSend(), false); assert.equal(s.view().bos.selDogru, false); }

// ---- kayıt ve özet ----
{ const s = mk(undefined, () => ({ note: 'Sağ RAPD mevcut.', history: 'öykü' })); assert.equal(s.save(), false);
  [0, 1, 2].forEach((i) => s.setAnswer(i, 'yanıt ' + i)); assert.equal(s.view().kayit.canSave, true); assert.equal(s.save(), true);
  const sum = s.view().kayit.summary; const tur = sum.sections.map((x) => x.tur);
  assert.deepEqual(tur, ['gercek', 'gercek', 'temsili', 'gercek', 'bekleyen', 'ogrenci']);
  const txt = JSON.stringify(sum); assert.match(txt, /Önceki muayene: Sağ RAPD mevcut\./); assert.match(txt, /BOS örneği alınmadı/); assert.match(txt, /Akut tedavi başlatılmadı/); assert.match(txt, /Henüz kaydedilmedi/);
  assert.ok(!/negatif|normal OKB/i.test(txt)); }
{ const s = mk(); s.toggleChip(0, 'A cümlesi.'); s.toggleChip(0, 'B cümlesi.'); assert.equal(s.view().kayit.answers[0], 'A cümlesi. B cümlesi.'); s.toggleChip(0, 'A cümlesi.'); assert.equal(s.view().kayit.answers[0], 'B cümlesi.'); }

// ---- eksik varlıklar bildirimi ----
{ const e = eksikVarliklar(); assert.ok(e.some((x) => /Beyin MRG/.test(x)) && e.some((x) => /Servikal MRG/.test(x)) && e.some((x) => /OKB paterni/.test(x)) && e.some((x) => /IgG indeksi/.test(x))); }
// başka olguya ait dosyalar bağlanmamış
assert.equal(OLGU_YAPILANDIRMA.mrg.beyin, null); assert.equal(OLGU_YAPILANDIRMA.mrg.servikal, null);

console.log('case testleri: tamam');
