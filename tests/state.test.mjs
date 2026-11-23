import assert from 'node:assert/strict';
import { SAHNE_01 as D } from '../src/scene-data.js';
import { createStore } from '../src/state.js';

const mk = () => { const s = createStore(D); s.start(); s.videoEnded(); return s; };

// video bir kez; sorular video bitmeden açılmaz
{ const s = createStore(D); let plays = 0; s.hooks.play = () => plays++;
  assert.equal(s.ask('baslangic'), true, 'panel baştan açık'); s.start(); assert.equal(s.start(), false); assert.equal(plays, 1);
  s.videoEnded(); assert.equal(s.view().ready, true);
  s.ask('baslangic'); s.ask('gorme'); assert.equal(plays, 1, 'soru seçimi videoyu yeniden başlatmaz'); }

// notlar yalnız sorulanlarla dolar
{ const s = mk(); let v = s.view(); assert.equal(v.timeline.length + v.facts.length, 0);
  s.ask('baslangic'); v = s.view();
  assert.deepEqual(v.timeline.map((n) => n.etiket), ['Bir hafta önce', 'Ertesi gün']); assert.equal(v.facts.length, 0);
  assert.equal(v.teachingAvailable, false);
  s.ask('aile'); v = s.view(); assert.equal(v.facts.length, 1); assert.equal(v.teachingAvailable, false);
  s.ask('gorme'); assert.equal(s.view().teachingAvailable, true); }

// tekrar seçim yanıtı yeniden gösterir, sayıyı artırmaz
{ const s = mk(); s.ask('onceki'); const seq = s.view().seq; s.ask('onceki'); const v = s.view();
  assert.equal(v.askedCount, 1); assert.ok(v.seq > seq); assert.equal(v.current.id, 'onceki'); }

// tamamla yalnız 5/5 sonrası
{ const s = mk(); D.sorular.slice(0, 4).forEach((q) => s.ask(q.id));
  assert.equal(s.view().canComplete, false); assert.equal(s.complete(), false);
  s.ask('aile'); assert.equal(s.view().canComplete, true); assert.equal(s.complete(), true);
  const v = s.view(); assert.equal(v.completed, true);
  assert.match(v.summary, /^25 yaşında erkek hasta/); assert.ok(!v.summary.includes('\n'), 'tek paragraf');
  for (const q of D.sorular.filter((x) => x.ozet)) assert.ok(v.summary.includes(q.ozet)); }
// tanı sorusu zorunlu değil, özete girmez
{ const s = mk(); s.ask('tani'); assert.equal(s.view().askedCount, 0); assert.equal(s.view().canComplete, false); }

// video bulunamazsa akış kilitlenmez
{ const s = createStore(D); s.setVideoMissing(); s.start(); assert.equal(s.view().ready, true); assert.equal(s.ask('hastalik'), true); }
{ const s = createStore(D); s.start(); assert.equal(s.view().phase, 'playing'); s.setVideoMissing(); assert.equal(s.view().ready, true); }

// veri sözleşmesi: üretilmemiş bulgu yok
{ const txt = JSON.stringify(D.sorular.filter((x) => x.tur !== 'egitici').map((x) => [x.yanit, x.notlar, x.ozet])).toLowerCase();
  for (const w of ['görme keskinliği', 'normal', 'negatif', 'diplopi', 'ödem', 'mr']) assert.ok(!txt.includes(w), w); }

assert.ok(!/(^|[^a-zçğıöşü])tanı/i.test(JSON.stringify(D.sorular.filter((x) => x.tur !== 'egitici').map((x) => x.yanit))), 'hasta yanıtında tanı yok');
{ const s = mk(); assert.equal(s.view().idle, false); s.setIdle(true); assert.equal(s.view().idle, true); }
// birleşik Notlar paneli: sayfalar, eğitici sayfa yalnız koşul sağlanınca
{ const s = mk(); let v = s.view(); assert.deepEqual(v.notePages, ['oyku']); assert.equal(v.notesOpen, false);
  assert.equal(s.setNotePage(1), false, 'eğitici sayfa kilitli');
  s.ask('baslangic'); assert.equal(s.view().teachingNew, false); s.ask('gorme'); v = s.view();
  assert.deepEqual(v.notePages, ['oyku', 'egitici']); assert.equal(v.teachingNew, true);
  s.toggleNotes(); v = s.view(); assert.equal(v.notesOpen, true); assert.equal(v.notePage, 0); assert.equal(v.teachingNew, true);
  s.stepNotePage(1); v = s.view(); assert.equal(v.notePage, 1); assert.equal(v.teachingNew, false);
  s.stepNotePage(1); assert.equal(s.view().notePage, 1, 'sınırda kalır'); s.stepNotePage(-1); assert.equal(s.view().notePage, 0);
  s.setNotePage(1); s.toggleNotes(); assert.equal(s.view().notesOpen, false); s.setNotePage(0); assert.equal(s.view().notesOpen, true);
  assert.equal('teachingOpen' in s.view(), false, 'ayrı eğitici panel yok'); }
console.log('state testleri: tamam');
