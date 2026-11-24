// Sahne 03 — Tetkik, akut tedavi ve izlem. Tüm metinler, sayısal değerler ve birimler arayüzden ayrıdır.
// Sayısal değerler ve birimleri AYRI alanlardır (deger / birim). Oran ve indeksler kodda hesaplanır.

export const SAHNE_03 = {
  id: 'sahne-03',
  sira: 3,
  baslik: 'Sahne 03 — Tetkik, akut tedavi ve izlem',
  gorev: 'Sağ optik sinir tutulumu düşündüğünüz hastada tetkikleri planlayın, beyin ve servikal MRG’yi inceleyin, akut tedaviyi başlatın ve iki hafta sonra raporlanan BOS incelemelerini yorumlayın.',
  panelBaslik: 'Tetkik ve tedavi',
  geriDugme: '← Sahne 02’ye dön',
  gecisDugme: 'Tetkik ve tedaviye geç', // Sahne 02 sonunda
  video: { bekleme: 'assets/hasta-bekleme.mp4', yedekKare: 'assets/hasta-son-kare.jpg' },

  kartTurleri: {
    yanit: { baslik: 'Hastanın yanıtı' },
    bulgu: { baslik: 'Muayene bulgusu' },
    egitici: { baslik: 'Eğitici not' },
    egitmen: { baslik: 'Eğitmen geri bildirimi' },
    ipucu: { baslik: 'İpucu' },
    uyari: { baslik: 'Bilgi' },
    rapor: { baslik: 'Rapor' },
    aciklama: { baslik: 'Hastaya açıklama örneği' },
    istem: { baslik: 'Tedavi istemi' },
  },

  zaman: {
    gunEtiket: 'Simülasyon günü',
    kontrolEylem: 'İki hafta sonraki kontrole geç',
    kontrolGun: 14,
    kontrolKilit: 'Önce BOS ve serum örneklerini alın; iki hafta örnek alım gününden hesaplanır.',
  },

  // Durum etiketleri (birbirinden ayrı)
  durum: {
    istendi: 'İstendi', ornek: 'Örnek alındı', sonuclandi: 'Sonuçlandı',
    bekleniyor: 'Sonuç bekleniyor', doz: 'Doz uygulandı',
  },

  eylemler: [
    { id: 'lab', ad: 'Başlangıç kan tetkiklerini incele' },
    { id: 'mrg', ad: 'Beyin ve servikal MRG’yi değerlendir' },
    { id: 'lp', ad: 'Lomber ponksiyon ve eş zamanlı serum incelemelerini planla' },
    { id: 'tx', ad: 'Akut tedaviyi başlat' },
    { id: 'izlem', ad: 'Beş günlük tedaviyi izle' },
    { id: 'bos', ad: 'İki hafta sonraki BOS sonuçlarını değerlendir' },
  ],

  oncekiMuayene: { baslik: 'Önceki muayene', bos: 'Önceki sahnede açılmış muayene bulgusu yok.' },
  olguBaglami: '25 yaşında erkek hasta. İlk kez gelişen sağ göz ağrısını ertesi gün bulanık görme izlemiş.',

  // ---- 1. Kan tetkikleri ----
  kan: {
    baslik: 'Rutin kan tetkikleri',
    etiket: 'Simülasyon için örnek laboratuvar sonuçları',
    satirlar: [
      { id: 'lokosit', ad: 'Lökosit', deger: 7.2, birim: '×10⁹/L', ondalik: 1 },
      { id: 'hb', ad: 'Hemoglobin', deger: 15.0, birim: 'g/dL', ondalik: 1 },
      { id: 'trombosit', ad: 'Trombosit', deger: 248, birim: '×10⁹/L', ondalik: 0 },
      { id: 'glukoz', ad: 'Serum glukozu', deger: 96, birim: 'mg/dL', ondalik: 0 },
      { id: 'na', ad: 'Sodyum', deger: 139, birim: 'mmol/L', ondalik: 0 },
      { id: 'k', ad: 'Potasyum', deger: 4.2, birim: 'mmol/L', ondalik: 1 },
      { id: 'kreatinin', ad: 'Kreatinin', deger: 0.9, birim: 'mg/dL', ondalik: 1 },
      { id: 'alt', ad: 'ALT', deger: 22, birim: 'U/L', ondalik: 0 },
      { id: 'ast', ad: 'AST', deger: 20, birim: 'U/L', ondalik: 0 },
      { id: 'crp', ad: 'CRP', deger: 1.2, birim: 'mg/L', ondalik: 1 },
    ],
    yorum: 'Rutin incelemelerde belirgin anormallik saptanmadı. Bu sonuçlar tedavi öncesi değerlendirmeye katkı sağlar. Enfeksiyon olasılığı ayrıca öykü, vital bulgular ve muayeneyle değerlendirilir.',
  },

  // ---- 2. MRG ----
  mrg: {
    sekmeler: [{ id: 'beyin', ad: 'Beyin MRG' }, { id: 'servikal', ad: 'Servikal MRG' }],
    raporDugme: 'Raporu aç',
    raporBaslik: 'Olgu raporu',
    rapor: 'Beyin ve servikal omurilik MRG’de MS ile uyumlu demiyelinizan plaklar izlenmektedir.',
    raporEkEtiketleri: {
      lezyonSayisi: 'Lezyon sayısı', altBolge: 'Anatomik alt bölge', omurilikSeviyesi: 'Omurilik seviyesi',
      segmentUzunlugu: 'Segment uzunluğu', kontrastTutulumu: 'Kontrast tutulumu',
    },
    eksikNot: 'Rapordaki ifadenin ötesinde lezyon sayısı, alt bölge, omurilik seviyesi, segment uzunluğu ve kontrast tutulumu bu olgu için doğrulanmamıştır; rapora eklenmemiştir.',
    gorselYok: 'Bu sekme için görüntü dosyası bağlanmadı. Yazılı olgu raporu erişilebilir.',
    testEtiketi: 'Test deseni — hastaya ait görüntü değil',
    isaretDugme: 'Eğitmen işaretlerini göster',
    onizlemeUyari: 'Raporu açmadan önce lezyonların yerleşimini, morfolojisini ve varsa kontrastlanmasını kendiniz değerlendirin.',

    egitA: {
      baslik: 'MRG tanıya nasıl katkı sağlar?',
      maddeler: [
        'Lezyonların yerleşimini, morfolojisini ve varsa kontrastlanmasını ayrı ayrı inceleyin.',
        'Periventriküler, kortikal/jukstakortikal, infratentoryal ve spinal lezyonlar MS için tipik anatomik bölgelerdir. 2024 McDonald revizyonunda optik sinir, uygun objektif kanıtla beşinci anatomik bölge olarak değerlendirilebilir.',
        'Aynı incelemede kontrast tutan ve tutmayan tipik lezyonların birlikte bulunması veya takip MRG’sinde yeni tipik lezyon gelişmesi zamanda yayılımı destekleyebilir.',
        'Bu olguda lezyonların yerleşimi, kontrastlanması ve zamanda yayılım için rapor ekindeki verilere bakın.',
      ],
    },
    egitB: {
      baslik: 'Ayırıcı tanı için hangi örüntülere bakarım?',
      etiket: 'Karşılaştırmalı eğitim örnekleri; bu hastanın görüntülerinde gösterilmiş bulgular değildir.',
      maddeler: [
        { b: 'MS lehine örnekler', t: 'Ventrikül yüzeyine temas eden ovoid periventriküler lezyonlar ve omurilikte kısa segmentli, sıklıkla periferik yerleşimli lezyonlar.' },
        { b: 'AQP4-IgG ilişkili NMOSD açısından uyarıcı örnekler', t: 'Uzun segmentli, santral omurilik lezyonu veya optik sinirin posterior bölümüne ve kiazmaya uzanan tutulum.' },
        { b: 'MOGAD açısından uyarıcı örnekler', t: 'Özellikle bilateral veya uzun segmentli anterior optik sinir tutulumu ve perinöral kontrastlanma.' },
        { b: 'Servikal incelemede', t: 'Kompresyonu ve sinyal değişikliğinin bası düzeyiyle ilişkisini de değerlendirin.' },
      ],
      orbitaDugme: 'Orbita MRG’si ne ekler?',
      orbita: 'Yağ baskılı orbital T2 ve kontrast sonrası yağ baskılı T1 sekansları, optik sinirdeki tutulumun yerini ve uzunluğunu değerlendirmeye yardımcı olur. Beyin ve servikal MRG’den orbital bulgu çıkarılamaz. Atipik fenotipte serum AQP4-IgG ve MOG-IgG incelemeleri klinik bağlama göre değerlendirilebilir.',
    },
    karar: {
      soru: 'Beyin ve servikal MRG’de plakların görülmesi, lezyonların farklı zamanlarda oluştuğunu bu raporla gösterir mi?',
      secenekler: [{ id: 'evet', ad: 'Evet, gösterir' }, { id: 'hayir', ad: 'Hayır, tek başına göstermez' }],
      dogru: 'hayir',
      dogruGeri: 'Bu rapor birden fazla bölgede tutulum bildiriyor. Lezyonların yaşı hakkında yorum için kontrastlanma özellikleri veya önceki incelemeyle karşılaştırma gibi ek kanıt gerekir.',
      yanlisGeri: 'Raporda yalnızca plakların varlığı bildiriliyor. Lezyonların yaşını belirleyen hangi ek bilgi (kontrastlanma, önceki inceleme) bu raporda yok?',
    },
  },

  // ---- 3. Lomber ponksiyon ----
  lp: {
    soru: 'BOS örneği alırken hangi kan örneklerini eş zamanlı planlarsınız?',
    esler: [
      { id: 'glukoz', bos: 'BOS glukozu', serum: 'Eş zamanlı serum glukozu' },
      { id: 'okb', bos: 'BOS oligoklonal IgG bantları', serum: 'Eşleştirilmiş serum oligoklonal bant incelemesi' },
      { id: 'iggAlb', bos: 'BOS IgG ve albümin', serum: 'Serum IgG ve albümin' },
    ],
    eksikEs: 'Eşleştirmesi planlanmayan BOS testi, serum karşılığı olmadan yorumlanamaz: ',
    tamEs: 'Üç eşleştirme de planlandı: her BOS testi için eş zamanlı serum karşılığı alınacak.',
    onKart: {
      baslik: 'LP öncesi klinik karar',
      aciklama: 'İşlemin amacını hastaya açıklayın ve onam alın; ardından uygunluğu aşağıdaki başlıklarla değerlendirin.',
      maddeler: [
        { id: 'onam', ad: 'Amaç hastaya açıklandı, onam alındı' },
        { id: 'kanama', ad: 'Kanama riski ve antitrombotik ilaç kullanımı değerlendirildi' },
        { id: 'enfeksiyon', ad: 'Ponksiyon yerinde enfeksiyon yok' },
        { id: 'kitle', ad: 'Kitle etkisi veya tehlikeli basınç gradyanı düşündüren bulgu yok' },
      ],
    },
    alDugme: 'BOS ve eş zamanlı serum örneklerini al',
    alKilit: 'Önce dört uygunluk başlığını değerlendirin.',
    rutinBaslik: 'Rutin BOS (örnek alım günü sonuçlandı)',
    rutinEtiket: 'Simülasyon için temsili normal değerler',
    rutin: [
      { id: 'gorunum', ad: 'Görünüm', metin: 'Berrak', birimAciklama: 'Renksiz' },
      { id: 'basinc', ad: 'Açılış basıncı', deger: 16, birim: 'cmH₂O', ondalik: 0, aciklama: 'lateral dekübit ölçümü' },
      { id: 'lokosit', ad: 'Lökosit', deger: 2, birim: 'hücre/µL', ondalik: 0 },
      { id: 'eritrosit', ad: 'Eritrosit', deger: 0, birim: 'hücre/µL', ondalik: 0 },
      { id: 'protein', ad: 'Total protein', deger: 32, birim: 'mg/dL', ondalik: 0 },
      { id: 'bosGlukoz', ad: 'BOS glukozu', deger: 64, birim: 'mg/dL', ondalik: 0 },
    ],
    esGlukozAd: 'Eş zamanlı serum glukozu',
    oranAd: 'BOS/serum glukoz oranı',
    oranBirim: 'Birimsiz',
    esGlukozYok: 'Alınmadı',
    oranYok: 'Hesaplanamadı (eş zamanlı serum glukozu alınmadı)',
    bekleyen: [
      { id: 'okb', ad: 'Eşleştirilmiş BOS/serum OKB', durum: 'Sonuç bekleniyor.' },
      { id: 'iggIndeks', ad: 'BOS IgG indeksi', durum: 'Sonuç bekleniyor.' },
    ],
    egitici: 'Rutin BOS değerleri normal sınırlarda. Hücre sayısı, protein ve glukozun normal olması, intratekal IgG sentezi hakkında tek başına karar verdirmez.',
  },

  // ---- 4. Akut tedavi ----
  tx: {
    soru: 'Sağ göz görme keskinliği 20/200 olan bu hastada akut tedaviyi şimdi mi planlarsınız, yoksa OKB sonucunu mu beklersiniz?',
    secenekler: [{ id: 'simdi', ad: 'Akut tedaviyi şimdi planlarım' }, { id: 'bekle', ad: 'OKB sonucunu beklerim' }],
    dogru: 'simdi',
    dogruGeri: 'Enfeksiyon ve önemli alternatif nedenler klinik olarak değerlendirildikten sonra, işlevsel açıdan belirgin görme kaybı nedeniyle yüksek doz IV metilprednizolon planlarım. OKB ve IgG indeksinin raporlanmasını beklemem.',
    yanlisGeri: 'OKB ve IgG indeksi örnekten yaklaşık iki hafta sonra raporlanır. Belirgin işlevsel görme kaybında akut tedaviyi bu sonuçlara bağlamak ne anlama gelir?',
    istem: {
      baslik: 'Tedavi istemi',
      satirlar: [
        { ad: 'İlaç', deger: 'Metilprednizolon' },
        { ad: 'Tek doz', deger: '1.000 mg (1 g)' },
        { ad: 'Yol', deger: 'İntravenöz infüzyon' },
        { ad: 'Sıklık', deger: 'Günde bir kez' },
        { ad: 'Süre', deger: 'Ardışık 5 gün' },
        { ad: 'Toplam', deger: '5 doz, kümülatif 5 g' },
        { ad: 'Uygulama', deger: 'Kurumun IV infüzyon protokolüne göre' },
      ],
    },
    baslatDugme: 'Tedaviyi başlat',
    onKartMetni: 'Uygun ve erişilebilirse başlangıç MRG’si (orbita dahil) ve gerekli örnekler ilk dozdan önce planlanabilir. Serum AQP4-IgG ve MOG-IgG örneğini ilk steroid dozundan önce alın: steroid, PLEX veya IVIG sonrası yanlış negatiflik olabilir. Bu bekleme, tedaviye başlamak için zorunlu koşul değildir.',
    amacDugme: 'Bu tedavinin amacı nedir?',
    amac: 'Bu olguda yüksek doz kortikosteroid, akut optik nörit sonrasında görsel iyileşmeyi hızlandırmak için veriliyor; uzun dönem görme sonucunu değiştirmez (ONTT). Biyoeşdeğer yüksek doz oral seçenek (günde 1.250 mg prednizon veya 1.000–1.250 mg oral metilprednizolon, 3–5 gün) IV ile eşdeğer bulunmuştur. Tek başına düşük doz oral prednizon (1 mg/kg) önerilmez: ONTT’de nüks riskini artırmıştır. Sonrasında oral azaltma bireysel değerlendirilir. Hastalık düzenleyici uzun dönem tedavi kararı ayrı bir değerlendirmedir.',
    izlemBaslik: 'Tedavi öncesi ve sırasında kısa izlem',
    izlemMaddeleri: [
      { id: 'tansiyon', ad: 'Kan basıncı' },
      { id: 'glukoz', ad: 'Kan glukozu' },
      { id: 'enfeksiyon', ad: 'Enfeksiyon belirtileri' },
      { id: 'uykuDuygu', ad: 'Uyku ve duygudurum değişiklikleri' },
      { id: 'infuzyon', ad: 'İnfüzyon toleransı' },
    ],
    hastaAciklama: 'Bu tedavi görmenizin toparlanmasını hızlandırabilir. Tedavi boyunca tansiyonunuzu, kan şekerinizi ve olası yan etkileri izleyeceğiz.',
  },

  // ---- 5. Gün 1–5 ----
  izlem: {
    doz: 5,
    kutu: (i) => `${i}. gün · 1 g IV`,
    uygulaDugme: 'Dozu uygula',
    tumDugme: 'Beş gün boyunca 1000 mg/gün metilprednizolon tedavisi başla',
    bugunVar: 'Bu gün için doz zaten uygulandı.',
    planli: 'Planlandı',
    bekliyor: 'Bugün uygulanabilir',
    uygulandi: 'Doz uygulandı',
    tamam: 'Akut tedavi tamamlandı. Görme keskinliği, renk algısı ve hastanın günlük görsel işlevi yeniden değerlendirilecek.',
    kontrolEtiket: 'Kontrol görme keskinliği: ',
    kontrolYok: 'Henüz kaydedilmedi',
    yetersizDugme: 'Belirgin kötüleşme veya yetersiz yanıt',
    yetersiz: 'Belirgin kötüleşme ya da yetersiz yanıtta nöro-oftalmolojik yeniden değerlendirme yapılır, alternatif tanılar (NMOSD, MOGAD, enfeksiyöz/infiltratif, kompresif) gözden geçirilir. Ağır, steroide yanıtsız optik nöritte terapötik plazma değişimi (PLEX; genellikle 5–7 seans) uzman ekipçe değerlendirilir; erken başlanması yanıtı artırır (Brochet 2020; MENACTRIMS 2023).',
    tedaviYok: 'Önce “Akut tedaviyi başlat” eylemiyle tedaviyi başlatın.',
  },

  // ---- 6. İki hafta sonra ----
  bos: {
    bekleyenBaslik: 'Bekleyen testler',
    raporDugme: 'Raporu aç',
    hazirDegil: 'Sonuçlar henüz raporlanmadı; örnek alım gününden 14 gün sonra açılır.',
    girilmedi: 'Rapor zamanı geldi; olgu sonucu eğitmen tarafından henüz girilmedi',
    okbSatir: 'OKB paterni',
    iggSatir: 'IgG indeksi',
    iggNot: 'Birimsiz; ölçümü yapan laboratuvarın referans aralığıyla yorumlanır.',
    olguEtiket: 'Hastanın sonucu',
    ogreticiEtiket: 'Öğretici örnek',
    okbA: {
      baslik: 'Oligoklonal bantlar nasıl yorumlanır?',
      giris: 'OKB incelemesinde BOS ve eş zamanlı serum birlikte karşılaştırılır. Amaç, serumda karşılığı olmayan BOS’a özgü IgG bantlarını saptamaktır.',
      tipler: [
        { id: 1, ad: 'Tip 1', t: 'Her iki örnekte oligoklonal bant saptanmaz.', intratekal: false },
        { id: 2, ad: 'Tip 2', t: 'BOS’a özgü bantlar vardır; serumda karşılıkları görülmez.', intratekal: true },
        { id: 3, ad: 'Tip 3', t: 'Ortak bantlara ek olarak BOS’a özgü bantlar vardır.', intratekal: true },
        { id: 4, ad: 'Tip 4', t: 'Serum ve BOS’ta eşleşen bantlar görülür; bu patern tek başına intratekal sentezi göstermez.', intratekal: false },
        { id: 5, ad: 'Tip 5', t: 'Serum ve BOS’ta eşleşen monoklonal patern görülür.', intratekal: false },
      ],
      soru: 'Hangi paternler intratekal IgG sentezini destekler?',
      dogru: [2, 3],
      dogruGeri: 'Belirleyici özellik BOS’a özgü bantların bulunmasıdır. Bu bulgu MS tanısını uygun klinik ve MRG bağlamında destekler; başka inflamatuvar veya enfeksiyöz MSS hastalıklarında da görülebilir.',
      yanlisGeri: 'Serumda karşılığı olmayan, yalnızca BOS’ta görülen bantların hangi tiplerde bulunduğuna bakın.',
    },
    iggB: {
      baslik: 'IgG indeksi nedir?',
      formul: { sol: 'IgG indeksi', ust1: 'BOS IgG', alt1: 'serum IgG', ust2: 'BOS albümin', alt2: 'serum albümin' },
      metin: 'İndeks, IgG’nin BOS/serum oranını albüminin BOS/serum oranına göre düzeltir. Yüksek değer intratekal IgG sentezini destekleyebilir. Sonuç birimsizdir ve ölçümü yapan laboratuvarın referans aralığıyla yorumlanır.',
      uyari: 'IgG indeksi, BOS’a özgü OKB veya kappa serbest hafif zincir indeksiyle aynı test değildir. Yüksek konvansiyonel IgG indeksi, güncel McDonald ölçütlerinde OKB’nin doğrudan yerine kullanılmaz.',
    },
  },

  // ---- Sahne sonu ----
  kayit: {
    dugme: 'Kararımı kaydet',
    baslik: 'Kararımı kaydet',
    sorular: [
      { id: 'mrg', soru: 'MRG’de hangi bilgiler MS olasılığını destekliyor, hangi bilgiler eksik?',
        oneriler: ['Beyin ve servikal omurilikte MS ile uyumlu plaklar bildirilmiş; bu MS olasılığını destekler.', 'Kontrastlanma durumu ve zamanda yayılım bilgisi eksik.', 'Lezyon sayısı ve spinal segment uzunluğu raporda yok.'] },
      { id: 'bos', soru: 'Rutin BOS normal olduğu hâlde neden eşleştirilmiş BOS/serum incelemesi istediniz?',
        oneriler: ['Normal hücre, protein ve glukoz intratekal IgG sentezini dışlamaz.', 'BOS’a özgü bantları göstermek için BOS ve serum OKB birlikte karşılaştırılır.', 'IgG indeksi için BOS ve serum IgG ile albümin eş zamanlı gerekir.'] },
      { id: 'tedavi', soru: 'Akut tedaviyi neden OKB ve IgG indeksi raporlanmadan başlattınız?',
        oneriler: ['Sağ göz görme keskinliği 20/200; işlevsel olarak belirgin görme kaybı var.', 'OKB ve indeks yaklaşık iki hafta sonra raporlanır; sonuçlar akut tedavi kararını geciktirmemeli.', 'Enfeksiyon ve önemli alternatif nedenler klinik olarak değerlendirildi.'] },
    ],
    ozetBaslik: 'Olgu özeti',
    ipucu: 'Üç soruyu da yanıtlayın.',
    etiketler: { gercek: 'Olgu verisi', temsili: 'Temsili laboratuvar değeri', bekleyen: 'Bekleyen / girilmemiş sonuç', ogrenci: 'Öğrenci yanıtı' },
  },
};
