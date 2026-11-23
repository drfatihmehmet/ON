# Klinik Simülasyon — Sahne 01: Acil serviste ilk karşılaşma

Öykü alma aşamasında biten, masaüstü + WebXR (Meta Quest 3) çalışan prototip. Derleme gerekmez (vanilla ES modülleri + yerel Three.js r187).

## Çalıştır
```
cd "D:\COWORK\MS Eğitim Olgusu ON\Sahne01_Acil_Servis"
node serve.mjs 8080        # veya: npm start
```
Tarayıcı: http://localhost:8080 · Testler: `npm test` (durum mantığı) · Gözlüksüz VR önizleme: http://localhost:8080/?vronizleme=1 · Video yok senaryosu: http://localhost:8080/?video=yok

## Dosyalar
| Dosya | Görev |
|---|---|
| `src/scene-data.js` | Sorular, yanıtlar, notlar, açılma koşulları, eğitici not, sonuç metni (arayüzden ayrı) |
| `src/state.js` | Masaüstü ve VR'nin ortak tek durumu |
| `src/ui.js`, `style.css`, `index.html` | Masaüstü / dar ekran arayüzü |
| `src/vr.js` | WebXR sahnesi: video yüzeyi + canvas panelleri + kontrolcü ışını |
| `assets/hasta-giris.mp4` | Hasta videosu (kaynak: `gemini_generated_video_0afd9551.mp4`) |
| `assets/hasta-bekleme.mp4` | Karşılaşma bitince soru sorulurken döngüyle oynayan bekleme klibi (kaynak: `bekleme.mp4`) |
| `assets/hasta-ilk-kare.jpg`, `hasta-son-kare.jpg` | Başlangıç karesi / video yokken yedek önden kare |

## Sonraki sahneler için
`scene-data.js` aynı şemayla çoğaltılır; yeni bölümler (`muayene`, `tanimlar`, `tedavi`) veri nesnesine eklenir, `state.js` koşulları `kosullar` alanından okur.

## Meta Quest 3'te aç
WebXR güvenli bağlam ister (HTTPS ya da localhost); düz `http://<bilgisayar-ip>` çalışmaz.
1. Quest'te Geliştirici Modu açık olsun, USB ile bilgisayara bağlayın; bilgisayarda `node serve.mjs 8080`.
2. `adb reverse tcp:8080 tcp:8080`
3. Quest Tarayıcı'da `http://localhost:8080` açın → "VR'ye gir". Karşılaşma sayfa açılınca kendiliğinden başlar.
Alternatif: klasörü HTTPS bir adrese yayınlayın (ör. `npx cloudflared tunnel --url http://localhost:8080`) ve o adresi Quest'te açın.
Kontrolcü ışını + tetik ile soru seçilir; VR'den çıkınca aynı noktadan masaüstünde devam edilir.
