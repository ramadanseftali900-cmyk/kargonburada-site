/* GARİBAN BEYİN - Öğrenen AI Sistemi */

// ==================== HAFIZA SİSTEMİ ====================
var ramcoHafiza = {
  kelimeler: {},      // Öğrenilen kelimeler
  konusmalar: [],     // Geçmiş konuşmalar
  kullanici: {},      // Kullanıcı tercihleri
  ogrenilen: [],      // Öğrenilen kalıplar
  sorular: [],        // Cevaplanmamış sorular
  baglamlar: {}       // Bağlam hafızası
};

// Firebase referansları
var ramcoDB = null;

function ramcoDBBaslat() {
  if (typeof database !== 'undefined') {
    ramcoDB = database.ref('ramco_beyin');
    hafizaYukle();
  }
}

// ==================== HAFIZA KAYIT/YÜKLE ====================
function hafizaKaydet() {
  if (ramcoDB) {
    ramcoDB.set(ramcoHafiza);
  }
  localStorage.setItem('ramco_hafiza', JSON.stringify(ramcoHafiza));
}

function hafizaYukle() {
  // Önce Firebase'den yükle
  if (ramcoDB) {
    ramcoDB.once('value', function(snapshot) {
      var data = snapshot.val();
      if (data) {
        ramcoHafiza = data;
        console.log('GARİBAN hafızası Firebase\'den yüklendi');
      } else {
        // LocalStorage'dan yükle
        var local = localStorage.getItem('ramco_hafiza');
        if (local) {
          ramcoHafiza = JSON.parse(local);
        }
      }
    });
  } else {
    var local = localStorage.getItem('ramco_hafiza');
    if (local) {
      ramcoHafiza = JSON.parse(local);
    }
  }
}


// ==================== KELİME ÖĞRENME ====================
function kelimeOgren(kelime, anlam, kategori) {
  kelime = kelime.toLowerCase().trim();
  
  if (!ramcoHafiza.kelimeler[kelime]) {
    ramcoHafiza.kelimeler[kelime] = {
      anlam: anlam,
      kategori: kategori || 'genel',
      olusturma: new Date().toISOString(),
      kullanim: 0
    };
    hafizaKaydet();
    return true;
  }
  return false;
}

function kelimeBul(kelime) {
  kelime = kelime.toLowerCase().trim();
  if (ramcoHafiza.kelimeler[kelime]) {
    ramcoHafiza.kelimeler[kelime].kullanim++;
    hafizaKaydet();
    return ramcoHafiza.kelimeler[kelime];
  }
  return null;
}

function kelimeSayisi() {
  return Object.keys(ramcoHafiza.kelimeler).length;
}

// ==================== KONUŞMA KAYIT ====================
function konusmaKaydet(kullaniciMesaj, ramcoCevap, basarili) {
  var konusma = {
    tarih: new Date().toISOString(),
    kullanici: kullaniciMesaj,
    ramco: ramcoCevap,
    basarili: basarili !== false,
    ogrenildi: false
  };
  
  ramcoHafiza.konusmalar.push(konusma);
  
  // Son 500 konuşmayı tut
  if (ramcoHafiza.konusmalar.length > 500) {
    ramcoHafiza.konusmalar = ramcoHafiza.konusmalar.slice(-500);
  }
  
  hafizaKaydet();
  
  // Kalıp analizi yap
  kalipAnalizi(kullaniciMesaj, ramcoCevap);
}

function sonKonusmalariAl(adet) {
  adet = adet || 10;
  return ramcoHafiza.konusmalar.slice(-adet);
}


// ==================== KALIP ÖĞRENME ====================
function kalipAnalizi(mesaj, cevap) {
  var kelimeler = mesaj.toLowerCase().split(/\s+/);
  
  kelimeler.forEach(function(kelime) {
    if (kelime.length > 3) {
      if (!ramcoHafiza.baglamlar[kelime]) {
        ramcoHafiza.baglamlar[kelime] = {
          sayac: 0,
          cevaplar: [],
          iliskili: []
        };
      }
      
      ramcoHafiza.baglamlar[kelime].sayac++;
      
      // Cevabı kaydet (max 5 farklı cevap)
      if (!ramcoHafiza.baglamlar[kelime].cevaplar.includes(cevap)) {
        ramcoHafiza.baglamlar[kelime].cevaplar.push(cevap);
        if (ramcoHafiza.baglamlar[kelime].cevaplar.length > 5) {
          ramcoHafiza.baglamlar[kelime].cevaplar.shift();
        }
      }
      
      // İlişkili kelimeleri bul
      kelimeler.forEach(function(diger) {
        if (diger !== kelime && diger.length > 3) {
          if (!ramcoHafiza.baglamlar[kelime].iliskili.includes(diger)) {
            ramcoHafiza.baglamlar[kelime].iliskili.push(diger);
          }
        }
      });
    }
  });
}

function kalipBul(mesaj) {
  var kelimeler = mesaj.toLowerCase().split(/\s+/);
  var enIyiEslesme = null;
  var enYuksekSkor = 0;
  
  kelimeler.forEach(function(kelime) {
    if (ramcoHafiza.baglamlar[kelime] && ramcoHafiza.baglamlar[kelime].sayac > enYuksekSkor) {
      enYuksekSkor = ramcoHafiza.baglamlar[kelime].sayac;
      enIyiEslesme = ramcoHafiza.baglamlar[kelime];
    }
  });
  
  return enIyiEslesme;
}

// ==================== SORU-CEVAP ÖĞRENME ====================
function soruKaydet(soru) {
  if (!ramcoHafiza.sorular.includes(soru)) {
    ramcoHafiza.sorular.push(soru);
    hafizaKaydet();
  }
}

function soruCevapOgren(soru, cevap) {
  // Soruyu kelime olarak kaydet
  kelimeOgren(soru, cevap, 'soru-cevap');
  
  // Sorular listesinden kaldır
  var index = ramcoHafiza.sorular.indexOf(soru);
  if (index > -1) {
    ramcoHafiza.sorular.splice(index, 1);
  }
  
  hafizaKaydet();
  return true;
}


// ==================== AKILLI CEVAP ÜRETİCİ ====================
var ogrenmeModuAktif = false;
var bekleyenOgrenme = null;

function akilliCevapUret(mesaj) {
  var m = mesaj.toLowerCase().trim();
  
  // 1. Öğrenme modu kontrolü
  if (ogrenmeModuAktif && bekleyenOgrenme) {
    return ogrenmeModuCevap(mesaj);
  }
  
  // 2. Öğretme komutları
  if (m.startsWith('öğren:') || m.startsWith('ogren:')) {
    return ogretmeKomutu(mesaj);
  }
  
  // 3. Bilgi sorguları
  if (m.includes('ne demek') || m.includes('nedir') || m.includes('ne anlama')) {
    return bilgiSorgusu(mesaj);
  }
  
  // 4. Öğrenilen kelimelerden ara
  var kelimeCevap = ogrenilmisKelimeAra(m);
  if (kelimeCevap) {
    konusmaKaydet(mesaj, kelimeCevap, true);
    return kelimeCevap;
  }
  
  // 5. Kalıp eşleştirme
  var kalip = kalipBul(m);
  if (kalip && kalip.cevaplar.length > 0 && kalip.sayac > 2) {
    var cevap = kalip.cevaplar[Math.floor(Math.random() * kalip.cevaplar.length)];
    konusmaKaydet(mesaj, cevap, true);
    return cevap;
  }
  
  // 6. Geçmiş konuşmalardan benzer bul
  var benzerCevap = benzerKonusmaBul(m);
  if (benzerCevap) {
    konusmaKaydet(mesaj, benzerCevap, true);
    return benzerCevap;
  }
  
  // 7. Varsayılan cevap üret (mevcut sistem)
  var varsayilanCevap = null;
  if (typeof cevapUret === 'function') {
    varsayilanCevap = cevapUret(mesaj);
  }
  
  // 8. Tanımadığı kelime varsa öğrenme moduna geç
  var bilinmeyenKelime = bilinmeyenKelimeBul(m);
  if (bilinmeyenKelime && !varsayilanCevap) {
    return ogrenmeModuBaslat(bilinmeyenKelime, mesaj);
  }
  
  if (varsayilanCevap) {
    konusmaKaydet(mesaj, varsayilanCevap, true);
    return varsayilanCevap;
  }
  
  // 9. Hiçbir şey bulamadıysa öğrenmeyi teklif et
  return ogrenmeModuBaslat(null, mesaj);
}

function ogrenilmisKelimeAra(mesaj) {
  var kelimeler = mesaj.split(/\s+/);
  
  for (var i = 0; i < kelimeler.length; i++) {
    var kelime = kelimeler[i].toLowerCase();
    var bilgi = kelimeBul(kelime);
    
    if (bilgi && bilgi.kategori === 'soru-cevap') {
      return bilgi.anlam;
    }
  }
  
  // Tam eşleşme ara
  var tamEslesme = kelimeBul(mesaj);
  if (tamEslesme) {
    return tamEslesme.anlam;
  }
  
  return null;
}


// ==================== ÖĞRENME MODU ====================
function ogrenmeModuBaslat(kelime, orijinalMesaj) {
  ogrenmeModuAktif = true;
  bekleyenOgrenme = {
    kelime: kelime,
    mesaj: orijinalMesaj,
    adim: 'cevap_bekle'
  };
  
  soruKaydet(orijinalMesaj);
  
  if (kelime) {
    return '🤔 "' + kelime + '" ne demek bilmiyorum. Bana öğretir misin?\n\n' +
      '💡 Cevabını yaz, ben öğreneyim!\n' +
      '(İptal için "iptal" yaz)';
  } else {
    return '🤔 Bu soruya nasıl cevap vereceğimi bilmiyorum.\n\n' +
      '💡 Bana doğru cevabı öğretir misin?\n' +
      '(İptal için "iptal" yaz)';
  }
}

function ogrenmeModuCevap(mesaj) {
  if (mesaj.toLowerCase() === 'iptal') {
    ogrenmeModuAktif = false;
    bekleyenOgrenme = null;
    return '👍 Tamam, iptal ettim. Başka bir şey sorabilirsn!';
  }
  
  // Cevabı öğren
  var ogrenilecek = bekleyenOgrenme.kelime || bekleyenOgrenme.mesaj;
  soruCevapOgren(ogrenilecek, mesaj);
  
  // Kalıp olarak da kaydet
  konusmaKaydet(bekleyenOgrenme.mesaj, mesaj, true);
  
  ogrenmeModuAktif = false;
  var eskiBekleme = bekleyenOgrenme;
  bekleyenOgrenme = null;
  
  // XP ver
  if (typeof xpEkle === 'function') {
    xpEkle(20);
  }
  
  return '🎉 Harika! Öğrendim!\n\n' +
    '📝 "' + eskiBekleme.mesaj + '" dersen artık bileceğim!\n\n' +
    'Teşekkürler, beni daha akıllı yaptın! 🧠\n' +
    '(Toplam ' + kelimeSayisi() + ' şey öğrendim)';
}

function ogretmeKomutu(mesaj) {
  // Format: öğren: soru = cevap
  var parcalar = mesaj.replace(/öğren:|ogren:/i, '').split('=');
  
  if (parcalar.length !== 2) {
    return '❌ Doğru format: öğren: soru = cevap\n\nÖrnek: öğren: merhaba = Sana da merhaba!';
  }
  
  var soru = parcalar[0].trim();
  var cevap = parcalar[1].trim();
  
  if (soru.length < 2 || cevap.length < 2) {
    return '❌ Soru ve cevap çok kısa!';
  }
  
  soruCevapOgren(soru, cevap);
  
  if (typeof xpEkle === 'function') {
    xpEkle(15);
  }
  
  return '✅ Öğrendim!\n\n' +
    '❓ Soru: "' + soru + '"\n' +
    '💬 Cevap: "' + cevap + '"\n\n' +
    '🧠 Toplam ' + kelimeSayisi() + ' şey biliyorum!';
}


// ==================== BİLGİ SORGULAMA ====================
function bilgiSorgusu(mesaj) {
  var m = mesaj.toLowerCase();
  
  // "X ne demek" formatını bul
  var eslesme = m.match(/(.+?)\s*(ne demek|nedir|ne anlama)/);
  if (eslesme) {
    var aranan = eslesme[1].trim();
    var bilgi = kelimeBul(aranan);
    
    if (bilgi) {
      return '📖 "' + aranan + '" = ' + bilgi.anlam + '\n\n' +
        '(Bu bilgiyi ' + bilgi.kullanim + ' kez kullandım)';
    } else {
      return ogrenmeModuBaslat(aranan, mesaj);
    }
  }
  
  return null;
}

// ==================== BENZER KONUŞMA BULMA ====================
function benzerKonusmaBul(mesaj) {
  var kelimeler = mesaj.toLowerCase().split(/\s+/);
  var enIyiEslesme = null;
  var enYuksekSkor = 0;
  
  ramcoHafiza.konusmalar.forEach(function(konusma) {
    if (konusma.basarili) {
      var konusmaKelimeleri = konusma.kullanici.toLowerCase().split(/\s+/);
      var skor = 0;
      
      kelimeler.forEach(function(k) {
        if (konusmaKelimeleri.includes(k) && k.length > 2) {
          skor++;
        }
      });
      
      // En az 2 kelime eşleşmeli
      if (skor > enYuksekSkor && skor >= 2) {
        enYuksekSkor = skor;
        enIyiEslesme = konusma.ramco;
      }
    }
  });
  
  return enIyiEslesme;
}

// ==================== BİLİNMEYEN KELİME BULMA ====================
var bilenenKelimeler = [
  'merhaba', 'selam', 'nasıl', 'nasılsın', 'naber', 'iyi', 'kötü', 'teşekkür',
  'sağol', 'tamam', 'evet', 'hayır', 'ne', 'kim', 'nerede', 'neden', 'nasıl',
  'sipariş', 'kargo', 'fatura', 'stok', 'müşteri', 'ürün', 'satış', 'para',
  'bugün', 'dün', 'yarın', 'hafta', 'ay', 'yıl', 'gün', 'saat',
  'yardım', 'analiz', 'rapor', 'hedef', 'tahmin', 'motivasyon', 'tavsiye',
  'ben', 'sen', 'biz', 'siz', 'o', 'bu', 'şu', 'bir', 'iki', 'üç',
  'var', 'yok', 'oldu', 'olacak', 'yapıyorum', 'istiyorum', 'lazım',
  'güzel', 'harika', 'süper', 'kötü', 'fena', 'berbat'
];

function bilinmeyenKelimeBul(mesaj) {
  var kelimeler = mesaj.split(/\s+/);
  
  for (var i = 0; i < kelimeler.length; i++) {
    var kelime = kelimeler[i].toLowerCase().replace(/[^a-zğüşıöç]/g, '');
    
    if (kelime.length > 4 && 
        !bilenenKelimeler.includes(kelime) && 
        !ramcoHafiza.kelimeler[kelime]) {
      return kelime;
    }
  }
  
  return null;
}


// ==================== KULLANICI PROFİLİ ====================
function kullaniciProfilGuncelle(ozellik, deger) {
  ramcoHafiza.kullanici[ozellik] = deger;
  hafizaKaydet();
}

function kullaniciProfilAl(ozellik) {
  return ramcoHafiza.kullanici[ozellik];
}

// Kullanıcı davranışlarını analiz et
function davranisAnalizi() {
  var analiz = {
    toplamKonusma: ramcoHafiza.konusmalar.length,
    basariliCevap: 0,
    enCokKonusulan: {},
    aktifSaatler: {},
    tercihler: []
  };
  
  ramcoHafiza.konusmalar.forEach(function(k) {
    if (k.basarili) analiz.basariliCevap++;
    
    // En çok konuşulan konular
    var kelimeler = k.kullanici.toLowerCase().split(/\s+/);
    kelimeler.forEach(function(kel) {
      if (kel.length > 3) {
        analiz.enCokKonusulan[kel] = (analiz.enCokKonusulan[kel] || 0) + 1;
      }
    });
    
    // Aktif saatler
    var saat = new Date(k.tarih).getHours();
    analiz.aktifSaatler[saat] = (analiz.aktifSaatler[saat] || 0) + 1;
  });
  
  return analiz;
}

// ==================== İSTATİSTİKLER ====================
function ramcoIstatistik() {
  var davranis = davranisAnalizi();
  
  return {
    ogrenilen: kelimeSayisi(),
    konusmaSayisi: ramcoHafiza.konusmalar.length,
    basariOrani: davranis.toplamKonusma > 0 ? 
      Math.round((davranis.basariliCevap / davranis.toplamKonusma) * 100) : 0,
    bekleyenSoru: ramcoHafiza.sorular.length,
    baglamSayisi: Object.keys(ramcoHafiza.baglamlar).length
  };
}

// ==================== GARİBAN DURUMU ====================
function ramcoDurumMesaji() {
  var istat = ramcoIstatistik();
  
  var mesaj = '🧠 GARİBAN BEYİN DURUMU\n\n';
  mesaj += '📚 Öğrenilen: ' + istat.ogrenilen + ' şey\n';
  mesaj += '💬 Konuşma: ' + istat.konusmaSayisi + ' mesaj\n';
  mesaj += '✅ Başarı: %' + istat.basariOrani + '\n';
  mesaj += '❓ Bekleyen soru: ' + istat.bekleyenSoru + '\n';
  mesaj += '🔗 Bağlam: ' + istat.baglamSayisi + ' kelime\n\n';
  
  if (istat.ogrenilen < 10) {
    mesaj += '💡 Bana daha çok şey öğret! "öğren: soru = cevap" formatını kullan.';
  } else if (istat.ogrenilen < 50) {
    mesaj += '📈 İyi gidiyorum! Daha çok konuşarak öğrenmeye devam ediyorum.';
  } else {
    mesaj += '🔥 Çok şey öğrendim! Artık daha akıllıyım!';
  }
  
  return mesaj;
}


// ==================== ÖĞRENME KOMUTLARI ====================
function ogrenmeKomutlariIsle(mesaj) {
  var m = mesaj.toLowerCase().trim();
  
  // Beyin durumu
  if (m === 'beyin' || m === 'beyin durumu' || m.includes('ne öğrendin')) {
    return ramcoDurumMesaji();
  }
  
  // Öğrenilenleri listele
  if (m === 'öğrenilenler' || m === 'liste' || m.includes('neler biliyorsun')) {
    return ogrenilenleriListele();
  }
  
  // Bir şeyi unut
  if (m.startsWith('unut:') || m.startsWith('sil:')) {
    var silinecek = m.replace(/unut:|sil:/i, '').trim();
    return kelimeUnut(silinecek);
  }
  
  // Hafızayı temizle
  if (m === 'hafızayı sil' || m === 'hafizayi sil' || m === 'sıfırla') {
    return hafizaSifirlaOnay();
  }
  
  // Bekleyen soruları göster
  if (m.includes('bekleyen soru')) {
    return bekleyenSorulariGoster();
  }
  
  return null;
}

function ogrenilenleriListele() {
  var kelimeler = Object.keys(ramcoHafiza.kelimeler);
  
  if (kelimeler.length === 0) {
    return '📭 Henüz hiçbir şey öğrenmedim.\n\n💡 "öğren: soru = cevap" ile öğretebilirsin!';
  }
  
  var mesaj = '📚 ÖĞRENDİKLERİM (' + kelimeler.length + ' adet)\n\n';
  
  kelimeler.slice(0, 20).forEach(function(k) {
    var bilgi = ramcoHafiza.kelimeler[k];
    mesaj += '• ' + k + ' → ' + bilgi.anlam.substring(0, 30) + '...\n';
  });
  
  if (kelimeler.length > 20) {
    mesaj += '\n... ve ' + (kelimeler.length - 20) + ' tane daha!';
  }
  
  return mesaj;
}

function kelimeUnut(kelime) {
  kelime = kelime.toLowerCase().trim();
  
  if (ramcoHafiza.kelimeler[kelime]) {
    delete ramcoHafiza.kelimeler[kelime];
    hafizaKaydet();
    return '🗑️ "' + kelime + '" bilgisini unuttum.';
  }
  
  return '❓ "' + kelime + '" zaten bilmiyordum.';
}

function hafizaSifirlaOnay() {
  return '⚠️ Tüm hafızamı silmek istediğine emin misin?\n\n' +
    'Bu işlem geri alınamaz!\n\n' +
    '"evet sıfırla" yaz onaylamak için.';
}

function bekleyenSorulariGoster() {
  if (ramcoHafiza.sorular.length === 0) {
    return '✅ Bekleyen soru yok! Her şeyi biliyorum 😎';
  }
  
  var mesaj = '❓ BEKLEYEN SORULAR (' + ramcoHafiza.sorular.length + ' adet)\n\n';
  
  ramcoHafiza.sorular.slice(0, 10).forEach(function(s, i) {
    mesaj += (i + 1) + '. ' + s + '\n';
  });
  
  mesaj += '\n💡 Bu soruları "öğren: soru = cevap" ile cevaplayabilirsin!';
  
  return mesaj;
}


// ==================== ANA CEVAP FONKSİYONU ====================
function ramcoAkilliCevap(mesaj) {
  // Önce öğrenme komutlarını kontrol et
  var komutCevap = ogrenmeKomutlariIsle(mesaj);
  if (komutCevap) {
    return komutCevap;
  }
  
  // Hafıza sıfırlama onayı
  if (mesaj.toLowerCase() === 'evet sıfırla') {
    ramcoHafiza = {
      kelimeler: {},
      konusmalar: [],
      kullanici: {},
      ogrenilen: [],
      sorular: [],
      baglamlar: {}
    };
    hafizaKaydet();
    return '🔄 Hafızam sıfırlandı. Yeniden öğrenmeye hazırım!';
  }
  
  // Akıllı cevap üret
  return akilliCevapUret(mesaj);
}

// ==================== BAŞLATMA ====================
function ramcoBeyniniBaslat() {
  ramcoDBBaslat();
  
  // Varsayılan kelimeler ekle
  var varsayilanlar = {
    'günaydın': 'Günaydın! Bugün harika bir gün olacak! ☀️',
    'iyi geceler': 'İyi geceler! Tatlı rüyalar! 🌙',
    'teşekkürler': 'Rica ederim! Her zaman yardıma hazırım! 😊',
    'nasıl çalışıyorsun': 'Ben yapay zeka destekli bir asistanım. Seninle konuştukça öğreniyorum!',
    'seni kim yaptı': 'Beni sen ve geliştirici birlikte yarattık! Her konuşmada daha akıllı oluyorum.',
    'kaç yaşındasın': 'Ben bir AI\'yım, yaşım yok ama her gün yeni şeyler öğreniyorum!'
  };
  
  Object.keys(varsayilanlar).forEach(function(k) {
    if (!ramcoHafiza.kelimeler[k]) {
      kelimeOgren(k, varsayilanlar[k], 'varsayilan');
    }
  });
  
  console.log('🧠 GARİBAN Beyni başlatıldı! Öğrenilen: ' + kelimeSayisi());
}

// Sayfa yüklenince başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ramcoBeyniniBaslat);
} else {
  ramcoBeyniniBaslat();
}


// ==================== HIZLI ÖĞRENME SİSTEMİ ====================

// Otomatik kalıp tanıma
function otomatikKalipOgren(mesaj, cevap) {
  var kelimeler = mesaj.toLowerCase().split(/\s+/);
  
  // 2+ kelimelik kalıpları öğren
  for (var i = 0; i < kelimeler.length - 1; i++) {
    var kalip = kelimeler[i] + ' ' + kelimeler[i + 1];
    if (kalip.length > 5) {
      if (!ramcoHafiza.kelimeler[kalip]) {
        ramcoHafiza.kelimeler[kalip] = {
          anlam: cevap,
          kategori: 'otomatik-kalip',
          olusturma: new Date().toISOString(),
          kullanim: 1
        };
      } else {
        ramcoHafiza.kelimeler[kalip].kullanim++;
      }
    }
  }
  
  hafizaKaydet();
}

// Duygu analizi
function duyguAnalizi(mesaj) {
  var m = mesaj.toLowerCase();
  
  var olumlu = ['güzel', 'harika', 'süper', 'teşekkür', 'sağol', 'iyi', 'mutlu', 'sevindim', 'başardım'];
  var olumsuz = ['kötü', 'berbat', 'üzgün', 'mutsuz', 'sinirli', 'kızgın', 'yorgun', 'sıkıldım', 'olmadı'];
  var soru = ['ne', 'nasıl', 'neden', 'kim', 'nerede', 'kaç', 'mi', 'mı', 'mu', 'mü'];
  
  var olumluSkor = 0;
  var olumsuzSkor = 0;
  var soruSkor = 0;
  
  olumlu.forEach(function(k) { if (m.includes(k)) olumluSkor++; });
  olumsuz.forEach(function(k) { if (m.includes(k)) olumsuzSkor++; });
  soru.forEach(function(k) { if (m.includes(k)) soruSkor++; });
  
  if (olumsuzSkor > olumluSkor) return 'olumsuz';
  if (olumluSkor > olumsuzSkor) return 'olumlu';
  if (soruSkor > 0) return 'soru';
  return 'notr';
}

// Duyguya göre cevap ayarla
function duyguyaGoreCevap(mesaj, cevap) {
  var duygu = duyguAnalizi(mesaj);
  
  if (duygu === 'olumsuz') {
    var teselli = [
      '\n\n💪 Üzülme, her şey düzelecek!',
      '\n\n🤗 Yanındayım, birlikte başaracağız!',
      '\n\n✨ Yarın daha iyi olacak!'
    ];
    return cevap + teselli[Math.floor(Math.random() * teselli.length)];
  }
  
  if (duygu === 'olumlu') {
    var kutlama = [
      ' 🎉',
      ' 🔥',
      ' 💪'
    ];
    return cevap + kutlama[Math.floor(Math.random() * kutlama.length)];
  }
  
  return cevap;
}

// Bağlam hafızası - son konuşmayı hatırla
var sonKonusmaBaglami = null;

function baglamliCevap(mesaj) {
  var m = mesaj.toLowerCase();
  
  // "O", "bu", "şu" gibi referansları çöz
  if (sonKonusmaBaglami && (m.includes(' o ') || m.includes(' bu ') || m.includes(' şu ') || m === 'evet' || m === 'hayır')) {
    // Son konuşmaya referans
    return 'Son konuştuğumuz konu: ' + sonKonusmaBaglami.konu + ' hakkında mı soruyorsun?';
  }
  
  return null;
}

// Kişiselleştirme - kullanıcı tercihlerini öğren
function kisiselTercihOgren(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Tercih kalıpları
  if (m.includes('seviyorum') || m.includes('severim')) {
    var ne = m.replace(/.*seviyorum|.*severim/, '').trim();
    if (ne) {
      ramcoHafiza.kullanici.sevdikleri = ramcoHafiza.kullanici.sevdikleri || [];
      if (!ramcoHafiza.kullanici.sevdikleri.includes(ne)) {
        ramcoHafiza.kullanici.sevdikleri.push(ne);
        hafizaKaydet();
      }
    }
  }
  
  if (m.includes('sevmiyorum') || m.includes('sevmem')) {
    var ne2 = m.replace(/.*sevmiyorum|.*sevmem/, '').trim();
    if (ne2) {
      ramcoHafiza.kullanici.sevmedikleri = ramcoHafiza.kullanici.sevmedikleri || [];
      if (!ramcoHafiza.kullanici.sevmedikleri.includes(ne2)) {
        ramcoHafiza.kullanici.sevmedikleri.push(ne2);
        hafizaKaydet();
      }
    }
  }
  
  // İsim öğren
  if (m.includes('benim adım') || m.includes('adım')) {
    var isimMatch = m.match(/adım\s+(\w+)/);
    if (isimMatch) {
      ramcoHafiza.kullanici.isim = isimMatch[1];
      localStorage.setItem('kullanici_isim', isimMatch[1]);
      hafizaKaydet();
      return 'Memnun oldum ' + isimMatch[1] + '! 😊 Artık seni tanıyorum!';
    }
  }
  
  return null;
}


// ==================== GELİŞMİŞ AKILLI CEVAP ====================

// Ana cevap fonksiyonunu güncelle
var eskiAkilliCevap = akilliCevapUret;

akilliCevapUret = function(mesaj) {
  var m = mesaj.toLowerCase().trim();
  
  // 1. Kişisel tercih öğrenme
  var kisiselCevap = kisiselTercihOgren(mesaj);
  if (kisiselCevap) {
    konusmaKaydet(mesaj, kisiselCevap, true);
    return kisiselCevap;
  }
  
  // 2. Bağlamlı cevap kontrolü
  var baglamCevap = baglamliCevap(mesaj);
  if (baglamCevap) {
    return baglamCevap;
  }
  
  // 3. Öğrenme modu kontrolü
  if (ogrenmeModuAktif && bekleyenOgrenme) {
    var cevap = ogrenmeModuCevap(mesaj);
    // Otomatik kalıp öğren
    otomatikKalipOgren(bekleyenOgrenme.mesaj, mesaj);
    return cevap;
  }
  
  // 4. Öğretme komutları
  if (m.startsWith('öğren:') || m.startsWith('ogren:')) {
    return ogretmeKomutu(mesaj);
  }
  
  // 5. Bilgi sorguları
  if (m.includes('ne demek') || m.includes('nedir') || m.includes('ne anlama')) {
    var bilgiCevap = bilgiSorgusu(mesaj);
    if (bilgiCevap) return bilgiCevap;
  }
  
  // 6. Öğrenilen kelimelerden ara (tam eşleşme)
  var tamEslesme = kelimeBul(m);
  if (tamEslesme) {
    var cevap = duyguyaGoreCevap(mesaj, tamEslesme.anlam);
    konusmaKaydet(mesaj, cevap, true);
    sonKonusmaBaglami = { konu: m, cevap: cevap };
    return cevap;
  }
  
  // 7. Kısmi eşleşme ara
  var kismiCevap = kismiEslesmeBul(m);
  if (kismiCevap) {
    var cevap = duyguyaGoreCevap(mesaj, kismiCevap);
    konusmaKaydet(mesaj, cevap, true);
    return cevap;
  }
  
  // 8. Kalıp eşleştirme
  var kalip = kalipBul(m);
  if (kalip && kalip.cevaplar.length > 0 && kalip.sayac > 1) {
    var cevap = kalip.cevaplar[Math.floor(Math.random() * kalip.cevaplar.length)];
    cevap = duyguyaGoreCevap(mesaj, cevap);
    konusmaKaydet(mesaj, cevap, true);
    return cevap;
  }
  
  // 9. Benzer konuşma bul
  var benzerCevap = benzerKonusmaBul(m);
  if (benzerCevap) {
    benzerCevap = duyguyaGoreCevap(mesaj, benzerCevap);
    konusmaKaydet(mesaj, benzerCevap, true);
    return benzerCevap;
  }
  
  // 10. Varsayılan cevap üret
  var varsayilanCevap = null;
  if (typeof cevapUret === 'function') {
    varsayilanCevap = cevapUret(mesaj);
    
    // Varsayılan cevap verdiyse kaydet
    if (varsayilanCevap && !varsayilanCevap.includes('bilmiyorum')) {
      konusmaKaydet(mesaj, varsayilanCevap, true);
      // Otomatik öğren
      otomatikKalipOgren(mesaj, varsayilanCevap);
      return duyguyaGoreCevap(mesaj, varsayilanCevap);
    }
  }
  
  // 11. Hiçbir şey bulamadıysa öğrenme moduna geç
  // Ama çok sık sormasın - sadece uzun mesajlarda
  if (m.split(' ').length > 3) {
    return ogrenmeModuBaslat(null, mesaj);
  }
  
  // Kısa mesajlarda varsayılan cevap ver
  var kisaCevaplar = [
    'Anlıyorum! 😊',
    'Tamam! 👍',
    'Devam et, dinliyorum! 👂',
    'Hmm, ilginç! 🤔'
  ];
  var cevap = kisaCevaplar[Math.floor(Math.random() * kisaCevaplar.length)];
  konusmaKaydet(mesaj, cevap, true);
  return cevap;
};

// Kısmi eşleşme bulma
function kismiEslesmeBul(mesaj) {
  var kelimeler = Object.keys(ramcoHafiza.kelimeler);
  var enIyiEslesme = null;
  var enYuksekSkor = 0;
  
  kelimeler.forEach(function(k) {
    if (mesaj.includes(k) || k.includes(mesaj)) {
      var skor = Math.min(mesaj.length, k.length) / Math.max(mesaj.length, k.length);
      if (skor > enYuksekSkor && skor > 0.5) {
        enYuksekSkor = skor;
        enIyiEslesme = ramcoHafiza.kelimeler[k].anlam;
      }
    }
  });
  
  return enIyiEslesme;
}


// ==================== AKILLI ÖNERİ SİSTEMİ ====================

function akilliOneriUret() {
  var oneriler = [];
  var saat = new Date().getHours();
  var gun = new Date().getDay();
  
  // Saat bazlı öneriler
  if (saat >= 9 && saat <= 11) {
    oneriler.push('☀️ Günaydın! Bugünkü siparişleri kontrol etmeye ne dersin?');
  }
  if (saat >= 14 && saat <= 16) {
    oneriler.push('📦 Öğleden sonra kargo zamanı! Bekleyen kargolar var mı?');
  }
  if (saat >= 20) {
    oneriler.push('📊 Günün özeti için "günlük özet" de!');
  }
  
  // Gün bazlı öneriler
  if (gun === 1) { // Pazartesi
    oneriler.push('💪 Yeni hafta, yeni hedefler! Bu hafta kaç sipariş hedefliyorsun?');
  }
  if (gun === 5) { // Cuma
    oneriler.push('🎉 Hafta sonu yaklaşıyor! Kampanya düşünür müsün?');
  }
  if (gun === 0 || gun === 6) { // Hafta sonu
    oneriler.push('📱 Hafta sonu sosyal medya paylaşımı zamanı!');
  }
  
  // Rastgele e-ticaret önerileri
  var eticaretOnerileri = [
    '💡 Ürün açıklamalarını güncelledin mi?',
    '📸 Yeni ürün fotoğrafları çekmeye ne dersin?',
    '⭐ Müşteri yorumlarını kontrol et!',
    '🏷️ İndirim kampanyası düşünür müsün?',
    '📧 Müşterilere teşekkür mesajı gönder!',
    '🔍 Rakiplerini kontrol ettin mi bugün?',
    '📊 Hangi ürün en çok satıyor? Analiz et!',
    '🚀 Yeni ürün eklemeyi düşünür müsün?'
  ];
  
  oneriler.push(eticaretOnerileri[Math.floor(Math.random() * eticaretOnerileri.length)]);
  
  return oneriler[Math.floor(Math.random() * oneriler.length)];
}

// ==================== HATIRLATMA SİSTEMİ ====================

var hatirlatmalar = [];

function hatirlatmaEkle(mesaj, dakika) {
  var id = Date.now();
  var zaman = Date.now() + (dakika * 60 * 1000);
  
  hatirlatmalar.push({
    id: id,
    mesaj: mesaj,
    zaman: zaman,
    aktif: true
  });
  
  // LocalStorage'a kaydet
  localStorage.setItem('ramco_hatirlatmalar', JSON.stringify(hatirlatmalar));
  
  // Zamanlayıcı kur
  setTimeout(function() {
    hatirlatmaGoster(id);
  }, dakika * 60 * 1000);
  
  return id;
}

function hatirlatmaGoster(id) {
  var hatirlatma = hatirlatmalar.find(function(h) { return h.id === id; });
  if (hatirlatma && hatirlatma.aktif) {
    // Bildirim göster
    if (typeof widgetBildirimGoster === 'function') {
      widgetBildirimGoster('⏰ HATIRLATMA: ' + hatirlatma.mesaj);
    }
    
    // Sesli uyarı
    if (typeof widgetKonusma === 'function') {
      widgetKonusma('Hatırlatma: ' + hatirlatma.mesaj);
    }
    
    hatirlatma.aktif = false;
    localStorage.setItem('ramco_hatirlatmalar', JSON.stringify(hatirlatmalar));
  }
}

function hatirlatmalariYukle() {
  var kayitli = localStorage.getItem('ramco_hatirlatmalar');
  if (kayitli) {
    hatirlatmalar = JSON.parse(kayitli);
    
    // Aktif hatırlatmaları kontrol et
    var simdi = Date.now();
    hatirlatmalar.forEach(function(h) {
      if (h.aktif && h.zaman > simdi) {
        var kalan = h.zaman - simdi;
        setTimeout(function() { hatirlatmaGoster(h.id); }, kalan);
      }
    });
  }
}

// Hatırlatma komutu işle
function hatirlatmaKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  // "X dakika sonra hatırlat: mesaj" formatı
  var match = m.match(/(\d+)\s*(dakika|dk|saat|sa)\s*(sonra)?\s*(hatırlat|hatırlat:)?\s*:?\s*(.+)/);
  
  if (match) {
    var miktar = parseInt(match[1]);
    var birim = match[2];
    var icerik = match[5] || 'Hatırlatma';
    
    if (birim.includes('saat') || birim === 'sa') {
      miktar = miktar * 60;
    }
    
    hatirlatmaEkle(icerik, miktar);
    return '⏰ Tamam! ' + miktar + ' dakika sonra hatırlatacağım: "' + icerik + '"';
  }
  
  return null;
}


// ==================== MİNİ OYUNLAR ====================

var oyunAktif = false;
var oyunTuru = null;
var oyunSkor = 0;
var oyunSoru = null;

function miniOyunBaslat(tur) {
  oyunAktif = true;
  oyunTuru = tur;
  oyunSkor = 0;
  
  if (tur === 'matematik') {
    return matematikSorusu();
  } else if (tur === 'kelime') {
    return kelimeOyunu();
  } else if (tur === 'tahmin') {
    return tahminOyunu();
  }
  
  return 'Hangi oyun oynamak istersin?\n\n🔢 "matematik" - Hızlı hesap\n📝 "kelime" - Kelime bulmaca\n🎯 "tahmin" - Sayı tahmin';
}

function matematikSorusu() {
  var a = Math.floor(Math.random() * 50) + 1;
  var b = Math.floor(Math.random() * 50) + 1;
  var islemler = ['+', '-', '*'];
  var islem = islemler[Math.floor(Math.random() * islemler.length)];
  
  var sonuc;
  if (islem === '+') sonuc = a + b;
  else if (islem === '-') sonuc = a - b;
  else sonuc = a * b;
  
  oyunSoru = { tip: 'matematik', cevap: sonuc };
  
  return '🔢 MATEMATİK OYUNU\n\n' + a + ' ' + islem + ' ' + b + ' = ?\n\n(Cevabı yaz veya "çık" de)';
}

function kelimeOyunu() {
  var kelimeler = [
    { kelime: 'SİPARİŞ', ipucu: 'Müşteriden gelen talep' },
    { kelime: 'KARGO', ipucu: 'Ürünü müşteriye ulaştırır' },
    { kelime: 'FATURA', ipucu: 'Satış belgesi' },
    { kelime: 'STOK', ipucu: 'Depodaki ürün miktarı' },
    { kelime: 'MÜŞTERİ', ipucu: 'Alışveriş yapan kişi' },
    { kelime: 'KAMPANYA', ipucu: 'İndirim dönemi' },
    { kelime: 'SATIŞ', ipucu: 'Ürün verip para alma' },
    { kelime: 'ÜRÜN', ipucu: 'Satılan şey' }
  ];
  
  var secilen = kelimeler[Math.floor(Math.random() * kelimeler.length)];
  var karisik = secilen.kelime.split('').sort(function() { return Math.random() - 0.5; }).join('');
  
  oyunSoru = { tip: 'kelime', cevap: secilen.kelime };
  
  return '📝 KELİME OYUNU\n\nKarışık harfler: ' + karisik + '\nİpucu: ' + secilen.ipucu + '\n\n(Kelimeyi yaz veya "çık" de)';
}

function tahminOyunu() {
  var sayi = Math.floor(Math.random() * 100) + 1;
  oyunSoru = { tip: 'tahmin', cevap: sayi, deneme: 0 };
  
  return '🎯 SAYI TAHMİN OYUNU\n\n1-100 arası bir sayı tuttum.\nTahmin et!\n\n(Sayı yaz veya "çık" de)';
}

function oyunCevapKontrol(cevap) {
  if (!oyunAktif || !oyunSoru) return null;
  
  var c = cevap.toLowerCase().trim();
  
  if (c === 'çık' || c === 'cik' || c === 'bırak') {
    oyunAktif = false;
    oyunSoru = null;
    return '👋 Oyun bitti! Skor: ' + oyunSkor + ' puan\n\nTekrar oynamak için "oyun" yaz!';
  }
  
  if (oyunSoru.tip === 'matematik') {
    if (parseInt(c) === oyunSoru.cevap) {
      oyunSkor += 10;
      if (typeof xpEkle === 'function') xpEkle(5);
      return '✅ Doğru! +10 puan\nToplam: ' + oyunSkor + '\n\n' + matematikSorusu();
    } else {
      return '❌ Yanlış! Doğru cevap: ' + oyunSoru.cevap + '\n\n' + matematikSorusu();
    }
  }
  
  if (oyunSoru.tip === 'kelime') {
    if (c.toUpperCase() === oyunSoru.cevap) {
      oyunSkor += 20;
      if (typeof xpEkle === 'function') xpEkle(10);
      return '✅ Doğru! +20 puan\nToplam: ' + oyunSkor + '\n\n' + kelimeOyunu();
    } else {
      return '❌ Yanlış! Tekrar dene veya "çık" de.';
    }
  }
  
  if (oyunSoru.tip === 'tahmin') {
    var tahmin = parseInt(c);
    oyunSoru.deneme++;
    
    if (tahmin === oyunSoru.cevap) {
      var puan = Math.max(50 - (oyunSoru.deneme * 5), 10);
      oyunSkor += puan;
      if (typeof xpEkle === 'function') xpEkle(15);
      return '🎉 Doğru! ' + oyunSoru.deneme + ' denemede buldun!\n+' + puan + ' puan\nToplam: ' + oyunSkor + '\n\n' + tahminOyunu();
    } else if (tahmin < oyunSoru.cevap) {
      return '⬆️ Daha büyük! (Deneme: ' + oyunSoru.deneme + ')';
    } else {
      return '⬇️ Daha küçük! (Deneme: ' + oyunSoru.deneme + ')';
    }
  }
  
  return null;
}


// ==================== GÜNLÜK RAPOR SİSTEMİ ====================

function gunlukRaporOlustur(callback) {
  if (typeof database === 'undefined') {
    callback('📊 Veritabanı bağlantısı yok!');
    return;
  }
  
  var bugun = new Date().toLocaleDateString('tr-TR');
  var rapor = {
    tarih: bugun,
    siparis: 0,
    ciro: 0,
    bekleyenKargo: 0,
    bekleyenFatura: 0,
    enCokSatan: null
  };
  
  database.ref('siparisler').once('value', function(snapshot) {
    var urunSayilari = {};
    
    snapshot.forEach(function(child) {
      var s = child.val();
      
      if (s.tarih === bugun) {
        rapor.siparis++;
        rapor.ciro += parseInt((s.tutar || '0').replace(/[^0-9]/g, '')) || 0;
      }
      
      if (!s.durum || s.durum === 'Bekliyor') rapor.bekleyenKargo++;
      if (!s.faturaKesildi) rapor.bekleyenFatura++;
      
      var urun = s.urun || 'Bilinmeyen';
      urunSayilari[urun] = (urunSayilari[urun] || 0) + 1;
    });
    
    // En çok satan
    var maxSatis = 0;
    Object.keys(urunSayilari).forEach(function(u) {
      if (urunSayilari[u] > maxSatis) {
        maxSatis = urunSayilari[u];
        rapor.enCokSatan = u;
      }
    });
    
    // Rapor mesajı oluştur
    var mesaj = '📊 GÜNLÜK RAPOR - ' + bugun + '\n';
    mesaj += '═══════════════════════\n\n';
    mesaj += '📦 Bugün Sipariş: ' + rapor.siparis + '\n';
    mesaj += '💰 Bugün Ciro: ' + rapor.ciro.toLocaleString('tr-TR') + '₺\n';
    mesaj += '🚚 Bekleyen Kargo: ' + rapor.bekleyenKargo + '\n';
    mesaj += '🧾 Bekleyen Fatura: ' + rapor.bekleyenFatura + '\n';
    
    if (rapor.enCokSatan) {
      mesaj += '🏆 En Çok Satan: ' + rapor.enCokSatan + '\n';
    }
    
    mesaj += '\n═══════════════════════\n';
    
    // Değerlendirme
    if (rapor.siparis >= 10) {
      mesaj += '🔥 MUHTEŞEM! Bugün çok iyi geçti!';
    } else if (rapor.siparis >= 5) {
      mesaj += '👍 İyi bir gün! Devam et!';
    } else if (rapor.siparis > 0) {
      mesaj += '💪 Fena değil, yarın daha iyi olacak!';
    } else {
      mesaj += '📢 Bugün sipariş yok. Kampanya zamanı!';
    }
    
    callback(mesaj);
  });
}

// ==================== SABAH RAPORU ====================

function sabahRaporuKontrol() {
  var sonRapor = localStorage.getItem('ramco_son_sabah_rapor');
  var bugun = new Date().toDateString();
  var saat = new Date().getHours();
  
  // Sabah 9'da ve henüz rapor verilmediyse
  if (saat >= 9 && saat <= 10 && sonRapor !== bugun) {
    localStorage.setItem('ramco_son_sabah_rapor', bugun);
    
    var mesaj = '☀️ GÜNAYDIN PATRON!\n\n';
    mesaj += akilliOneriUret() + '\n\n';
    mesaj += 'Bugün harika bir gün olacak! 💪';
    
    if (typeof widgetBildirimGoster === 'function') {
      widgetBildirimGoster(mesaj);
    }
    
    return mesaj;
  }
  
  return null;
}

// ==================== KOMUT İŞLEYİCİ GÜNCELLEMESİ ====================

var eskiOgrenmeKomutlari = ogrenmeKomutlariIsle;

ogrenmeKomutlariIsle = function(mesaj) {
  var m = mesaj.toLowerCase().trim();
  
  // Oyun komutları
  if (m === 'oyun' || m === 'oyna' || m.includes('oyun oyna')) {
    return miniOyunBaslat(null);
  }
  if (m === 'matematik' || m === 'kelime' || m === 'tahmin') {
    return miniOyunBaslat(m);
  }
  
  // Oyun aktifse cevap kontrol
  if (oyunAktif) {
    var oyunCevap = oyunCevapKontrol(mesaj);
    if (oyunCevap) return oyunCevap;
  }
  
  // Hatırlatma komutları
  if (m.includes('hatırlat') || m.includes('hatırlat:')) {
    var hatirlatmaCevap = hatirlatmaKomutuIsle(mesaj);
    if (hatirlatmaCevap) return hatirlatmaCevap;
  }
  
  // Günlük rapor
  if (m === 'rapor' || m === 'günlük rapor' || m === 'gunluk rapor') {
    gunlukRaporOlustur(function(rapor) {
      if (typeof mesajEkle === 'function') {
        mesajEkle(rapor, 'ramco');
      } else if (typeof widgetMesajEkle === 'function') {
        widgetMesajEkle(rapor, 'ramco');
      }
    });
    return '📊 Günlük rapor hazırlanıyor...';
  }
  
  // Öneri
  if (m === 'öneri' || m === 'oneri' || m.includes('ne yapmalı')) {
    return akilliOneriUret();
  }
  
  // Eski komutları çalıştır
  return eskiOgrenmeKomutlari(mesaj);
};

// Hatırlatmaları yükle
hatirlatmalariYukle();

// Sabah raporu kontrolü
setInterval(sabahRaporuKontrol, 60000);


// ==================== NOT ALMA SİSTEMİ ====================

var notlar = [];

function notlariYukle() {
  var kayitli = localStorage.getItem('ramco_notlar');
  if (kayitli) {
    notlar = JSON.parse(kayitli);
  }
}

function notKaydet() {
  localStorage.setItem('ramco_notlar', JSON.stringify(notlar));
  if (ramcoDB) {
    ramcoDB.child('notlar').set(notlar);
  }
}

function notEkle(icerik) {
  var not = {
    id: Date.now(),
    icerik: icerik,
    tarih: new Date().toLocaleString('tr-TR'),
    onemli: icerik.includes('!') || icerik.toLowerCase().includes('önemli')
  };
  
  notlar.unshift(not);
  notKaydet();
  return not;
}

function notSil(id) {
  notlar = notlar.filter(function(n) { return n.id !== id; });
  notKaydet();
}

function notlariListele() {
  if (notlar.length === 0) {
    return '📝 Henüz not yok.\n\n💡 "not al: mesajın" yazarak not ekleyebilirsin!';
  }
  
  var mesaj = '📝 NOTLARIN (' + notlar.length + ' adet)\n\n';
  
  notlar.slice(0, 10).forEach(function(n, i) {
    var onemliIsaret = n.onemli ? '⭐ ' : '';
    mesaj += (i + 1) + '. ' + onemliIsaret + n.icerik + '\n';
    mesaj += '   📅 ' + n.tarih + '\n\n';
  });
  
  if (notlar.length > 10) {
    mesaj += '... ve ' + (notlar.length - 10) + ' not daha';
  }
  
  return mesaj;
}

function notKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Not ekle
  if (m.startsWith('not al:') || m.startsWith('not ekle:') || m.startsWith('kaydet:')) {
    var icerik = mesaj.replace(/not al:|not ekle:|kaydet:/i, '').trim();
    if (icerik.length < 2) {
      return '❌ Not içeriği çok kısa!';
    }
    notEkle(icerik);
    return '✅ Not kaydedildi!\n\n📝 "' + icerik + '"\n\n💡 Notlarını görmek için "notlar" yaz.';
  }
  
  // Notları listele
  if (m === 'notlar' || m === 'notlarım' || m === 'not listesi') {
    return notlariListele();
  }
  
  // Not sil
  if (m.startsWith('not sil:') || m.startsWith('notu sil:')) {
    var silinecek = m.replace(/not sil:|notu sil:/i, '').trim();
    var silinecekNot = notlar.find(function(n) { 
      return n.icerik.toLowerCase().includes(silinecek); 
    });
    
    if (silinecekNot) {
      notSil(silinecekNot.id);
      return '🗑️ Not silindi: "' + silinecekNot.icerik + '"';
    }
    return '❌ Bu not bulunamadı!';
  }
  
  // Tüm notları sil
  if (m === 'tüm notları sil' || m === 'notları temizle') {
    notlar = [];
    notKaydet();
    return '🗑️ Tüm notlar silindi!';
  }
  
  return null;
}

notlariYukle();


// ==================== TAKVİM SİSTEMİ ====================

var takvimEtkinlikleri = [];

function takvimYukle() {
  var kayitli = localStorage.getItem('ramco_takvim');
  if (kayitli) {
    takvimEtkinlikleri = JSON.parse(kayitli);
  }
}

function takvimKaydet() {
  localStorage.setItem('ramco_takvim', JSON.stringify(takvimEtkinlikleri));
}

function etkinlikEkle(tarih, icerik) {
  var etkinlik = {
    id: Date.now(),
    tarih: tarih,
    icerik: icerik,
    olusturma: new Date().toISOString()
  };
  
  takvimEtkinlikleri.push(etkinlik);
  takvimKaydet();
  return etkinlik;
}

function bugunEtkinlikler() {
  var bugun = new Date().toLocaleDateString('tr-TR');
  return takvimEtkinlikleri.filter(function(e) { return e.tarih === bugun; });
}

function yarinEtkinlikler() {
  var yarin = new Date();
  yarin.setDate(yarin.getDate() + 1);
  var yarinStr = yarin.toLocaleDateString('tr-TR');
  return takvimEtkinlikleri.filter(function(e) { return e.tarih === yarinStr; });
}

function takvimKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Etkinlik ekle
  if (m.includes('takvime ekle:') || m.includes('etkinlik ekle:')) {
    var parcalar = mesaj.replace(/takvime ekle:|etkinlik ekle:/i, '').trim();
    // Format: tarih - içerik veya sadece içerik (bugün için)
    
    var tarih, icerik;
    if (parcalar.includes(' - ')) {
      var bolunmus = parcalar.split(' - ');
      tarih = bolunmus[0].trim();
      icerik = bolunmus[1].trim();
    } else {
      tarih = new Date().toLocaleDateString('tr-TR');
      icerik = parcalar;
    }
    
    etkinlikEkle(tarih, icerik);
    return '📅 Etkinlik eklendi!\n\n📆 Tarih: ' + tarih + '\n📝 ' + icerik;
  }
  
  // Bugün ne var
  if (m === 'bugün ne var' || m === 'bugünkü etkinlikler') {
    var bugunList = bugunEtkinlikler();
    if (bugunList.length === 0) {
      return '📅 Bugün için kayıtlı etkinlik yok.';
    }
    var mesaj = '📅 BUGÜNKÜ ETKİNLİKLER\n\n';
    bugunList.forEach(function(e) {
      mesaj += '• ' + e.icerik + '\n';
    });
    return mesaj;
  }
  
  // Yarın ne var
  if (m === 'yarın ne var' || m === 'yarınki etkinlikler') {
    var yarinList = yarinEtkinlikler();
    if (yarinList.length === 0) {
      return '📅 Yarın için kayıtlı etkinlik yok.';
    }
    var mesaj = '📅 YARINKİ ETKİNLİKLER\n\n';
    yarinList.forEach(function(e) {
      mesaj += '• ' + e.icerik + '\n';
    });
    return mesaj;
  }
  
  // Tüm etkinlikler
  if (m === 'takvim' || m === 'etkinlikler') {
    if (takvimEtkinlikleri.length === 0) {
      return '📅 Takvimde etkinlik yok.\n\n💡 "takvime ekle: tarih - etkinlik" ile ekle!';
    }
    var mesaj = '📅 TAKVİM (' + takvimEtkinlikleri.length + ' etkinlik)\n\n';
    takvimEtkinlikleri.slice(0, 10).forEach(function(e) {
      mesaj += '📆 ' + e.tarih + ': ' + e.icerik + '\n';
    });
    return mesaj;
  }
  
  return null;
}

takvimYukle();


// ==================== KİŞİLİK MODLARI ====================

var kisilikModu = localStorage.getItem('ramco_kisilik') || 'normal';

var kisilikler = {
  normal: {
    isim: 'Normal',
    emoji: '🤖',
    selamlar: ['Merhaba!', 'Selam!', 'Hey!'],
    olumlu: ['Harika!', 'Süper!', 'Güzel!'],
    olumsuz: ['Anlıyorum...', 'Hmm...', 'Tamam...']
  },
  eglenceli: {
    isim: 'Eğlenceli',
    emoji: '🎉',
    selamlar: ['Heyyy dostum! 🎉', 'Naber kanka! 😎', 'Selaaaam! 🔥'],
    olumlu: ['EFSANE! 🔥', 'BOOM! 💥', 'Çıldırdım! 🤯', 'Harikasın be! 💪'],
    olumsuz: ['Boşver ya! 😅', 'Takma kafana! 🤷', 'Olsun be! 😄']
  },
  ciddi: {
    isim: 'Profesyonel',
    emoji: '👔',
    selamlar: ['Merhaba.', 'İyi günler.', 'Hoş geldiniz.'],
    olumlu: ['Başarılı.', 'Tamamlandı.', 'İyi iş.'],
    olumsuz: ['Anlaşıldı.', 'Not edildi.', 'Değerlendireceğim.']
  },
  motivasyon: {
    isim: 'Motivasyon Koçu',
    emoji: '💪',
    selamlar: ['GÜNAYDIN ŞAMPİYON! 💪', 'Bugün EFSANE olacak! 🔥', 'Hazır mısın kazanmaya?! 🏆'],
    olumlu: ['SEN KRALIN KRALISIN! 👑', 'DURDURULAMAZ! 🚀', 'ZİRVEYE GİDİYORSUN! ⛰️'],
    olumsuz: ['VAZGEÇME! 💪', 'HER DÜŞÜŞ YENİ BİR KALKIŞ! 🔥', 'SEN YAPABİLİRSİN! ✨']
  },
  romantik: {
    isim: 'Romantik',
    emoji: '💕',
    selamlar: ['Merhaba güzellik! 💕', 'Seni görmek ne güzel! 🌹', 'Hoş geldin canım! ✨'],
    olumlu: ['Ne kadar tatlısın! 💖', 'Harikasın! 🌟', 'Çok iyisin! 💝'],
    olumsuz: ['Üzülme, yanındayım 💕', 'Her şey güzel olacak 🌈', 'Seni anlıyorum 💗']
  }
};

function kisilikDegistir(yeniKisilik) {
  if (kisilikler[yeniKisilik]) {
    kisilikModu = yeniKisilik;
    localStorage.setItem('ramco_kisilik', yeniKisilik);
    return '🎭 Kişilik değişti: ' + kisilikler[yeniKisilik].emoji + ' ' + kisilikler[yeniKisilik].isim + '\n\n' +
      kisilikler[yeniKisilik].selamlar[0];
  }
  return null;
}

function kisilikCevapEkle(cevap, duygu) {
  var kisilik = kisilikler[kisilikModu];
  
  if (duygu === 'olumlu' && kisilik.olumlu.length > 0) {
    return kisilik.olumlu[Math.floor(Math.random() * kisilik.olumlu.length)] + ' ' + cevap;
  }
  if (duygu === 'olumsuz' && kisilik.olumsuz.length > 0) {
    return kisilik.olumsuz[Math.floor(Math.random() * kisilik.olumsuz.length)] + ' ' + cevap;
  }
  
  return cevap;
}

function kisilikKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Kişilik değiştir
  if (m.startsWith('kişilik:') || m.startsWith('mod:') || m.startsWith('kisilik:')) {
    var yeni = m.replace(/kişilik:|mod:|kisilik:/i, '').trim();
    var sonuc = kisilikDegistir(yeni);
    if (sonuc) return sonuc;
    
    return '❌ Bu kişilik yok!\n\nMevcut kişilikler:\n' +
      '• normal - 🤖 Normal\n' +
      '• eglenceli - 🎉 Eğlenceli\n' +
      '• ciddi - 👔 Profesyonel\n' +
      '• motivasyon - 💪 Motivasyon Koçu\n' +
      '• romantik - 💕 Romantik';
  }
  
  // Kişilikleri listele
  if (m === 'kişilikler' || m === 'modlar' || m === 'kisilikler') {
    var mesaj = '🎭 KİŞİLİK MODLARI\n\nMevcut: ' + kisilikler[kisilikModu].emoji + ' ' + kisilikler[kisilikModu].isim + '\n\n';
    Object.keys(kisilikler).forEach(function(k) {
      var aktif = k === kisilikModu ? ' ✓' : '';
      mesaj += kisilikler[k].emoji + ' ' + k + ' - ' + kisilikler[k].isim + aktif + '\n';
    });
    mesaj += '\n💡 Değiştirmek için: "kişilik: eglenceli"';
    return mesaj;
  }
  
  return null;
}


// ==================== YAZIM HATASI DÜZELTME ====================

var yazimDuzeltmeleri = {
  // Selamlar
  'slm': 'selam', 'mrb': 'merhaba', 'mrba': 'merhaba', 'mrhba': 'merhaba',
  'nbr': 'naber', 'naber': 'naber', 'nabersin': 'naber',
  'naslsn': 'nasılsın', 'nasilsin': 'nasılsın', 'nasılsın': 'nasılsın',
  'nslsn': 'nasılsın', 'nasıl': 'nasıl',
  
  // Teşekkür
  'tşk': 'teşekkür', 'tşkler': 'teşekkürler', 'tesekkur': 'teşekkür',
  'saol': 'sağol', 'sagol': 'sağol', 'eyw': 'eyvallah',
  
  // Genel
  'tmm': 'tamam', 'tm': 'tamam', 'ok': 'tamam',
  'evt': 'evet', 'hyr': 'hayır', 'yok': 'hayır',
  'peki': 'peki', 'ok': 'tamam',
  
  // E-ticaret
  'siparis': 'sipariş', 'siparış': 'sipariş', 'sprs': 'sipariş',
  'musteri': 'müşteri', 'müsteri': 'müşteri',
  'urun': 'ürün', 'ürün': 'ürün',
  'fiyat': 'fiyat', 'fyat': 'fiyat',
  
  // Sorular
  'nerde': 'nerede', 'nereye': 'nereye',
  'kac': 'kaç', 'kaç': 'kaç',
  'ne zmn': 'ne zaman', 'nezaman': 'ne zaman',
  
  // Duygular
  'iyi': 'iyi', 'ii': 'iyi', 'iyiyim': 'iyiyim',
  'kotu': 'kötü', 'kotü': 'kötü',
  'mutlu': 'mutlu', 'uzgun': 'üzgün', 'üzgün': 'üzgün'
};

function yazimDuzelt(mesaj) {
  var kelimeler = mesaj.split(/\s+/);
  var duzeltilmis = kelimeler.map(function(kelime) {
    var kucuk = kelime.toLowerCase();
    return yazimDuzeltmeleri[kucuk] || kelime;
  });
  return duzeltilmis.join(' ');
}

// Benzer kelime bulma (Levenshtein mesafesi)
function benzerlikHesapla(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  var matrix = [];
  for (var i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (var j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (var i = 1; i <= s1.length; i++) {
    for (var j = 1; j <= s2.length; j++) {
      var cost = s1[i-1] === s2[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,
        matrix[i][j-1] + 1,
        matrix[i-1][j-1] + cost
      );
    }
  }
  
  var mesafe = matrix[s1.length][s2.length];
  var maxUzunluk = Math.max(s1.length, s2.length);
  return 1 - (mesafe / maxUzunluk);
}

function benzerKelimeBul(kelime) {
  var tumKelimeler = Object.keys(ramcoHafiza.kelimeler).concat(bilenenKelimeler);
  var enBenzer = null;
  var enYuksekSkor = 0;
  
  tumKelimeler.forEach(function(k) {
    var skor = benzerlikHesapla(kelime, k);
    if (skor > enYuksekSkor && skor > 0.6) {
      enYuksekSkor = skor;
      enBenzer = k;
    }
  });
  
  return enBenzer;
}


// ==================== HAZIR ŞABLONLAR ====================

var mesajSablonlari = {
  kargo: {
    isim: '🚚 Kargo Bildirimi',
    sablonlar: [
      'Merhaba! Siparişiniz kargoya verildi. Kargo takip numaranız: [TAKIP_NO]. İyi günler dileriz! 📦',
      'Siparişiniz yola çıktı! 🚚 Takip No: [TAKIP_NO]. Tahmini teslimat: 2-3 iş günü.',
      'Harika haber! Paketiniz kargoda. Takip: [TAKIP_NO] 📦✨'
    ]
  },
  tesekkur: {
    isim: '💝 Teşekkür',
    sablonlar: [
      'Siparişiniz için teşekkür ederiz! Bizi tercih ettiğiniz için mutluyuz. 💝',
      'Değerli müşterimiz, alışverişiniz için teşekkürler! Tekrar bekleriz. 🙏',
      'Teşekkürler! Memnuniyetiniz bizim için önemli. İyi günler! ⭐'
    ]
  },
  gecikme: {
    isim: '⏰ Gecikme Bildirimi',
    sablonlar: [
      'Merhaba, siparişinizde beklenmedik bir gecikme yaşandı. En kısa sürede gönderilecektir. Anlayışınız için teşekkürler. 🙏',
      'Özür dileriz, siparişiniz yoğunluk nedeniyle gecikti. 1-2 gün içinde kargoya verilecektir.',
      'Değerli müşterimiz, gecikme için özür dileriz. Siparişiniz öncelikli olarak hazırlanıyor.'
    ]
  },
  iade: {
    isim: '↩️ İade Bilgisi',
    sablonlar: [
      'İade talebiniz alındı. Ürünü orijinal ambalajında göndermenizi rica ederiz. İade adresi: [ADRES]',
      'İade işleminiz başlatıldı. Kargo ücreti tarafımıza aittir. Kargo kodu: [KOD]',
      'İade talebiniz onaylandı. Para iadesi 3-5 iş günü içinde hesabınıza yatacaktır.'
    ]
  },
  stok: {
    isim: '📦 Stok Bildirimi',
    sablonlar: [
      'Merhaba! Sorduğunuz ürün şu an stokta mevcut. Hemen sipariş verebilirsiniz! 📦',
      'Üzgünüz, bu ürün şu an stokta yok. Stoğa girdiğinde size haber verelim mi?',
      'Ürün stoğa geldi! Sınırlı sayıda, kaçırmayın! 🔥'
    ]
  },
  hosgeldin: {
    isim: '👋 Hoş Geldin',
    sablonlar: [
      'Mağazamıza hoş geldiniz! Size nasıl yardımcı olabiliriz? 😊',
      'Merhaba! Ürünlerimiz hakkında soru sormak ister misiniz?',
      'Hoş geldiniz! Bugün %10 indirim fırsatını kaçırmayın! 🎉'
    ]
  }
};

function sablonlariListele() {
  var mesaj = '💬 HAZIR MESAJ ŞABLONLARI\n\n';
  
  Object.keys(mesajSablonlari).forEach(function(k) {
    mesaj += mesajSablonlari[k].isim + '\n';
    mesaj += '   → "şablon ' + k + '" yaz kullanmak için\n\n';
  });
  
  mesaj += '💡 Örnek: "şablon kargo" veya "şablon tesekkur"';
  return mesaj;
}

function sablonGetir(tur) {
  if (mesajSablonlari[tur]) {
    var sablon = mesajSablonlari[tur];
    var rastgele = sablon.sablonlar[Math.floor(Math.random() * sablon.sablonlar.length)];
    
    return sablon.isim + '\n\n📋 ' + rastgele + '\n\n' +
      '💡 Kopyala ve WhatsApp\'a yapıştır!\n' +
      '📝 [TAKIP_NO], [ADRES] gibi yerleri düzenle.';
  }
  return null;
}

function sablonKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  if (m === 'şablonlar' || m === 'sablonlar' || m === 'mesaj şablonları') {
    return sablonlariListele();
  }
  
  if (m.startsWith('şablon ') || m.startsWith('sablon ')) {
    var tur = m.replace(/şablon |sablon /i, '').trim();
    var sonuc = sablonGetir(tur);
    if (sonuc) return sonuc;
    return '❌ Bu şablon yok!\n\n' + sablonlariListele();
  }
  
  return null;
}


// ==================== TEMA SİSTEMİ ====================

var temalar = {
  varsayilan: {
    isim: 'Varsayılan',
    emoji: '🤖',
    renkler: { ana: '#e94560', arkaplan: '#1a1a2e', metin: '#ffffff' }
  },
  karanlik: {
    isim: 'Karanlık',
    emoji: '🌙',
    renkler: { ana: '#6c5ce7', arkaplan: '#0a0a0a', metin: '#ffffff' }
  },
  aydinlik: {
    isim: 'Aydınlık',
    emoji: '☀️',
    renkler: { ana: '#e94560', arkaplan: '#f5f5f5', metin: '#333333' }
  },
  yesil: {
    isim: 'Doğa',
    emoji: '🌿',
    renkler: { ana: '#27ae60', arkaplan: '#1a2e1a', metin: '#ffffff' }
  },
  mavi: {
    isim: 'Okyanus',
    emoji: '🌊',
    renkler: { ana: '#3498db', arkaplan: '#1a1a2e', metin: '#ffffff' }
  },
  turuncu: {
    isim: 'Gün Batımı',
    emoji: '🌅',
    renkler: { ana: '#e67e22', arkaplan: '#2e1a1a', metin: '#ffffff' }
  }
};

var mevcutTema = localStorage.getItem('ramco_tema') || 'varsayilan';

function temaUygula(temaAdi) {
  if (!temalar[temaAdi]) return false;
  
  var tema = temalar[temaAdi];
  mevcutTema = temaAdi;
  localStorage.setItem('ramco_tema', temaAdi);
  
  // CSS değişkenlerini güncelle
  document.documentElement.style.setProperty('--ramco-ana', tema.renkler.ana);
  document.documentElement.style.setProperty('--ramco-arkaplan', tema.renkler.arkaplan);
  document.documentElement.style.setProperty('--ramco-metin', tema.renkler.metin);
  
  // Widget border rengini değiştir
  var face = document.querySelector('.ramco-widget-face');
  if (face) face.style.borderColor = tema.renkler.ana;
  
  var panel = document.querySelector('.ramco-widget-panel');
  if (panel) panel.style.borderColor = tema.renkler.ana;
  
  return true;
}

function temaKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  if (m === 'temalar' || m === 'tema listesi') {
    var mesaj = '🎨 TEMALAR\n\nMevcut: ' + temalar[mevcutTema].emoji + ' ' + temalar[mevcutTema].isim + '\n\n';
    Object.keys(temalar).forEach(function(t) {
      var aktif = t === mevcutTema ? ' ✓' : '';
      mesaj += temalar[t].emoji + ' ' + t + ' - ' + temalar[t].isim + aktif + '\n';
    });
    mesaj += '\n💡 Değiştirmek için: "tema mavi"';
    return mesaj;
  }
  
  if (m.startsWith('tema ')) {
    var yeniTema = m.replace('tema ', '').trim();
    if (temaUygula(yeniTema)) {
      return '🎨 Tema değişti: ' + temalar[yeniTema].emoji + ' ' + temalar[yeniTema].isim;
    }
    return '❌ Bu tema yok! "temalar" yaz listeyi gör.';
  }
  
  return null;
}

// Sayfa yüklenince temayı uygula
setTimeout(function() { temaUygula(mevcutTema); }, 500);


// ==================== TARAYICI BİLDİRİMİ ====================

var bildirimIzni = false;

function bildirimIzniIste() {
  if (!('Notification' in window)) {
    return 'Tarayıcın bildirimleri desteklemiyor!';
  }
  
  if (Notification.permission === 'granted') {
    bildirimIzni = true;
    return '✅ Bildirim izni zaten var!';
  }
  
  Notification.requestPermission().then(function(permission) {
    if (permission === 'granted') {
      bildirimIzni = true;
      masaustuneBildirimGonder('GARİBAN', 'Bildirimler açıldı! 🔔');
    }
  });
  
  return '🔔 Bildirim izni istendi. Tarayıcıdan izin ver!';
}

function masaustuneBildirimGonder(baslik, mesaj) {
  if (!bildirimIzni && Notification.permission !== 'granted') return;
  
  var notification = new Notification(baslik, {
    body: mesaj,
    icon: '🤖',
    badge: '🤖',
    tag: 'ramco-bildirim',
    requireInteraction: false
  });
  
  notification.onclick = function() {
    window.focus();
    notification.close();
  };
  
  setTimeout(function() { notification.close(); }, 5000);
}

function bildirimKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  if (m === 'bildirimleri aç' || m === 'bildirim izni') {
    return bildirimIzniIste();
  }
  
  if (m.startsWith('bildirim gönder:') || m.startsWith('bildirim:')) {
    var icerik = mesaj.replace(/bildirim gönder:|bildirim:/i, '').trim();
    masaustuneBildirimGonder('GARİBAN', icerik);
    return '🔔 Masaüstü bildirimi gönderildi!';
  }
  
  return null;
}

// Sayfa yüklenince izin kontrolü
if (Notification.permission === 'granted') {
  bildirimIzni = true;
}


// ==================== ANA KOMUT İŞLEYİCİ GÜNCELLEMESİ ====================

var superEskiKomutlar = ogrenmeKomutlariIsle;

ogrenmeKomutlariIsle = function(mesaj) {
  // Yazım düzeltme uygula
  var duzeltilmisMesaj = yazimDuzelt(mesaj);
  var m = duzeltilmisMesaj.toLowerCase().trim();
  
  // Not komutları
  var notCevap = notKomutuIsle(mesaj);
  if (notCevap) return notCevap;
  
  // Takvim komutları
  var takvimCevap = takvimKomutuIsle(mesaj);
  if (takvimCevap) return takvimCevap;
  
  // Kişilik komutları
  var kisilikCevap = kisilikKomutuIsle(mesaj);
  if (kisilikCevap) return kisilikCevap;
  
  // Şablon komutları
  var sablonCevap = sablonKomutuIsle(mesaj);
  if (sablonCevap) return sablonCevap;
  
  // Tema komutları
  var temaCevap = temaKomutuIsle(mesaj);
  if (temaCevap) return temaCevap;
  
  // Bildirim komutları
  var bildirimCevap = bildirimKomutuIsle(mesaj);
  if (bildirimCevap) return bildirimCevap;
  
  // Yardım komutu güncelleme
  if (m === 'yardım' || m === 'yardim' || m === 'komutlar') {
    return superYardimMesaji();
  }
  
  // Eski komutları çalıştır
  return superEskiKomutlar(duzeltilmisMesaj);
};

function superYardimMesaji() {
  var kisilik = kisilikler[kisilikModu];
  
  var mesaj = kisilik.emoji + ' GARİBAN KOMUTLARI\n';
  mesaj += '═══════════════════════\n\n';
  
  mesaj += '📊 ANALİZ\n';
  mesaj += '• analiz, rapor, özet\n\n';
  
  mesaj += '🧠 ÖĞRENME\n';
  mesaj += '• öğren: soru = cevap\n';
  mesaj += '• beyin, öğrenilenler\n\n';
  
  mesaj += '📝 NOT & TAKVİM\n';
  mesaj += '• not al: mesaj\n';
  mesaj += '• notlar, takvim\n';
  mesaj += '• takvime ekle: tarih - etkinlik\n\n';
  
  mesaj += '⏰ HATIRLATMA\n';
  mesaj += '• 30 dk sonra hatırlat: mesaj\n\n';
  
  mesaj += '💬 ŞABLONLAR\n';
  mesaj += '• şablonlar, şablon kargo\n\n';
  
  mesaj += '🎮 EĞLENCE\n';
  mesaj += '• oyun, matematik, kelime\n';
  mesaj += '• motivasyon, tavsiye\n\n';
  
  mesaj += '🎨 KİŞİSELLEŞTİRME\n';
  mesaj += '• kişilikler, kişilik: eglenceli\n';
  mesaj += '• temalar, tema mavi\n\n';
  
  mesaj += '🔔 BİLDİRİM\n';
  mesaj += '• bildirimleri aç\n\n';
  
  mesaj += '═══════════════════════\n';
  mesaj += '💡 Ne kadar konuşursan o kadar akıllı olurum!';
  
  return mesaj;
}


// ==================== NOT ALMA SİSTEMİ ====================

var notlar = [];

function notlariYukle() {
  var kayitli = localStorage.getItem('ramco_notlar');
  if (kayitli) {
    notlar = JSON.parse(kayitli);
  }
}

function notKaydet() {
  localStorage.setItem('ramco_notlar', JSON.stringify(notlar));
  if (ramcoDB) {
    ramcoDB.child('notlar').set(notlar);
  }
}

function notEkle(icerik) {
  var not = {
    id: Date.now(),
    icerik: icerik,
    tarih: new Date().toLocaleString('tr-TR'),
    onemli: icerik.includes('!') || icerik.toLowerCase().includes('önemli')
  };
  
  notlar.unshift(not);
  notKaydet();
  return not;
}

function notSil(id) {
  notlar = notlar.filter(function(n) { return n.id !== id; });
  notKaydet();
}

function notlariListele() {
  if (notlar.length === 0) {
    return '📝 Henüz not yok.\n\n💡 "not al: mesajın" yazarak not ekleyebilirsin!';
  }
  
  var mesaj = '📝 NOTLARIN (' + notlar.length + ' adet)\n\n';
  
  notlar.slice(0, 10).forEach(function(n, i) {
    var onemliIsaret = n.onemli ? '⭐ ' : '';
    mesaj += (i + 1) + '. ' + onemliIsaret + n.icerik + '\n';
    mesaj += '   📅 ' + n.tarih + '\n\n';
  });
  
  if (notlar.length > 10) {
    mesaj += '... ve ' + (notlar.length - 10) + ' not daha';
  }
  
  return mesaj;
}

function notKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Not ekle
  if (m.startsWith('not al:') || m.startsWith('not ekle:') || m.startsWith('kaydet:')) {
    var icerik = mesaj.replace(/not al:|not ekle:|kaydet:/i, '').trim();
    if (icerik.length < 2) {
      return '❌ Not içeriği çok kısa!';
    }
    notEkle(icerik);
    return '✅ Not kaydedildi!\n\n📝 "' + icerik + '"\n\n💡 Notlarını görmek için "notlar" yaz.';
  }
  
  // Notları listele
  if (m === 'notlar' || m === 'notlarım' || m === 'not listesi') {
    return notlariListele();
  }
  
  // Not sil
  if (m.startsWith('not sil:') || m.startsWith('notu sil:')) {
    var silinecek = m.replace(/not sil:|notu sil:/i, '').trim();
    var silinecekNot = notlar.find(function(n) { 
      return n.icerik.toLowerCase().includes(silinecek); 
    });
    
    if (silinecekNot) {
      notSil(silinecekNot.id);
      return '🗑️ Not silindi: "' + silinecekNot.icerik + '"';
    }
    return '❌ Bu not bulunamadı!';
  }
  
  // Tüm notları sil
  if (m === 'tüm notları sil' || m === 'notları temizle') {
    notlar = [];
    notKaydet();
    return '🗑️ Tüm notlar silindi!';
  }
  
  return null;
}

notlariYukle();


// ==================== TAKVİM SİSTEMİ ====================

var takvimEtkinlikleri = [];

function takvimYukle() {
  var kayitli = localStorage.getItem('ramco_takvim');
  if (kayitli) {
    takvimEtkinlikleri = JSON.parse(kayitli);
  }
}

function takvimKaydet() {
  localStorage.setItem('ramco_takvim', JSON.stringify(takvimEtkinlikleri));
}

function etkinlikEkle(tarih, baslik) {
  var etkinlik = {
    id: Date.now(),
    tarih: tarih,
    baslik: baslik,
    olusturma: new Date().toISOString()
  };
  
  takvimEtkinlikleri.push(etkinlik);
  takvimKaydet();
  return etkinlik;
}

function bugunEtkinlikler() {
  var bugun = new Date().toLocaleDateString('tr-TR');
  return takvimEtkinlikleri.filter(function(e) { return e.tarih === bugun; });
}

function yarinEtkinlikler() {
  var yarin = new Date();
  yarin.setDate(yarin.getDate() + 1);
  var yarinStr = yarin.toLocaleDateString('tr-TR');
  return takvimEtkinlikleri.filter(function(e) { return e.tarih === yarinStr; });
}

function takvimKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Etkinlik ekle
  if (m.includes('takvime ekle:') || m.includes('etkinlik ekle:')) {
    var parcalar = mesaj.replace(/takvime ekle:|etkinlik ekle:/i, '').trim().split(' - ');
    if (parcalar.length >= 2) {
      var tarih = parcalar[0].trim();
      var baslik = parcalar[1].trim();
      
      // Tarih formatını düzelt
      if (tarih === 'yarın' || tarih === 'yarin') {
        var yarin = new Date();
        yarin.setDate(yarin.getDate() + 1);
        tarih = yarin.toLocaleDateString('tr-TR');
      } else if (tarih === 'bugün' || tarih === 'bugun') {
        tarih = new Date().toLocaleDateString('tr-TR');
      }
      
      etkinlikEkle(tarih, baslik);
      return '📅 Etkinlik eklendi!\n\n📆 ' + tarih + '\n📝 ' + baslik;
    }
    return '❌ Format: takvime ekle: tarih - etkinlik\nÖrnek: takvime ekle: yarın - Kampanya başlat';
  }
  
  // Bugün ne var
  if (m.includes('bugün ne var') || m === 'bugün' || m.includes('bugünkü etkinlik')) {
    var bugunList = bugunEtkinlikler();
    if (bugunList.length === 0) {
      return '📅 Bugün planlanmış etkinlik yok!';
    }
    var mesaj = '📅 BUGÜNKÜ ETKİNLİKLER\n\n';
    bugunList.forEach(function(e) {
      mesaj += '• ' + e.baslik + '\n';
    });
    return mesaj;
  }
  
  // Yarın ne var
  if (m.includes('yarın ne var') || m === 'yarın' || m.includes('yarınki etkinlik')) {
    var yarinList = yarinEtkinlikler();
    if (yarinList.length === 0) {
      return '📅 Yarın planlanmış etkinlik yok!';
    }
    var mesaj = '📅 YARINKİ ETKİNLİKLER\n\n';
    yarinList.forEach(function(e) {
      mesaj += '• ' + e.baslik + '\n';
    });
    return mesaj;
  }
  
  // Tüm etkinlikler
  if (m === 'takvim' || m === 'etkinlikler') {
    if (takvimEtkinlikleri.length === 0) {
      return '📅 Takvimde etkinlik yok!\n\n💡 "takvime ekle: tarih - etkinlik" ile ekle!';
    }
    var mesaj = '📅 TAKVİM (' + takvimEtkinlikleri.length + ' etkinlik)\n\n';
    takvimEtkinlikleri.slice(0, 10).forEach(function(e) {
      mesaj += '📆 ' + e.tarih + ' - ' + e.baslik + '\n';
    });
    return mesaj;
  }
  
  return null;
}

takvimYukle();


// ==================== HAZIR ŞABLONLAR ====================

var mesajSablonlari = {
  kargo: {
    baslik: '🚚 Kargo Bildirimi',
    mesaj: 'Merhaba! Siparişiniz kargoya verildi. Takip numaranız: [TAKIP_NO]. İyi günler dileriz! 📦'
  },
  teslim: {
    baslik: '✅ Teslim Bildirimi',
    mesaj: 'Merhaba! Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz! ⭐ Değerlendirmenizi bekliyoruz.'
  },
  tesekkur: {
    baslik: '🙏 Teşekkür',
    mesaj: 'Değerli müşterimiz, siparişiniz için teşekkür ederiz! Memnuniyetiniz bizim için önemli. İyi günler! 💝'
  },
  gecikme: {
    baslik: '⏰ Gecikme Bildirimi',
    mesaj: 'Merhaba, siparişinizde beklenmedik bir gecikme yaşanmaktadır. En kısa sürede gönderilecektir. Anlayışınız için teşekkürler. 🙏'
  },
  stok: {
    baslik: '📦 Stok Bildirimi',
    mesaj: 'Merhaba, istediğiniz ürün şu an stokta bulunmamaktadır. Stoğa girdiğinde size haber vereceğiz! 🔔'
  },
  iade: {
    baslik: '↩️ İade Onayı',
    mesaj: 'Merhaba, iade talebiniz onaylanmıştır. Ürünü [ADRES] adresine gönderebilirsiniz. İade işlemi 3-5 iş günü içinde tamamlanacaktır.'
  },
  kampanya: {
    baslik: '🎉 Kampanya',
    mesaj: 'Süper fırsat! 🔥 Tüm ürünlerde %[INDIRIM] indirim! Kaçırmayın! 🛒 [LINK]'
  },
  hosgeldin: {
    baslik: '👋 Hoş Geldin',
    mesaj: 'Mağazamıza hoş geldiniz! 🎉 İlk siparişinize özel %10 indirim kodu: HOSGELDIN10 🎁'
  }
};

function sablonlariListele() {
  var mesaj = '💬 HAZIR MESAJ ŞABLONLARI\n\n';
  
  Object.keys(mesajSablonlari).forEach(function(key) {
    var s = mesajSablonlari[key];
    mesaj += s.baslik + '\n';
    mesaj += '   Kullanım: "şablon ' + key + '"\n\n';
  });
  
  mesaj += '💡 Şablonu kopyalamak için adını yaz!';
  return mesaj;
}

function sablonGetir(ad) {
  var sablon = mesajSablonlari[ad.toLowerCase()];
  if (sablon) {
    return sablon.baslik + '\n\n' + sablon.mesaj + '\n\n📋 Kopyala ve WhatsApp\'a yapıştır!';
  }
  return null;
}

function sablonKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  if (m === 'şablonlar' || m === 'sablonlar' || m === 'mesaj şablonları') {
    return sablonlariListele();
  }
  
  if (m.startsWith('şablon ') || m.startsWith('sablon ')) {
    var ad = m.replace(/şablon |sablon /i, '').trim();
    var sonuc = sablonGetir(ad);
    if (sonuc) return sonuc;
    return '❌ Bu şablon bulunamadı! "şablonlar" yaz listeyi gör.';
  }
  
  // Direkt şablon adı yazılmışsa
  if (mesajSablonlari[m]) {
    return sablonGetir(m);
  }
  
  return null;
}


// ==================== KİŞİLİK MODLARI ====================

var kisilikModu = 'normal'; // normal, ciddi, eglenceli, motivasyon

function kisilikModuDegistir(mod) {
  kisilikModu = mod;
  localStorage.setItem('ramco_kisilik', mod);
  return true;
}

function kisilikModuYukle() {
  var kayitli = localStorage.getItem('ramco_kisilik');
  if (kayitli) {
    kisilikModu = kayitli;
  }
}

function kisilikEkle(cevap) {
  if (kisilikModu === 'ciddi') {
    // Emoji azalt, resmi dil
    return cevap.replace(/😊|😄|🎉|🔥|💪|🚀/g, '').trim();
  }
  
  if (kisilikModu === 'eglenceli') {
    // Daha fazla emoji ve şaka
    var ekler = [' 😄', ' 🎉', ' 🔥', ' hahaha!', ' 😎', ' yeaah!'];
    return cevap + ekler[Math.floor(Math.random() * ekler.length)];
  }
  
  if (kisilikModu === 'motivasyon') {
    // Her cevaba motivasyon ekle
    var motivasyonlar = [
      '\n\n💪 Sen başarabilirsin!',
      '\n\n🌟 Harika gidiyorsun!',
      '\n\n🚀 Durma devam et!',
      '\n\n⭐ Sen en iyisisin!',
      '\n\n🔥 Bugün senin günün!'
    ];
    return cevap + motivasyonlar[Math.floor(Math.random() * motivasyonlar.length)];
  }
  
  return cevap;
}

function kisilikKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  if (m === 'ciddi mod' || m === 'ciddi ol') {
    kisilikModuDegistir('ciddi');
    return '👔 Ciddi moda geçtim. Artık daha resmi konuşacağım.';
  }
  
  if (m === 'eğlenceli mod' || m === 'eglenceli mod' || m === 'komik ol') {
    kisilikModuDegistir('eglenceli');
    return '🎉 Eğlenceli moda geçtim! Şimdi daha neşeli olacağım hahaha! 😄🔥';
  }
  
  if (m === 'motivasyon modu' || m === 'motive et') {
    kisilikModuDegistir('motivasyon');
    return '💪 Motivasyon moduna geçtim! Seni sürekli motive edeceğim! Sen BAŞARACAKSIN! 🚀⭐';
  }
  
  if (m === 'normal mod' || m === 'normal ol') {
    kisilikModuDegistir('normal');
    return '😊 Normal moda döndüm!';
  }
  
  if (m === 'mod' || m === 'hangi mod' || m === 'kişilik') {
    return '🎭 Şu anki mod: ' + kisilikModu.toUpperCase() + '\n\n' +
      'Değiştirmek için:\n' +
      '• "ciddi mod" - Resmi ve profesyonel\n' +
      '• "eğlenceli mod" - Şakacı ve neşeli\n' +
      '• "motivasyon modu" - Sürekli moral\n' +
      '• "normal mod" - Dengeli';
  }
  
  return null;
}

kisilikModuYukle();


// ==================== YAZIM HATASI DÜZELTME ====================

var yazimDuzeltmeleri = {
  // Selamlar
  'slm': 'selam', 'mrb': 'merhaba', 'mrba': 'merhaba', 'mrhb': 'merhaba',
  'nbr': 'naber', 'nbr': 'naber', 'nabrr': 'naber', 'nasilsin': 'nasılsın',
  'naslsn': 'nasılsın', 'nasilsn': 'nasılsın', 'nslsn': 'nasılsın',
  
  // Teşekkür
  'tsk': 'teşekkür', 'tşk': 'teşekkür', 'tesekkur': 'teşekkür', 'tşkler': 'teşekkürler',
  'saol': 'sağol', 'sagol': 'sağol', 'eyw': 'eyvallah', 'eyv': 'eyvallah',
  
  // İş terimleri
  'siparis': 'sipariş', 'siparisler': 'siparişler', 'sprs': 'sipariş',
  'musteri': 'müşteri', 'mşteri': 'müşteri', 'müsteri': 'müşteri',
  'urun': 'ürün', 'ürünler': 'ürünler', 'urunler': 'ürünler',
  'fiyat': 'fiyat', 'fyat': 'fiyat',
  
  // Sorular
  'nerde': 'nerede', 'nereye': 'nereye', 'nasil': 'nasıl', 'nasl': 'nasıl',
  'kac': 'kaç', 'kactane': 'kaç tane', 'nekadar': 'ne kadar',
  
  // Genel
  'tmm': 'tamam', 'tm': 'tamam', 'ok': 'tamam', 'oke': 'tamam',
  'evt': 'evet', 'hyr': 'hayır', 'yok': 'yok', 'var': 'var',
  'bi': 'bir', 'bişey': 'bir şey', 'bişi': 'bir şey', 'bisey': 'bir şey',
  'simdi': 'şimdi', 'şuan': 'şu an', 'bugun': 'bugün', 'yarin': 'yarın',
  
  // Duygular
  'iyi': 'iyi', 'kotu': 'kötü', 'guzel': 'güzel', 'harika': 'harika',
  'uzgun': 'üzgün', 'mutlu': 'mutlu', 'sinirli': 'sinirli'
};

function yazimDuzelt(mesaj) {
  var kelimeler = mesaj.split(/\s+/);
  var duzeltilmis = kelimeler.map(function(kelime) {
    var kucuk = kelime.toLowerCase();
    return yazimDuzeltmeleri[kucuk] || kelime;
  });
  return duzeltilmis.join(' ');
}

// Benzer kelime bulma (Levenshtein mesafesi)
function benzerlikHesapla(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  var matrix = [];
  for (var i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (var j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (var i = 1; i <= s1.length; i++) {
    for (var j = 1; j <= s2.length; j++) {
      var cost = s1[i-1] === s2[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,
        matrix[i][j-1] + 1,
        matrix[i-1][j-1] + cost
      );
    }
  }
  
  var maxLen = Math.max(s1.length, s2.length);
  return 1 - (matrix[s1.length][s2.length] / maxLen);
}

function enBenzerKelimeBul(kelime) {
  var tumKelimeler = Object.keys(ramcoHafiza.kelimeler);
  var enBenzer = null;
  var enYuksekSkor = 0.6; // Minimum %60 benzerlik
  
  tumKelimeler.forEach(function(k) {
    var skor = benzerlikHesapla(kelime, k);
    if (skor > enYuksekSkor) {
      enYuksekSkor = skor;
      enBenzer = k;
    }
  });
  
  return enBenzer;
}


// ==================== TEMA SİSTEMİ ====================

var temalar = {
  varsayilan: {
    ad: 'Varsayılan',
    renk: '#e94560',
    arkaplan: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    yuzRenk: '#e94560'
  },
  gece: {
    ad: 'Gece Modu',
    renk: '#6c5ce7',
    arkaplan: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a2e 100%)',
    yuzRenk: '#6c5ce7'
  },
  doga: {
    ad: 'Doğa',
    renk: '#00b894',
    arkaplan: 'linear-gradient(135deg, #0a1a0a 0%, #1a2e1a 50%, #16213e 100%)',
    yuzRenk: '#00b894'
  },
  gunbatimi: {
    ad: 'Gün Batımı',
    renk: '#fd79a8',
    arkaplan: 'linear-gradient(135deg, #2d1f3d 0%, #3d2a4d 50%, #4a3a5d 100%)',
    yuzRenk: '#fd79a8'
  },
  okyanus: {
    ad: 'Okyanus',
    renk: '#0984e3',
    arkaplan: 'linear-gradient(135deg, #0a1a2e 0%, #1a2e3e 50%, #2a3e4e 100%)',
    yuzRenk: '#0984e3'
  }
};

var aktifTema = 'varsayilan';

function temaYukle() {
  var kayitli = localStorage.getItem('ramco_tema');
  if (kayitli && temalar[kayitli]) {
    aktifTema = kayitli;
    temaUygula(kayitli);
  }
}

function temaUygula(temaAdi) {
  var tema = temalar[temaAdi];
  if (!tema) return false;
  
  aktifTema = temaAdi;
  localStorage.setItem('ramco_tema', temaAdi);
  
  // CSS değişkenlerini güncelle
  document.documentElement.style.setProperty('--ramco-renk', tema.renk);
  document.documentElement.style.setProperty('--ramco-arkaplan', tema.arkaplan);
  
  // Container'ı güncelle
  var container = document.querySelector('.ramco-container');
  if (container) {
    container.style.background = tema.arkaplan;
  }
  
  // Yüz rengini güncelle
  var face = document.querySelector('.ramco-face');
  if (face) {
    face.style.borderColor = tema.yuzRenk;
  }
  
  var mouth = document.querySelector('.ramco-mouth');
  if (mouth) {
    mouth.style.background = tema.yuzRenk;
  }
  
  return true;
}

function temaKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  if (m === 'temalar' || m === 'tema listesi') {
    var mesaj = '🎨 TEMALAR\n\n';
    Object.keys(temalar).forEach(function(key) {
      var t = temalar[key];
      var aktif = key === aktifTema ? ' ✓' : '';
      mesaj += '• ' + t.ad + aktif + '\n';
      mesaj += '  Kullanım: "tema ' + key + '"\n\n';
    });
    return mesaj;
  }
  
  if (m.startsWith('tema ')) {
    var temaAdi = m.replace('tema ', '').trim();
    if (temalar[temaAdi]) {
      temaUygula(temaAdi);
      return '🎨 Tema değiştirildi: ' + temalar[temaAdi].ad + '\n\n✨ Yeni görünümün hazır!';
    }
    return '❌ Bu tema bulunamadı! "temalar" yaz listeyi gör.';
  }
  
  // Gece modu kısayolu
  if (m === 'gece modu' || m === 'karanlık mod') {
    temaUygula('gece');
    return '🌙 Gece moduna geçildi!';
  }
  
  return null;
}

setTimeout(temaYukle, 500);


// ==================== TARAYICI BİLDİRİMİ ====================

var bildirimIzni = false;

function bildirimIzniIste() {
  if (!('Notification' in window)) {
    console.log('Tarayıcı bildirimleri desteklemiyor');
    return;
  }
  
  if (Notification.permission === 'granted') {
    bildirimIzni = true;
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(function(permission) {
      bildirimIzni = permission === 'granted';
    });
  }
}

function masaustiBildirimi(baslik, mesaj, ikon) {
  if (!bildirimIzni) {
    bildirimIzniIste();
    return;
  }
  
  var options = {
    body: mesaj,
    icon: ikon || '🤖',
    badge: '🤖',
    vibrate: [200, 100, 200],
    tag: 'ramco-bildirim',
    requireInteraction: false
  };
  
  var notification = new Notification(baslik, options);
  
  notification.onclick = function() {
    window.focus();
    notification.close();
  };
  
  // 5 saniye sonra kapat
  setTimeout(function() {
    notification.close();
  }, 5000);
}

// Sayfa yüklenince izin iste
setTimeout(bildirimIzniIste, 3000);

// ==================== HEDEF BELİRLEME ====================

function hedefBelirle(tip, deger) {
  var hedefler = JSON.parse(localStorage.getItem('ramco_hedefler') || '{"gunluk":5,"haftalik":30,"aylik":100}');
  
  if (tip === 'günlük' || tip === 'gunluk') {
    hedefler.gunluk = parseInt(deger);
  } else if (tip === 'haftalık' || tip === 'haftalik') {
    hedefler.haftalik = parseInt(deger);
  } else if (tip === 'aylık' || tip === 'aylik') {
    hedefler.aylik = parseInt(deger);
  }
  
  localStorage.setItem('ramco_hedefler', JSON.stringify(hedefler));
  return hedefler;
}

function hedefKomutuIsle(mesaj) {
  var m = mesaj.toLowerCase();
  
  // Hedef belirleme
  var match = m.match(/(günlük|gunluk|haftalık|haftalik|aylık|aylik)\s*hedef\s*(\d+)/);
  if (match) {
    var tip = match[1];
    var deger = match[2];
    hedefBelirle(tip, deger);
    return '🎯 ' + tip.charAt(0).toUpperCase() + tip.slice(1) + ' hedef ' + deger + ' sipariş olarak ayarlandı!\n\n💪 Başarılar!';
  }
  
  // Hedefleri göster
  if (m === 'hedeflerim' || m === 'hedefler') {
    var hedefler = JSON.parse(localStorage.getItem('ramco_hedefler') || '{"gunluk":5,"haftalik":30,"aylik":100}');
    return '🎯 HEDEFLERİN\n\n' +
      '📅 Günlük: ' + hedefler.gunluk + ' sipariş\n' +
      '📆 Haftalık: ' + hedefler.haftalik + ' sipariş\n' +
      '📊 Aylık: ' + hedefler.aylik + ' sipariş\n\n' +
      '💡 Değiştirmek için: "günlük hedef 10"';
  }
  
  return null;
}


// ==================== ANA KOMUT İŞLEYİCİ GÜNCELLEMESİ ====================

var superEskiKomutlar = ogrenmeKomutlariIsle;

ogrenmeKomutlariIsle = function(mesaj) {
  // Yazım düzeltme uygula
  var duzeltilmisMesaj = yazimDuzelt(mesaj);
  var m = duzeltilmisMesaj.toLowerCase().trim();
  
  // Not komutları
  var notCevap = notKomutuIsle(mesaj);
  if (notCevap) return kisilikEkle(notCevap);
  
  // Takvim komutları
  var takvimCevap = takvimKomutuIsle(mesaj);
  if (takvimCevap) return kisilikEkle(takvimCevap);
  
  // Şablon komutları
  var sablonCevap = sablonKomutuIsle(mesaj);
  if (sablonCevap) return kisilikEkle(sablonCevap);
  
  // Kişilik komutları
  var kisilikCevap = kisilikKomutuIsle(mesaj);
  if (kisilikCevap) return kisilikCevap;
  
  // Tema komutları
  var temaCevap = temaKomutuIsle(mesaj);
  if (temaCevap) return kisilikEkle(temaCevap);
  
  // Hedef komutları
  var hedefCevap = hedefKomutuIsle(mesaj);
  if (hedefCevap) return kisilikEkle(hedefCevap);
  
  // Yardım komutu güncelleme
  if (m === 'yardım' || m === 'yardim' || m === 'komutlar' || m === 'help') {
    return ramcoYardimMesaji();
  }
  
  // Eski komutları çalıştır
  var eskiCevap = superEskiKomutlar(duzeltilmisMesaj);
  if (eskiCevap) return kisilikEkle(eskiCevap);
  
  return null;
};

// Güncellenmiş yardım mesajı
function ramcoYardimMesaji() {
  return '🤖 GARİBAN KOMUTLARI\n\n' +
    '📝 NOT SİSTEMİ\n' +
    '• "not al: mesaj" - Not kaydet\n' +
    '• "notlar" - Notları listele\n' +
    '• "not sil: mesaj" - Not sil\n\n' +
    '📅 TAKVİM\n' +
    '• "takvime ekle: tarih - etkinlik"\n' +
    '• "bugün ne var" / "yarın ne var"\n' +
    '• "takvim" - Tüm etkinlikler\n\n' +
    '💬 ŞABLONLAR\n' +
    '• "şablonlar" - Mesaj şablonları\n' +
    '• "şablon kargo" - Kargo bildirimi\n\n' +
    '🎨 TEMA\n' +
    '• "temalar" - Tema listesi\n' +
    '• "tema gece" - Tema değiştir\n\n' +
    '🎭 KİŞİLİK\n' +
    '• "ciddi mod" / "eğlenceli mod"\n' +
    '• "motivasyon modu" / "normal mod"\n\n' +
    '🎯 HEDEF\n' +
    '• "günlük hedef 10" - Hedef belirle\n' +
    '• "hedeflerim" - Hedefleri gör\n\n' +
    '⏰ HATIRLATMA\n' +
    '• "30 dk sonra hatırlat: mesaj"\n\n' +
    '🎮 OYUN\n' +
    '• "oyun" - Mini oyunlar\n\n' +
    '🧠 ÖĞRENME\n' +
    '• "öğren: soru = cevap"\n' +
    '• "beyin" - Beyin durumu\n\n' +
    '📊 ANALİZ\n' +
    '• "analiz" / "rapor" / "özet"';
}