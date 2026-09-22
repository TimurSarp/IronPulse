# IronPulse • Kişisel Fitness, Vücut Geliştirme, Alışkanlık & İş Takip Sistemi (PWA)

Sıfır derleme/kurulum (`no npm, no node build steps`) gereksinimiyle doğrudan **GitHub Pages** üzerinde ve yerel tarayıcılarda çalışacak şekilde geliştirilmiş, **Mobil Öncelikli (Mobile-First PWA)** kişisel antrenman, gelişim, alışkanlık ve özel iş/görev takip sistemi.

---

## 🌟 Temel Özellikler

### 1. Antrenman Modülü (Workout Tracker)
- **Şablon Yönetimi:** PPL (Push / Pull / Legs), Upper / Lower, Full Body hazır şablonları ve sınırsız özel şablon oluşturma.
- **Canlı Antrenman Başlatma Modu:**
  - **Screen Wake Lock API:** Antrenman esnasında ekran kilidinin kapanmasını önleme.
  - **Progressive Overload (Ghost Values):** Önceki antrenmanda o egzersizde yapılan ağırlık ve tekrarları gri kılavuz ipucu olarak gösterir.
  - **Set Türleri:** Isınma (`W`), Çalışma Seti (`R`), Drop Set (`D`), Failure (`F`) tek dokunuşla geçiş.
  - **1RM (Tek Tekrar Maksimumu) Hesaplayıcı:** Epley ve Brzycki formülleriyle anında yüzde dağılımı (%95 - %70).
  - **Dahili Dinlenme Sayacı (Rest Timer):** 30s, 45s, 60s, 90s, 120s hazır butonları, ekranın köşesinde kayan sayaç kapsülü, son 3 saniye geri sayım sesi ve süre bittiğinde zil sesi + titreşim.

### 2. İş & Günlük Hedefler Modülü (Özel İstek / %100 Gizli)
- **Gizlilik Garantisi:** Bu sekmedeki tüm verileriniz yalnızca tarayıcınızın yerel belleğinde (`localStorage`) tutulur, hiçbir uzak sunucuya iletilmez.
- **İki Farklı Takip Türü:**
  1. **Tik İşareti (Checklist):** Tek dokunuşla "Yapıldı / Yapılmadı" işaretleme (örn: Önemli e-postaları kontrol et, toplantı yapıldı).
  2. **Sayısal Hedef (Numeric Stepper):** Hedef ve birim belirleyerek ilerleme (örn: 15 arama, 50 sayfa kitap, 3 teklif). `+` ve `-` butonları veya elle sayı girerek takip, anlık yüzde ve renkli ilerleme çubuğu.
- **Günlük Sıfırlama:** Tekrarlayan hedefler her yeni gün başladığında otomatik sıfırlanır veya elle tek tıkla sıfırlanabilir.

### 3. Gelişim, Analiz ve İstatistikler (Chart.js)
- **Egzersiz Güç Artış Eğrisi:** Seçilen hareket bazında (Bench Press, Squat vb.) ağırlık ve tahmini 1RM geçmişi grafiği.
- **Tonaj (Volume Load) Grafiği:** Seans başına kaldırılan toplam hacim çubuk grafiği.
- **Kas Grubu Frekansı:** Göğüs, Sırt, Omuz, Bacak, Kol ve Karın set dağılımını gösteren halka (doughnut) grafik.

### 4. Vücut Ölçüleri ve Kilo Takibi
- **Kilo & 7 Günlük Hareketli Ortalama:** Su tutumu dalgalanmalarını filtreleyen çift çizgili trend grafiği.
- **Vücut Ölçüleri:** Kol (Biceps), Göğüs, Bel, Kalça, Bacak ve Kalf ölçümleri, önceki ölçüme göre fark (delta `+ / - cm`) göstergeleri.

### 5. Beslenme, Su & Alışkanlıklar
- **Kalori & Makro Hedefleri:** Protein, Karbonhidrat ve Yağ çubukları, tek dokunuşla hızlı ekleme butonları (`+25g Protein`).
- **Su Takip Sayacı:** `+250ml`, `+500ml` hızlı ekleme ve interaktif doluluk barı.
- **Aktivite Isı Haritası (Calendar Heatmap):** Ay içinde antrenman yapılan günleri yeşil renkle gösteren aktivite takvimi.

### 6. Veri Güvenliği, Yedekleme ve PWA
- **JSON Dışa Aktar (Yedekle):** Tek tıkla tüm verileri (antrenmanlar, şablonlar, hedefler, vücut ölçüleri, ayarlar) tarihli JSON dosyası olarak indirme.
- **JSON Geri Yükle:** Kaydedilen JSON dosyasını seçerek anında geri yükleme.
- **Çevrimdışı Çalışma:** `sw.js` (Service Worker) ve `manifest.json` sayesinde internet olmasa dahi spor salonunda kesintisiz çalışır.

---

## 🚀 GitHub Pages'e Yükleme Adımları

1. GitHub'da yeni bir repository açın (Örn: `SporTakip` veya `IronPulse`).
2. Bu klasördeki tüm dosyaları repository'e yükleyin:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of IronPulse PWA"
   git branch -M main
   git remote add origin https://github.com/TimurSarp/IronPulse.git
   git push -u origin main
   ```
3. GitHub reponuzda **Settings > Pages** sekmesine gidin.
4. **Branch** kısmından `main` dalını ve `/ (root)` klasörünü seçip **Save** butonuna tıklayın.
5. Birkaç dakika içinde `https://timursarp.github.io/IronPulse/` adresinde siteniz canlıya alınacaktır!

---

## 📱 Telefona Uygulama (PWA) Olarak Kurma

- **iOS (Safari):** Safari'de sitenizi açın, alt kısımdaki **Paylaş (Share)** butonuna basın ve **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
- **Android (Chrome):** Chrome'da sitenizi açın, sağ üstteki üç noktaya tıklayın ve **"Uygulamayı Yükle"** veya **"Ana Ekrana Ekle"** butonuna dokunun.
- Artık telefonunuzda tam ekran, tarayıcı çubukları olmadan bağımsız bir mobil uygulama gibi çalışacaktır!
