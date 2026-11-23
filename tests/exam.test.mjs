import assert from 'node:assert/strict';
import { SAHNE_02 as D } from '../src/scene02-data.js';
import { createExamStore, createApp, pupilSize } from '../src/exam-state.js';
import { SAHNE_01 } from '../src/scene-data.js';
import { createStore } from '../src/state.js';

let T = 0; // sahte saat (ms)
const mk = () => { T = 0; return createExamStore(D, { clock: () => T }); };
const adv = (s, ms, step = 100) => { for (let i = 0; i < ms; i += step) { T += step; s.tick(T); } };
const sizes = (s) => s.view(T).pupil.size;

// ---- RAPD dizisi: sol ışık → dar; sağ ışık → göreceli geniş; tekrar sol → dar ----
{ const s = mk(); const c = D.pupilla.boyut;
  assert.equal(s.view(T).pupil.lit, null); assert.equal(sizes(s), c.karanlik, 'başlangıçta ışık yok, iki pupilla eşit (tek durum)');
  s.run('sol', T); adv(s, 2500); const dar1 = sizes(s);
  s.run('sag', T); adv(s, 2500); const genis = sizes(s);
  s.run('sol', T); adv(s, 2500); const dar2 = sizes(s);
  assert.ok(Math.abs(dar1 - c.solAydinlik) < 1e-6, 'sol ışık: belirgin dar');
  assert.ok(genis > dar1 + 0.15, 'sağ ışık: sol ışığa göre belirgin geniş');
  assert.ok(genis < c.karanlik, 'sağ ışıkta pupilla yine de karanlıktakinden dar');
  assert.ok(Math.abs(dar2 - dar1) < 1e-6, 'tekrar sol: yeniden dar');
  // Her an iki pupilla tek değerden çizilir; bağımsız sağ/sol boyutu yoktur
  const v = s.view(T); assert.equal(Object.keys(v.pupil).filter((k) => /^(sag|sol)Size$/.test(k)).length, 0); }

// ---- ışığı sağa taşırken karanlık geçiş yok: ara değerler monoton, karanlık boyutuna çıkmaz ----
{ const s = mk(); s.run('sol', T); adv(s, 2500); s.run('sag', T);
  let prev = sizes(s), max = prev;
  for (let i = 0; i < 20; i++) { T += 25; const z = sizes(s); assert.ok(z >= prev - 1e-9, 'monoton'); prev = z; max = Math.max(max, z); }
  assert.ok(max <= D.pupilla.boyut.sagAydinlik + 1e-9, 'geçişte karanlık düzeyine sıçramaz'); }
assert.ok(D.pupilla.boyut.sagAydinlik > D.pupilla.boyut.solAydinlik);
assert.ok(D.pupilla.gecisMs <= 600, 'geçiş kısa');

// ---- pupilla sorusu: her iki taraf gözlenmeden açılmaz; doğru/yanlış; tekrar deneme ----
{ const s = mk(); s.run('sol', T); adv(s, 2100);
  assert.equal(s.view(T).pupil.questionAvailable, false); assert.equal(s.answerPupil('sag'), false);
  s.run('sag', T); adv(s, 1000); assert.equal(s.view(T).pupil.questionAvailable, false);
  adv(s, 1200); assert.equal(s.view(T).pupil.questionAvailable, true);
  assert.equal(s.answerPupil('sol'), true); let v = s.view(T);
  assert.equal(v.pupil.correct, false); assert.deepEqual(v.cards.map((c) => c.kind), ['ipucu']); assert.equal(v.cards[0].text, D.pupilla.yanlisIpucu);
  assert.equal(v.done.pupilla, false); assert.equal(v.note.lines.length, 0);
  s.answerPupil('yok'); assert.equal(s.view(T).pupil.correct, false);
  s.answerPupil('sag'); v = s.view(T);
  assert.equal(v.pupil.correct, true); assert.deepEqual(v.cards.map((c) => c.kind), ['bulgu', 'egitici']);
  assert.match(v.cards[0].text, /Sağ rölatif afferent pupilla defekti/); assert.equal(v.done.pupilla, true); }

// ---- görme keskinliği / renk: sonuç yalnızca ölçüm bitince ----
{ const s = mk(); s.run('gorme', T); adv(s, 1000);
  let v = s.view(T); assert.equal(v.cards.length, 0); assert.equal(v.done.gorme, false); assert.equal(v.visual.finished, false); assert.equal(v.animating, true);
  adv(s, 2000); v = s.view(T); assert.deepEqual(v.cards.map((c) => c.kind), ['bulgu', 'egitici']);
  assert.equal(v.cards[0].text, 'Sağ göz görme keskinliği: 20/200 (ondalık 0,1).'); assert.equal(v.done.gorme, true);
  s.run('renk', T); adv(s, 4000); v = s.view(T);
  assert.deepEqual(v.cards.map((c) => c.kind), ['yanit', 'bulgu']); assert.equal(v.done.renk, true);
  // tekrar inceleme: bulgu kalır
  s.run('gorme', T); v = s.view(T); assert.equal(v.done.gorme, true); assert.equal(v.cards.length, 2); }

// ---- fundus ----
{ const s = mk(); s.run('fundus', T); const v = s.view(T);
  assert.deepEqual(v.cards.map((c) => c.kind), ['bulgu', 'egitici']); assert.match(v.cards[0].text, /disk ödemi izlenmiyor/); assert.equal(v.done.fundus, true); }

// ---- plan: seçim normal sonuç atamaz ----
{ const s = mk(); s.run('plan', T); let v = s.view(T); assert.equal(v.done.plan, false); assert.equal(v.note.lines.length, 0);
  s.togglePlan('gozhareket'); s.togglePlan('yuruyus'); v = s.view(T);
  assert.equal(v.done.plan, true); assert.deepEqual(v.cards[0].list, ['Göz hareketleri', 'Yürüyüş']);
  // yalnız seçilen başlıkların sonucu açılır; seçilmeyene sonuç atanmaz
  const bulgu = v.cards.find((c) => c.kind === 'bulgu'); assert.deepEqual(bulgu.list, ['Göz hareketleri: Bir–iki atımlık horizontal nistagmus.', 'Yürüyüş: Doğal.']);
  assert.ok(!/refleks|dismetri|kas gücü|duyu/i.test(JSON.stringify(bulgu)), 'seçilmeyen başlık sonucu açılmadı');
  assert.ok(v.cards.some((c) => c.kind === 'plan' && /almadığınız başlıklar/.test(c.text)));
  s.togglePlan('yuruyus'); assert.equal(s.view(T).planSelected.length, 1);
  s.togglePlan('refleks'); s.togglePlan('koordinasyon'); s.togglePlan('kraniyal'); s.togglePlan('gug'); s.togglePlan('duyu'); s.togglePlan('yuruyus');
  v = s.view(T); const all = v.cards.find((c) => c.kind === 'bulgu').list.join(' ');
  assert.match(all, /Derin tendon refleksleri alt ekstremitelerde canlı/); assert.match(all, /Bilateral dismetri/); assert.match(all, /horizontal nistagmus/);
  assert.equal((all.match(/Doğal./g) || []).length, 4, 'diğerleri doğal'); assert.ok(!v.cards.some((c) => /almadığınız/.test(c.text)), 'hepsi seçildi');
  assert.match(v.note.paragraph, /^Nörolojik muayene: Göz hareketleri: Bir–iki atımlık horizontal nistagmus./);
  assert.ok(v.cards.some((c) => c.kind === 'egitici'));
  assert.equal(s.view(T).eyeDoneCount, 0, 'plan göz muayenesi sayılmaz'); }

// ---- birleştirme: kilit, yanlış ipucu, doğru A, not ----
{ const s = mk(); assert.equal(s.run('birlestir', T), false); assert.equal(s.view(T).integAvail, false);
  s.run('gorme', T); adv(s, 3000); s.run('renk', T); adv(s, 4000); s.run('fundus', T);
  assert.equal(s.view(T).integAvail, false, 'pupilla tamamlanmadı');
  s.run('sol', T); adv(s, 2100); s.run('sag', T); adv(s, 2100); s.answerPupil('sag');
  let v = s.view(T); assert.equal(v.integAvail, true); assert.equal(v.eyeDoneCount, 4);
  assert.equal(v.note.paragraph, 'Sağ gözde görme keskinliği 20/200 (0,1). Sağ gözde renkli görme bozuk. Sağ RAPD mevcut. Sağ göz dibi doğal.');
  assert.ok(!/optik nörit|optik sinir/i.test(v.note.paragraph), 'tanısal yorum notta yok');
  assert.equal(s.run('birlestir', T), true);
  for (const k of ['B', 'C', 'D']) { s.answerInteg(k); v = s.view(T); assert.equal(v.integCorrect, false); assert.deepEqual(v.cards.map((c) => c.kind), ['ipucu']); assert.equal(v.cards[0].text, D.birlestir.ipuclari[k]); }
  assert.match(D.birlestir.ipuclari.D, /homonim görme alanı kaybının lokalizasyonlarını karşılaştırın/);
  s.answerInteg('A'); v = s.view(T); assert.equal(v.completed, true); assert.deepEqual(v.cards.map((c) => c.kind), ['egitmen']);
  assert.match(v.cards[0].text, /optik nörit ön planda düşünülür/); }

// ---- not yalnızca açılan bulguları toplar ----
{ const s = mk(); s.run('fundus', T); assert.equal(s.view(T).note.paragraph, 'Sağ göz dibi doğal.');
  s.run('gorme', T); assert.equal(s.view(T).note.lines.length, 1, 'ölçüm bitmeden gorme notta yok'); }

// ---- sahne geçişi: Sahne 01 tamamlanmadan 02'ye geçilemez; öykü korunur ----
{ const s1 = createStore(SAHNE_01); s1.start(); s1.videoEnded();
  const app = createApp({ canLeaveScene1: () => s1.view().completed });
  assert.equal(app.goto(2), false); SAHNE_01.sorular.filter((q) => q.zorunlu !== false).forEach((q) => s1.ask(q.id)); s1.complete();
  assert.equal(app.goto(2), true); assert.equal(app.scene, 2);
  assert.equal(app.goto(1), true); const v = s1.view(); assert.equal(v.completed, true); assert.equal(v.askedCount, 5); assert.ok(v.summary.length > 50);
  const e = createExamStore(D, { history: () => s1.view().summary, clock: () => 0 }); assert.equal(e.view(0).history, v.summary); }

// ---- veri sözleşmesi: üretilmemiş sayılar yok ----
{ const txt = JSON.stringify(D).toLowerCase();
  for (const w of ['ishihara', '%', 'iris rengi', 'normal sonuç']) assert.ok(!txt.includes(w) || w === 'normal sonuç', w);
  assert.ok(!/20\/20 ?[(:]|sol göz.{0,30}20\/\d+/i.test(JSON.stringify(D.gorme.sonuc))); }

console.log('exam testleri: tamam');
