// ============================================================================
// SAHNE 03 — EĞİTMEN YAPILANDIRMA ALANI (dosyayı sonradan bağlamak için TEK yer)
// ============================================================================
// Bu bir EĞİTİM SİMÜLASYONU olgusudur (25 yaşında erkek, sağ optik nörit → MS).
// Aşağıdaki olgu değerleri eğitim amaçlı KURGUSAL olarak tamamlanmıştır (kurgu: true → arayüzde "KURGU" rozeti).
// Değerler klinik tabloyla (sağ ON, bilateral dismetri, alt ekstremitede canlı DTR, birkaç atımlık nistagmus) ve
// 2024 McDonald ile tutarlı seçilmiştir; gerçek bir hastaya ait değildir. Bir alanı `null` yaparsanız uygulama onu
// "girilmedi" olarak gösterir ve ASLA normal/negatif saymaz.
//
// Görüntüler: assets/mrg/ içindeki dosyaları kullanıcı bu olgu için sağlamıştır (kaynak klasördeki Flair*.png /
// Cervical MRI.png ile aynı dosyalar; eğitim olgusunun görüntüsü olarak bilinçli kullanılmıştır).
//
// ---- MRG görüntüleri -------------------------------------------------------
// tur: 'kesit' (PNG/JPEG dizisi) ya da 'video' (MP4). İkisi birden doluysa video kullanılır.
//   kesit : { tur: 'kesit', dosyalar: ['assets/mrg/beyin/k01.png', 'assets/mrg/beyin/k02.png', ...] }
//   video : { tur: 'video', dosya: 'assets/mrg/beyin.mp4' }
// Tek videoda her iki inceleme varsa yalnızca doğrulanmış bölümü verin: { baslangic: 0.0, bitis: 12.5 } (sn)
// (DICOM serisi bu sürümde desteklenmez; PNG/JPEG'e çevrilmiş kesitler kullanın.)
export const OLGU_YAPILANDIRMA = {
  mrg: {
    // Eğitmen tarafından sağlanan görüntüler (kullanıcı: bu olgunun beyin ve servikal MRG'si). Sıra: dosya sırası (beyin: aksiyal FLAIR kesitleri, servikal: sagittal T2).
    // Sekans/lezyon düzeyi bilgisi dosyalardan tahmin edilmemiştir; lezyon sayısı ve yerleşimi rapor ekinde girilmedikçe boştur.
    beyin: { tur: 'kesit', dosyalar: [1, 2, 3, 4, 5, 6].map((i) => `assets/mrg/beyin-0${i}.png`) },
    servikal: { tur: 'kesit', dosyalar: ['assets/mrg/servikal-01.png'] },
  },

  // Lezyon işaretleme: YALNIZCA eğitmenin belirlediği kesit ve normalleştirilmiş koordinatlarla (x, y: 0–1).
  // örn. beyin: [{ kesit: 2, x: 0.42, y: 0.31, etiket: 'Periventriküler' }]. Boşsa özellik açılmaz.
  // (Görüntü üzerinde koordinat tahmin edilmedi; yanlış yere işaret koymamak için boş bırakıldı.)
  isaretler: { beyin: [], servikal: [] },

  kurgu: true, // olgu değerleri eğitim amaçlı kurgudur

  // MRG rapor eki (metin). `null` ise rapora eklenmez.
  mrgRaporEki: {
    lezyonSayisi: 'Beyinde 11 T2/FLAIR hiperintens lezyon; servikal omurilikte 1 lezyon',
    altBolge: 'Periventriküler (korpus kallozuma dik, Dawson parmağı biçiminde, 5), jukstakortikal (2), sol orta serebellar pedünkül (1), derin ak madde (3)',
    omurilikSeviyesi: 'C3 düzeyi, sağ posterolateral (dorsal kolon)',
    segmentUzunlugu: '1 vertebra segmentinden kısa, kesit alanının yarısından az',
    kontrastTutulumu: 'Sol periventriküler 1 lezyonda açık halka biçiminde kontrast tutulumu; diğer lezyonlar tutmuyor (zamanda yayılım). Orbita MRG: sağ intraorbital optik sinirde kısa segment T2 hiperintensite ve kontrast tutulumu.',
  },

  // Klinik değerler
  klinik: {
    solGozGorme: '20/20',
    kontrolGorme: '15. gün: sağ göz 20/20; renkli görme tam; RAPD düzelmiş. Görme tam düzelmiştir (eğitim amaçlı kurgu)', // 5 doz + 15. günden sonra gösterilir
  },

  // Sahne 04 — tanısal sentez ('var' | 'yok'); null = eksik
  tani: {
    bolgeler: { optik: 'var', periv: 'var', kortikal: 'var', infra: 'var', omurilik: 'var' }, // beş bölgede TİPİK lezyon
    dit: 'var', // kontrast tutan ve tutmayan lezyon birlikte
    cvs: 'var', // santral ven işareti ("select 6"): 7/11 lezyonda CVS+ (3T SWI)
    prl: 'yok', // paramagnetik rim lezyonu saptanmadı
    kflc: 'negatif', // 'pozitif' | 'negatif' | 'çalışılmadı'
    kflcDeger: 0.77, // kFLC indeksi (kurgu); OKB pozitif olduğundan BOS ölçütü OKB ile karşılanır
    aciklama: 'yok', // daha iyi açıklama yok: AQP4/MOG negatif, kırmızı bayrak yok, enfeksiyöz/infiltratif tarama negatif
    antikor: { aqp4: 'Negatif', mog: 'Negatif', yontem: 'Canlı hücre tabanlı test (CBA)', ornekZamani: 'Steroid öncesi (1. gün, ilk dozdan önce)' },
  },

  // Sahne 05 — DMT kararını etkileyen hasta bilgileri
  aktivite: { agirAtak: 'yok', eksikDuzelme: 'yok', yuksekT2: 'yok', cokGd: 'yok' },
  dmt: {
    jcv: 'negatif',
    aileplani: 'Bekâr; önümüzdeki 2–3 yılda çocuk planı yok',
    tercih: 'Oral tedaviyi tercih ediyor; yazılım mühendisi, sık infüzyon randevusu istemiyor',
  },

  // Sahne 06 — izlem
  izlem: { lenfosit: '6. ay: 1,05×10⁹/L (1.050/µL); başlangıç 1,90×10⁹/L. Grade 0, rutin izlem.' },

  // Örnekten 14 gün sonra raporlanan BOS sonuçları
  bos14gun: {
    okbPatern: 2,
    okbNotu: 'BOS’ta 6 oligoklonal bant; serumda karşılığı yok (izoelektrik odaklama + immünoblot)',
    iggIndeksi: 0.84, // birimsiz; laboratuvar referansı <0,70
  },
};

// Eksik varlıkların adları (eğitmene bildirim için)
export function eksikVarliklar(cfg = OLGU_YAPILANDIRMA) {
  const out = [];
  if (!cfg.mrg.beyin) out.push('Beyin MRG görüntüsü (kesit dizisi veya MP4) — mrg.beyin');
  if (!cfg.mrg.servikal) out.push('Servikal MRG görüntüsü (kesit dizisi veya MP4) — mrg.servikal');
  if (!cfg.klinik.kontrolGorme) out.push('Tedavi sonrası kontrol görme keskinliği — klinik.kontrolGorme');
  if (!cfg.bos14gun.okbPatern) out.push('OKB paterni (14. gün) — bos14gun.okbPatern');
  if (cfg.bos14gun.iggIndeksi == null) out.push('IgG indeksi (14. gün) — bos14gun.iggIndeksi');
  if (Object.values(cfg.tani.bolgeler).some((v) => v == null)) out.push('Beş anatomik bölgede tipik lezyon durumu (MRG değerlendirmesi) — tani.bolgeler');
  if (cfg.tani.dit == null || cfg.tani.cvs == null) out.push('DIT ve CVS durumu — tani.dit, tani.cvs');
  if (cfg.tani.aciklama == null) out.push('“Daha iyi açıklama yok” değerlendirmesi — tani.aciklama');
  if (cfg.tani.antikor.aqp4 == null || cfg.tani.antikor.mog == null) out.push('Serum AQP4-IgG / MOG-IgG sonucu, yöntemi ve örnek zamanı — tani.antikor');
  if (cfg.dmt.jcv == null) out.push('JCV antikor durumu (natalizumab kartı için) — dmt.jcv');
  return out;
}
