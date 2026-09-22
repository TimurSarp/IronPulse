// 50 Adet Seçkin Türkçe Spor, Fitness ve Disiplin Motivasyon Sözü
const MOTIVATION_QUOTES = [
  { quote: "Zihin sınırları çizmedikçe, beden asla pes etmez.", author: "Arnold Schwarzenegger" },
  { quote: "Herkes vücut geliştirmeci olmak ister, ama kimse o ağır ağırlıkları kaldırmak istemez!", author: "Ronnie Coleman" },
  { quote: "Yorulduğunda değil, işin bittiğinde dur.", author: "David Goggins" },
  { quote: "Şampiyonlar salonlarda doğmaz. Şampiyonlar içlerindeki tutku, hayal ve vizyondan doğar.", author: "Muhammad Ali" },
  { quote: "Disiplin, ne istediğini unutmama sanatıdır.", author: "Marcus Aurelius" },
  { quote: "Acı geçicidir. Bir dakika, bir saat ya da bir gün sürebilir. Ama pes edersen sonsuza dek sürer.", author: "Eric Thomas" },
  { quote: "Zor zamanlar güçlü insanlar yaratır. Güçlü insanlar güzel zamanlar getirir.", author: "G. Michael Hopf" },
  { quote: "Kazanmak istiyorsan, acıyla dost olmayı öğreneceksin.", author: "Mike Tyson" },
  { quote: "Bugün yapmadığın tekrar, yarın yenilginin sebebi olur.", author: "Dorian Yates" },
  { quote: "Bahanelerin yaktığı kalori sıfırdır.", author: "Anonim" },
  { quote: "Son 3-4 tekrar kası büyüten şeydir. Sıradan olanı şampiyondan ayıran bu acı sınırıdır.", author: "Arnold Schwarzenegger" },
  { quote: "Kendini feda etmeden bir şeye ulaşamazsın.", author: "Kobe Bryant" },
  { quote: "Sadece salona adım atmak bile insanların %90'ından önde olmanı sağlar.", author: "Tom Platz" },
  { quote: "Kendine hakim olamayan hiç kimse özgür değildir.", author: "Epiktetos" },
  { quote: "Başarı, her gün tekrarlanan küçük disiplinlerin toplamıdır.", author: "Robert Collier" },
  { quote: "Aynadaki rakibini yen, dünyadaki herkesi yenersin.", author: "Anonim" },
  { quote: "İrade, yetenekten daha güçlü bir kastır.", author: "David Goggins" },
  { quote: "Bir gün değil, birinci gün de ve başla!", author: "Anonim" },
  { quote: "Vücudun senin tek gerçek mabedindir, ona iyi bak.", author: "Jim Rohn" },
  { quote: "Antrenmanın en zor kısmı ayakkabılarını giymektir.", author: "Anonim" },
  { quote: "Terle yıkanmayan beden, zaferle taçlanamaz.", author: "Anonim" },
  { quote: "Konfor alanı güzel bir yerdir ama orada hiçbir şey büyümez.", author: "Anonim" },
  { quote: "Bugün hissettiğin acı, yarın hissedeceğin güçtür.", author: "Jay Cutler" },
  { quote: "Kendine inanmıyorsan, salondaki en ağır dambıl bile sana güler.", author: "Kai Greene" },
  { quote: "Sınırlar sadece zihninde vardır. Barı kaldır ve sınırları kır.", author: "Anonim" },
  { quote: "Işık saçmak için önce yanmak gerekir.", author: "Mevlana" },
  { quote: "Düşmek suç değil, kalkmamak tercihtir.", author: "Vince Lombardi" },
  { quote: "Büyük işler bir anda değil, küçük adımların birleşmesiyle başarılır.", author: "Vincent Van Gogh" },
  { quote: "Gözlerini hedeften ayırma; rüzgar ne kadar sert eserse essin köklerin sağlam olsun.", author: "Seneca" },
  { quote: "Yarın daha hafif olmayacak, sadece sen daha güçlü olacaksın.", author: "Greg Glassman" },
  { quote: "Kaslar konfor içinde inşa edilmez, zorlanarak büyür.", author: "Lou Ferrigno" },
  { quote: "Sabahın köründe kalkıp çalışanlar, gün batımında zafer kazananlardır.", author: "Anonim" },
  { quote: "Sen yapamazsın diyenlere en güzel cevabın sessizce başarmak olsun.", author: "Anonim" },
  { quote: "Bir aslan koyunların fikrini umursamaz.", author: "Anonim" },
  { quote: "Bedenin zihninin kölesidir; zihnine hükmet, bedenin takip etsin.", author: "Anonim" },
  { quote: "Kolay olsaydı herkes yapardı.", author: "Ronnie Coleman" },
  { quote: "Yenilgi bir durum değil, bir zihniyettir. Pes etmediğin sürece yenilmiş sayılmazsın.", author: "Bruce Lee" },
  { quote: "Disiplin seni hedefine götürür, motivasyon sadece başlatır.", author: "Jocko Willink" },
  { quote: "Dünün rekoru, bugünün ısınmasıdır.", author: "Anonim" },
  { quote: "Her set yeni bir meydan okumadır, hakkını ver.", author: "Franco Columbu" },
  { quote: "Savaşçı yara almaktan korkmaz, durmaktan korkar.", author: "Anonim" },
  { quote: "Kendine acımayı bırak. Aynaya bak ve sorumluluğu al.", author: "David Goggins" },
  { quote: "Ağırlıklar yalan söylemez. 100 kg her zaman 100 kg'dır.", author: "Henry Rollins" },
  { quote: "Zorluklar, karakterin çeliğe dönüştüğü ocaklardır.", author: "Marcus Aurelius" },
  { quote: "Hayallerinin bedelini bugün ödemezsen, yarın pişmanlıkla ödersin.", author: "Anonim" },
  { quote: "Harekete geçmek için mükemmel hissetmeyi bekleme.", author: "Mel Robbins" },
  { quote: "Gelişim rahatsız edicidir, ama durgunluk ölümcüldür.", author: "Anonim" },
  { quote: "Sen kendi hikayenin kahramanısın; mazeret üretme, tarih yaz.", author: "Anonim" },
  { quote: "Son tekrarı tamamlayanlar, hayatın zorluklarını da tamamlar.", author: "Anonim" },
  { quote: "Şimdi başla, yarın başladığın için kendine teşekkür edeceksin.", author: "Anonim" }
];

const QuotesManager = {
  quotes: MOTIVATION_QUOTES,
  
  getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[randomIndex];
  }
};

window.quotes = QuotesManager;
