# Klinik Simülasyon — Sahne 01: Acil serviste ilk karşılaşma

Öykü alma aşamasında biten, masaüstü + WebXR (Meta Quest 3) çalışan prototip. Derleme gerekmez (vanilla ES modülleri + yerel Three.js r187).

## Çalıştır
```
cd "D:\COWORK\MS Eğitim Olgusu ON\Sahne01_Acil_Servis"
node serve.mjs 8080        # veya: npm start
```
Tarayıcı: http://localhost:8080 · Testler: `npm test` (durum mantığı; Sahne 02 için `node tests/exam.test.mjs`) · Gözlüksüz VR önizleme: http://localhost:8080/?vronizleme=1 · Video yok senaryosu: http://localhost:8080/?video=yok

## Dosyalar
| Dosya | Görev |
|---|---|
| `src/scene-data.js` | Sorular, yanıtlar, notlar, açılma koşulları, eğitici not, sonuç metni (arayüzden ayrı) |
| `src/state.js` | Masaüstü ve VR'nin ortak tek durumu |
| `src/ui.js`, `style.css`, `index.html` | Masaüstü / dar ekran arayüzü |
| `src/scene02-data.js` | Sahne 02 (göz ve nörolojik muayene) verisi: bulgu/eğitici metinleri, pupilla parametreleri, sorular |
| `src/exam-state.js` | Yönlendirme (Sahne 01 ⇄ 02) ve Sahne 02 muayene durumu; pupilla modeli (tek durumdan iki pupilla) |
| `src/visuals.js` | Sahne 02 görselleri (iki göz, Snellen, renk hedefi, fundus); masaüstü tuvali ve VR paneli aynı kodu kullanır |
| `src/ui2.js` | Sahne 02 masaüstü arayüzü |
| `src/vr.js` | WebXR sahnesi: video yüzeyi + canvas panelleri + kontrolcü ışını |
| `assets/hasta-giris.mp4` | Hasta videosu (kaynak: `gemini_generated_video_0afd9551.mp4`) |
| `assets/hasta-bekleme.mp4` | Karşılaşma bitince soru sorulurken döngüyle oynayan bekleme klibi (kaynak: `bekleme.mp4`) |
| `assets/hasta-ilk-kare.jpg`, `hasta-son-kare.jpg` | Başlangıç karesi / video yokken yedek önden kare |

## Sahne 03 — Tetkik, akut tedavi ve izlem
| Dosya | Görev |
|---|---|
| `src/scene03-config.js` | **Eğitmenin doldurduğu TEK alan**: MRG dosyaları, doğrulanmış rapor ekleri, lezyon işaretleri, kontrol görme keskinliği, 14. gün OKB paterni ve IgG indeksi. `null` = eksik (hiçbir zaman normal/negatif sayılmaz) |
| `src/scene03-data.js` | Tüm metinler, laboratuvar değerleri (sayı ve birim ayrı alanlar), tedavi istemi |
| `src/case-state.js` | Simülasyon günü, örnek alımı, doz kayıtları, raporlar (oran kodda hesaplanır) |
| `src/s3-model.js` | Masaüstü ve VR'nin ortak çizdiği bildirimsel model + eylem yönlendirme |
| `src/ui3.js`, `src/vr-s3.js`, `src/mrg-viewer.js` | Masaüstü, VR (sayfalı) ve MRG görüntüleyici (kesit dizisi / MP4) |

Dev: `?sahne=3` (öncekileri atlar). MRG görüntüleyici denemesi: `?sahne=3&mrgtest=1` — **test deseni** yükler, hastaya ait değildir ve arayüzde etiketlenir.
MRG bağlamak için `scene03-config.js` içindeki `mrg.beyin` / `mrg.servikal` alanlarını doldurun (örn. `{ tur: 'video', dosya: 'assets/mrg/beyin.mp4' }` veya `{ tur: 'kesit', dosyalar: [...] }`).

## Arayüz kuralları
- Tüm paneller ve kartlar siyah zeminlidir (beyaz/açık zemin yok); renk yalnızca kenar çubuğu ve etiketlerde.
- Sahne 01'de "Öykü notları" ve "Eğitici not" tek **Notlar** panelinde, yana kayan sayfalar olarak birleşiktir (sekme, ok, kaydırma/klavye ←→; VR'de sekme + ‹ › düğmeleri ve kayma animasyonu).
- Sahne 02: Sahne 01 tamamlanınca "Göz ve nörolojik muayeneye geç" düğmesi açılır; geri dönüşte öykü korunur. Geliştirme için `?sahne=2`.

## Sonraki sahneler için
`scene-data.js` aynı şemayla çoğaltılır; yeni bölümler (`muayene`, `tanimlar`, `tedavi`) veri nesnesine eklenir, `state.js` koşulları `kosullar` alanından okur.

## Meta Quest 3'te aç
WebXR güvenli bağlam ister (HTTPS ya da localhost); düz `http://<bilgisayar-ip>` çalışmaz.
1. Quest'te Geliştirici Modu açık olsun, USB ile bilgisayara bağlayın; bilgisayarda `node serve.mjs 8080`.
2. `adb reverse tcp:8080 tcp:8080`
3. Quest Tarayıcı'da `http://localhost:8080` açın → "VR'ye gir". Karşılaşma sayfa açılınca kendiliğinden başlar.
Alternatif: klasörü HTTPS bir adrese yayınlayın (ör. `npx cloudflared tunnel --url http://localhost:8080`) ve o adresi Quest'te açın.
Kontrolcü ışını + tetik ile soru seçilir; VR'den çıkınca aynı noktadan masaüstünde devam edilir.
