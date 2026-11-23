// ============================================================================
// SAHNE 03 — EĞİTMEN YAPILANDIRMA ALANI (dosyayı sonradan bağlamak için TEK yer)
// ============================================================================
// Bu olgu (25 yaşında erkek, sağ optik nörit) için DOĞRULANMIŞ veri yoksa alanları `null` bırakın.
// `null` değerler uygulamada ASLA "normal" ya da "negatif" olarak yorumlanmaz; eksik bilgi olarak gösterilir.
//
// UYARI: "MS Eğitim Olgusu ON" klasöründeki Flair*.png ve Cervical MRI.png dosyaları başka bir olguya
// (29 yaşında kadın) ait senaryonun görselleridir; bu hastanın MRG'si olarak BAĞLANMAMIŞTIR.
//
// ---- MRG görüntüleri -------------------------------------------------------
// tur: 'kesit' (PNG/JPEG dizisi) ya da 'video' (MP4). İkisi birden doluysa video kullanılır.
//   kesit : { tur: 'kesit', dosyalar: ['assets/mrg/beyin/k01.png', 'assets/mrg/beyin/k02.png', ...] }
//   video : { tur: 'video', dosya: 'assets/mrg/beyin.mp4' }
// Tek videoda her iki inceleme varsa yalnızca doğrulanmış bölümü verin: { baslangic: 0.0, bitis: 12.5 } (sn)
// (DICOM serisi bu sürümde desteklenmez; PNG/JPEG'e çevrilmiş kesitler kullanın.)
export const OLGU_YAPILANDIRMA = {
  mrg: {
    beyin: null, // örn. { tur: 'video', dosya: 'assets/mrg/beyin.mp4', baslangic: 0, bitis: null }
    servikal: null, // örn. { tur: 'kesit', dosyalar: [...] }
  },

  // Lezyon işaretleme: YALNIZCA eğitmenin belirlediği kesit ve normalleştirilmiş koordinatlarla (x, y: 0–1).
  // örn. beyin: [{ kesit: 7, x: 0.42, y: 0.31, etiket: 'Periventriküler' }]. Boşsa özellik açılmaz.
  isaretler: { beyin: [], servikal: [] },

  // MRG rapor eki: yalnızca doğrulanmışsa doldurun (metin). `null` ise rapora eklenmez.
  mrgRaporEki: {
    lezyonSayisi: null,
    altBolge: null, // örn. 'periventriküler, jukstakortikal'
    omurilikSeviyesi: null, // örn. 'C3–C4'
    segmentUzunlugu: null, // örn. '1 vertebra segmentinden kısa'
    kontrastTutulumu: null, // örn. 'Var' / 'Yok' — yalnızca doğrulanmışsa
  },

  // Klinik değerler (doğrulanmışsa)
  klinik: {
    solGozGorme: null, // sayısal sol göz görme keskinliği verilmedi
    kontrolGorme: null, // tedavi sonrası görme keskinliği (örn. '20/40'); null → "Henüz kaydedilmedi"
  },

  // Örnekten 14 gün sonra raporlanan BOS sonuçları (eğitmen girer)
  bos14gun: {
    okbPatern: null, // 1–5 (tip); null → "olgu sonucu eğitmen tarafından henüz girilmedi"
    okbNotu: null,
    iggIndeksi: null, // sayı (birimsiz); null → henüz girilmedi
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
  return out;
}
