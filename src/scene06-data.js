// Sahne 06 — DMF başlangıcı ve izlem (kaynak olgudaki seyir). Kaynaklar: R09, R10 (MSTCG), R16, R17. Ruhsatlı doz ve izlem ayrıntıları için ürün bilgisi (KÜB) gerekir.
// Lenfosit senaryoları ve yan etki olayı "Eğitim amaçlı kurgusal" veridir; hastanın gerçek değeri değildir.
const kb = (title, text, kaynak, rozet = 'UZL', kind = 'egitici') => ({ t: 'card', kind, title, text, kaynak, rozet });

export const SAHNE_06 = {
  veri: {
    id: 'sahne-06', sira: 6,
    baslik: 'Sahne 06 — DMF başlangıcı ve izlem',
    gorev: 'Dimetil fumarat başlangıcını planlayın; titrasyonu, yan etki yönetimini, lenfosit izlemini ve MR izlemini kaynaklara göre değerlendirin ve izlem kararlarınızı kaydedin.',
    panelBaslik: 'DMF izlemi',
    geriDugme: '← Sahne 05’e dön',
    kartTurleri: {
      yanit: { baslik: 'Yanıtınız' }, bulgu: { baslik: 'Bulgu' }, egitici: { baslik: 'Eğitici not' }, egitmen: { baslik: 'Eğitmen geri bildirimi' },
      ipucu: { baslik: 'İpucu' }, uyari: { baslik: 'Bilgi' }, rapor: { baslik: 'Rapor' }, aciklama: { baslik: 'Açıklama' },
    },
    oncekiMuayene: { baslik: 'Önceki sahneler', bos: '' },
    olguBaglami: '25 yaşında erkek hasta; sağ optik nörit, beyin ve servikal omurilikte MS ile uyumlu plaklar; akut tedavi tamamlandı; DMT seçimi Sahne 05’te kaydedildi.',
  },
  bosMetin: 'Bu sahne kaynak olgudaki seyri (DMF) izler. Başka bir DMT seçtiyseniz de DMF izlem mantığı öğretici örnektir; gerçek hasta reçetesi değildir.',
  oncekiMetin: ({ prev }) => prev.note || '',

  solResim: Object.fromEntries(['baslangic', 'titrasyon', 'yan', 'lenfosit', 'mr', 'mekanizma', 'dal', 'son'].map((k) => [k, 'dmf'])), // tüm adımlarda sol tarafta oral tedavi görseli
  eylemler: [
    { id: 'baslangic', ad: 'Başlangıç değerlendirmesini yap' },
    { id: 'titrasyon', ad: 'Titrasyon planını seç' },
    { id: 'yan', ad: 'Flushing ve gastrointestinal yan etkileri yönet' },
    { id: 'lenfosit', ad: 'Lenfosit izlemini yorumla' },
    { id: 'mr', ad: 'MR izlemini ve rebaseline mantığını incele' },
    { id: 'mekanizma', ad: 'Etki mekanizmasını incele' },
    { id: 'dal', ad: 'Takip dallarını değerlendir' },
    { id: 'son', ad: 'İzlem kararlarımı kaydet' },
  ],

  ekranlar: {
    baslangic: [
      { t: 'card', kind: 'uyari', title: 'Ürün bilgisi gerekli', text: 'Bu uygulamada Türkiye dimetil fumarat KÜB/KT metni yoktur. Başlangıç test listesinin tamamı (HBV/HCV, VZV, gebelik testi, karaciğer enzimleri vb.) ve karaciğer izlem sıklığı KÜB ile doğrulanmalıdır.', rozet: 'KÜB' },
      { t: 'p', text: 'Başlangıçta yapacaklarınızı işaretleyin (özetinize yazılır):', tone: 'muted' },
      { t: 'check', id: 'b-kan', label: 'Tam kan sayımı ve formül (lökosit, mutlak lenfosit)' },
      { t: 'check', id: 'b-bilgi', label: 'Hastayı bilgilendirme: flushing ve gastrointestinal yan etkiler, uyumun önemi' },
      { t: 'check', id: 'b-asi', label: 'Aşı durumunun gözden geçirilmesi' },
      { t: 'check', id: 'b-kub', label: 'Ek başlangıç testleri için KÜB’e bakma' },
      { t: 'check', id: 'b-mr', label: 'Başlangıç (referans) MR’ın belirlenmesi' },
      kb('Tam kan sayımı', 'Tedavi öncesi tam kan sayımı ve formül; ilk yıl 6–8 haftada bir, sonra 3–6 ayda bir izlem önerilir.', 'R10 Tablo 1, s.6 (C56)'),
      kb('Hasta bilgilendirme', 'Başlamadan önce uyumun önemi ile flushing ve gastrointestinal yan etkilerin olası görülme sıklığı ve şiddeti hakkında danışmanlık verilmelidir.', 'R17 Özet, s.1 (C57)', 'DER'),
      kb('Aşılar', 'İmmünsüpresif tedavi öncesinde aşı durumu kontrol edilmeli, gerekirse yenilenmelidir; canlı aşılar ile tedavi başlangıcı arasında en az 6 hafta bırakılır.', 'R10 (immünsüpresif tedavi ve aşılar bölümü)', 'UZL'),
    ],

    titrasyon: [
      { t: 'choice', id: 'titre', soru: 'DMF titrasyonunu nasıl planlarsınız?',
        secenekler: [
          { id: 'a', ad: 'İlk günden günde iki kez 240 mg', geri: { tur: 'yanlis', text: 'Standart şema 7 gün 120 mg günde iki kez, ardından 240 mg günde iki kez’dir; titrasyonu atlamak için kaynakta destek yoktur.', kaynak: 'R17 s.6–7 (C58)' } },
          { id: 'b', ad: '7 gün 120 mg günde iki kez, sonra 240 mg günde iki kez', geri: { tur: 'dogru', text: 'Doğru: ürün bilgisinde önerilen standart titrasyon budur. Doz ve zamanlama ruhsatlı ürün bilgisiyle (KÜB) doğrulanmalıdır.', kaynak: 'R17 s.6–7 (C58)', rozet: 'DER' } },
          { id: 'c', ad: '120 mg günde bir kez ile başla; titrasyonu 4 haftaya kadar uzat', geri: { tur: 'bagimli', text: 'Derleme/deneyim temelli alternatiflerdendir: 1 hafta günde bir 120 mg, ardından 3 haftada artış bir seçenektir; ancak 8 haftalık bir çalışmada gastrointestinal yan etkileri azaltmadığı bildirilmiştir. Ruhsatlı şemanın yerine geçmez; KÜB ile doğrulayın.', kaynak: 'R17 s.6–7 (C58)', rozet: 'DER' } },
        ] },
      kb('Yemekle alma', 'DMF’yi yemekle birlikte almak gastrointestinal yan etkileri azaltmaya yönelik yararlı bir önlem olarak önerilir.', 'R17 s.4–5 (C57–C59)', 'DER'),
    ],

    yan: [
      kb('Eğitim amaçlı kurgusal olay', 'Tedavinin 3. gününde hasta yüzünde sıcaklık ve kızarma ile hafif bulantı bildiriyor. Başka sistemik bulgu yok.', 'Kurgusal senaryo — hastanın gerçek verisi değildir', 'KURGU', 'bulgu'),
      { t: 'choice', id: 'yanyon', multi: true, soru: 'Hangi yaklaşımlar uygundur? (Tümünü seçin.)',
        secenekler: [
          { id: 'food', ad: 'Dozu yemekle birlikte almasını önermek' }, { id: 'egit', ad: 'Yakınmaların çoğunlukla hafif–orta ve geçici olduğunu anlatmak' },
          { id: 'sempt', ad: 'Gerekirse semptomatik tedavi (flushing/bulantı için)' }, { id: 'kes', ad: 'İlacı hemen kalıcı olarak kesmek' }, { id: 'cift', ad: 'Dozu bir kerede ikiye katlamak' },
        ],
        dogru: ['food', 'egit', 'sempt'],
        geriDogru: 'Doğru: en sık yan etkiler flushing ve gastrointestinal yakınmalardır; çoğu hafif–orta ve geçicidir. Yemekle alma ve semptomatik tedavi stratejileri uygulanır.',
        geriYanlis: 'Yakınmalar çoğunlukla hafif–orta ve geçici olduğundan hemen kalıcı kesmek veya dozu artırmak uygun değildir; yemekle alma, bilgilendirme ve semptomatik tedavi önceliklidir.', kaynak: 'R17 s.1 (C57); R09 §4.4.1.3', rozet: 'DER' },
      { t: 'toggle', id: 'asp', label: 'Aspirin ön tedavisi?', bloklar: [
        kb('Kanıt ve sınır', 'İlk ay DMF’den 30 dakika önce 325 mg aspirin flushing sıklığını ve şiddetini azaltabilir; bu bulgu sağlıklı gönüllülerde tek merkezli randomize bir çalışmaya dayanır. Otomatik öneri değildir: kontrendikasyonlar ve ürün bilgisi (KÜB) değerlendirilmelidir.', 'R17 s.1, s.8 (C59)', 'DER', 'uyari'),
      ] },
      { t: 'toggle', id: 'yavas', label: 'Titrasyonu uzatma?', bloklar: [
        kb('Alternatif titrasyon', 'Titrasyon süresini 4 haftaya kadar uzatma, 120 mg günde bir ile başlama ve geçici doz azaltma, derleme/deneyim temelli alternatiflerdir; ruhsatlı şemanın yerine geçmez.', 'R17 s.6–7 (C58)', 'DER', 'uyari'),
      ] },
    ],

    lenfosit: [
      kb('Kaynaklar arası fark — KÜB ile doğrulanacak', 'MENACTRIMS: grade III lenfopeni (<0,5×10⁹/L) 6 aydan uzun sürerse DMF kesilmesi önerilir. MSTCG: doğrulanmış mutlak lenfosit <500/µL (=0,5×10⁹/L) veya lökosit <3000/µL’de kesilir; 500–800/µL aralığında yakın izlem. İki kaynak farklı ifade eder; tek bir kesin kural sunulmaz.', 'R09 §4.4.1.3 (C55); R10 Tablo 1, s.6; s.25 (C56)', 'UZL', 'uyari'),
      kb('Lenfopeni ve PML', 'Entegre analizde mutlak lenfosit sayısı ilk yıl yaklaşık %30 düşüp plato yapmıştır; ≥6 ay tedavi alanların %2,2’sinde ≥6 ay süren <0,5×10⁹/L görülmüştür. DMF ile 12 doğrulanmış PML (31.12.2021), çoğu uzamış orta–ağır lenfopenide; PML riski yaklaşık 1:45.000 tahmin edilmiştir.', 'R17 s.8 (C60); R09 §4.4.1.3; R10 s.25 (C56)', 'DER'),
      { t: 'p', text: 'Aşağıdaki üç senaryo eğitim amaçlı kurgusaldır; hastanın gerçek değeri değildir.', tone: 'warn' },
      { t: 'choice', id: 'lenA', soru: 'Senaryo A: tedavinin 6. ayında mutlak lenfosit 0,95×10⁹/L (950/µL), önceki değerlere göre %30 civarında düşüş.',
        secenekler: [
          { id: 'rutin', ad: 'Rutin izlemi sürdürürüm', geri: { tur: 'dogru', text: 'Doğru: ilk yıl yaklaşık %30’luk düşüş ve plato beklenen bir örüntüdür; değer 0,8’in üzerindedir. İzlem planına devam edilir.', kaynak: 'R17 s.8 (C60); R10 (C56)', rozet: 'DER' } },
          { id: 'kes', ad: 'DMF’yi hemen keserim', geri: { tur: 'yanlis', text: 'Bu değer kesme eşiklerinin (<0,5×10⁹/L) çok üzerindedir.', kaynak: 'R09; R10 (C55–C56)' } },
        ] },
      { t: 'choice', id: 'lenB', soru: 'Senaryo B: doğrulanmış mutlak lenfosit 0,65×10⁹/L (650/µL), kalıcı.',
        secenekler: [
          { id: 'rutin', ad: 'Rutin izlemi sürdürürüm', geri: { tur: 'yanlis', text: 'MSTCG’ye göre kalıcı 500–800/µL aralığında yakın izlem önerilir; bu aralıkta da PML olguları bildirilmiştir ve yaş bir ek etkendir.', kaynak: 'R10 s.25 (C56)' } },
          { id: 'yakin', ad: 'Yakın izlem (daha sık kan sayımı); eşik kaynaklarını KÜB ile doğrularım', geri: { tur: 'dogru', text: 'Doğru: değer 0,5×10⁹/L eşiğinin üstünde ama 500–800/µL aralığında; yakın izlem önerilir. Kaynaklar arası eşik farkı KÜB ile doğrulanır.', kaynak: 'R10 s.25 (C56); R09 (C55)', rozet: 'UZL' } },
          { id: 'kes', ad: 'DMF’yi hemen keserim', geri: { tur: 'bagimli', text: 'Değer her iki kaynaktaki kesme eşiğinin üzerindedir; kesme yerine yakın izlem önerilir, ancak yaş ve diğer etkenlere göre uzman kararıyla değişebilir.', kaynak: 'R10 s.25 (C56)' } },
        ] },
      { t: 'choice', id: 'lenC', soru: 'Senaryo C: mutlak lenfosit 0,45×10⁹/L (450/µL), 6 aydan uzun süredir kalıcı.',
        secenekler: [
          { id: 'rutin', ad: 'Rutin izlemi sürdürürüm', geri: { tur: 'yanlis', text: 'Her iki kaynağa göre kesme eşiği aşılmıştır: MENACTRIMS grade III lenfopeni >6 ay; MSTCG doğrulanmış <500/µL.', kaynak: 'R09 (C55); R10 (C56)' } },
          { id: 'kes', ad: 'DMF’yi kesmeyi planlar, uzman ekiple alternatif tedaviyi tartışırım', geri: { tur: 'dogru', text: 'Doğru: uzamış orta–ağır lenfopeni PML riski ile ilişkili olgularda görülmüştür; her iki kaynak da bu düzeyde kesmeyi önerir (KÜB ile doğrulayın).', kaynak: 'R09 §4.4.1.3 (C55); R10 Tablo 1 (C56)', rozet: 'UZL' } },
        ] },
      { t: 'varsa', kosul: ({ cfg }) => cfg.izlem.lenfosit != null, bloklar: [{ t: 'card', kind: 'bulgu', title: 'Bu olgunun izlem değeri', text: ({ cfg }) => `Mutlak lenfosit: ${cfg.izlem.lenfosit}`, rozet: 'KURGU' }] },
    ],

    mr: [
      kb('Rebaseline mantığı', 'Tedavi sonrası 1. yılda 3 yeni T2 lezyonu tedavi başarısızlığını öngörmüştür; ancak bu çalışmalarda 6. ayda MR “rebaseline” yapılmadığından bazı lezyonlar etki başlamadan oluşmuş olabilir.', 'R09 s.8 (C53)', 'UZL'),
      { t: 'choice', id: 'rebase', soru: 'Tedavinin 1. yılındaki MR’da yeni T2 lezyonları görüldüğünde neyi dikkate alırsınız?',
        secenekler: [
          { id: 'a', ad: 'Hepsi tedavi başarısızlığıdır; hemen ilaç değiştiririm', geri: { tur: 'yanlis', text: 'Tedavi etkisi tam gelişmeden oluşan lezyonlar olabilir; referans (rebaseline) MR olmadan yorum sınırlıdır.', kaynak: 'R09 s.8 (C53)' } },
          { id: 'b', ad: 'Tedavi etkisi başlamadan oluşan lezyonları ayırmak için yaklaşık 6. ayda rebaseline MR’ı dikkate alırım', geri: { tur: 'dogru', text: 'Doğru: rebaseline MR, etki başlamadan oluşmuş lezyonları sonraki yeni lezyonlardan ayırmaya yardım eder; klinik aktivite ve uyumla birlikte değerlendirilir.', kaynak: 'R09 s.8 (C53)', rozet: 'UZL' } },
        ] },
    ],

    mekanizma: [
      { t: 'p', text: 'Önemli kanıt kısmı preklinik veya hayvan modeli verisidir.', tone: 'warn' },
      kb('Metabolizma ve Nrf2 yolu', 'DMF büyük ölçüde ince barsakta monometil fumarata (MMF) hidrolize olur; MMF ana aktif bileşik kabul edilir. Keap-1’in –SH gruplarını oksitleyerek Nrf2’yi serbestleştirir; HO-1, NQO-1 ve GST-1 ekspresyonu artar.', 'R16 s.1–2 (C63)', 'PRE'),
      kb('Nrf2’den bağımsız yollar', 'HCAR2 (GPR109A) aktivasyonu (EAE’de baskın; fare verisi), NF-κB baskılanması ve cAMP sinyali.', 'R16 s.1–2 (C63)', 'PRE'),
    ],

    dal: [
      { t: 'choice', id: 'dalsec', soru: 'Tam uyumla tedavinin 8. ayında yeni klinik atak ve yeni Gd+ lezyonlar saptanıyor. Yaklaşımınız?',
        secenekler: [
          { id: 'a', ad: 'Uyumu ve alternatif tanıları gözden geçirir, suboptimal yanıt olarak tedavi yükseltmeyi (S1PR modülatörü, natalizumab, B hücre deplesyonu, kladribin) tartışırım', geri: { tur: 'dogru', text: 'Doğru: tam uyumla 6–12 ay içinde klinik atak, yeni/büyüyen/kontrast tutan MR lezyonu veya özürlülük ilerlemesi suboptimal yanıt göstergesidir; risk sınıflaması ve komorbiditeler değerlendirilerek yükseltme düşünülür.', kaynak: 'R09 §4.4.3.1, §4.4.4', rozet: 'UZL' } },
          { id: 'b', ad: 'DMF dozunu artırırım', geri: { tur: 'yanlis', text: '240 mg günde iki kez ruhsatlı maksimum dozdur; doz artırımı kaynaklarda bir seçenek değildir.', kaynak: 'R09 s.4 (C54)' } },
          { id: 'c', ad: 'Tedaviyi bırakır, izlerim', geri: { tur: 'yanlis', text: 'Yeni klinik ve radyolojik aktivite varken tedavisiz izlem uygun değildir.', kaynak: 'R09 §4.4.3.1' } },
        ] },
      { t: 'choice', id: 'uyum', soru: 'Hasta flushing nedeniyle dozları atladığını söylüyor. İlk yaklaşım?',
        secenekler: [
          { id: 'a', ad: 'Yan etkiyi yönetme stratejilerini yeniden gözden geçirir, uyumu konuşurum', geri: { tur: 'dogru', text: 'Doğru: danışmanlık, yemekle alma ve semptomatik tedavi; uyum, tedavi başarısızlığını yorumlamadan önce değerlendirilir.', kaynak: 'R17 Özet s.1 (C57)', rozet: 'DER' } },
          { id: 'b', ad: 'Tedavinin başarısız olduğunu varsayıp yükseltirim', geri: { tur: 'yanlis', text: 'Suboptimal yanıt tanımı tam uyumu varsayar; önce uyum sorununu çözün.', kaynak: 'R09 §4.4.3.1' } },
        ] },
    ],

    son: [{ t: 'kaydet', id: 'son', dugme: 'İzlem kararlarımı kaydet' }],
  },

  ozet: ({ sel, chk }) => {
    const sec = (id, harita) => harita[(sel[id] || [])[0]] || 'Henüz seçilmedi.';
    const bas = [['b-kan', 'tam kan sayımı'], ['b-bilgi', 'hasta bilgilendirme'], ['b-asi', 'aşı durumu'], ['b-kub', 'KÜB kontrolü'], ['b-mr', 'referans MR']].filter(([k]) => chk[k]).map(([, a]) => a);
    return {
      baslik: 'DMF izlem özeti',
      bolumler: [
        { baslik: 'Başlangıç değerlendirmesi', kart: 'rapor', satirlar: [bas.length ? bas.join(', ') + '.' : 'İşaretlenmedi.', 'Ek başlangıç testleri ve karaciğer izlemi: KÜB ile doğrulama bekliyor.'] },
        { baslik: 'Titrasyon', kart: 'yanit', satirlar: [sec('titre', { a: 'İlk günden 240 mg ×2', b: '120 mg ×2 (7 gün) → 240 mg ×2', c: '120 mg ×1, 4 haftaya uzatılmış titrasyon' })] },
        { baslik: 'Lenfosit izlemi (kurgusal senaryolar)', kart: 'rapor', satirlar: [`A: ${sec('lenA', { rutin: 'rutin izlem', kes: 'kes' })}`, `B: ${sec('lenB', { rutin: 'rutin izlem', yakin: 'yakın izlem', kes: 'kes' })}`, `C: ${sec('lenC', { rutin: 'rutin izlem', kes: 'kesmeyi planla' })}`] },
        { baslik: 'MR izlemi', kart: 'yanit', satirlar: [sec('rebase', { a: 'yeni T2 lezyonu = tedavi başarısızlığı', b: 'rebaseline MR dikkate alınır' })] },
        { baslik: 'Not', kart: 'uyari', satirlar: ['Bu bir eğitim özetidir; gerçek hasta reçetesi değildir. Doz, test listesi ve izlem sıklığı ruhsatlı ürün bilgisiyle (KÜB) doğrulanmalıdır.'] },
      ],
    };
  },
};
