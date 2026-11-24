// Sahne 05 — Hastalık düzenleyici tedavi (DMT) seçimi. Kaynaklar: R09 (MENACTRIMS 2023), R10 (MSTCG). İlaç kartları R09 §4.4 ve §4.7 metninden doğrulanmıştır.
// Kartlar sıralama içermez; farklı çalışmaların etki büyüklükleri birbiriyle karşılaştırma değildir.
const S = (x) => x; // okunabilirlik için

const KART = (baslik, satirlar, kaynak, rozet = 'UZL') => ({ t: 'card', kind: 'egitici', title: baslik, text: satirlar.join(' '), kaynak, rozet });

const ilac = (id, ad, bloklar) => ({ t: 'toggle', id: 'ilac-' + id, label: ad, bloklar });

export const SAHNE_05 = {
  veri: {
    id: 'sahne-05', sira: 5,
    baslik: 'Sahne 05 — DMT seçimi',
    gorev: 'Hastalık aktivitesini ve prognostik özellikleri tartın, ortak karar başlıklarını belirleyin, seçenekleri inceleyin ve gerekçenizle bir DMT önerin. Bilinmeyen değişkenler “bilinmiyor” kalır.',
    panelBaslik: 'DMT seçimi',
    geriDugme: '← Sahne 04’e dön',
    kartTurleri: {
      yanit: { baslik: 'Yanıtınız' }, bulgu: { baslik: 'Bulgu' }, egitici: { baslik: 'Eğitici not' }, egitmen: { baslik: 'Eğitmen geri bildirimi' },
      ipucu: { baslik: 'İpucu' }, uyari: { baslik: 'Bilgi' }, rapor: { baslik: 'Rapor' }, aciklama: { baslik: 'Açıklama' },
    },
    oncekiMuayene: { baslik: 'Önceki sahneler', bos: '' },
    olguBaglami: '25 yaşında erkek hasta; ilk atak: sağ optik nörit (20/200); MRG raporunda beyin ve servikal omurilikte MS ile uyumlu plaklar. Tanı durumu Sahne 04’te kaydedildi.',
  },
  sonrakiDugme: 'DMF başlangıcı ve izlem sahnesine geç',
  bosMetin: 'Eylemleri istediğiniz sırada yapabilirsiniz. Ortak karar penceresinde kullandığınız gerekçeler özetinize yazılır.',
  oncekiMetin: ({ prev }) => prev.note || '',

  eylemler: [
    { id: 'aktivite', ad: 'Hastalık aktivitesini ve prognostik özellikleri değerlendir' },
    { id: 'ortak', ad: 'Ortak karar başlıklarını belirle' },
    { id: 'ilaclar', ad: 'DMT seçeneklerini incele' },
    { id: 'secim', ad: 'DMT seçimini yap ve gerekçelendir' },
    { id: 'kayit', ad: 'Karar notunu kaydet' },
  ],

  ekranlar: {
    aktivite: [
      { t: 'p', text: 'Yüksek hastalık aktivitesi için uzlaşı tanımı yoktur. Her etkeni işaretleyin: yalnız doğrulanmış bilgiyi Var/Yok olarak, bilmediğinizi “Bilinmiyor” bırakın.', tone: 'muted' },
      { t: 'tri', id: 'akt', satirlar: [
        { id: 'atak2', ad: 'Önceki yılda ≥2 atak', bilinen: () => 'yok' },
        { id: 'siddet', ad: 'Ağır atak (piramidal, serebellar veya sfinkter tutulumlu; izole ON başlangıcı olumlu prognostik etkendir)', bilinen: (c) => c.aktivite?.agirAtak ?? null },
        { id: 'noro', ad: 'Piramidal veya serebellar bulgu (nörolojik muayene: bilateral dismetri)', bilinen: (c, p) => (/dismetri/i.test((p && p.note) || '') ? 'var' : null) },
        { id: 'duzelme', ad: 'Atak sonrası eksik düzelme (kontrol görme keskinliği)', bilinen: (c) => c.aktivite?.eksikDuzelme ?? null },
        { id: 't2', ad: 'Yüksek T2 lezyon yükü', bilinen: (c) => c.aktivite?.yuksekT2 ?? null },
        { id: 'omurilik', ad: 'Omurilik lezyonu (servikal omurilikte MS ile uyumlu plak)', bilinen: (c) => c.tani.bolgeler.omurilik ?? null },
        { id: 'infra', ad: 'İnfratentoriyal lezyon', bilinen: (c) => c.tani.bolgeler.infra ?? null },
        { id: 'gd', ad: 'Çok sayıda Gd+ lezyon', bilinen: (c) => c.aktivite?.cokGd ?? null },
      ] },
      { t: 'card', kind: 'egitici', title: 'Dikkate alınacak etkenler', text: 'Önceki yılda ≥2 atak, atak şiddeti (piramidal/serebellar), eksik düzelme, yüksek T2 yükü, omurilik lezyonları, infratentoriyal lezyonlar ve çok sayıda Gd+ lezyon. Omurilik lezyonları DIS bölgesi olmanın ötesinde kötü prognozla ilişkilidir.', kaynak: 'R09 s.8 (C52); R02 s.2 (C15)', rozet: 'UZL' },
      { t: 'card', kind: 'uyari', title: 'Gerilim: omurilik lezyonu', text: 'Servikal omurilik lezyonu yüksek aktivite lehine değerlendirilebilecek bir faktördür; ancak tek başına “yüksek aktif hastalık” anlamına gelmez. Bu olguda infratentoriyal lezyon da vardır; T2 yükü orta ve yalnız bir Gd+ lezyon vardır. Etkenleri birlikte tartın: orta ve yüksek etkinlikli seçenekler ortak kararla savunulabilir.', kaynak: 'R09 s.8 (C52)', rozet: 'UZL' },
      { t: 'card', kind: 'egitici', title: 'Erken yüksek etkinlikli tedavi', text: 'Başlangıçta yüksek etkinlikli DMT kullanımı, orta etkinlikli DMT’ye kıyasla uzun dönemde daha iyi sonuçlarla ilişkili bulunmuştur; bunlar retrospektif kayıt verileridir ve hasta özelliklerine göre tartışılır.', kaynak: 'R09 §4.4.2.1 (MSBase; Brown 2019, He 2020)', rozet: 'DER' },
    ],

    ortak: [
      { t: 'choice', id: 'ortakbas', multi: true, soru: 'Ortak karar görüşmesinde hangi başlıkları ele alırsınız? (Savunulabilir başlıkların tümünü seçin.)',
        secenekler: [
          { id: 'yasam', ad: 'Hastanın yaşam ve aile planı' }, { id: 'komor', ad: 'Komorbiditeler ve ilaç kullanımı' },
          { id: 'izlem', ad: 'İzlem olanakları (kan testi, MR, infüzyon merkezi)' }, { id: 'tercih', ad: 'Hasta tercihi (oral / enjeksiyon / infüzyon)' },
          { id: 'jcv', ad: 'JCV serostatüsü (natalizumab kartı için)' }, { id: 'erisim', ad: 'Erişim ve geri ödeme' }, { id: 'sadece', ad: 'Yalnızca MR lezyon sayısı' },
        ],
        dogru: ['yasam', 'komor', 'izlem', 'tercih', 'jcv', 'erisim'],
        geriDogru: 'Doğru: yüksek etkinlikli DMT seçiminde ortak karar; hasta özellikleri (aile/yaşam planı dahil), komorbiditeler, risk profili ve izlem gereksinimi, geri ödeme ve erişim birlikte ele alınır. Yalnız MR lezyon sayısı karar vermek için yeterli değildir.',
        geriYanlis: 'Ortak karar tek bir ölçüte indirgenemez: hasta özellikleri, komorbiditeler, risk/izlem gereksinimi ve erişim birlikte ele alınır; JCV serostatüsü yalnız natalizumab için ilgilidir.', kaynak: 'R10 s.4 (C62); R09 §4.4.2', rozet: 'UZL' },
      { t: 'card', kind: 'uyari', title: 'Bu olgudaki karar verileri', text: ({ cfg }) => (cfg.dmt.jcv == null && cfg.dmt.tercih == null ? 'Aile/yaşam planı, JCV serostatüsü, hasta tercihi ve komorbiditeler girilmedi; “bilinmiyor” kalır, varsayım yapılmaz.' : `JCV: ${cfg.dmt.jcv ?? 'girilmedi'}. Aile planı: ${cfg.dmt.aileplani ?? 'girilmedi'}. Tercih: ${cfg.dmt.tercih ?? 'girilmedi'}. Komorbidite: girilmedi.`), rozet: '?' },
      { t: 'card', kind: 'egitici', title: 'Kaynak notu: gebelik planı', text: 'Gebelik planlayan kadın hastalar için DMT seçimi ayrıca değerlendirilir: IFN-β ve GA gebelikte görece güvenli kabul edilir; DMF kısa yarı ömrü nedeniyle konsepsiyona kadar sürdürülebilir; fingolimod ve mitoksantron gebelikte kontrendikedir. Bu olgu erkektir; kayıt verileri burada yalnızca bilgi içindir.', kaynak: 'R09 §4.7 (C61)', rozet: 'UZL' },
    ],

    ilaclar: [
      { t: 'card', kind: 'uyari', title: 'Nasıl okunur?', text: 'Kartlar sıralama içermez. Farklı çalışmaların etki büyüklükleri doğrudan karşılaştırma değildir; seçim bu hastanın etkenleri ve ortak kararla yapılır. Orta etkinlikli: IFN-β, GA, teriflunomid, DMF. Yüksek etkinlikli: S1PR modülatörleri, kladribin, B hücre deplesyonu, natalizumab (JCV seronegatif).', kaynak: 'R09 §4.4.3 (C51)', rozet: 'UZL' },
      ilac('ifn', 'İnterferon-β ve glatiramer asetat (orta etkinlikli)', [
        KART('Etki ve kullanım', ['Sınıf I kanıt; relaps ve özürlülük ilerlemesinde yaklaşık %30 azalma.', 'IFN-β T ve B hücre etkinliğini, GA T regülatuvar hücreleri değiştirir. PEG-IFN-β-1a iki haftada bir; GA 40 mg haftada üç kez.'], 'R09 §4.4.1.1', 'UZL'),
        KART('Güvenlilik ve izlem', ['20 yılı aşan uzun dönem güvenlilik verisi büyük avantajdır; enjeksiyon yeri reaksiyonları ve grip benzeri yakınmalar uyumu azaltabilir. Kullanımı son yıllarda azalmıştır.'], 'R09 §4.4.1.1'),
        KART('Gebelik / emzirme', ['IFN-β ve GA konsepsiyona kadar ve gebelikte etiket doğrultusunda sürdürülebilir; emzirmede kullanım için onaylıdır.'], 'R09 §4.7'),
      ]),
      ilac('teri', 'Teriflunomid (orta etkinlikli)', [
        KART('Etki ve kullanım', ['DHODH inhibitörü; günde 14 mg, oral. TOWER ve TEMSO’da yıllık atak hızını %36,3 ve %31, özürlülük ilerleme riskini %31,5 ve %30 azaltmıştır (plasebo).'], 'R09 §4.4.1.2', 'UZL'),
        KART('Güvenlilik ve izlem', ['Genellikle iyi tolere edilir: saç incelmesi, karaciğer enzim yüksekliği, hafif lökopeni. Kolestiramin veya kömürle yaklaşık 11 günde vücuttan uzaklaştırılabilir.'], 'R09 §4.4.1.2'),
      ]),
      ilac('dmf', 'Dimetil fumarat (orta etkinlikli)', [
        KART('Etki ve kullanım', ['Günde iki kez 240 mg, oral. DEFINE/CONFIRM entegre analizinde yıllık atak hızında %49, özürlülük ilerlemesinde %32 azalma (plasebo). Nrf2 yolu aracılığıyla anti-inflamatuvar etkiler (kısmen).'], 'R09 §4.4.1.3 (C54)', 'UZL'),
        KART('Güvenlilik ve izlem', ['En sık yan etkiler flushing ve gastrointestinal yakınmalar. Aralık 2021’e kadar 12 doğrulanmış PML; çoğu uzamış orta–ağır lenfopenide. Grade III lenfopeni (<0,5×10⁹/L) 6 aydan uzun sürerse kesilmesi önerilir. Ayrıntı Sahne 06’da.'], 'R09 §4.4.1.3 (C55)', 'UZL'),
      ]),
      ilac('s1p', 'S1PR modülatörleri: fingolimod, siponimod, ponesimod (yüksek etkinlikli)', [
        KART('Etki ve kullanım', ['Lenfositlerin lenf nodlarından çıkışını engeller. Fingolimod yıllık atak hızını %55 azaltmıştır (plasebo). Ponesimod 20 mg/gün, teriflunomide göre atak hızını %30,5 ve MR aktivitesini %56 azaltmıştır. Siponimod CIS, RRMS ve aktif SPMS için onaylıdır.'], 'R09 §4.4.1.4–6', 'UZL'),
        KART('Güvenlilik ve izlem', ['Fingolimod: ilk doz kardiyak izlem, bradikardi, makula ödemi, deri kanseri, enfeksiyonlar; PML riski yaklaşık 1,86/10.000, JCV taraması önerilmez. Siponimod: CYP2C9*3/*3 genotipinde kontrendike, 10 günde titrasyon; karaciğer enzimleri, makula ödemi, hipertansiyon, VZV reaktivasyonu. Ponesimod fingolimoda göre daha az bradikardi ve uzun süreli lenfopeni.'], 'R09 §4.4.1.4–6', 'UZL'),
        KART('Gebelik / emzirme', ['Fingolimod gebelikte kontrendikedir (doğumsal anomali); emzirmeden kaçınılır.'], 'R09 §4.7'),
      ]),
      ilac('klad', 'Kladribin (yüksek etkinlikli)', [
        KART('Etki ve kullanım', ['Lenfositleri tercihen etkileyen nükleozid analoğu, oral. 3,5 mg/kg, 1., 2., 13. ve 14. aylarda beşer günlük dört kür; atak hızında %58, özürlülük ilerlemesinde %47 azalma (plasebo). 3. ve 4. yıllarda ek tedavi gerekmez.'], 'R09 §4.4.1.7', 'UZL'),
        KART('Güvenlilik ve izlem', ['Enfeksiyon oranları plaseboya benzer; herpes zoster hafif artmıştır. İkinci kürden sonra konsepsiyon için bekleme süreleri vardır (kadın hastalar için kaynakta anlatılır).'], 'R09 §4.4.1.7, §4.7'),
      ]),
      ilac('ntz', 'Natalizumab (yüksek etkinlikli; JCV seronegatif hastada)', [
        KART('Etki ve kullanım', ['α4β1 integrin inhibitörü, IV (subkutan formu 2021’de EMA onaylı). AFFIRM’de atak hızında %68, özürlülük ilerlemesinde %42 azalma (plasebo). Tedavi naif orta aktif hastalıkta JCV seronegatif ise önerilir.'], 'R09 §4.4.1.8, §4.4.3', 'UZL'),
        KART('Güvenlilik ve izlem', ['PML riski; JCV antikor pozitifliği, önceki immünosupresan kullanımı ve 2 yılı aşan tedavi süresi riski artırır. Seronegatif hastada risk çok düşük (0,1/1000); seronegatifte JCV 6 ayda bir test edilir. Uzatılmış doz aralığı (6–8 hafta) etkinliği bozmadan riski azaltabilir.'], 'R09 §4.4.1.8', 'UZL'),
        { t: 'p', text: 'Natalizumab kararı JCV serostatüsüne bağlıdır; bu bilgi girilmemişse “bilinmiyor” kalır ve karar onsuz verilemez. Olgunun JCV sonucu yukarıdaki “karar verileri” kartındadır.', tone: 'warn' },
      ]),
      ilac('cd20', 'Anti-CD20 (ocrelizumab, ofatumumab, ublituximab; rituximab off-label)', [
        KART('Etki ve kullanım', ['B hücre deplesyonu. Ocrelizumab IV: başlangıçta 2×300 mg (2 hafta arayla), sonra 6 ayda bir 600 mg; OPERA’da IFN-β-1a’ya göre atak hızı %46–47 daha düşük. Ofatumumab: aylık 20 mg SC; ASCLEPIOS’ta teriflunomide göre atak hızı daha düşük. Rituximab MS’te ruhsatsız (off-label) kullanılır; erişimin sınırlı olduğu özel durumlarda anılır.'], 'R09 §4.4.1.10–13', 'UZL'),
        KART('Güvenlilik ve izlem', ['Enfeksiyon, infüzyon reaksiyonları; COVID-19 riski ve aşı yanıtında azalma bildirilmiştir. Ocrelizumab’da memede hafif artış sinyali yaş-uyumlu kontrol aralığında kalmıştır.'], 'R09 §4.4.1.10'),
      ]),
    ],

    secim: [
      { t: 'choice', id: 'dmt', soru: 'Bu hasta için hangi DMT’yi önerirsiniz? (Birini seçin; her seçimin geri bildirimi ayrıdır.)',
        secenekler: [
          { id: 'dmf', ad: 'Dimetil fumarat', geri: { tur: 'kabul', text: 'Orta etkinlikli, oral seçenek; hastanın oral tercihiyle uyumludur ve tedavi naif orta aktif hastalıkta başlanabilir. Bu olguda omurilik ve infratentoriyal lezyon (yüksek aktivite lehine etkenler) ile tek Gd+ lezyon birlikte olduğundan, yüksek etkinlikli seçeneklerle dengeli tartışılması ve lenfosit izleminin planlanması gerekçede yer almalıdır. Tek bir “doğru” ilaç yoktur.', kaynak: 'R09 §4.4.3, s.8 (C51–C52)', rozet: 'UZL' } },
          { id: 'ifn', ad: 'İnterferon-β', geri: { tur: 'kabul', text: 'Orta etkinlikli enjeksiyon seçeneği; hasta oral tedaviyi tercih ediyor. Uzun dönem güvenlilik verisi geniştir. Omurilik lezyonu gibi yüksek aktivite lehine etkenler varsa daha etkin seçeneklerle birlikte tartışılmalıdır.', kaynak: 'R09 §4.4.1.1, §4.4.3', rozet: 'UZL' } },
          { id: 'ga', ad: 'Glatiramer asetat', geri: { tur: 'kabul', text: 'Orta etkinlikli enjeksiyon seçeneği; hasta oral tedaviyi tercih ediyor. Uzun dönem güvenlilik verisi geniştir. Aktivite etkenleri ve hasta tercihiyle birlikte gerekçelendirilir.', kaynak: 'R09 §4.4.1.1, §4.4.3', rozet: 'UZL' } },
          { id: 'teri', ad: 'Teriflunomid', geri: { tur: 'kabul', text: 'Orta etkinlikli seçenek; karaciğer enzimleri ve kan sayımı izlenir. Yüksek aktivite etkenleri varsa daha etkin seçeneklerle birlikte tartışılmalıdır.', kaynak: 'R09 §4.4.1.2, §4.4.3', rozet: 'UZL' } },
          { id: 's1p', ad: 'S1PR modülatörü', geri: { tur: 'kabul', text: 'Yüksek etkinlikli seçenek olarak kabul edilebilir alternatif; kardiyak ve oküler izlem, enfeksiyon ve karaciğer enzimi izlemi için kapasiteniz ve hasta tercihi gerekçede yer almalıdır.', kaynak: 'R09 §4.4.3', rozet: 'UZL' } },
          { id: 'klad', ad: 'Kladribin', geri: { tur: 'kabul', text: 'Yüksek etkinlikli seçenek olarak kabul edilebilir alternatif; lenfosit izlemi ve herpes zoster riski ve aile planı konuşulmalıdır.', kaynak: 'R09 §4.4.3, §4.4.1.7', rozet: 'UZL' } },
          { id: 'ntz', ad: 'Natalizumab', geri: ({ cfg }) => (cfg.dmt.jcv === 'negatif'
            ? { tur: 'kabul', text: 'JCV seronegatif olduğu için kabul edilebilir yüksek etkinlikli seçenek; JCV her 6 ayda bir yeniden test edilir.', kaynak: 'R09 §4.4.1.8', rozet: 'UZL' }
            : { tur: 'bagimli', text: 'JCV serostatüsü bu olguda bilinmiyor. Natalizumab tedavi naif orta aktif hastada JCV seronegatifse önerilir; PML riski serostatüye ve önceki immünosupresan kullanımına bağlıdır. Serostatü öğrenilmeden karar verilemez.', kaynak: 'R09 §4.4.3, §4.4.1.8', rozet: 'UZL' }) },
          { id: 'cd20', ad: 'Anti-CD20 (B hücre deplesyonu)', geri: { tur: 'kabul', text: 'Yüksek etkinlikli seçenek olarak kabul edilebilir alternatif; uzun dönem izlem, enfeksiyon ve aşı yanıtı ile infüzyon/enjeksiyon lojistiği gerekçede yer almalıdır.', kaynak: 'R09 §4.4.3, §4.4.1.10–11', rozet: 'UZL' } },
        ] },
      { t: 'p', text: 'Gerekçenizi seçin (özetinize yazılır):', tone: 'muted' },
      { t: 'check', id: 'g-omurilik', label: 'Omurilik lezyonu yüksek aktivite lehine bir etkendir' },
      { t: 'check', id: 'g-oral', label: 'Oral kullanım ve hasta tercihi' },
      { t: 'check', id: 'g-izlem', label: 'Mevcut izlem olanakları (kan testi, MR, infüzyon)' },
      { t: 'check', id: 'g-guvenlilik', label: 'Uzun dönem güvenlilik verisi ve risk profili' },
      { t: 'check', id: 'g-erisim', label: 'Erişim ve geri ödeme' },
      { t: 'check', id: 'g-eksik', label: 'Eksik veriler (T2 yükü, Gd+, JCV, tercih) tamamlanınca yeniden değerlendirilecek' },
    ],

    kayit: [{ t: 'kaydet', id: 'dmt', dugme: 'Karar notunu kaydet' }],
  },

  ozet: ({ sel, tri, chk, cfg, prev }) => {
    const ad = { dmf: 'Dimetil fumarat', ifn: 'İnterferon-β', ga: 'Glatiramer asetat', teri: 'Teriflunomid', s1p: 'S1PR modülatörü', klad: 'Kladribin', ntz: 'Natalizumab', cd20: 'Anti-CD20' };
    const gerekce = { 'g-omurilik': 'omurilik lezyonu yüksek aktivite lehine', 'g-oral': 'oral kullanım ve hasta tercihi', 'g-izlem': 'izlem olanakları', 'g-guvenlilik': 'uzun dönem güvenlilik ve risk profili', 'g-erisim': 'erişim ve geri ödeme', 'g-eksik': 'eksik veriler tamamlanınca yeniden değerlendirme' };
    const g = Object.keys(gerekce).filter((k) => chk[k]).map((k) => gerekce[k]);
    const bil = ['atak2', 'siddet', 'noro', 'duzelme', 't2', 'omurilik', 'infra', 'gd'].filter((k) => !tri[`akt.${k}`] || tri[`akt.${k}`] === 'bilinmiyor');
    return {
      baslik: 'DMT karar notu',
      bolumler: [
        { baslik: 'Seçilen DMT', kart: 'yanit', satirlar: [ad[(sel.dmt || [])[0]] || 'Henüz seçilmedi.'] },
        { baslik: 'Gerekçe', kart: 'rapor', satirlar: [g.length ? g.join('; ') + '.' : 'Gerekçe işaretlenmedi.'] },
        { baslik: 'Bilinmeyen / doğrulanmamış değişkenler', kart: 'ipucu', satirlar: [`Aktivite etkenlerinden ${bil.length} tanesi “bilinmiyor” veya işaretlenmedi.`, `JCV: ${cfg.dmt.jcv ?? 'girilmedi'}; aile/yaşam planı: ${cfg.dmt.aileplani ?? 'girilmedi'}; hasta tercihi: ${cfg.dmt.tercih ?? 'girilmedi'}.`] },
        { baslik: 'Not', kart: 'uyari', satirlar: ['Bu bir eğitim karar notudur; gerçek hasta reçetesi değildir.'] },
      ],
    };
  },
};
void S;
