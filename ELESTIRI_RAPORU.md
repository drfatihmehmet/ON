# Üç uzman gözüyle eleştiri raporu — MS / Optik Nörit simülasyonu (Sahne 01–06)

Tarih: 24.11.2026 · Sürüm: yerel klasör (GitHub'daki a7bcac1'den yeni)
Yöntem: Üç bağımsız ajan üç rolle inceledi: akademik eğitim profesörü, nöroimmünolog, grafiker/UX. Ajanlar dosyaları yalnızca okudu. Eğitim profesörü ile grafiker uygulamayı localhost:8080'de açıp gezdi. Nöroimmünolog, klasördeki kılavuz PDF'leriyle karşılaştırdı. Önemli bulguların kodda karşılığı tek tek kontrol edildi (✔ = koddan doğrulandı).
Doğrulanmayanlar: gerçek Quest 3 oturumu, ekran okuyucuyla kullanım, gerçek öğrenciyle süre ölçümü.

---

## 1. Ortak sonuç

Uygulamanın en güçlü yanı epistemik dürüstlük. Eksik veri hiçbir zaman "normal" sayılmıyor, kanıt rozetleri var, kaynaklar arası çelişkiler açıkça öğretiliyor. Bu nokta üç uzman tarafından da ayrı ayrı vurgulandı.

Sorunlar üç kümede toplanıyor:

1. **Tanı-tedavi mantığı:** Sahne 04 "tanı konamaz" sonucunu doğru sayıyor, Sahne 05 yine de DMT seçtiriyor ve dimetil fumaratı tek "doğru" seçenek olarak ödüllendiriyor. `mcdonald()` fonksiyonunda bir ölçüt hatası var.
2. **Ölçme-değerlendirme eksik:** Yazılı öğrenme hedefi, puan, kayıt ya da debrifing çıktısı yok. İskele hiçbir sahnede kaldırılmıyor.
3. **Görsel okunabilirlik:** Sabit sahne çubuğu içeriğin üstüne biniyor. Canvas ve VR yazıları küçük, rozetlerin açıklaması yok, bazı kontrastlar WCAG eşiğinin altında.

---

## 2. Kritik ve yüksek öncelikli bulgular (birleşik)

| # | Öncelik | Alan | Sorun | Kanıt | Öneri |
|---|---|---|---|---|---|
| 1 | **Kritik** | Bilimsel | 2024 McDonald hatası: ≥2 bölgede PRL tek başına ek kanıt sayılıyor. CVS ile PRL aynı girdi (`cvs`) olarak işleniyor. Örnek: 2 bölge, BOS negatif, DIT yok, yalnız PRL → sonuç "MS" | ✔ `src/ds-engine.js:192`, `scene04-data.js:103`, `scene03-config.js:47` | `cvs` ve `prl` ayrı girdiler olsun. ≥2 bölgede yalnız CVS (select-6) kabul edilsin. PRL yalnız tek bölge kuralında geçsin. Bunu yakalayan bir test eklenmeli. |
| 2 | **Kritik** | Veri bütünlüğü | MRG görüntüleri, üst klasördeki `Flair*.png` / `Cervical MRI.png` dosyalarıyla MD5 olarak birebir aynı. Config yorumu hâlâ "bunlar başka olguya aittir, BAĞLANMAMIŞTIR" diyor | ✔ `scene03-config.js:7` ile `:18–21` birbiriyle çelişiyor | Görüntüleri bu olgu için siz verdiniz. Bu bilinçli seçimse yorumu ve README'deki "aktarılmadı" ifadesini düzeltin. Değilse görüntüleri kaldırın. |
| 3 | Yüksek | Eğitim + bilimsel | Sahne 04'te doğru yanıt "koşullu / kesin tanı yok", ama Sahne 05 DMT seçtiriyor. Sahne 04'te "MS dışlandı" seçilip kaydedilse bile Sahne 05 açılıyor | ✔ `main.js` kapısı yalnız `stores[4].saved()` koşuluna bakıyor; `scene04-data.js:165–167` | Sahne 05 öncesine bir köprü adımı ekleyin: eksik veri tamamlansın (örneğin 3 ay kontrol MRG'si ya da OKB sonucu) ya da açık bir tanı kararı kaydedilsin. Tanı durumu Sahne 05'e taşınsın. |
| 4 | Yüksek | Eğitim + bilimsel | Dimetil fumarat tek "doğru", yüksek etkinlikli ilaçlar yalnız "kabul". Sahnenin kendi verisi (servikal lezyon, multifokal bulgu, erkek cinsiyet) yüksek etkinlikli tedaviyi en az eşit derecede savunulabilir kılıyor | ✔ `scene05-data.js:105` (`dogru`), `:106–114` (`kabul`) | Kaynak olgunun seyrini ödüllendirmeyin. Tüm seçenekleri "savunulabilir / koşula bağlı" olarak derecelendirin; puanı gerekçenin aktivite etkenleriyle tutarlılığı belirlesin. |
| 5 | Yüksek | Bilimsel | Doğrulanmış veri yolu hiçbir zaman "MS" sonucuna ulaşamıyor; `aciklama` alanı sabit `'bilinmiyor'` | ✔ `scene04-data.js:14` | Eğitmen yapılandırmasına bir `tani.aciklama` alanı ekleyin, ya da `:164`'teki "yanlış" geri bildirim metnini düzeltin. |
| 6 | Yüksek | Bilimsel | Akut tedavide eksikler: oral eşdeğer (prednizon/MP 1250 mg), ONTT'deki düşük doz oral uyarısı, steroide dirençli ağır atakta PLEX'in adıyla anılması | `scene03-data.js:173–219` ("kurtarma tedavisi" muğlak) | Bunları Morrow 2018 (JAMA Neurol), ONTT 1992, MENACTRIMS 4.1 ve Brochet 2020 kaynaklarıyla bir eğitici kart ve seçenek olarak ekleyin. |
| 7 | Yüksek | Bilimsel + eğitim | Steroid öncesi AQP4/MOG serum örneği Sahne 03'te istenemiyor, ama Sahne 04 bunu soruyor. Atipik ON kırmızı bayrakları listelenmemiş | `scene03-data.js:131–135`; `scene04-data.js:120, 125, 147` | İlk dozdan önce "antikor serumu" adımı ve orbita MRG istemi ekleyin. Kırmızı bayrak kartı ekleyin: ağrısızlık, bilateral tutulum, belirgin disk ödemi ya da hemoraji, 2 haftadan uzun ilerleme, düzelmeme, steroid bağımlılığı (Petzold 2022). |
| 8 | Yüksek | Eğitim | Yazılı öğrenme hedefi yok; puan, deneme sayısı, kayıt ve eğitmen çıktısı yok | Kodda "hedef" ya da dışa aktarma bulunmuyor | Her sahneye 2–4 ölçülebilir hedef (Bloom fiilleriyle) ekleyin ve blokları bu hedeflere etiketleyin. Olay günlüğü tutun (ilk yanıt, deneme sayısı, süre, açılan ipuçları). Sahne sonunda JSON/PDF debrifing raporu üretin. |
| 9 | Yüksek | Eğitim | Sahne 03'teki yansıtma sorularında öneri çipleri tıklanınca model yanıt metne ekleniyor; serbest hatırlama ortadan kalkıyor | `scene03-data.js:262–267`; `case-state.js:233–239` | Önce serbest metin isteyin. Model yanıtı kayıttan sonra "uzman yanıtıyla karşılaştır" olarak gösterin. |
| 10 | Yüksek | Eğitim + UX | Gezinme çubuğu tüm kapıları her zaman aşıyor | ✔ `main.js` `app.goto(n, true)` | Öğrenci kipinde çubuk yalnız tamamlanan sahneleri açsın. Serbest atlama `?egitmen=1` ile açılsın. |
| 11 | Yüksek | Grafik | Sabit sahne çubuğu kaydırınca başlıkları ve düğmeleri örtüyor; 375 px'te alttan metni kesiyor | `style.css:218–225`; ekranda gözlendi | Masaüstünde `position:sticky` bir başlık satırına alın. Mobilde `body{padding-bottom:calc(3.2rem + env(safe-area-inset-bottom))}` ve tam genişlik `#000` zemin kullanın. |
| 12 | Yüksek | Grafik | Fundus etiketleri kesiliyor ("akula (temporal)"). Canvas metinleri 375 px'te yaklaşık 8–9 px'e iniyor | `visuals.js:150–152, 191` | Etiketleri `measureText` ile sınır içine yerleştirin. Canvas'ı DPR'ye duyarlı yapın, metinde en az 12 CSS px kullanın, açıklamaları HTML `figcaption`'a taşıyın. |
| 13 | Yüksek | Grafik + eğitim | Kanıt rozetlerinin (UZL/DER/PRE/KÜB/KURGU/"?") lejantı yok. KURGU olay kartı gerçek bulgu gibi mavi görünüyor | `scene06-data.js:58`; `.tag b` stili | "Kanıt düzeyleri" adlı açılır bir lejant ekleyin; rozetleri hap biçimine getirip `title` verin. Kurgu kartına kesikli kenarlık gibi ayrı bir stil verin. |

---

## 3. Orta öncelik

**Klinik içerik**
- Birkaç atımlık horizontal nistagmus `anormal: true` olarak işaretli (`scene02-data.js:121`) ve Sahne 05'te serebellar bulgu sayılıyor (`scene05:41`). Bu bulgu fizyolojik end-point nistagmus olabilir. Nistagmusu kalıcı ve bakışa bağlı olarak tanımlayın ya da "fizyolojik olabilir" diye öğretin. INO muayenesi ekleyin.
- Canlı DTR tek başına piramidal bulgu gibi sunuluyor. Plantar yanıt, klonus ve asimetri seçenekleri yok.
- Sahne 02'deki multifokal bulgular (dismetri, nistagmus, DTR) Sahne 04 sentezinde hiç kullanılmıyor. "İlk atak" diye sunulan bir hastada bu bir çelişki ve öğretilmesi gerekiyor.
- Öyküde "göz hareketiyle ağrı" sorulamıyor; oysa ON ölçütünün temel bileşeni bu. Uhthoff ve Lhermitte soruları da yok.
- "Ağır atak" sabit olarak "var" kodlanmış (`scene05:40`). MENACTRIMS'e göre atak şiddeti piramidal/serebellar tutulumu ifade eder; izole ON başlangıcı ise olumlu prognostik etkendir.
- Omurilik lezyonu sahneler arasında çelişkili: Sahne 05'te "var", Sahne 04'te "doğrulanmadı" görünüyor. İkisini tek bir veriye bağlayın.
- Tek BOS testi negatif girildiğinde diğer test bilinmese bile BOS tümüyle negatif sayılıyor (`scene04:13`). Böyle durumda sonuç "bilinmiyor" olmalı.
- Erkek hastaya özgü bilgi eksik. Kladribin kullanan erkek hastanın da son dozdan sonra 6 ay kontrasepsiyon uygulaması gerektiği yazılmamış (KÜB'e dayanır; klasördeki PDF'lerde doğrulanamadı). Anti-CD20 kartına HBV taraması eklenmeli.

**Eğitim tasarımı**
- Ayırıcı tanı listesi hazır veriliyor. Öğrenciden önce 3 ön tanı isteyin, Sahne 02 sonunda bu listeyi yeniden sıralatın (hipotez güncelleme).
- Sorularda ipucu var: birleştirme sorusu bulguları özetliyor, pupilla açıklaması yanıtı veriyor, nörolojik planda 7 başlığın hepsi bedelsiz seçilebiliyor.
- Öğrenci ve asistan seviyesi ayrılmıyor. Bir `seviye` parametresi ekleyin: asistan kipinde teori kartları kapalı olsun ve deneme sayısı sınırlansın.
- İletişim ve etik yüzeysel: LP onamı tek bir onay kutusu, kötü haber verme sahnesi yok. SPIKES temelli seçimli bir diyalog önerilir.

**Grafik ve UX**
- `--blue:#0070C0` siyah zeminde 4.08:1 kontrast veriyor; küçük metin için yetersiz. Metinde `#3d9be9` kullanın.
- `--line:#22345c` kenarlık kontrastı 1.71:1; WCAG 1.4.11 için en az 3:1 gerekir. `#3a5288` ya da daha açık bir renk önerilir.
- Sorulan sorunun numarası yeşil zemin üzerinde beyaz ve 3.45:1 kontrastta. Rakam siyah olmalı.
- 1–6 tuş dinleyicisi sahne kontrolü yapmıyor; diğer sahnelerde de Sahne 01 sorusunu seçebiliyor (✔ `ui.js:57`). `app.scene === 1` koşulu eklenmeli.
- Sahne çubuğunda sahne adları yok ve hedef boyutu 32 px. Düğmeleri 40–44 px yapın, sahne adını `title`/aria ile verin, tamamlanan sahneye ✓ koyun.
- 3–6. sahnelerde sol sütunda hep aynı avatar duruyor ve sağ panel çok uzun. Bağlam içeriğini sola taşıyın.
- Sahne 02'deki başvuru kartı hâlâ "Acil servis · İlk karşılaşma" diyor (`ui2.js:23`).
- MRG görüntüleyicide sekans adı, kesit numarası ve yön bilgisi görüntü üstünde yok. Kesit bilgisi `aria-live` değil; fare tekerleği ile kesit değiştirme ve ok tuşu ipucu da yok.
- VR'de soru metni yaklaşık 16 dmm, kaynak satırı yaklaşık 10 dmm. Gövde metni en az 32 px, kaynak satırı en az 24 px olmalı. Başvuru paneli y=0,5 m'de; göz hizasına (y≈1,0 m) alınmalı.

## 4. Düşük öncelik
- `prefers-reduced-motion` desteği yok.
- Pasif kırmızı düğmede metin kontrastı yaklaşık 3.2:1.
- Bazı kart türleri aynı rengi paylaşıyor: yanıt, plan ve açıklama aynı gri; uyarı ve rapor aynı mavi.
- Logo ve favicon yok; `logo tıp.png` kullanılmıyor.
- Sahne 04 özetindeki sınıflama satırı doğruluğa değil yalnız sayıya bakıyor.
- "Eş zamanlı" serum glukozu aslında 1. günün değeri.
- DIS kartında CVS/select-6 tanımı eksik.
- Ayırıcı tanıda sifiliz ve sarkoidoz gibi enfeksiyöz/infiltratif nedenler ayrıca adlandırılmamış.

---

## 5. Güçlü yönler (üç uzmanın ortak görüşü)
- Eksik veri normal sayılmıyor; tri-panoda "Bilinmiyor" seçeneği ve "olgu verisiyle uyumsuz" uyarısı var.
- McDonald panosu öğrencinin değerlendirmesiyle doğrulanmış veriyi ayrı kartlarda gösteriyor.
- 2024 BOS ölçütü doğru: BOS'a özgü OKB veya kFLC sayılıyor, IgG indeksi dışarıda. Optik sinir 5. bölge olarak doğru kodlanmış; OKT ve VEP eşikleri de doğru.
- IVMP 5×1 g, BOS değerleri ve DMF izlem eşikleri (lenfosit <500/µL'de kesme, 500–800 arası yakın izlem) kılavuzlarla uyumlu.
- Tuzak seçenekler yanlışa özgü geri bildirim veriyor (Tip 4 OKB, "MOG negatif = dışlandı").
- Zaman modeli gerçekçi: OKB sonucu 14 gün sonra geliyor, tedavi sonucu beklemeden başlıyor.
- Görsel taraf: güçlü odak göstergesi (11.2:1), kart türleri hem renk hem metin etiketiyle ayrılıyor, 375 px'te yatay taşma yok.

## 6. Önerilen yol haritası
1. **Bilimsel düzeltmeler (bir oturum):** CVS ile PRL'yi ayırın ve teste bağlayın; `aciklama` alanını düzeltin; config/README'deki MRG yorumunu düzeltin; nistagmus ve DTR tanımlarını düzeltin; oral eşdeğer, PLEX ve kırmızı bayrak kartları ile steroid öncesi antikor adımını ekleyin.
2. **Tanı → tedavi köprüsü:** Sahne 04 sonucunu Sahne 05'e bağlayın ve DMT derecelendirmesini gerekçe tutarlılığına göre yeniden kurun.
3. **Ölçme katmanı:** öğrenme hedefleri, olay günlüğü, debrifing çıktısı, öğrenci/asistan seviyesi ve eğitmen kipi.
4. **Görsel düzeltmeler:** sahne çubuğu, canvas metinleri, rozet lejantı, kontrast değerleri, VR punto boyutları.

> Not: Grafiker ajanı, inceleme sırasında tarayıcıdaki diğer sekmede (Sahne 02) yanlışlıkla bir düğmeye tıkladığını bildirdi. Sayfayı yenilemek bu durumu sıfırlar; dosyalarda bir değişiklik yok.
