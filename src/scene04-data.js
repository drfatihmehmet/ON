// Sahne 04 — Tanısal sentez (2024 McDonald). Karar sahnesi tanımı: ds-engine.js bu veriyi çalıştırır.
// Bilimsel içerik "MS Eğitim Olgusu ON" klasöründeki makalelerden (R01–R08) ve onların doğrulanmış kaynak–iddia matrisinden (C kodları) alınmıştır.
// Hasta verileri bu erkek olguya aittir; kaynak klasördeki başka bir olgunun (kadın) değerleri AKTARILMAMIŞTIR.
// Doğrulanmamış hiçbir değer normal/negatif kodlanmaz; eğitmen değerleri src/scene03-config.js içindedir.
import { mcdonald } from './ds-engine.js';
import { fmt } from './case-state.js';

const durum = (v) => (v == null ? 'Girilmedi' : v);

// Olgunun DOĞRULANMIŞ verisinden McDonald girdisi (yalnız config; öğrenci işaretlemesinden bağımsız)
export function dogrulanmisGirdi(cfg) {
  const t = cfg.tani, okb = cfg.bos14gun.okbPatern;
  // BOS pozitif: OKB tip 2/3 VEYA kFLC pozitif. Negatif yalnız iki yol da kapalıysa (diğer test negatif ya da çalışılmadı); biri bilinmiyorsa sonuç bilinmiyor.
  const okbNeg = [1, 4, 5].includes(okb), kNeg = t.kflc === 'negatif' || t.kflc === 'çalışılmadı';
  const csf = [2, 3].includes(okb) || t.kflc === 'pozitif' ? 'pozitif' : okbNeg && kNeg ? 'negatif' : 'bilinmiyor';
  return { bolgeler: t.bolgeler, csf, dit: t.dit, cvs: t.cvs, prl: t.prl, aciklama: t.aciklama || 'bilinmiyor' };
}
const ver = (x) => ({ var: 'var', yok: 'yok' }[x] || null);

export const SAHNE_04 = {
  veri: {
    id: 'sahne-04', sira: 4,
    baslik: 'Sahne 04 — Tanısal sentez (2024 McDonald)',
    gorev: 'BOS ve serolojik sonuçları, MRG bulgularını ve klinik tabloyu 2024 McDonald çerçevesinde birleştirin; hangi bilginin mevcut, hangisinin eksik olduğunu ayırt ederek tanı durumunu belirleyin.',
    panelBaslik: 'Tanısal sentez',
    geriDugme: '← Sahne 03’e dön',
    kartTurleri: {
      yanit: { baslik: 'Hastanın yanıtı' }, bulgu: { baslik: 'Bulgu' }, egitici: { baslik: 'Eğitici not' }, egitmen: { baslik: 'Eğitmen geri bildirimi' },
      ipucu: { baslik: 'İpucu' }, uyari: { baslik: 'Bilgi' }, rapor: { baslik: 'Rapor' }, aciklama: { baslik: 'Açıklama' },
    },
    oncekiMuayene: { baslik: 'Önceki bulgular', bos: '' },
    olguBaglami: '25 yaşında erkek hasta; sağ optik sinir tutulumu, beyin ve servikal MRG’de MS ile uyumlu demiyelinizan plaklar (rapor).',
  },
  sonrakiDugme: 'DMT seçimi sahnesine geç',
  bosMetin: 'Sağdan bir eylem seçin. Tek bir “MS” düğmesi yoktur: önce hangi bilginin mevcut, hangisinin eksik olduğunu belirleyin.',

  eylemler: [
    { id: 'sonuc', ad: 'BOS ve serolojik sonuçları aç' },
    { id: 'okb', ad: 'OKB, IgG indeksi ve kFLC farkını incele' },
    { id: 'pano', ad: 'Kriter panosunu doldur' },
    { id: 'ayirici', ad: 'MOGAD ve NMOSD olasılığını değerlendir' },
    { id: 'sinif', ad: 'Destekleyen, sınırlayan ve eksik bulguları ayır' },
    { id: 'karar', ad: 'Tanı durumunu kaydet' },
  ],

  // Sol: sonuç tablosu
  sol: {
    sonuc: {
      baslik: 'BOS ve serolojik sonuçlar (14. gün)', etiket: 'Eğitmenin girdiği olgu verileri · girilmemiş değer normal/negatif sayılmaz',
      head: ['İnceleme', 'Sonuç', 'Not'],
      rows: ({ cfg }) => [
        ['OKB paterni', cfg.bos14gun.okbPatern ? `Tip ${cfg.bos14gun.okbPatern}` : 'Girilmedi', cfg.bos14gun.okbPatern ? '' : 'Doğrulama bekliyor'],
        ['IgG indeksi', cfg.bos14gun.iggIndeksi != null ? fmt(cfg.bos14gun.iggIndeksi, 2) : 'Girilmedi', '2024 McDonald BOS ölçütünde kullanılmaz; birimsiz, laboratuvar referansıyla yorumlanır'],
        ['kFLC indeksi', cfg.tani.kflcDeger != null ? `${String(cfg.tani.kflcDeger).replace('.', ',')} (${durum(cfg.tani.kflc)})` : durum(cfg.tani.kflc), cfg.tani.kflc ? '' : 'Çalışıldı mı? Doğrulama bekliyor'],
        ['Serum AQP4-IgG', durum(cfg.tani.antikor.aqp4), cfg.tani.antikor.aqp4 ? '' : 'Doğrulama bekliyor'],
        ['Serum MOG-IgG', durum(cfg.tani.antikor.mog), cfg.tani.antikor.mog ? '' : 'Doğrulama bekliyor'],
        ['Antikor yöntemi', durum(cfg.tani.antikor.yontem), 'Tercih edilen: canlı hücre tabanlı test'],
        ['Antikor örnek zamanı', durum(cfg.tani.antikor.ornekZamani), 'İdeal: steroid öncesi'],
      ],
    },
  },

  ekranlar: {
    sonuc: [
      { t: 'p', text: 'Sol tablo bu olgu için eğitmenin girdiği değerleri gösterir. Girilmemiş değerler negatif ya da normal olarak yorumlanmaz.', tone: 'muted' },
      { t: 'card', kind: 'uyari', title: 'Kesin ON ile MS tanısı ayrı katmanlardır', text: 'Kesin optik nörit = klinik ölçüt A + bir paraklinik test (MR, OKT veya biyobelirteç; intratekal IgG–OKB biyobelirteç sayılır). MS tanısı ise 2024 McDonald ölçütlerinin ayrıca karşılanmasını gerektirir.', kaynak: 'R03 Panel 1, s.2 (C21–C22)', rozet: 'UZL' },
      { t: 'card', kind: 'egitici', title: 'Klinik ON ölçütü A', text: 'Tek gözde subakut görme kaybı + göz hareketiyle artan orbital ağrı + kontrast ve renk görmede azalma + RAPD.', kaynak: 'R03 Panel 1, s.2 (C20)', rozet: 'UZL' },
      { t: 'p', text: 'Bu olguda ağrı göz hareketleriyle artıyor (öykü); ölçüt A’nın bileşenleri mevcut. Paraklinik kanıt: orbita MRG’de sağ optik sinirde kontrast tutulumu ve BOS’a özgü OKB.', tone: 'muted' },
      { t: 'toggle', id: 'akut', label: 'Akut evrede OKT ve fundus ne bekletir?', bloklar: [
        { t: 'card', kind: 'egitici', title: 'Akut evre', text: 'Akut evre (<7 gün) ve kronik evre (≥3 ay) ayrılır; akut evrede OKT normal olabilir. Maksimal incelme genellikle optik nörit başlangıcından en az 6 ay sonra saptanır. Fundus vakaların yaklaşık üçte ikisinde normaldir.', kaynak: 'R04 s.1,3 (C27); R01 s.3–4 (C03); R05 s.3 (C28)', rozet: 'DER' },
      ] },
      { t: 'choice', id: 'mcdBos', multi: true, soru: 'Aşağıdakilerden hangileri 2024 McDonald’da BOS pozitifliği olarak sayılır?',
        secenekler: [{ id: 'okb', ad: 'BOS’a özgü oligoklonal bantlar (patern 2 veya 3)' }, { id: 'kflc', ad: 'kFLC indeksi' }, { id: 'igg', ad: 'Yüksek IgG indeksi' }, { id: 'prot', ad: 'BOS protein artışı' }],
        dogru: ['okb', 'kflc'],
        geriDogru: 'BOS’a özgü OKB ve kFLC indeksi sayılır; kFLC indeksi OKB ile birbirinin yerine kullanılabilir. IgG indeksi oylamaya alınmamış, OKB ve kFLC’ye göre duyarlılığı ve doğruluğu daha düşük bulunmuştur.',
        geriYanlis: 'IgG indeksi ve protein artışı 2024 McDonald BOS ölçütü değildir; yalnız BOS’a özgü OKB ve kFLC indeksi kabul edilir.', kaynak: 'R01 Panel 4, s.6–7 (C10)', rozet: 'UZL' },
    ],

    okb: [
      { t: 'choice', id: 'tip', soru: 'Freedman paternlerini inceleyin: bir tip seçin.',
        secenekler: [1, 2, 3, 4, 5].map((n) => ({ id: String(n), ad: `Tip ${n}`, geri: { tur: 'bilgi', text: ['Her iki örnekte oligoklonal bant saptanmaz.', 'BOS’a özgü bantlar vardır; serumda karşılıkları görülmez: intratekal sentez.', 'Ortak bantlara ek olarak BOS’a özgü bantlar vardır: intratekal sentez.', 'Serum ve BOS’ta eşleşen bantlar; tek başına intratekal sentezi göstermez.', 'Serum ve BOS’ta eşleşen monoklonal patern; intratekal sentezi göstermez.'][n - 1], kaynak: 'R06 s.3 (C31)', rozet: 'DER' } })) },
      { t: 'hesap', ad: 'okbSema' },
      { t: 'card', kind: 'egitici', title: 'Yöntem ve duyarlılık', text: 'OKB için önerilen standart izoelektrik odaklama + IgG immünoblottur; intratekal sentez ancak serumla karşılaştırarak değerlendirilir. Yüksek IgG (ör. IgG indeksi) MS hastalarının yaklaşık %60’ında, OKB yaklaşık %95’inde bulunur; kantitatif formüller OKB’den daha az duyarlıdır.', kaynak: 'R06 s.3 (C32–C33)', rozet: 'DER' },
      { t: 'card', kind: 'uyari', title: 'OKB’nin özgüllük sınırı', text: 'Karşılaştırma grubu yalnız inflamatuvar MSS hastalıklarından oluştuğunda OKB’nin MS özgüllüğü %94’ten %61’e düşer. kFLC indeksi ve OKB, MOGAD ve NMOSD’de de (daha düşük değerlerle) pozitif olabilir.', kaynak: 'R06 s.2 (C34); R01 s.7 (C11)', rozet: 'DER' },
      { t: 'card', kind: 'uyari', title: 'IgG indeksi ≠ OKB ≠ kFLC', text: 'IgG indeksi, BOS’a özgü OKB veya kFLC indeksiyle aynı test değildir. Evrensel bir IgG indeksi üst sınırı kaynak setinde yoktur; yorum laboratuvarın referans aralığına bağlıdır.', kaynak: 'R01 Panel 4 (C10); R06 (laboratuvar referansı)', rozet: 'UZL' },
      { t: 'choice', id: 'tip4', soru: 'Serumda da aynı bantlar görülüyorsa (Tip 4) ne düşünürsünüz?',
        secenekler: [
          { id: 'a', ad: 'İntratekal IgG sentezi vardır', geri: { tur: 'yanlis', text: 'Eşleşen (özdeş) bantlar serum kaynaklı olabilir; tek başına intratekal sentez göstermez. Belirleyici olan BOS’a özgü bantlardır.', kaynak: 'R06 s.3 (C31)' } },
          { id: 'b', ad: 'Tek başına intratekal sentezi göstermez; BOS’a özgü bant aranır', geri: { tur: 'dogru', text: 'Doğru: patern 4 ve 5 intratekal sentez göstermez; patern 2 ve 3’te BOS’a özgü bantlar vardır.', kaynak: 'R06 s.3 (C31)', rozet: 'DER' } },
        ] },
    ],

    pano: [
      { t: 'p', text: 'Her bölge için “tipik lezyon” durumunu işaretleyin. Yalnız doğrulanmış bilgiyi Var/Yok olarak işaretleyin; bilmediğinizi “Bilinmiyor” bırakın. Beyinde “plak var” bilgisi tek başına yeterli değildir: lezyon periventriküler, kortikal/jukstakortikal veya infratentoriyal olmalıdır; yalnız derin ak madde lezyonları sayılmaz.', tone: 'muted' },
      { t: 'tri', id: 'bol', satirlar: [
        { id: 'optik', ad: 'Optik sinir (MR, OKT veya VEP kanıtı gerekir; klinik ON + RAPD tek başına yetmez)', bilinen: (c) => ver(c.tani.bolgeler.optik) },
        { id: 'periv', ad: 'Periventriküler', bilinen: (c) => ver(c.tani.bolgeler.periv) },
        { id: 'kortikal', ad: 'Kortikal / jukstakortikal', bilinen: (c) => ver(c.tani.bolgeler.kortikal) },
        { id: 'infra', ad: 'İnfratentoriyal', bilinen: (c) => ver(c.tani.bolgeler.infra) },
        { id: 'omurilik', ad: 'Omurilik (kısa segmentli, periferik yerleşimli tipik lezyon)', bilinen: (c) => ver(c.tani.bolgeler.omurilik) },
      ] },
      { t: 'tri', id: 'jet', satirlar: [
        { id: 'dit', ad: 'Zamanda yayılım (DIT): kontrast tutan ve tutmayan tipik lezyon birlikte, yeni T2 lezyon veya yeni atak', bilinen: (c) => ver(c.tani.dit) },
        { id: 'csf', ad: 'BOS pozitifliği: BOS’a özgü OKB (patern 2/3) veya kFLC indeksi', bilinen: (c) => { const d = dogrulanmisGirdi(c).csf; return d === 'pozitif' ? 'var' : d === 'negatif' ? 'yok' : null; } },
        { id: 'cvs', ad: 'Santral ven işareti (“select 6”: ≥6 CVS+ lezyon; <10 lezyonda CVS+ çoğunlukta)', bilinen: (c) => ver(c.tani.cvs) },
        { id: 'prl', ad: '≥1 paramagnetik rim lezyonu (PRL; yalnız tek bölge durumunda ek kanıt)', bilinen: (c) => ver(c.tani.prl) },
        { id: 'aciklama', ad: 'MS dışında daha iyi bir açıklama var (klinik + seroloji + kırmızı bayraklar)', bilinen: (c) => ver(c.tani.aciklama) },
      ] },
      { t: 'card', kind: 'uyari', title: 'IgG indeksi jetonu', text: 'IgG indeksi bu panoda ayrı bir ölçüt değildir: 2024 McDonald BOS ölçütünde kullanılmaz.', kaynak: 'R01 Panel 4, s.6 (C10)', rozet: 'UZL' },
      { t: 'hesap', ad: 'mcd' },
      { t: 'toggle', id: 'mantik', label: 'Ölçüt mantığı (2024 McDonald)', bloklar: [
        { t: 'card', kind: 'egitici', title: 'DIS', text: 'Beş bölgeden (optik sinir, intrakortikal/jukstakortikal, periventriküler, infratentoriyal, omurilik) ikisinde tipik lezyon; semptomatik olup olmamasından bağımsız. DIS + DIT, DIS + pozitif BOS veya DIS + CVS (“select 6”) tanı için yeterlidir; ≥2 bölgede PRL tek başına ek kanıt sayılmaz; tipik klinik tabloda ≥4 bölge tek başına yeterlidir. DIT artık her durumda zorunlu değildir.', kaynak: 'R01 Panel 3, s.4–5 (C06–C09)', rozet: 'UZL' },
        { t: 'card', kind: 'egitici', title: 'Tek bölge', text: 'Tek bölgede tipik lezyon varsa (DIT veya BOS) ve (CVS “select 6” veya ≥1 PRL) gerekir.', kaynak: 'R01 Panel 3–4 (C08)', rozet: 'UZL' },
        { t: 'card', kind: 'egitici', title: 'Optik sinir beşinci bölge', text: 'Optik sinir tutulumu MR, OKT veya VEP ile gösterilmeli ve daha iyi açıklaması olmamalıdır. OKT ölçütü: gözler arası pRNFL farkı ≥6 µm veya mGCIPL farkı ≥4 µm. VEP: P100 ve gözler arası latansın ortalamadan 2,5 SD fazla olması (merkeze özgü eşikler).', kaynak: 'R01 Panel 2, s.3–4 (C02–C04)', rozet: 'UZL' },
        { t: 'card', kind: 'egitici', title: 'İlk ON’da görüntüleme', text: 'İlk ON başvurusunda optik sinir MR’ı önerilir; yeni veya kontrast tutan optik sinir lezyonu DIT için de kullanılabilir. Tanı anında omurilik görüntülemesi rutin yapılmalıdır.', kaynak: 'R02 s.2 (C14–C15)', rozet: 'UZL' },
      ] },
    ],

    ayirici: [
      { t: 'p', text: 'Antikor sonucu, yöntemi ve örnek zamanını sol tablodan okuyun. Girilmemiş bir sonuç negatif varsayılmaz.', tone: 'muted' },
      { t: 'card', kind: 'uyari', title: 'Atipik optik nörit kırmızı bayrakları', text: 'Ağrısızlık veya çok şiddetli ağrı; iki taraflı ya da ardışık tutulum; belirgin disk ödemi, peripapiller hemoraji veya eksüda; 2 haftadan uzun süren ilerleme; 3 hafta–1 ay içinde düzelme başlamaması; ışık algısı yok düzeyinde ağır kayıp; steroid kesilince kötüleşme (steroid bağımlılığı). Varlığında NMOSD, MOGAD, enfeksiyöz/infiltratif (sifiliz, sarkoidoz, tüberküloz) ve kompresif nedenler araştırılır.', kaynak: 'R03 Panel 3 (Petzold 2022); MENACTRIMS 2023', rozet: 'UZL' },
      { t: 'toggle', id: 'abtest', label: 'Antikor testleri: yöntem, zamanlama, kimde istenir?', bloklar: [
        { t: 'card', kind: 'egitici', title: 'Yöntem', text: 'MOG-IgG için tercih edilen yöntem canlı hücre tabanlı testtir; ELISA önerilmez. AQP4-IgG için tercih edilen biyomateryal serumdur. Klinisyen laboratuvarın yöntemini sormalıdır.', kaynak: 'R07 Panel 1, s.7 (C36); R08 s.9 (C41)', rozet: 'UZL' },
        { t: 'card', kind: 'egitici', title: 'Zamanlama', text: 'Antikor testi en yüksek olasılıkla atak anında ve ideal olarak steroid, IVIG veya aferez öncesinde pozitif saptanır; akut tedavi sonrası negatifse en az 3 ay sonra veya relapsta tekrar önerilir. Steroid, PLEX, IA ve IVIG nadiren yanlış negatiflik yapabilir.', kaynak: 'R07 s.7 (C37); R08 s.9 (C41)', rozet: 'UZL' },
        { t: 'card', kind: 'uyari', title: 'Kime istenir? Kaynaklar arası gerilim', text: 'Optik nörit kriterleri mümkünse AQP4 ve MOG antikorlarının eşzamanlı testini önerir (özellikle relaps eden seronegatif ON veya MR’da perinörit). MS tanı kriterleri ve MOGAD paneli ise MOG-IgG’yi tüm demiyelinizan olgularda rutin taramak için önermez: ön olasılık pozitif prediktif değeri belirler. Bu nedenle ON bağlamında hedefli test öğretilir.', kaynak: 'R03 s.7 (C26); R01 s.9 (C12); R07 Panel 2, s.8 (C38)', rozet: 'UZL' },
      ] },
      { t: 'toggle', id: 'orut', label: 'MS lehine ve aleyhine örüntüler', bloklar: [
        { t: 'card', kind: 'egitici', title: 'MS lehine', text: 'BOS’a özgü OKB (NMO’da ≤%20, MS’te >%90), Dawson parmakları, jukstakortikal U lifi lezyonları, <3 segment ve periferik omurilik lezyonları.', kaynak: 'R08 s.7 (C42)', rozet: 'UZL' },
        { t: 'card', kind: 'egitici', title: 'MOGAD aleyhine kırmızı bayraklar', text: 'MS DIS paterninde iyi sınırlı lezyonlar, özellikle OKB ile birlikte; yüksek doz steroide yanıtsızlık; ≥6 ay süren kontrast tutulumu. BOS’a özgü OKB MOG-IgG pozitif hastaların %20’sine kadarında görülebilir; MOGAD’yi dışlamaz.', kaynak: 'R07 Panel 3, s.10 (C40); s.8 (C39)', rozet: 'UZL' },
        { t: 'card', kind: 'egitici', title: 'Optik sinir ve omurilik örüntüleri', text: 'MS: tek taraflı, kısa, anterior optik sinir; omurilikte genellikle bir vertebra segmentinden kısa, periferik lezyon. NMOSD: uzun, posterior/kiazma; >3 segment, santral omurilik. MOGAD: uzun, anterior, perinörit; H işareti.', kaynak: 'R02 Tablo 3, s.8 (C17–C18)', rozet: 'UZL' },
      ] },
      { t: 'choice', id: 'mogneg', soru: 'Bu hastada MOG-IgG negatif gelirse nasıl yorumlarsınız?',
        secenekler: [
          { id: 'a', ad: 'MOGAD kesin dışlandı', geri: { tur: 'yanlis', text: 'Negatif sonuç ön olasılığa, test yöntemine ve örnek zamanına bağlıdır; steroid sonrası alınmış örnekte yanlış negatiflik olabilir.', kaynak: 'R07 s.7–8 (C37–C38)' } },
          { id: 'b', ad: 'Ön olasılık, yöntem (hücre tabanlı mı?) ve örnek zamanıyla birlikte yorumlarım', geri: { tur: 'dogru', text: 'Doğru: tek başına bir sayı değil, bağlamı yorumlanır; ön olasılık düşükse pozitif prediktif değer de düşer.', kaynak: 'R07 Panel 2, s.8 (C37–C38)', rozet: 'UZL' } },
          { id: 'c', ad: 'Örnek steroid sonrası alındıysa en az 3 ay sonra veya relapsta tekrarlarım', geri: { tur: 'kabul', text: 'Kabul edilebilir: akut tedavi sonrası negatifse en az 3 ay sonra veya relapsta tekrar önerilir.', kaynak: 'R07 s.7 (C37)', rozet: 'UZL' } },
        ] },
      { t: 'choice', id: 'mslehine', multi: true, soru: 'Aşağıdakilerden hangileri MS lehine, NMOSD aleyhine bulgulardır?',
        secenekler: [{ id: 'okb', ad: 'BOS’a özgü oligoklonal bantlar' }, { id: 'dawson', ad: 'Dawson parmakları' }, { id: 'juxta', ad: 'Jukstakortikal U lifi lezyonları' }, { id: 'uzun', ad: '3 segmentten uzun santral omurilik lezyonu' }, { id: 'kisa', ad: 'Kısa segmentli, periferik omurilik lezyonu' }],
        dogru: ['okb', 'dawson', 'juxta', 'kisa'],
        geriDogru: 'Doğru: bu örüntüler MS lehinedir; uzun segmentli santral omurilik lezyonu NMOSD için uyarıcıdır.', geriYanlis: 'Uzun segmentli (>3) santral omurilik lezyonu NMOSD için uyarıcıdır; diğer dört örüntü MS lehinedir.', kaynak: 'R08 s.7 (C42); R02 s.8 (C17)', rozet: 'UZL' },
    ],

    sinif: [
      { t: 'p', text: 'Aşağıdaki bulguları bu olgudaki yerlerine göre gruplayın.', tone: 'muted' },
      { t: 'bucket', id: 'sentez', soru: 'Her ifadeyi Destekleyen, Sınırlayan veya Eksik olarak sınıflayın.',
        kovalar: [{ id: 'destek', ad: 'Destekleyen' }, { id: 'sinir', ad: 'Sınırlayan' }, { id: 'eksik', ad: 'Eksik' }],
        satirlar: [
          { id: 's1', ad: 'Subakut görme kaybı, renk bozukluğu ve sağ RAPD (klinik ON bulguları)', dogru: 'destek' },
          { id: 's2', ad: 'Beyin ve servikal omurilikte MS ile uyumlu demiyelinizan plaklar (rapor)', dogru: 'destek' },
          { id: 's3', ad: 'Sağ göz görme keskinliği 20/200: atipik ON tanımındaki sınır değere yakın', dogru: 'sinir' },
          { id: 's4', ad: 'IgG indeksi 2024 McDonald BOS ölçütü olarak sayılmaz', dogru: 'sinir' },
          { id: 's5', ad: 'OKB MS’e tek başına özgül değildir; başka inflamatuvar hastalıklarda da görülür', dogru: 'sinir' },
          { id: 's6', ad: 'Rutin BOS normal; intratekal sentez hakkında tek başına karar vermez', dogru: 'sinir' },
          { id: 's7', ad: 'Periventriküler, jukstakortikal, infratentoriyal ve servikal omurilik lezyonları (MRG rapor eki)', dogru: 'destek' },
          { id: 's8', ad: 'Kontrast tutan ve tutmayan lezyon birlikte (zamanda yayılım)', dogru: 'destek' },
          { id: 's9', ad: 'BOS’a özgü OKB (Tip 2); AQP4-IgG ve MOG-IgG negatif (hücre tabanlı test, steroid öncesi)', dogru: 'destek' },
          { id: 's10', ad: 'OKT ile pRNFL/mGCIPL ölçümü (bu olguda yapılmadı)', dogru: 'eksik' },
          { id: 's11', ad: 'Bilateral dismetri ve son aylardaki dengesizlik: “ilk atak” öncesi fark edilmemiş infratentoriyal tutulum olasılığı', dogru: 'destek' },
        ],
        geriDogru: 'Doğru sınıflama: klinik ON, çok bölgeli tipik lezyonlar, zamanda yayılım ve BOS’a özgü OKB tanıyı destekler; sınırlayan bulgular özgüllüğün ve test seçiminin sınırlarını hatırlatır. OKT yapılmamıştır; kFLC indeksi 0,77 (negatif) olsa da ölçüt BOS’a özgü OKB ile karşılanır.', kaynak: 'R01 Panel 2–4; R03 Panel 3 (C24, C29)' },
    ],

    karar: [
      { t: 'choice', id: 'tani', soru: 'Bu olgu için tanı durumunu nasıl kaydedersiniz?',
        secenekler: [
          { id: 'ms', ad: 'MS tanısı konuldu (2024 McDonald karşılanıyor)', geri: ({ cfg }) => (mcdonald(dogrulanmisGirdi(cfg)).sonuc === 'ms'
            ? { tur: 'dogru', text: 'Doğru: ≥2 bölgede (bu olguda beş bölgenin tamamında) tipik lezyon, ayrıca DIT, BOS’a özgü OKB ve CVS mevcut; AQP4/MOG negatif ve kırmızı bayrak yok, daha iyi bir açıklama bulunmuyor. Ayırıcı tanı değerlendirmesini de nota yazın.', kaynak: 'R01 Şekil 3, Panel 3 (C07)', rozet: 'UZL' }
            : { tur: 'yanlis', text: 'Olgu verileriyle ölçüt henüz karşılanmıyor ya da gerekli bilgilerden biri (lezyon yerleşimi, DIT/CVS, OKB/kFLC, “daha iyi açıklama yok” değerlendirmesi) eksik. Eksik veriyle kesin tanı yazılmaz.', kaynak: 'R01 Panel 3–4' }) },
          { id: 'kosullu', ad: 'Koşullu değerlendirme: eksik veriler tamamlanana kadar tanı kesinleştirilmez', geri: ({ cfg }) => (mcdonald(dogrulanmisGirdi(cfg)).sonuc === 'ms'
            ? { tur: 'yanlis', text: 'Olgu verileri tamamlandı ve ölçüt karşılanıyor: yayılım, ek kanıt ve antikor sonuçlarıyla birlikte daha iyi bir açıklama yok. Tanıyı ertelemek tedaviyi geciktirir.', kaynak: 'R01 Şekil 3', rozet: 'UZL' }
            : { tur: 'dogru', text: 'Doğru: lezyon yerleşimi, DIT/CVS, BOS’a özgü OKB veya kFLC ve ayırıcı tanı (AQP4/MOG) bilgileri tamamlanmadan kesin tanı konulamaz.', kaynak: 'R01 Panel 3–4; R02 s.2', rozet: 'UZL' }) },
          { id: 'on', ad: 'Yalnızca kesin optik nörit tanısı; MS ayrıca değerlendirilir', geri: { tur: 'bagimli', text: 'ON ve MS ayrı katmanlardır: kesin ON klinik A + bir paraklinik test gerektirir; bu olguda paraklinik test (MR/OKT/OKB biyobelirteç) henüz doğrulanmadı. Yaklaşım sınırlı ama savunulabilir; MS değerlendirmesini ertelememeli.', kaynak: 'R03 Panel 1 (C22)' } },
          { id: 'disla', ad: 'MS dışlandı', geri: { tur: 'yanlis', text: 'Normal rutin BOS veya girilmemiş değerler MS’i dışlamaz; rapor MS ile uyumlu plaklar bildirmektedir.', kaynak: 'R06 (C35)' } },
        ] },
      { t: 'kaydet', id: 'tani' },
    ],
  },

  hesap: {
    okbSema: ({ sel }) => {
      const t = Number((sel.tip || [])[0]);
      return t ? [{ t: 'canvas', draw: 'okb', tip: t, etiket: 'Öğretici örnek' }] : [];
    },
    // Öğrencinin panosu + doğrulanmış veriyle iki ayrı sonuç
    mcd: ({ tri, cfg }) => {
      const g = (id) => tri[`${id}`];
      const stu = {
        bolgeler: { optik: g('bol.optik'), periv: g('bol.periv'), kortikal: g('bol.kortikal'), infra: g('bol.infra'), omurilik: g('bol.omurilik') },
        csf: { var: 'pozitif', yok: 'negatif', bilinmiyor: 'bilinmiyor' }[g('jet.csf')],
        dit: g('jet.dit'), cvs: g('jet.cvs'), prl: g('jet.prl'),
        aciklama: { var: 'var', yok: 'yok', bilinmiyor: 'bilinmiyor' }[g('jet.aciklama')] === 'var' ? 'var' : g('jet.aciklama') === 'yok' ? 'yok' : 'bilinmiyor',
      };
      const eks = (r) => (r.eksik.length ? ` Eksik: ${r.eksik.join('; ')}.` : '');
      const rS = mcdonald(stu), rV = mcdonald(dogrulanmisGirdi(cfg));
      const kind = (r) => (r.sonuc === 'ms' ? 'egitmen' : r.sonuc === 'konamaz' ? 'ipucu' : 'uyari');
      return [
        { t: 'card', kind: kind(rS), title: 'Panonuzun sonucu', text: `${rS.baslik}. ${rS.gerekce.join(' ')}${eks(rS)}`, kaynak: 'Ölçüt mantığı: R01 Panel 3–4 (C06–C09)', rozet: 'UZL' },
        { t: 'card', kind: kind(rV), title: 'Doğrulanmış olgu verisiyle sonuç', text: `${rV.baslik}. ${rV.gerekce.join(' ')}${eks(rV)}`, kaynak: 'Eğitim olgusu verisi (scene03-config.js)', rozet: cfg.kurgu ? 'KURGU' : '?' },
      ];
    },
  },

  ozet: ({ sel, bucket, tri, cfg }) => {
    const rV = mcdonald(dogrulanmisGirdi(cfg));
    const secimler = { ms: 'MS tanısı konuldu', kosullu: 'Koşullu değerlendirme; eksik veriler tamamlanana kadar tanı kesinleştirilmez', on: 'Yalnızca kesin optik nörit; MS ayrıca değerlendirilecek', disla: 'MS dışlandı' };
    const eks = rV.eksik.length ? rV.eksik.join('; ') : 'Yok';
    const yanlisBucket = Object.keys(bucket).length;
    return {
      baslik: 'Tanısal sentez özeti',
      bolumler: [
        { baslik: 'Doğrulanmış olgu verisi', kart: 'rapor', satirlar: ['Klinik: sağ optik nörit (göz hareketiyle artan ağrı, 20/200, renk bozukluğu, sağ RAPD, fundus doğal); bilateral dismetri, alt ekstremitede canlı DTR.', 'MRG: periventriküler, jukstakortikal, infratentoriyal ve C3 omurilik lezyonları; orbita MRG’de sağ optik sinir tutulumu; 1 kontrast tutan lezyon (DIT); CVS “select 6” pozitif.', 'BOS: rutin normal; OKB Tip 2. AQP4-IgG ve MOG-IgG negatif (CBA, steroid öncesi).', 'Değerler eğitim amaçlı kurgudur.'] },
        { baslik: 'Doğrulanmış verilerle ölçüt sonucu', kart: rV.sonuc === 'ms' ? 'egitmen' : 'uyari', satirlar: [rV.baslik + '.'] },
        { baslik: 'Eksik / girilmemiş bilgiler', kart: 'ipucu', satirlar: [eks + '.'] },
        { baslik: 'Öğrencinin tanı durumu', kart: 'yanit', satirlar: [secimler[(sel.tani || [])[0]] || 'Henüz seçilmedi.'] },
        { baslik: 'Sınıflama', kart: 'rapor', satirlar: [yanlisBucket ? 'Destekleyen / sınırlayan / eksik sınıflaması yapıldı.' : 'Sınıflama yapılmadı.'] },
      ],
    };
  },
};
