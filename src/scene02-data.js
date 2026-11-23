// Sahne 02 — Göz ve nörolojik muayene
// Tüm klinik içerik, metinler, koşullar ve animasyon parametreleri arayüz kodundan ayrıdır.
//
// TARAF KURALI (karşıdan bakan muayene eden gözüyle):
//   Hastanın SAĞ gözü ekranın SOLUNDA, hastanın SOL gözü ekranın SAĞINDA görünür.
//   Kodda taraf anahtarları hep HASTANIN tarafıdır: 'sag' = hastanın sağı, 'sol' = hastanın solu.
//
// ÜRETİLMEMİŞ VERİ: sol göz için sayısal görme keskinliği, Ishihara puanı, sayısal desatürasyon yüzdesi,
// ve (kullanıcının sonradan verdiği nörolojik bulgular dışında) başka muayene sonucu verilmedi.
// Nörolojik muayene sonuçları YALNIZCA öğrencinin planına eklediği başlıklar için açılır;
// seçilmeyen başlığa "normal" ya da başka sonuç atanmaz.

export const SAHNE_02 = {
  id: 'sahne-02',
  sira: 2,
  baslik: 'Sahne 02 — Göz ve nörolojik muayene',
  gorev: 'Sağ gözdeki görme kaybını muayene edin. Bulguları birlikte değerlendirerek etkilenen yapıyı belirleyin.',
  panelBaslik: 'Muayene yap',
  geriDugme: '← Sahne 01’e dön',

  video: {
    bekleme: 'assets/hasta-bekleme.mp4', // 10 sn, sessiz, döngü; giriş yürüyüşü yeniden oynamaz
    yedekKare: 'assets/hasta-son-kare.jpg',
  },

  // Sahne 01'den alınan olgu (öykü metni Sahne 01 verisinden üretilir; burada yalnızca başvuru satırı)
  oykuBaslik: 'Sahne 01’de aldığınız öykü',
  oykuYok: 'Sahne 01 öyküsü bu oturumda tamamlanmadı.',

  kartTurleri: {
    yanit: { baslik: 'Hastanın yanıtı' },
    bulgu: { baslik: 'Muayene bulgusu' },
    egitici: { baslik: 'Eğitici not' },
    egitmen: { baslik: 'Eğitmen geri bildirimi' },
    ipucu: { baslik: 'İpucu' },
    plan: { baslik: 'Muayene planı' },
  },

  // Sağ paneldeki işlem grupları (düğmelerde yalnızca işlem adı yazar)
  gruplar: [
    { id: 'gorme', baslik: 'Görme keskinliği', islemler: [{ id: 'gorme', ad: 'Sol gözü kapat, sağ gözü test et' }] },
    { id: 'renk', baslik: 'Renkli görme', islemler: [{ id: 'renk', ad: 'Gözleri sırayla karşılaştır' }] },
    { id: 'pupilla', baslik: 'Pupilla ışık yanıtları', islemler: [{ id: 'sol', ad: 'Sol gözü aydınlat' }, { id: 'sag', ad: 'Sağ gözü aydınlat' }] },
    { id: 'fundus', baslik: 'Göz dibi', islemler: [{ id: 'fundus', ad: 'Sağ göz dibini incele' }] },
    { id: 'plan', baslik: 'Nörolojik muayene', islemler: [{ id: 'plan', ad: 'Nörolojik muayeneyi planla' }] },
    { id: 'birlestir', baslik: 'Değerlendirme', gizliKilit: true, islemler: [{ id: 'birlestir', ad: 'Bulguları birleştir' }] },
  ],

  // Birleştirme sorusu için gereken göz muayeneleri (nörolojik plan sayılmaz)
  gozMuayeneleri: ['gorme', 'renk', 'pupilla', 'fundus'],

  gorme: {
    sureMs: 2800,
    sonuc: [
      { tur: 'bulgu', metin: 'Sağ göz görme keskinliği: 20/200 (ondalık 0,1).' },
      { tur: 'egitici', metin: '20/200, standart görmeye sahip bir kişinin 200 feet mesafeden ayırt edebildiği bir optotipi, hastanın 20 feet mesafeden ayırt edebildiğini ifade eder.' },
    ],
    not: 'Sağ gözde görme keskinliği 20/200 (0,1).',
    // Temsili Snellen eşeli: ekran boyutuna / VR çözünürlüğüne bağlı gerçek ölçüm DEĞİLDİR.
    satirlar: [
      { oran: '20/200', harf: 'E', boy: 1.0 },
      { oran: '20/100', harf: 'F P', boy: 0.62 },
      { oran: '20/70', harf: 'T O Z', boy: 0.46 },
      { oran: '20/50', harf: 'L P E D', boy: 0.35 },
      { oran: '20/40', harf: 'P E C F D', boy: 0.28 },
      { oran: '20/30', harf: 'E D F C Z P', boy: 0.22 },
      { oran: '20/20', harf: 'F E L O P Z D', boy: 0.17 },
    ],
    okunanSatir: 0, // hastanın okuduğu en küçük satırın indeksi (20/200)
    gorselAltyazi: 'Temsili Snellen eşeli — ölçek, ekran boyutuna veya gözlük çözünürlüğüne bağlı değildir.',
  },

  renk: {
    sureMs: 3600,
    sonuc: [
      { tur: 'yanit', metin: 'Sağ gözümle baktığımda kırmızı daha soluk görünüyor.' },
      { tur: 'bulgu', metin: 'Sağ gözde renkli görme bozulmuş. Kırmızı hedef sağ gözle daha az doygun algılanıyor.' },
    ],
    not: 'Sağ gözde renkli görme bozuk.',
    gorselAltyazi: 'Hastanın algısını temsil eden örnek',
    // Temsili renkler (sayısal desatürasyon yüzdesi VERİLMEZ)
    doygun: '#d7102b',
    soluk: '#b9757c',
  },

  pupilla: {
    gozlemMs: 2000, // her taraf için asgari aydınlatma süresi (2–3 sn gözlem)
    gecisMs: 450, // ışık taşınırken pupilla geçişi; araya karanlık konmaz
    // Her iki pupilla her zaman AYNI çapta (konsensüel yanıt tam). Çap yalnızca aydınlatılan tarafa bağlıdır.
    boyut: { karanlik: 1.0, solAydinlik: 0.36, sagAydinlik: 0.62 },
    soru: 'Bu ışık yanıtı hangi tarafta afferent defekti destekler?',
    secenekler: [
      { id: 'sag', ad: 'Sağ' },
      { id: 'sol', ad: 'Sol' },
      { id: 'yok', ad: 'Afferent asimetri yok' },
    ],
    dogru: 'sag',
    yanlisIpucu: 'Işığın hangi göze taşındığına ve o anda iki pupillanın birlikte nasıl değiştiğine yeniden bakın.',
    sonuc: [
      { tur: 'bulgu', metin: 'Sağ rölatif afferent pupilla defekti (RAPD) var.' },
      { tur: 'egitici', metin: 'Sağ göz aydınlatıldığında afferent ışık girdisi daha zayıf olduğundan her iki pupillanın konstriksiyonu azalır.' },
    ],
    not: 'Sağ RAPD mevcut.',
    yonerge: 'Aynı şiddetteki ışığı gözler arasında taşıyın; her aydınlatmayı 2–3 saniye izleyin. Ortam loş, hasta uzağa bakıyor.',
    gorselAltyazi: 'Karşıdan görünüm: hastanın sağ gözü ekranın solundadır.',
  },

  fundus: {
    sonuc: [
      { tur: 'bulgu', metin: 'Sağ göz dibi doğal. Optik disk sınırları seçiliyor; disk ödemi izlenmiyor.' },
      { tur: 'egitici', metin: 'Göz dibi muayenesinde optik sinirin başı görülür. Tutulum göz küresinin arkasındaki optik sinir segmentindeyse görme işlevi etkilenmesine rağmen disk başlangıçta doğal görünebilir.' },
    ],
    not: 'Sağ göz dibi doğal.',
    // Projede kullanım izni belli bir normal fundus fotoğrafı bulunmadığından şema kullanılır.
    gorselAltyazi: 'Temsili sağ fundus — optik disk nazalde, makula temporalde',
  },

  plan: {
    soru: 'Görsel yakınmaya eşlik eden başka bir nörolojik bulgu olup olmadığını araştırmak için neleri değerlendirirsiniz?',
    secenekler: [
      { id: 'gozhareket', ad: 'Göz hareketleri', sonuc: 'Bir–iki atımlık horizontal nistagmus.', anormal: true },
      { id: 'kraniyal', ad: 'Diğer kraniyal sinirler', sonuc: 'Doğal.', anormal: false },
      { id: 'gug', ad: 'Kas gücü', sonuc: 'Doğal.', anormal: false },
      { id: 'refleks', ad: 'Refleksler', sonuc: 'Derin tendon refleksleri alt ekstremitelerde canlı.', anormal: true },
      { id: 'duyu', ad: 'Duyu', sonuc: 'Doğal.', anormal: false },
      { id: 'koordinasyon', ad: 'Koordinasyon', sonuc: 'Bilateral dismetri.', anormal: true },
      { id: 'yuruyus', ad: 'Yürüyüş', sonuc: 'Doğal.', anormal: false },
    ],
    bosMetin: 'Henüz bir başlık seçmediniz.',
    // Seçilmeyen başlıklar için sonuç açılmaz
    secilmeyenMetni: 'Planınıza almadığınız başlıklar için sonuç açılmadı.',
    egitici: 'Nistagmus, bilateral dismetri ve alt ekstremitelerde canlı refleksler görsel yakınmanın ötesinde, optik sinir dışındaki merkezi sinir sistemi yollarının da tutulduğunu düşündürür. Bu bulgular lokalizasyonu ve sonraki değerlendirmeyi etkiler; tek başına etiyolojiyi belirlemez.',
    noroNotBas: 'Nörolojik muayene: ',
  },

  birlestir: {
    soru: 'Sağ gözde görme keskinliği ve renk algısı azalmış, sağ RAPD saptanmış ve göz dibi doğal bulunmuştur. Bu bulgular birlikte değerlendirildiğinde en olası tutulum yeri neresidir?',
    secenekler: [
      { id: 'A', ad: 'A. Sağ optik sinirin retrobulber bölümü' },
      { id: 'B', ad: 'B. Sağ gözün korneası veya lensi' },
      { id: 'C', ad: 'C. Optik kiazma' },
      { id: 'D', ad: 'D. Sol oksipital korteks' },
    ],
    dogru: 'A',
    ipuclari: {
      B: 'Saydam ortam sorunları görme keskinliğini azaltabilir; ancak belirgin RAPD ile renk algısı bozukluğunun birlikte bulunması afferent yol (optik sinir) tutulumunu daha çok düşündürür.',
      C: 'Kiazma lezyonları tipik olarak iki gözün görme alanını etkiler. Bu olguda yakınma tek gözle sınırlı ve RAPD sağ tarafta; tek gözlü tablo ile kiazmal tutulumu karşılaştırın.',
      D: 'Tek gözle sınırlı bir yakınma ile homonim görme alanı kaybının lokalizasyonlarını karşılaştırın.',
    },
    geriBildirim:
      'Sağ gözde görme keskinliği ve renk algısındaki azalmaya sağ RAPD’nin eşlik etmesi, bu olguda sağ optik sinir tutulumunu destekler. Optik diskin doğal görünmesi retrobulber yerleşimle uyumludur. Ağrıyı izleyen subakut görme kaybı öyküsüyle birlikte optik nörit ön planda düşünülür. Bu bulgular tek başına etiyolojiyi belirlemez.',
  },

  // Muayene notu yalnızca açılmış bulgulardan, bu sırayla oluşur.
  notSirasi: ['gorme', 'renk', 'pupilla', 'fundus'],
  notBaslik: 'Muayene notu',
  notBos: 'Henüz açılmış bir bulgu yok. Yaptığınız muayenelerin bulguları burada birikir.',
  tamamlandi: 'Sahne 02 tamamlandı.',
};
