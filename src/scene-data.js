// Sahne 01 — Acil serviste ilk karşılaşma
// Tüm klinik içerik (sorular, yanıtlar, notlar, açılma koşulları) arayüz kodundan ayrıdır.
// Sonraki sahnelerde aynı şema; `muayene`, `tanimlar`, `tedavi` gibi bölümlerle genişletilebilir.
//
// Şema özeti
//  sorular[].id        : kararlı kimlik (koşullar bu kimliklere bağlanır)
//  sorular[].notlar[]  : soru sorulunca "Öykü notları" paneline eklenen kısa klinik ifadeler
//       tur 'zaman'    : zaman çizelgesi olayı (etiket = zaman, metin = olay, sira = kronolojik sıra)
//       tur 'bilgi'    : başlıklı öykü bilgisi
//  sorular[].ozet      : öykü özeti paragrafında kullanılan cümle (yalnız sorulmuşsa kullanılır)
//  kosullar            : arayüz öğelerinin açılma koşulları
//
// ÜRETİLMEMİŞ VERİ: eşlik eden belirtiler, ağrının göz hareketleriyle ilişkisi, görme keskinliği,
// muayene bulguları ve tetkikler bu sahnede verilmez. Aşağıda `verilmeyenler` yalnız geliştirici
// içindir; arayüzde "normal/negatif" olarak gösterilmez.

export const SAHNE_01 = {
  id: 'sahne-01',
  sira: 1,
  baslik: 'Sahne 01 — Acil serviste ilk karşılaşma',
  gorev:
    'Sağ gözde bulanık görme yakınmasının nasıl başladığını ve zaman içinde nasıl değiştiğini hastadan öğrenin.',

  video: {
    // Proje bağlamından bu sahneye ait olduğu belirlenen klip: gemini_generated_video_0afd9551.mp4
    // (10 sn, 1280×720, 24 fps; hasta önden, tam boy, kameraya yaklaşıp durur).
    // Aranan yol; bulunamazsa sahne `yedekKare` ile öykü etkileşimini sürdürür.
    src: 'assets/hasta-giris.mp4',
    // Karşılaşma bitince, öğrenci soru sorarken döngüyle oynayan bekleme klibi (10 sn, sessiz).
    bekleme: 'assets/hasta-bekleme.mp4',
    ilkKare: 'assets/hasta-ilk-kare.jpg',
    yedekKare: 'assets/hasta-son-kare.jpg',
    sureSn: 10,
  },

  basvuru: {
    yer: 'Acil servis · İlk karşılaşma',
    hasta: '25 yaşında erkek hasta',
    soz: 'Sağ gözüm bulanık görüyor.',
  },

  sorular: [
    {
      id: 'baslangic',
      teori: "Başlangıç zamanı ve sırası: akut (saat–gün), subakut (gün–hafta) ve kronik (ay–yıl) gelişen görme kayıpları farklı hastalık gruplarına işaret eder. Ağrının görme kaybından önce gelmesi ve yakınmanın tek gözde olması, ayırıcı tanıyı daraltan öykü ayrıntılarıdır. Kaydederken ilk belirtiyi ve görme değişikliğinin başlangıcını ayrı ayrı yazın.",
      soru: 'Şikâyetiniz ne zaman ve nasıl başladı?',
      yanit: 'Bir hafta önce sağ gözümde ağrı başladı. Ertesi gün o gözümle bulanık görmeye başladım.',
      notlar: [
        { tur: 'zaman', sira: 1, etiket: 'Bir hafta önce', metin: 'Sağ gözde ağrı başlamış.' },
        { tur: 'zaman', sira: 2, etiket: 'Ertesi gün', metin: 'Sağ gözde bulanık görme eklenmiş.' },
      ],
      ozet: 'Bir hafta önce sağ gözünde ağrı başlamış, ertesi gün aynı gözde bulanık görme eklenmiş.',
    },
    {
      id: 'gorme',
      teori: "Hastanın kendi tarifi (buğulu, bulanık, karanlık nokta, görme alanı kaybı, çift görme) etkilenen yapıyı ayırt etmeye yardım eder. Tek gözü kapatınca yakınma sürüyorsa sorun o gözdedir; çift görme ise tek göz kapatılınca genellikle düzelir. Tarif tek başına tanı koydurmaz; görme keskinliği, renk görme ve görme alanı muayenesiyle doğrulanır.",
      soru: 'Sağ gözünüzle nasıl gördüğünüzü tarif eder misiniz?',
      yanit: 'Sanki buğulu bir camın arkasından bakıyorum.',
      notlar: [
        { tur: 'bilgi', etiket: 'Görmenin niteliği', metin: 'Sağ gözde “buğulu cam” benzetmesiyle tarif edilen bulanık görme.' },
      ],
      ozet: 'Görmeyi “buğulu bir camın arkasından bakmak” gibi tarif ediyor.',
    },
    {
      id: 'onceki',
      teori: "Önceki benzer epizodlar, olayın ilk mi yoksa tekrarlayan mı olduğunu gösterir. Geçmişte görme, duyu, güç veya denge ile ilgili geçici yakınmalar varsa çok odaklı bir hastalık düşünülebilir; bu nedenle hasta yalnız aynı yakınmayı değil, geçmiş geçici nörolojik yakınmaları da ayrıca sorgulanmalıdır.",
      soru: 'Daha önce buna benzer bir şikâyetiniz oldu mu?',
      yanit: 'Hayır, ilk kez böyle bir şey yaşıyorum.',
      notlar: [
        { tur: 'bilgi', etiket: 'Benzer önceki yakınma', metin: 'Yok; ilk kez yaşıyor.' },
      ],
      ozet: 'Daha önce benzer bir yakınması olmamış.',
    },
    {
      id: 'hastalik',
      teori: "Bilinen hastalıklar (otoimmün, enfeksiyöz, damarsal, metabolik), ilaç kullanımı ve yakın zamanda geçirilmiş enfeksiyon veya aşı birlikte sorgulanır. Bilinen hastalığın olmaması nedeni dışlamaz; genç yaşta ilk atak olarak ortaya çıkan hastalıklar vardır.",
      soru: 'Bilinen bir hastalığınız var mı?',
      yanit: 'Hayır, bildiğim bir hastalığım yok.',
      notlar: [
        { tur: 'bilgi', etiket: 'Bilinen hastalık', metin: 'Hastanın bildiği bir hastalık yok.' },
      ],
      ozet: 'Bilinen bir hastalığı yok.',
    },
    {
      id: 'aile',
      teori: "Aile öyküsü, kalıtsal optik nöropatiler ve otoimmün hastalıklar açısından sorgulanır. Hastanın “bildiğim kadarıyla yok” demesi kesin bir dışlama değildir; aile öyküsü hastanın bilgisiyle sınırlıdır ve gerekirse yakınlarından teyit edilir.",
      soru: 'Ailenizde bildiğiniz ciddi bir kalıtsal hastalık var mı?',
      yanit: 'Bildiğim kadarıyla yok.',
      notlar: [
        { tur: 'bilgi', etiket: 'Aile öyküsü', metin: 'Hastanın bildiği ciddi kalıtsal hastalık yok.' },
      ],
      ozet: 'Ailede bildiği ciddi bir kalıtsal hastalık yok.',
    },
    {
      id: 'tani',
      soru: 'Bu öyküyle muhtemel tanılar nelerdir?',
      tur: 'egitici', // hasta değil, eğitmen yanıtlar
      zorunlu: false, // "Öyküyü tamamla" koşuluna sayılmaz
      baslikEtiketi: 'Eğitmen yanıtı — ayırıcı tanı (teorik)',
      liste: [
        'Optik nörit: genç erişkinde subakut gelişen, ağrılı tek taraflı görme kaybında en sık düşünülen neden; demiyelinizan (ör. multipl skleroz ilişkili), otoimmün veya parainfeksiyöz olabilir.',
        'Diğer optik nöropatiler: iskemik (genç yaşta nadir), kompresif, infiltratif, toksik/nütrisyonel, herediter (ör. Leber; genellikle ağrısız).',
        'Retina ve damar nedenleri: retina arter/ven tıkanıklığı, retina dekolmanı, makülopatiler (çoğunlukla ağrısız).',
        'Ön segment ve oküler nedenler: üveit, keratit, skleral inflamasyon, akut açı kapanması (ağrılı, kırmızı göz), kırma kusuru.',
        'Diğer: papilödem (genellikle iki taraflı), migren aurası (geçici).',
      ],
      teori: 'Öykü ayırıcı tanıyı daraltır ama tanı koydurmaz. Sonraki sahnede görme keskinliği, renk görme, pupilla yanıtı, fundus ve göz hareketleri muayenesiyle bu listede ilerlenecektir; bulgular henüz verilmedi.',
      notlar: [],
    },
  ],

  kosullar: {
    // "Eğitici not" düğmesi: başlangıç ve görmenin niteliği sorulduktan sonra görünür.
    egiticiNot: { gerek: ['baslangic', 'gorme'] },
    // "Öyküyü tamamla": tüm sorular sorulduğunda etkinleşir.
    tamamla: { gerek: 'hepsi' },
  },

  egiticiNot: {
    baslik: 'Eğitici not',
    metin:
      'Hastanın “buğulu cam” benzetmesi, görme değişikliğini kendi sözcükleriyle tarif eder. Öyküyü kaydederken etkilenen gözü, ilk belirtiyi ve bulanık görmenin ne zaman başladığını ayrı ayrı belirtin.',
  },

  sonuc: {
    ozetGiris: '25 yaşında erkek hasta acil servise “Sağ gözüm bulanık görüyor.” yakınmasıyla başvurdu.',
    sonrakiSahne: 'Sıradaki sahne: Göz ve nörolojik muayene',
  },

  // Yalnız geliştirici notu — arayüzde gösterilmez, "normal" diye kaydedilmez.
  verilmeyenler: [
    'eşlik eden belirtiler',
    'ağrının göz hareketleriyle ilişkisi',
    'görme keskinliği',
    'muayene bulguları',
    'tetkik sonuçları',
  ],
};
