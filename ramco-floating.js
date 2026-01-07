/* FLOATING GARİBAN - Her sayfada seninle gezen mini asistan */

// CSS Stillerini Ekle
function floatingStilleriEkle() {
  if (document.getElementById('floatingRamcoStyles')) return;
  
  var style = document.createElement('style');
  style.id = 'floatingRamcoStyles';
  style.textContent = 
    '.floating-ramco {' +
      'position: fixed;' +
      'bottom: 30px;' +
      'right: 30px;' +
      'width: 60px;' +
      'height: 60px;' +
      'background: linear-gradient(135deg, #e94560, #0f3460);' +
      'border-radius: 50%;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'font-size: 28px;' +
      'cursor: pointer;' +
      'box-shadow: 0 5px 25px rgba(233, 69, 96, 0.5);' +
      'transition: all 0.3s ease;' +
      'z-index: 9998;' +
      'border: 3px solid rgba(255,255,255,0.2);' +
    '}' +
    '.floating-ramco:hover {' +
      'transform: scale(1.1);' +
      'box-shadow: 0 8px 35px rgba(233, 69, 96, 0.7);' +
    '}' +
    '.floating-ramco .notif-badge {' +
      'position: absolute;' +
      'top: -5px;' +
      'right: -5px;' +
      'background: #dc3545;' +
      'color: #fff;' +
      'font-size: 11px;' +
      'font-weight: bold;' +
      'width: 20px;' +
      'height: 20px;' +
      'border-radius: 50%;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;' +
    '}' +
    '.mini-chat {' +
      'position: fixed;' +
      'bottom: 100px;' +
      'right: 30px;' +
      'width: 320px;' +
      'height: 400px;' +
      'background: linear-gradient(135deg, #0a0a0a, #1a1a2e);' +
      'border: 2px solid #e94560;' +
      'border-radius: 20px;' +
      'display: none;' +
      'flex-direction: column;' +
      'overflow: hidden;' +
      'z-index: 9999;' +
      'box-shadow: 0 10px 40px rgba(0,0,0,0.5);' +
    '}' +
    '.mini-chat.active {' +
      'display: flex;' +
    '}' +
    '.mini-chat-header {' +
      'background: linear-gradient(135deg, #e94560, #0f3460);' +
      'color: #fff;' +
      'padding: 15px;' +
      'font-weight: bold;' +
      'display: flex;' +
      'justify-content: space-between;' +
      'align-items: center;' +
    '}' +
    '.mini-chat-close {' +
      'background: rgba(255,255,255,0.2);' +
      'border: none;' +
      'color: #fff;' +
      'width: 28px;' +
      'height: 28px;' +
      'border-radius: 50%;' +
      'cursor: pointer;' +
      'font-size: 14px;' +
    '}' +
    '.mini-chat-close:hover {' +
      'background: rgba(255,255,255,0.3);' +
    '}' +
    '.mini-chat-body {' +
      'flex: 1;' +
      'padding: 15px;' +
      'overflow-y: auto;' +
      'background: #0f0f23;' +
      'color: #fff;' +
    '}' +
    '.mini-chat-input {' +
      'display: flex;' +
      'padding: 10px;' +
      'background: #1a1a2e;' +
      'border-top: 1px solid #333;' +
      'gap: 8px;' +
    '}' +
    '.mini-chat-input input {' +
      'flex: 1;' +
      'background: #0f0f23;' +
      'border: 1px solid #333;' +
      'color: #fff;' +
      'padding: 10px 15px;' +
      'border-radius: 20px;' +
      'font-size: 13px;' +
    '}' +
    '.mini-chat-input input:focus {' +
      'outline: none;' +
      'border-color: #e94560;' +
    '}' +
    '.mini-chat-input button {' +
      'background: linear-gradient(135deg, #e94560, #0f3460);' +
      'border: none;' +
      'color: #fff;' +
      'width: 40px;' +
      'height: 40px;' +
      'border-radius: 50%;' +
      'cursor: pointer;' +
      'font-size: 16px;' +
    '}' +
    '.mini-chat-input button:hover {' +
      'opacity: 0.9;' +
    '}';
  document.head.appendChild(style);
}

// Floating GARİBAN oluştur
function floatingRamcoOlustur() {
  // Önce stilleri ekle
  floatingStilleriEkle();
  
  // Zaten varsa oluşturma
  if (document.getElementById('floatingRamco')) return;
  
  // Ana container
  var container = document.createElement('div');
  container.id = 'floatingRamco';
  container.className = 'floating-ramco';
  container.innerHTML = '🤖';
  container.onclick = function() { miniChatToggle(); };
  
  // Bildirim badge
  var badge = document.createElement('div');
  badge.className = 'notif-badge';
  badge.id = 'floatingBadge';
  badge.style.display = 'none';
  badge.textContent = '0';
  container.appendChild(badge);
  
  document.body.appendChild(container);
  
  // Mini chat penceresi
  var miniChat = document.createElement('div');
  miniChat.id = 'miniChat';
  miniChat.className = 'mini-chat';
  miniChat.innerHTML = 
    '<div class="mini-chat-header">' +
      '<span>🤖 GARİBAN</span>' +
      '<button class="mini-chat-close" onclick="miniChatKapat()">✕</button>' +
    '</div>' +
    '<div class="mini-chat-body" id="miniChatBody"></div>' +
    '<div class="mini-chat-input">' +
      '<input type="text" id="miniChatInput" placeholder="Bir şey yaz...">' +
      '<button onclick="miniMesajGonder()">➤</button>' +
    '</div>';
  
  document.body.appendChild(miniChat);
  
  // Enter tuşu
  setTimeout(function() {
    var input = document.getElementById('miniChatInput');
    if (input) {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') miniMesajGonder();
      });
    }
  }, 100);
  
  // Hoş geldin mesajı
  setTimeout(function() {
    miniMesajEkle('Merhaba! 👋 Ben GARİBAN. Yardıma ihtiyacın olursa buradayım!', 'ramco');
  }, 1000);
}

function miniChatToggle() {
  var chat = document.getElementById('miniChat');
  if (chat) {
    chat.classList.toggle('active');
  }
}

function miniChatKapat() {
  var chat = document.getElementById('miniChat');
  if (chat) {
    chat.classList.remove('active');
  }
}

function miniMesajGonder() {
  var input = document.getElementById('miniChatInput');
  var mesaj = input.value.trim();
  if (!mesaj) return;
  
  miniMesajEkle(mesaj, 'user');
  input.value = '';
  
  // Basit cevap
  setTimeout(function() {
    var cevap = miniCevapUret(mesaj);
    miniMesajEkle(cevap, 'ramco');
  }, 500);
}

function miniMesajEkle(mesaj, kimden) {
  var body = document.getElementById('miniChatBody');
  if (!body) return;
  
  var div = document.createElement('div');
  div.className = 'chat-message ' + kimden;
  div.style.marginBottom = '8px';
  div.style.display = 'flex';
  div.style.gap = '8px';
  div.style.flexDirection = kimden === 'user' ? 'row-reverse' : 'row';
  
  div.innerHTML = 
    '<div style="width:25px;height:25px;border-radius:50%;background:' + 
    (kimden === 'ramco' ? '#e94560' : '#28a745') + 
    ';display:flex;align-items:center;justify-content:center;font-size:12px">' +
    (kimden === 'ramco' ? '🤖' : '👤') + '</div>' +
    '<div style="max-width:70%;padding:8px 12px;border-radius:12px;font-size:11px;' +
    'background:' + (kimden === 'ramco' ? 'rgba(233,69,96,0.2)' : 'rgba(40,167,69,0.2)') + '">' +
    mesaj + '</div>';
  
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function miniCevapUret(mesaj) {
  var m = mesaj.toLowerCase();
  
  if (m.includes('merhaba') || m.includes('selam')) {
    return 'Merhaba! 😊 Nasıl yardımcı olabilirim?';
  }
  if (m.includes('sipariş') || m.includes('kargo') || m.includes('fatura')) {
    return 'Detaylı bilgi için GARİBAN sayfasına git! 📊';
  }
  if (m.includes('yardım')) {
    return 'GARİBAN sayfasında sistem analizi, tahmin, motivasyon ve daha fazlası var! 🤖';
  }
  
  var cevaplar = [
    'Anlıyorum! 😊',
    'Tamam! 👍',
    'GARİBAN sayfasında daha fazla özellik var!',
    'Seninle sohbet etmek güzel! 💬'
  ];
  return cevaplar[Math.floor(Math.random() * cevaplar.length)];
}

// Sayfa yüklenince floating GARİBAN'ı oluştur
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', floatingRamcoOlustur);
} else {
  floatingRamcoOlustur();
}