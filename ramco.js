/* GARİBAN - MEGA AI ASİSTAN BEYNİ */

// GLOBAL DEĞİŞKENLER
var ramcoMood = 'happy';
var isTyping = false;
var isSpeaking = false;
var soundEnabled = true;
var voiceEnabled = false;
var recognition = null;
var synth = window.speechSynthesis;

// SEVİYE SİSTEMİ
var seviyeler = [
  { isim: 'Çırak', icon: '🌱', minXP: 0 },
  { isim: 'Satıcı', icon: '🛒', minXP: 100 },
  { isim: 'Tüccar', icon: '💼', minXP: 300 },
  { isim: 'Usta', icon: '⭐', minXP: 600 },
  { isim: 'Uzman', icon: '🏆', minXP: 1000 },
  { isim: 'Patron', icon: '👑', minXP: 2000 },
  { isim: 'Efsane', icon: '🔥', minXP: 5000 }
];

// ROZETLER
var rozetler = [
  { id: 'ilk_siparis', icon: '📦', isim: 'İlk Sipariş', aciklama: 'İlk siparişini aldın!' },
  { id: 'on_siparis', icon: '🎯', isim: '10 Sipariş', aciklama: '10 sipariş tamamladın!' },
  { id: 'yuz_siparis', icon: '💯', isim: '100 Sipariş', aciklama: '100 sipariş efsanesi!' },
  { id: 'ilk_bin', icon: '💰', isim: 'İlk 1000₺', aciklama: '1000₺ ciro yaptın!' },
  { id: 'on_bin', icon: '💎', isim: '10.000₺', aciklama: '10.000₺ ciro kralı!' },
  { id: 'hizli_kargo', icon: '🚀', isim: 'Hızlı Kargo', aciklama: 'Aynı gün kargo gönderdin!' },
  { id: 'sadik_musteri', icon: '❤️', isim: 'Sadık Müşteri', aciklama: 'Tekrar sipariş aldın!' },
  { id: 'gece_kusu', icon: '🦉', isim: 'Gece Kuşu', aciklama: 'Gece 12den sonra çalıştın!' },
  { id: 'hafta_sonu', icon: '🎉', isim: 'Hafta Sonu', aciklama: 'Hafta sonu satış yaptın!' },
  { id: 'sampion', icon: '🏅', isim: 'Şampiyon', aciklama: 'Günlük hedefi aştın!' }
];

// GÜNLÜK GÖREVLER
var gunlukGorevler = [
  { id: 'giris', text: 'Sisteme giriş yap', xp: 10, completed: false },
  { id: 'analiz', text: 'Sistem analizi yap', xp: 15, completed: false },
  { id: 'kargo', text: '1 kargo gönder', xp: 25, completed: false },
  { id: 'fatura', text: '1 fatura kes', xp: 20, completed: false },
  { id: 'hedef', text: 'Günlük hedefe ulaş', xp: 50, completed: false }
];


// MOTİVASYON SÖZLERİ
var motivasyonSozleri = [
  "Bugün harika bir gün olacak! 🌟",
  "Sen başarabilirsin, buna inanıyorum! 💪",
  "Her sipariş yeni bir fırsat demek! 📦",
  "Azim ve sabırla her şey mümkün! ✨",
  "Bugün dünden daha iyi olacaksın! 🚀",
  "Müşteriler seni seviyor, bunu unutma! ❤️",
  "Küçük adımlar büyük başarılar getirir! 👣",
  "Sen bu işin en iyisisin! 🏆",
  "Zorluklar seni güçlendirir! 💎",
  "Her gün yeni bir başlangıç! 🌅",
  "Başarı senin hakkın! 🎯",
  "Vazgeçme, zirve yakın! ⛰️",
  "Bugün bir adım daha at! 🦶",
  "Hayal et, çalış, başar! 💫",
  "Sen bir savaşçısın! ⚔️"
];

// E-TİCARET TAVSİYELERİ
var eticaretTavsiyeleri = [
  "Ürün fotoğrafları çok önemli! Kaliteli ve net fotoğraflar satışı %30 artırır. 📸",
  "Müşteri yorumları altın değerinde! Her satıştan sonra yorum isteyin. ⭐",
  "Hızlı kargo = Mutlu müşteri! Aynı gün kargo hedefleyin. 🚚",
  "Sosyal medyada aktif olun! Instagram ve TikTok satışları artırır. 📱",
  "Kampanyalar düzenleyin! İndirimler yeni müşteri çeker. 🏷️",
  "Stok takibini ihmal etmeyin! Stoksuz kalmak müşteri kaybettirir. 📊",
  "Müşteri hizmetleri çok önemli! Hızlı ve nazik cevap verin. 💬",
  "Rakiplerinizi takip edin! Fiyat ve ürün karşılaştırması yapın. 👀",
  "Paketleme kaliteli olsun! İlk izlenim önemli. 🎁",
  "Sadık müşterilere özel indirim yapın! VIP sistemi kurun. 👑",
  "Ürün açıklamalarını detaylı yazın! SEO için önemli. ✍️",
  "Mobil uyumlu olun! Alışverişlerin %70'i mobilden. 📱",
  "Ücretsiz kargo sınırı koyun! Sepet ortalamasını artırır. 🛒",
  "E-posta listesi oluşturun! Tekrar satış için altın. 📧",
  "A/B testi yapın! Neyin işe yaradığını öğrenin. 🔬"
];

// SELAMLAŞMA MESAJLARI
var selamlar = {
  sabah: ["Günaydın patron! ☀️", "Hayırlı sabahlar! 🌅", "Güne enerjik başla! ⚡", "Sabah sabah buradayım! 🌞"],
  ogle: ["İyi günler! 🌤️", "Öğlen molası zamanı! ☕", "Enerjin yerinde mi? 💪", "Öğleden sonra da varım! 🌻"],
  aksam: ["İyi akşamlar! 🌙", "Günün nasıl geçti? 😊", "Akşam mesaisi mi? 🌆", "Yoruldun mu bugün? 🌟"],
  gece: ["Gece kuşu musun? 🦉", "Geç saatlere kadar çalışıyorsun! 💪", "Biraz dinlenmelisin! 😴", "Gece vardiyası! 🌃"]
};


// YARDIMCI FONKSİYONLAR
function saatSelamAl() {
  var saat = new Date().getHours();
  var kategori;
  if (saat >= 6 && saat < 12) kategori = 'sabah';
  else if (saat >= 12 && saat < 18) kategori = 'ogle';
  else if (saat >= 18 && saat < 22) kategori = 'aksam';
  else kategori = 'gece';
  
  var selamListesi = selamlar[kategori];
  return selamListesi[Math.floor(Math.random() * selamListesi.length)];
}

function rastgeleMotivasyonAl() {
  return motivasyonSozleri[Math.floor(Math.random() * motivasyonSozleri.length)];
}

function rastgeleTavsiyeAl() {
  return eticaretTavsiyeleri[Math.floor(Math.random() * eticaretTavsiyeleri.length)];
}

// SEVİYE HESAPLAMA
function seviyeHesapla(xp) {
  for (var i = seviyeler.length - 1; i >= 0; i--) {
    if (xp >= seviyeler[i].minXP) {
      return {
        seviye: seviyeler[i],
        index: i,
        sonrakiXP: seviyeler[i + 1] ? seviyeler[i + 1].minXP : null
      };
    }
  }
  return { seviye: seviyeler[0], index: 0, sonrakiXP: seviyeler[1].minXP };
}

// XP KAYDET/YÜKLE
function xpKaydet(xp) {
  localStorage.setItem('ramco_xp', xp);
}

function xpYukle() {
  return parseInt(localStorage.getItem('ramco_xp')) || 0;
}

function xpEkle(miktar) {
  var mevcutXP = xpYukle();
  var yeniXP = mevcutXP + miktar;
  xpKaydet(yeniXP);
  seviyeGuncelle();
  
  // Seviye atladı mı kontrol
  var eskiSeviye = seviyeHesapla(mevcutXP);
  var yeniSeviye = seviyeHesapla(yeniXP);
  
  if (yeniSeviye.index > eskiSeviye.index) {
    kutlamaYap();
    mesajEkle('🎉 TEBRİKLER! ' + yeniSeviye.seviye.icon + ' ' + yeniSeviye.seviye.isim + ' seviyesine ulaştın!', 'ramco');
    ramcoKonusma('Tebrikler! Yeni seviyeye ulaştın!');
  }
}


// ROZET SİSTEMİ
function rozetKaydet(rozetId) {
  var kazanilanlar = JSON.parse(localStorage.getItem('ramco_rozetler') || '[]');
  if (!kazanilanlar.includes(rozetId)) {
    kazanilanlar.push(rozetId);
    localStorage.setItem('ramco_rozetler', JSON.stringify(kazanilanlar));
    
    var rozet = rozetler.find(r => r.id === rozetId);
    if (rozet) {
      mesajEkle('🏅 YENİ ROZET: ' + rozet.icon + ' ' + rozet.isim + ' - ' + rozet.aciklama, 'ramco');
      kutlamaYap();
      xpEkle(50);
    }
  }
}

function rozetKontrol() {
  return JSON.parse(localStorage.getItem('ramco_rozetler') || '[]');
}

// SEVİYE GÜNCELLE
function seviyeGuncelle() {
  var xp = xpYukle();
  var seviyeBilgi = seviyeHesapla(xp);
  var kazanilanRozetler = rozetKontrol();
  
  var levelIcon = document.getElementById('levelIcon');
  var levelName = document.getElementById('levelName');
  var levelXP = document.getElementById('levelXP');
  var levelProgress = document.getElementById('levelProgress');
  var badgesContainer = document.getElementById('badgesContainer');
  
  if (levelIcon) levelIcon.textContent = seviyeBilgi.seviye.icon;
  if (levelName) levelName.textContent = seviyeBilgi.seviye.isim;
  
  if (seviyeBilgi.sonrakiXP) {
    var ilerleme = ((xp - seviyeBilgi.seviye.minXP) / (seviyeBilgi.sonrakiXP - seviyeBilgi.seviye.minXP)) * 100;
    if (levelXP) levelXP.textContent = xp + ' / ' + seviyeBilgi.sonrakiXP + ' XP';
    if (levelProgress) levelProgress.style.width = ilerleme + '%';
  } else {
    if (levelXP) levelXP.textContent = xp + ' XP (MAX)';
    if (levelProgress) levelProgress.style.width = '100%';
  }
  
  if (badgesContainer) {
    badgesContainer.innerHTML = '';
    rozetler.forEach(function(rozet) {
      var span = document.createElement('span');
      span.className = 'badge' + (kazanilanRozetler.includes(rozet.id) ? ' earned' : '');
      span.textContent = rozet.icon;
      span.title = rozet.isim + ': ' + rozet.aciklama;
      badgesContainer.appendChild(span);
    });
  }
}


// KUTLAMA ANİMASYONU
function kutlamaYap() {
  var container = document.createElement('div');
  container.className = 'celebration';
  document.body.appendChild(container);
  
  var renkler = ['#e94560', '#f39c12', '#28a745', '#3498db', '#9b59b6', '#1abc9c'];
  
  for (var i = 0; i < 50; i++) {
    var confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.background = renkler[Math.floor(Math.random() * renkler.length)];
    confetti.style.animationDelay = Math.random() * 2 + 's';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    container.appendChild(confetti);
  }
  
  setTimeout(function() { container.remove(); }, 4000);
  
  ramcoYuzDegistir('excited');
  setTimeout(function() { ramcoYuzDegistir('happy'); }, 3000);
}

// SİSTEM ANALİZİ
function sistemAnaliziYap(callback) {
  var analiz = {
    toplamSiparis: 0,
    bekleyenKargo: 0,
    bekleyenFatura: 0,
    bugunSiparis: 0,
    bugunKazanc: 0,
    haftaSiparis: 0,
    haftaKazanc: 0,
    aySiparis: 0,
    ayKazanc: 0,
    enCokSatan: {},
    uyarilar: [],
    oneriler: []
  };
  
  database.ref('siparisler').once('value', function(snapshot) {
    var bugun = new Date();
    var bugunStr = bugun.toLocaleDateString('tr-TR');
    var haftaOnce = new Date(bugun.getTime() - 7 * 24 * 60 * 60 * 1000);
    var ayOnce = new Date(bugun.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    snapshot.forEach(function(child) {
      var s = child.val();
      analiz.toplamSiparis++;
      
      var tutar = parseInt((s.tutar || '0').replace(/[^0-9]/g, '')) || 0;
      var siparisTarih = s.tarih ? new Date(s.tarih.split('.').reverse().join('-')) : null;
      
      // Bugün
      if (s.tarih === bugunStr) {
        analiz.bugunSiparis++;
        analiz.bugunKazanc += tutar;
      }
      
      // Hafta
      if (siparisTarih && siparisTarih >= haftaOnce) {
        analiz.haftaSiparis++;
        analiz.haftaKazanc += tutar;
      }
      
      // Ay
      if (siparisTarih && siparisTarih >= ayOnce) {
        analiz.aySiparis++;
        analiz.ayKazanc += tutar;
      }
      
      // Bekleyen kargo
      if (!s.durum || s.durum === 'Bekliyor' || s.durum === 'Kargo Bekliyor') {
        analiz.bekleyenKargo++;
      }
      
      // Bekleyen fatura
      if (!s.faturaKesildi) {
        analiz.bekleyenFatura++;
      }
      
      // En çok satan
      var urun = s.urun || 'Bilinmeyen';
      analiz.enCokSatan[urun] = (analiz.enCokSatan[urun] || 0) + 1;
    });
    
    // Uyarılar
    if (analiz.bekleyenKargo > 0) analiz.uyarilar.push('⚠️ ' + analiz.bekleyenKargo + ' sipariş kargo bekliyor!');
    if (analiz.bekleyenFatura > 0) analiz.uyarilar.push('⚠️ ' + analiz.bekleyenFatura + ' fatura kesilmedi!');
    if (analiz.bugunSiparis === 0) analiz.uyarilar.push('📢 Bugün henüz sipariş yok!');
    
    // Öneriler
    if (analiz.bekleyenKargo > 3) analiz.oneriler.push('Kargo işlemlerini hızlandır!');
    if (analiz.bugunSiparis > 5) analiz.oneriler.push('Bugün harika gidiyor! 🎉');
    if (analiz.bugunSiparis === 0 && new Date().getHours() > 14) analiz.oneriler.push('Kampanya zamanı olabilir!');
    
    callback(analiz);
  });
}


// TAHMİN SİSTEMİ
function tahminHesapla(callback) {
  sistemAnaliziYap(function(analiz) {
    var tahmin = {
      yarinSiparis: 0,
      haftaSiparis: 0,
      ayCiro: 0
    };
    
    // Basit tahmin: son 7 günün ortalaması
    var gunlukOrtalama = analiz.haftaSiparis / 7;
    var ortalamaFiyat = analiz.haftaKazanc / (analiz.haftaSiparis || 1);
    
    tahmin.yarinSiparis = Math.round(gunlukOrtalama * 1.1); // %10 artış varsayımı
    tahmin.haftaSiparis = Math.round(gunlukOrtalama * 7);
    tahmin.ayCiro = Math.round(gunlukOrtalama * 30 * ortalamaFiyat);
    
    callback(tahmin);
  });
}

// DURUM KARTLARINI GÜNCELLE
function durumKartlariniGuncelle() {
  sistemAnaliziYap(function(analiz) {
    var kartToplam = document.getElementById('kartToplamSiparis');
    var kartKargo = document.getElementById('kartBekleyenKargo');
    var kartFatura = document.getElementById('kartBekleyenFatura');
    var kartKazanc = document.getElementById('kartBugunKazanc');
    
    if (kartToplam) kartToplam.textContent = analiz.toplamSiparis;
    if (kartKargo) kartKargo.textContent = analiz.bekleyenKargo;
    if (kartFatura) kartFatura.textContent = analiz.bekleyenFatura;
    if (kartKazanc) kartKazanc.textContent = analiz.bugunKazanc.toLocaleString('tr-TR') + '₺';
    
    // Kart renklerini ayarla
    if (kartKargo) {
      var kargoKart = kartKargo.closest('.status-card');
      if (analiz.bekleyenKargo > 0) kargoKart.classList.add('warning');
      else kargoKart.classList.remove('warning');
    }
    
    if (kartFatura) {
      var faturaKart = kartFatura.closest('.status-card');
      if (analiz.bekleyenFatura > 0) faturaKart.classList.add('danger');
      else faturaKart.classList.remove('danger');
    }
    
    // Rozet kontrolleri
    if (analiz.toplamSiparis >= 1) rozetKaydet('ilk_siparis');
    if (analiz.toplamSiparis >= 10) rozetKaydet('on_siparis');
    if (analiz.toplamSiparis >= 100) rozetKaydet('yuz_siparis');
    if (analiz.ayKazanc >= 1000) rozetKaydet('ilk_bin');
    if (analiz.ayKazanc >= 10000) rozetKaydet('on_bin');
    
    // Gece kuşu rozeti
    var saat = new Date().getHours();
    if (saat >= 0 && saat < 6) rozetKaydet('gece_kusu');
    
    // Hafta sonu rozeti
    var gun = new Date().getDay();
    if ((gun === 0 || gun === 6) && analiz.bugunSiparis > 0) rozetKaydet('hafta_sonu');
  });
  
  // Stokları da güncelle
  stokYukle();
}

// STOK YÜKLEME FONKSİYONU
function stokYukle() {
  var stokGrid = document.getElementById('ramcoStokGrid');
  if (!stokGrid) return;
  
  stokGrid.innerHTML = '<div style="color:#888;text-align:center;grid-column:1/-1;padding:20px;">Stoklar yükleniyor...</div>';
  
  // Firebase'den stokları çek
  database.ref('stoklar').once('value', function(stokSnapshot) {
    // Siparişlerden satılan adetleri hesapla
    database.ref('siparisler').once('value', function(siparisSnapshot) {
      var satislar = {};
      
      // Her siparişin ürün adını ve adetini say
      siparisSnapshot.forEach(function(child) {
        var s = child.val();
        var urunAdi = s.urunAdi || s.urun || 'Bilinmeyen';
        var adet = parseInt((s.adet || '1').toString().replace(/[^0-9]/g, '')) || 1;
        
        // İptal ve iade olanları sayma
        if (s.durum !== 'Iptal' && s.durum !== 'Iade') {
          if (!satislar[urunAdi]) satislar[urunAdi] = 0;
          satislar[urunAdi] += adet;
        }
      });
      
      stokGrid.innerHTML = '';
      
      // Stokları göster
      var stokVar = false;
      stokSnapshot.forEach(function(child) {
        stokVar = true;
        var stok = child.val();
        var urunAdi = stok.urunAdi || child.key;
        var mevcutStok = parseInt(stok.miktar) || 0;
        var satilanAdet = satislar[urunAdi] || 0;
        var kalanStok = mevcutStok - satilanAdet;
        
        var uyariClass = kalanStok <= 5 ? 'uyari' : '';
        var kalanClass = kalanStok <= 5 ? 'az' : '';
        
        var div = document.createElement('div');
        div.className = 'stok-item ' + uyariClass;
        div.innerHTML = '<div class="urun-adi">' + urunAdi + '</div>' +
          '<div class="stok-miktar">' + kalanStok + '</div>' +
          '<div class="satis-bilgi">📦 ' + satilanAdet + ' Satış</div>' +
          '<div class="kalan-bilgi ' + kalanClass + '">📊 Stok: ' + mevcutStok + '</div>';
        stokGrid.appendChild(div);
      });
      
      if (!stokVar) {
        stokGrid.innerHTML = '<div style="color:#888;text-align:center;grid-column:1/-1;padding:20px;">Henüz stok tanımlanmamış.<br>Ana sayfadan stok ekleyebilirsiniz.</div>';
      }
    });
  });
}


// HEDEF TAKİP
function hedefleriGuncelle() {
  var hedefler = JSON.parse(localStorage.getItem('ramco_hedefler') || '{"gunluk":5,"haftalik":30,"aylik":100}');
  
  sistemAnaliziYap(function(analiz) {
    // Günlük hedef
    var gunlukYuzde = Math.min((analiz.bugunSiparis / hedefler.gunluk) * 100, 100);
    var gunlukFill = document.getElementById('gunlukHedefFill');
    var gunlukText = document.getElementById('gunlukHedefText');
    if (gunlukFill) gunlukFill.style.width = gunlukYuzde + '%';
    if (gunlukText) gunlukText.textContent = analiz.bugunSiparis + ' / ' + hedefler.gunluk;
    
    // Haftalık hedef
    var haftalikYuzde = Math.min((analiz.haftaSiparis / hedefler.haftalik) * 100, 100);
    var haftalikFill = document.getElementById('haftalikHedefFill');
    var haftalikText = document.getElementById('haftalikHedefText');
    if (haftalikFill) haftalikFill.style.width = haftalikYuzde + '%';
    if (haftalikText) haftalikText.textContent = analiz.haftaSiparis + ' / ' + hedefler.haftalik;
    
    // Aylık hedef
    var aylikYuzde = Math.min((analiz.aySiparis / hedefler.aylik) * 100, 100);
    var aylikFill = document.getElementById('aylikHedefFill');
    var aylikText = document.getElementById('aylikHedefText');
    if (aylikFill) aylikFill.style.width = aylikYuzde + '%';
    if (aylikText) aylikText.textContent = analiz.aySiparis + ' / ' + hedefler.aylik;
    
    // Hedef aşıldıysa kutla
    if (gunlukYuzde >= 100) {
      rozetKaydet('sampion');
      gorevTamamla('hedef');
    }
  });
}

// TAHMİNLERİ GÜNCELLE
function tahminleriGuncelle() {
  tahminHesapla(function(tahmin) {
    var yarinEl = document.getElementById('tahminYarin');
    var haftaEl = document.getElementById('tahminHafta');
    var ayEl = document.getElementById('tahminAy');
    
    if (yarinEl) yarinEl.textContent = tahmin.yarinSiparis + ' sipariş';
    if (haftaEl) haftaEl.textContent = tahmin.haftaSiparis + ' sipariş';
    if (ayEl) ayEl.textContent = tahmin.ayCiro.toLocaleString('tr-TR') + '₺';
  });
}


// GÜNLÜK GÖREVLER
function gorevleriYukle() {
  var bugun = new Date().toDateString();
  var kayitliTarih = localStorage.getItem('ramco_gorev_tarih');
  
  if (kayitliTarih !== bugun) {
    // Yeni gün, görevleri sıfırla
    gunlukGorevler.forEach(function(g) { g.completed = false; });
    localStorage.setItem('ramco_gorev_tarih', bugun);
    localStorage.setItem('ramco_gorevler', JSON.stringify(gunlukGorevler));
  } else {
    var kayitli = JSON.parse(localStorage.getItem('ramco_gorevler') || '[]');
    if (kayitli.length > 0) {
      gunlukGorevler = kayitli;
    }
  }
  
  gorevleriGoster();
}

function gorevleriGoster() {
  var container = document.getElementById('gorevlerContainer');
  if (!container) return;
  
  container.innerHTML = '';
  gunlukGorevler.forEach(function(gorev, index) {
    var div = document.createElement('div');
    div.className = 'task-item' + (gorev.completed ? ' completed' : '');
    div.onclick = function() { gorevTamamla(gorev.id); };
    div.innerHTML = '<div class="task-checkbox"></div>' +
      '<span class="task-text">' + gorev.text + '</span>' +
      '<span class="task-reward">+' + gorev.xp + ' XP</span>';
    container.appendChild(div);
  });
}

function gorevTamamla(gorevId) {
  var gorev = gunlukGorevler.find(function(g) { return g.id === gorevId; });
  if (gorev && !gorev.completed) {
    gorev.completed = true;
    localStorage.setItem('ramco_gorevler', JSON.stringify(gunlukGorevler));
    xpEkle(gorev.xp);
    gorevleriGoster();
    mesajEkle('✅ Görev tamamlandı! +' + gorev.xp + ' XP kazandın!', 'ramco');
  }
}

// BİLDİRİMLER
var bildirimler = [];

function bildirimEkle(mesaj, tip) {
  tip = tip || 'info';
  var icons = { info: 'ℹ️', warning: '⚠️', success: '✅', danger: '❌' };
  
  bildirimler.unshift({
    mesaj: mesaj,
    tip: tip,
    icon: icons[tip],
    zaman: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  });
  
  if (bildirimler.length > 20) bildirimler.pop();
  
  bildirimleriGoster();
}

function bildirimleriGoster() {
  var container = document.getElementById('bildirimlerContainer');
  if (!container) return;
  
  container.innerHTML = '';
  bildirimler.forEach(function(b) {
    var div = document.createElement('div');
    div.className = 'notif-item ' + b.tip;
    div.innerHTML = '<span class="notif-icon">' + b.icon + '</span>' +
      '<span class="notif-text">' + b.mesaj + '</span>' +
      '<span class="notif-time">' + b.zaman + '</span>';
    container.appendChild(div);
  });
}


// SES SİSTEMİ - TEXT TO SPEECH
function ramcoKonusma(metin) {
  if (!soundEnabled || !synth) return;
  
  synth.cancel(); // Önceki konuşmayı durdur
  
  var utterance = new SpeechSynthesisUtterance(metin);
  utterance.lang = 'tr-TR';
  utterance.rate = 1;
  utterance.pitch = 1;
  
  // Türkçe ses bul
  var voices = synth.getVoices();
  var turkceVoice = voices.find(function(v) { return v.lang.includes('tr'); });
  if (turkceVoice) utterance.voice = turkceVoice;
  
  utterance.onstart = function() {
    isSpeaking = true;
    var mouth = document.querySelector('.ramco-mouth');
    if (mouth) mouth.classList.add('talking');
  };
  
  utterance.onend = function() {
    isSpeaking = false;
    var mouth = document.querySelector('.ramco-mouth');
    if (mouth) mouth.classList.remove('talking');
  };
  
  synth.speak(utterance);
}

// SES TANIMA - SPEECH TO TEXT
function sesKomutBaslat() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    mesajEkle('❌ Tarayıcın ses tanımayı desteklemiyor!', 'ramco');
    return;
  }
  
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'tr-TR';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onstart = function() {
    voiceEnabled = true;
    var voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) voiceBtn.classList.add('recording');
    mesajEkle('🎤 Dinliyorum...', 'ramco');
  };
  
  recognition.onresult = function(event) {
    var transcript = event.results[0][0].transcript;
    mesajEkle(transcript, 'user');
    
    setTimeout(function() {
      var cevap = cevapUret(transcript);
      mesajEkle(cevap, 'ramco');
      ramcoKonusma(cevap.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ''));
    }, 500);
  };
  
  recognition.onerror = function(event) {
    mesajEkle('❌ Ses tanıma hatası: ' + event.error, 'ramco');
  };
  
  recognition.onend = function() {
    voiceEnabled = false;
    var voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) voiceBtn.classList.remove('recording');
  };
  
  recognition.start();
}

function sesDurdur() {
  if (recognition) {
    recognition.stop();
  }
}

function sesToggle() {
  soundEnabled = !soundEnabled;
  var btn = document.getElementById('soundToggle');
  if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
}


// MESAJ SİSTEMİ
function mesajGonder() {
  var input = document.getElementById('ramcoInput');
  var mesaj = input.value.trim();
  if (!mesaj) return;
  
  mesajEkle(mesaj, 'user');
  input.value = '';
  
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  
  setTimeout(function() {
    // Önce akıllı beyin sistemini dene
    var cevap;
    if (typeof ramcoAkilliCevap === 'function') {
      cevap = ramcoAkilliCevap(mesaj);
    } else {
      cevap = cevapUret(mesaj);
    }
    
    yaziyorGizle();
    mesajEkle(cevap, 'ramco');
    ramcoYuzDegistir('happy');
    
    if (soundEnabled) {
      ramcoKonusma(cevap.replace(/[^\w\sğüşıöçĞÜŞİÖÇ.,!?]/g, ''));
    }
  }, 800 + Math.random() * 800);
}

function mesajEkle(mesaj, kimden) {
  var chatBox = document.getElementById('ramcoChatBox');
  if (!chatBox) return;
  
  var div = document.createElement('div');
  div.className = 'chat-message ' + kimden;
  
  var avatar = kimden === 'ramco' ? '🤖' : '👤';
  div.innerHTML = '<div class="chat-avatar">' + avatar + '</div><div class="chat-bubble">' + mesaj + '</div>';
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  if (kimden === 'ramco') {
    var mouth = document.querySelector('.ramco-mouth');
    if (mouth) {
      mouth.classList.add('talking');
      setTimeout(function() { mouth.classList.remove('talking'); }, 1500);
    }
  }
}

function yaziyorGoster() {
  var chatBox = document.getElementById('ramcoChatBox');
  if (!chatBox) return;
  
  var div = document.createElement('div');
  div.className = 'chat-message ramco';
  div.id = 'typingIndicator';
  div.innerHTML = '<div class="chat-avatar">🤖</div><div class="typing-indicator"><span></span><span></span><span></span></div>';
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function yaziyorGizle() {
  var typing = document.getElementById('typingIndicator');
  if (typing) typing.remove();
}

function ramcoYuzDegistir(mood) {
  var face = document.querySelector('.ramco-face');
  if (!face) return;
  
  face.classList.remove('happy', 'sad', 'thinking', 'excited', 'surprised', 'angry');
  face.classList.add(mood);
  ramcoMood = mood;
}


// GELİŞMİŞ CEVAP ÜRETME
function cevapUret(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Selamlaşma
  if (m.includes('merhaba') || m.includes('selam') || m.includes('hey') || m.includes('naber')) {
    ramcoYuzDegistir('happy');
    return saatSelamAl() + ' Nasıl yardımcı olabilirim?';
  }
  
  // Nasılsın
  if (m.includes('nasılsın') || m.includes('ne haber') || m.includes('iyi misin')) {
    ramcoYuzDegistir('excited');
    return 'Ben harikayım! 😊 Senin için buradayım. Sen nasılsın?';
  }
  
  // Teşekkür
  if (m.includes('teşekkür') || m.includes('sağol') || m.includes('eyvallah')) {
    ramcoYuzDegistir('happy');
    return 'Rica ederim! 😊 Her zaman yanındayım!';
  }
  
  // Sipariş sorguları
  if (m.includes('sipariş') || m.includes('siparis')) {
    if (m.match(/\d+/)) {
      var siparisNo = m.match(/\d+/)[0];
      return siparisAra(siparisNo);
    }
    gorevTamamla('analiz');
    return 'Sipariş durumuna bakıyorum... 📦 Yukarıdaki kartlarda güncel bilgiler var!';
  }
  
  // Müşteri sorguları
  if (m.includes('müşteri') || m.includes('musteri')) {
    if (m.match(/[a-zA-ZğüşıöçĞÜŞİÖÇ]+/)) {
      var isim = m.split(' ').find(function(k) { return k.length > 3 && !['müşteri', 'musteri', 'sipariş', 'nerede', 'durumu'].includes(k); });
      if (isim) return musteriAra(isim);
    }
    return 'Hangi müşteri hakkında bilgi istiyorsun? İsim söyle bakalım! 👤';
  }
  
  // Tarih sorguları
  if (m.includes('dün') || m.includes('bugün') || m.includes('bu hafta') || m.includes('bu ay')) {
    return tarihSorgusu(m);
  }
  
  // Kargo
  if (m.includes('kargo')) {
    return 'Kargo işlemleri için Kargo Gönder sayfasına git! 🚚 Bekleyen kargolarını yukarıda görebilirsin.';
  }
  
  // Fatura
  if (m.includes('fatura')) {
    return 'Fatura işlemleri için Fatura Kes sayfasına git! 🧾 Bekleyen faturaları kontrol et.';
  }
  
  // Motivasyon
  if (m.includes('motivasyon') || m.includes('moral') || m.includes('üzgün') || m.includes('kötü') || m.includes('mutsuz')) {
    ramcoYuzDegistir('excited');
    xpEkle(5);
    return rastgeleMotivasyonAl();
  }
  
  // Tavsiye
  if (m.includes('tavsiye') || m.includes('öneri') || m.includes('fikir') || m.includes('ne yapmalı') || m.includes('ipucu')) {
    ramcoYuzDegistir('thinking');
    xpEkle(5);
    return '💡 ' + rastgeleTavsiyeAl();
  }
  
  // Yardım
  if (m.includes('yardım') || m.includes('help') || m.includes('ne yapabilirsin')) {
    return yardimMesaji();
  }
  
  // Analiz
  if (m.includes('analiz') || m.includes('rapor') || m.includes('durum')) {
    hizliSistemAnalizi();
    return '';
  }
  
  // Hedef
  if (m.includes('hedef')) {
    return hedefDurumu();
  }
  
  // Seviye
  if (m.includes('seviye') || m.includes('xp') || m.includes('rozet')) {
    return seviyeDurumu();
  }
  
  // Tahmin
  if (m.includes('tahmin') || m.includes('yarın') || m.includes('gelecek')) {
    hizliTahmin();
    return '';
  }
  
  // Stok
  if (m.includes('stok')) {
    return 'Stok durumunu kontrol etmek için Sipariş Takibi sayfasına git! 📊';
  }
  
  // İyi/kötü gün
  if (m.includes('iyi') && (m.includes('gün') || m.includes('günler'))) {
    ramcoYuzDegistir('happy');
    return 'Sana da iyi günler! ☀️ Bugün harika satışlar yapacaksın!';
  }
  
  if (m.includes('kötü') && m.includes('gün')) {
    ramcoYuzDegistir('sad');
    setTimeout(function() { ramcoYuzDegistir('happy'); }, 3000);
    return 'Üzülme! 😢 Her gün aynı olmaz. ' + rastgeleMotivasyonAl();
  }
  
  // Varsayılan
  return varsayilanCevap();
}


// ÖZEL SORGULAR
function siparisAra(siparisNo) {
  // Firebase'den sipariş ara
  return '🔍 ' + siparisNo + ' numaralı siparişi arıyorum... Sipariş Takibi sayfasından detaylı bilgi alabilirsin!';
}

function musteriAra(isim) {
  return '👤 "' + isim + '" isimli müşteriyi arıyorum... Sipariş Takibi sayfasında arama yapabilirsin!';
}

function tarihSorgusu(mesaj) {
  var sonuc = '';
  sistemAnaliziYap(function(analiz) {
    if (mesaj.includes('bugün')) {
      sonuc = '📅 Bugün: ' + analiz.bugunSiparis + ' sipariş, ' + analiz.bugunKazanc.toLocaleString('tr-TR') + '₺ kazanç';
    } else if (mesaj.includes('bu hafta')) {
      sonuc = '📅 Bu hafta: ' + analiz.haftaSiparis + ' sipariş, ' + analiz.haftaKazanc.toLocaleString('tr-TR') + '₺ kazanç';
    } else if (mesaj.includes('bu ay')) {
      sonuc = '📅 Bu ay: ' + analiz.aySiparis + ' sipariş, ' + analiz.ayKazanc.toLocaleString('tr-TR') + '₺ kazanç';
    }
    mesajEkle(sonuc, 'ramco');
  });
  return '📊 Verilere bakıyorum...';
}

function yardimMesaji() {
  return 'Ben GARİBAN! 🤖 Sana şunlarda yardımcı olabilirim:\n\n' +
    '📊 Sistem analizi\n' +
    '💡 E-ticaret tavsiyeleri\n' +
    '💪 Motivasyon\n' +
    '📦 Sipariş sorgulama\n' +
    '🚚 Kargo takibi\n' +
    '🧾 Fatura hatırlatma\n' +
    '🎯 Hedef takibi\n' +
    '🔮 Satış tahmini\n' +
    '🎤 Sesli komut (mikrofon butonuna bas)\n\n' +
    'Aşağıdaki butonları da kullanabilirsin!';
}

function hedefDurumu() {
  var hedefler = JSON.parse(localStorage.getItem('ramco_hedefler') || '{"gunluk":5,"haftalik":30,"aylik":100}');
  return '🎯 Hedefler:\n' +
    'Günlük: ' + hedefler.gunluk + ' sipariş\n' +
    'Haftalık: ' + hedefler.haftalik + ' sipariş\n' +
    'Aylık: ' + hedefler.aylik + ' sipariş\n\n' +
    'Yukarıdaki hedef çubuklarından ilerlemeyi takip edebilirsin!';
}

function seviyeDurumu() {
  var xp = xpYukle();
  var seviyeBilgi = seviyeHesapla(xp);
  var rozetSayisi = rozetKontrol().length;
  
  return seviyeBilgi.seviye.icon + ' Seviye: ' + seviyeBilgi.seviye.isim + '\n' +
    '⭐ XP: ' + xp + '\n' +
    '🏅 Rozetler: ' + rozetSayisi + '/' + rozetler.length + '\n\n' +
    'Görevleri tamamlayarak XP kazan ve seviye atla!';
}

function varsayilanCevap() {
  var cevaplar = [
    'Anlıyorum! 🤔 Başka nasıl yardımcı olabilirim?',
    'İlginç! 😊 Devam et, dinliyorum.',
    'Hmm, bunu düşünmeliyim... 🤖',
    'Seninle sohbet etmek güzel! 💬',
    'Ben buradayım! 🤗 Her konuda yardımcı olurum!',
    'Anladım! Başka bir şey sormak ister misin? 😊',
    'Tamam! 👍 Başka ne yapabilirim?'
  ];
  return cevaplar[Math.floor(Math.random() * cevaplar.length)];
}


// HIZLI BUTON FONKSİYONLARI
function hizliSistemAnalizi() {
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  gorevTamamla('analiz');
  
  sistemAnaliziYap(function(analiz) {
    setTimeout(function() {
      yaziyorGizle();
      
      var mesaj = '📊 SİSTEM ANALİZİ\n\n';
      mesaj += '📦 Toplam Sipariş: ' + analiz.toplamSiparis + '\n';
      mesaj += '🚚 Bekleyen Kargo: ' + analiz.bekleyenKargo + '\n';
      mesaj += '🧾 Bekleyen Fatura: ' + analiz.bekleyenFatura + '\n';
      mesaj += '💰 Bugün Kazanç: ' + analiz.bugunKazanc.toLocaleString('tr-TR') + '₺\n';
      mesaj += '📈 Bugün Sipariş: ' + analiz.bugunSiparis + '\n';
      mesaj += '📅 Bu Hafta: ' + analiz.haftaSiparis + ' sipariş\n';
      mesaj += '📆 Bu Ay: ' + analiz.aySiparis + ' sipariş\n\n';
      
      if (analiz.uyarilar.length > 0) {
        mesaj += '⚠️ UYARILAR:\n';
        analiz.uyarilar.forEach(function(u) { mesaj += u + '\n'; });
      } else {
        mesaj += '✅ Her şey yolunda görünüyor!';
      }
      
      mesajEkle(mesaj, 'ramco');
      ramcoYuzDegistir('happy');
      xpEkle(10);
      
      if (soundEnabled) ramcoKonusma('Sistem analizi tamamlandı');
    }, 1200);
  });
}

function hizliMotivasyonVer() {
  ramcoYuzDegistir('excited');
  yaziyorGoster();
  
  setTimeout(function() {
    yaziyorGizle();
    var mot = rastgeleMotivasyonAl();
    mesajEkle(mot, 'ramco');
    ramcoYuzDegistir('happy');
    xpEkle(5);
    
    if (soundEnabled) ramcoKonusma(mot.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ''));
  }, 600);
}

function hizliTavsiyeVer() {
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  
  setTimeout(function() {
    yaziyorGizle();
    var tav = rastgeleTavsiyeAl();
    mesajEkle('💡 E-TİCARET TAVSİYESİ:\n\n' + tav, 'ramco');
    ramcoYuzDegistir('happy');
    xpEkle(5);
  }, 800);
}

function hizliGunlukOzet() {
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  
  sistemAnaliziYap(function(analiz) {
    setTimeout(function() {
      yaziyorGizle();
      
      var saat = new Date().getHours();
      var selamTipi = saat < 12 ? 'Günaydın' : (saat < 18 ? 'İyi günler' : 'İyi akşamlar');
      
      var mesaj = selamTipi + ' patron! 👋\n\n';
      mesaj += '📅 GÜNLÜK ÖZET\n\n';
      mesaj += '📦 Bugün ' + analiz.bugunSiparis + ' sipariş geldi\n';
      mesaj += '💰 Bugün ' + analiz.bugunKazanc.toLocaleString('tr-TR') + '₺ kazandın\n';
      mesaj += '🚚 ' + analiz.bekleyenKargo + ' kargo bekliyor\n';
      mesaj += '🧾 ' + analiz.bekleyenFatura + ' fatura kesilecek\n\n';
      
      if (analiz.bugunSiparis > 5) {
        mesaj += '🎉 Harika bir gün! Tebrikler!';
        ramcoYuzDegistir('excited');
      } else if (analiz.bugunSiparis > 0) {
        mesaj += '👍 İyi gidiyorsun, devam et!';
      } else {
        mesaj += '💪 Bugün biraz yavaş, ama yarın daha iyi olacak!';
      }
      
      mesajEkle(mesaj, 'ramco');
      setTimeout(function() { ramcoYuzDegistir('happy'); }, 2000);
      xpEkle(10);
    }, 1000);
  });
}

function hizliBekleyenler() {
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  
  sistemAnaliziYap(function(analiz) {
    setTimeout(function() {
      yaziyorGizle();
      
      var mesaj = '⏳ BEKLEYEN İŞLER\n\n';
      
      if (analiz.bekleyenKargo > 0) {
        mesaj += '🚚 ' + analiz.bekleyenKargo + ' sipariş kargoya verilmedi!\n';
        mesaj += '→ Kargo Gönder sayfasına git\n\n';
        bildirimEkle(analiz.bekleyenKargo + ' kargo bekliyor', 'warning');
      }
      
      if (analiz.bekleyenFatura > 0) {
        mesaj += '🧾 ' + analiz.bekleyenFatura + ' fatura kesilmedi!\n';
        mesaj += '→ Fatura Kes sayfasına git\n\n';
        bildirimEkle(analiz.bekleyenFatura + ' fatura bekliyor', 'warning');
      }
      
      if (analiz.bekleyenKargo === 0 && analiz.bekleyenFatura === 0) {
        mesaj += '✅ Harika! Bekleyen işin yok! 🎉\n';
        mesaj += 'Biraz dinlenebilirsin 😊';
        ramcoYuzDegistir('excited');
      } else {
        mesaj += '💪 Hadi bu işleri bitirelim!';
        ramcoYuzDegistir('sad');
      }
      
      mesajEkle(mesaj, 'ramco');
      setTimeout(function() { ramcoYuzDegistir('happy'); }, 3000);
    }, 1000);
  });
}

function hizliTahmin() {
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  
  tahminHesapla(function(tahmin) {
    setTimeout(function() {
      yaziyorGizle();
      
      var mesaj = '🔮 SATIŞ TAHMİNİ\n\n';
      mesaj += '📅 Yarın tahmini: ~' + tahmin.yarinSiparis + ' sipariş\n';
      mesaj += '📆 Bu hafta tahmini: ~' + tahmin.haftaSiparis + ' sipariş\n';
      mesaj += '💰 Bu ay tahmini ciro: ~' + tahmin.ayCiro.toLocaleString('tr-TR') + '₺\n\n';
      mesaj += '📊 Bu tahminler son 7 günlük verilerine göre hesaplandı.';
      
      mesajEkle(mesaj, 'ramco');
      ramcoYuzDegistir('happy');
      xpEkle(5);
    }, 1200);
  });
}


// AKILLI BİLDİRİM SİSTEMİ
function akilliBildirimKontrol() {
  sistemAnaliziYap(function(analiz) {
    var saat = new Date().getHours();
    
    // Stok uyarısı
    if (analiz.bekleyenKargo > 5) {
      bildirimEkle('Çok fazla bekleyen kargo var! Hemen gönder!', 'danger');
      ramcoYuzDegistir('angry');
      setTimeout(function() { ramcoYuzDegistir('happy'); }, 3000);
    }
    
    // Hedef yaklaşıyor
    var hedefler = JSON.parse(localStorage.getItem('ramco_hedefler') || '{"gunluk":5}');
    if (analiz.bugunSiparis >= hedefler.gunluk * 0.8 && analiz.bugunSiparis < hedefler.gunluk) {
      bildirimEkle('Günlük hedefe çok yaklaştın! 💪', 'success');
    }
    
    // Hedef aşıldı
    if (analiz.bugunSiparis >= hedefler.gunluk) {
      bildirimEkle('🎉 Günlük hedefi aştın! Tebrikler!', 'success');
    }
    
    // Sipariş yok uyarısı
    if (analiz.bugunSiparis === 0 && saat > 14) {
      bildirimEkle('Bugün henüz sipariş yok. Kampanya zamanı!', 'warning');
    }
    
    // İyi gidiyor
    if (analiz.bugunSiparis > 10) {
      bildirimEkle('Bugün harika gidiyor! ' + analiz.bugunSiparis + ' sipariş! 🔥', 'success');
    }
  });
}

// GARİBAN BAŞLAT
function ramcoBaslat() {
  // Giriş görevi tamamla
  gorevTamamla('giris');
  
  // Hoş geldin mesajı
  setTimeout(function() {
    var isim = localStorage.getItem('kullanici_isim') || 'Patron';
    var xp = xpYukle();
    var seviyeBilgi = seviyeHesapla(xp);
    
    var hosgeldin = saatSelamAl() + ' ' + isim + '!\n\n';
    hosgeldin += 'Ben GARİBAN, senin e-ticaret asistanın! 🤖\n';
    hosgeldin += 'Seviye: ' + seviyeBilgi.seviye.icon + ' ' + seviyeBilgi.seviye.isim + '\n\n';
    hosgeldin += 'Nasıl yardımcı olabilirim?';
    
    mesajEkle(hosgeldin, 'ramco');
    
    if (soundEnabled) {
      setTimeout(function() {
        ramcoKonusma('Merhaba ' + isim + '! Ben Gariban, senin e-ticaret asistanın!');
      }, 500);
    }
  }, 500);
  
  // Verileri yükle
  seviyeGuncelle();
  durumKartlariniGuncelle();
  hedefleriGuncelle();
  tahminleriGuncelle();
  gorevleriYukle();
  
  // Periyodik güncellemeler
  setInterval(durumKartlariniGuncelle, 30000);
  setInterval(hedefleriGuncelle, 60000);
  setInterval(akilliBildirimKontrol, 120000);
  
  // İlk bildirim kontrolü
  setTimeout(akilliBildirimKontrol, 5000);
  
  // Enter tuşu
  var input = document.getElementById('ramcoInput');
  if (input) {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') mesajGonder();
    });
  }
  
  // Ses sistemini hazırla
  if (synth) {
    synth.getVoices();
  }
  
  // XP ekle (günlük giriş)
  var sonGiris = localStorage.getItem('ramco_son_giris');
  var bugun = new Date().toDateString();
  if (sonGiris !== bugun) {
    xpEkle(10);
    localStorage.setItem('ramco_son_giris', bugun);
    bildirimEkle('Günlük giriş bonusu: +10 XP! 🎁', 'success');
  }
}


// ==================== BEYİN HIZLI BUTONLARI ====================
function hizliBeyin() {
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  
  setTimeout(function() {
    yaziyorGizle();
    
    if (typeof ramcoDurumMesaji === 'function') {
      mesajEkle(ramcoDurumMesaji(), 'ramco');
    } else {
      mesajEkle('🧠 Beyin sistemi henüz yüklenmedi!', 'ramco');
    }
    
    ramcoYuzDegistir('happy');
  }, 800);
}

function hizliOgret() {
  ramcoYuzDegistir('excited');
  
  var mesaj = '📚 GARİBAN\'A ÖĞRETME REHBERİ\n\n';
  mesaj += '1️⃣ Direkt öğret:\n';
  mesaj += '   "öğren: soru = cevap"\n';
  mesaj += '   Örnek: öğren: patron kim = Sen patronsun!\n\n';
  mesaj += '2️⃣ Konuşarak öğret:\n';
  mesaj += '   Bilmediğim bir şey sorduğunda\n';
  mesaj += '   sana soracağım, cevapla öğreneyim!\n\n';
  mesaj += '3️⃣ Komutlar:\n';
  mesaj += '   • "beyin" - Durumumu gör\n';
  mesaj += '   • "öğrenilenler" - Ne öğrendim\n';
  mesaj += '   • "bekleyen sorular" - Cevaplanmamışlar\n';
  mesaj += '   • "unut: kelime" - Bir şeyi unut\n\n';
  mesaj += '💡 Ne kadar konuşursan o kadar akıllı olurum!';
  
  mesajEkle(mesaj, 'ramco');
}


// ==================== YENİ HIZLI BUTONLAR ====================

function hizliOyun() {
  ramcoYuzDegistir('excited');
  
  var mesaj = '🎮 OYUN ZAMANI!\n\n';
  mesaj += 'Hangi oyunu oynamak istersin?\n\n';
  mesaj += '🔢 "matematik" - Hızlı hesap yap\n';
  mesaj += '📝 "kelime" - Kelime bulmaca\n';
  mesaj += '🎯 "tahmin" - Sayı tahmin et\n\n';
  mesaj += 'Oyun adını yaz başlayalım!';
  
  mesajEkle(mesaj, 'ramco');
}

function hizliRapor() {
  ramcoYuzDegistir('thinking');
  yaziyorGoster();
  
  if (typeof gunlukRaporOlustur === 'function') {
    gunlukRaporOlustur(function(rapor) {
      yaziyorGizle();
      mesajEkle(rapor, 'ramco');
      ramcoYuzDegistir('happy');
      
      if (soundEnabled) {
        ramcoKonusma('Günlük rapor hazır!');
      }
    });
  } else {
    setTimeout(function() {
      yaziyorGizle();
      mesajEkle('📊 Rapor sistemi yükleniyor...', 'ramco');
      ramcoYuzDegistir('happy');
    }, 1000);
  }
}

// ==================== GELİŞMİŞ HOŞGELDİN ====================

var eskiRamcoBaslat = ramcoBaslat;

ramcoBaslat = function() {
  // Giriş görevi tamamla
  if (typeof gorevTamamla === 'function') {
    gorevTamamla('giris');
  }
  
  // Hoş geldin mesajı
  setTimeout(function() {
    var isim = localStorage.getItem('kullanici_isim') || 'Patron';
    var xp = typeof xpYukle === 'function' ? xpYukle() : 0;
    var seviyeBilgi = typeof seviyeHesapla === 'function' ? seviyeHesapla(xp) : { seviye: { icon: '🌱', isim: 'Çırak' } };
    var ogrenilen = typeof kelimeSayisi === 'function' ? kelimeSayisi() : 0;
    
    var hosgeldin = saatSelamAl() + ' ' + isim + '!\n\n';
    hosgeldin += 'Ben GARİBAN, senin akıllı e-ticaret asistanın! 🤖\n\n';
    hosgeldin += '📊 Seviye: ' + seviyeBilgi.seviye.icon + ' ' + seviyeBilgi.seviye.isim + '\n';
    hosgeldin += '🧠 Öğrenilen: ' + ogrenilen + ' şey\n';
    hosgeldin += '⭐ XP: ' + xp + '\n\n';
    hosgeldin += 'Nasıl yardımcı olabilirim?\n\n';
    hosgeldin += '💡 İpucu: Bana yeni şeyler öğretebilirsin!';
    
    mesajEkle(hosgeldin, 'ramco');
    
    if (soundEnabled) {
      setTimeout(function() {
        ramcoKonusma('Merhaba ' + isim + '! Ben Gariban, senin akıllı asistanın!');
      }, 500);
    }
  }, 500);
  
  // Verileri yükle
  if (typeof seviyeGuncelle === 'function') seviyeGuncelle();
  durumKartlariniGuncelle();
  if (typeof hedefleriGuncelle === 'function') hedefleriGuncelle();
  if (typeof tahminleriGuncelle === 'function') tahminleriGuncelle();
  if (typeof gorevleriYukle === 'function') gorevleriYukle();
  
  // Periyodik güncellemeler
  setInterval(durumKartlariniGuncelle, 30000);
  if (typeof hedefleriGuncelle === 'function') setInterval(hedefleriGuncelle, 60000);
  if (typeof akilliBildirimKontrol === 'function') setInterval(akilliBildirimKontrol, 120000);
  
  // İlk bildirim kontrolü
  if (typeof akilliBildirimKontrol === 'function') {
    setTimeout(akilliBildirimKontrol, 5000);
  }
  
  // Enter tuşu
  var input = document.getElementById('ramcoInput');
  if (input) {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') mesajGonder();
    });
  }
  
  // Ses sistemini hazırla
  if (synth) {
    synth.getVoices();
  }
  
  // XP ekle (günlük giriş)
  var sonGiris = localStorage.getItem('ramco_son_giris');
  var bugun = new Date().toDateString();
  if (sonGiris !== bugun) {
    if (typeof xpEkle === 'function') xpEkle(10);
    localStorage.setItem('ramco_son_giris', bugun);
    if (typeof bildirimEkle === 'function') {
      bildirimEkle('Günlük giriş bonusu: +10 XP! 🎁', 'success');
    }
  }
  
  // Akıllı öneri göster
  setTimeout(function() {
    if (typeof akilliOneriUret === 'function') {
      var oneri = akilliOneriUret();
      if (typeof bildirimEkle === 'function') {
        bildirimEkle(oneri, 'info');
      }
    }
  }, 10000);
};


// ==================== YENİ HIZLI BUTONLAR ====================

function hizliNotlar() {
  if (typeof notlariListele === 'function') {
    mesajEkle(notlariListele(), 'ramco');
  } else {
    mesajEkle('📝 Not sistemi yükleniyor...', 'ramco');
  }
}

function hizliSablonlar() {
  if (typeof sablonlariListele === 'function') {
    mesajEkle(sablonlariListele(), 'ramco');
  } else {
    mesajEkle('💬 Şablon sistemi yükleniyor...', 'ramco');
  }
}

function hizliKisilik() {
  if (typeof kisilikKomutuIsle === 'function') {
    mesajEkle(kisilikKomutuIsle('kişilikler'), 'ramco');
  } else {
    mesajEkle('🎭 Kişilik sistemi yükleniyor...', 'ramco');
  }
}

function hizliTema() {
  if (typeof temaKomutuIsle === 'function') {
    mesajEkle(temaKomutuIsle('temalar'), 'ramco');
  } else {
    mesajEkle('🎨 Tema sistemi yükleniyor...', 'ramco');
  }
}

function hizliYardim() {
  if (typeof superYardimMesaji === 'function') {
    mesajEkle(superYardimMesaji(), 'ramco');
  } else {
    mesajEkle('❓ Yardım yükleniyor...', 'ramco');
  }
}

// ADMİN ÇEKMECESİ FONKSİYONLARI
function adminCekmeceAc() {
  document.getElementById('adminCekmece').classList.add('open');
  document.getElementById('adminOverlay').classList.add('open');
}

function adminCekmeceKapat() {
  document.getElementById('adminCekmece').classList.remove('open');
  document.getElementById('adminOverlay').classList.remove('open');
}