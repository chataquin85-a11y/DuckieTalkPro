(function() {
  const host = document.createElement('div');
  host.id = 'pestana-sidebar-host';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
     .sidebar {
        position: fixed;
        top: 0;
        left: -300px;
        width: 280px;
        height: 100vh;
        background-color: #121e14;
        color: #fff;
        transition: left 0.3s ease;
        z-index: 9999;
        box-shadow: 4px 0 20px rgba(0,0,0,0.7);
        padding: 25px 20px;
        box-sizing: border-box;
        border-right: 1px solid #1f3622;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
     .sidebar.open { left: 0; }
     .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 35px;
        border-bottom: 1px solid #1f3622;
        padding-bottom: 15px;
      }
     .sidebar-header h3 { margin: 0; color: #4CAF50; font-size: 18px; }
     .close-btn { background: none; border: none; color: #aaa; font-size: 22px; cursor: pointer; }
     .close-btn:hover { color: #fff; }
     .sidebar-menu { list-style: none; padding: 0; margin: 0; }
     .sidebar-menu li { margin: 18px 0; }
     .sidebar-menu a {
        color: #e0e0e0;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 15px;
        transition: color 0.2s;
      }
     .sidebar-menu a:hover { color: #4CAF50; }
     .sidebar-overlay {
        position: fixed;
        top:0; left:0;
        width:100vw; height:100vh;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
        display: none;
      }
     .sidebar-overlay.open { display: block; }
    </style>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <div class="sidebar" id="appSidebar">
      <div class="sidebar-header">
        <h3>Duckie Duck Pro 🦆</h3>
        <button class="close-btn" id="btnCloseSidebar">&times;</button>
      </div>
      <ul class="sidebar-menu">
        <li><a href="#" data-menu="New chat">✨ New chat</a></li>
        <li><a href="#" data-menu="Chats">💬 Chats</a></li>
        <li><a href="#" data-menu="AI Chat">🧠 AI Chat</a></li>
        <li><a href="#" data-menu="Llamada">📞 Llamada VIVO</a></li>
        <li><a href="#" data-menu="Media">🖼️ Media</a></li>
        <li><a href="#" data-menu="MarketPlace">🛒 MarketPlace</a></li>
        <li><a href="#" data-menu="Schedules">📅 Schedules</a></li>
        <li><a href="#" data-menu="Library">📚 Library</a></li>
        <li><a href="#" data-menu="Projects">📁 Projects</a></li>
      </ul>
    </div>
  `;

  const sidebar = shadow.getElementById('appSidebar');
  const overlay = shadow.getElementById('sidebarOverlay');
  const btnClose = shadow.getElementById('btnCloseSidebar');
  let lastPestana = localStorage.getItem('lastPestana') || 'Chats';

  window.togglePestanaSidebar = function() {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    } else {
      sidebar.classList.add('open');
      overlay.classList.add('open');
    }
  };

  window.cleanAllListeners = function(keepCall = false) {
    if (window.unsubscribeAI) { try{window.unsubscribeAI();}catch(e){} window.unsubscribeAI = null; }
    if (window.unsubscribeNative) { try{window.unsubscribeNative();}catch(e){} window.unsubscribeNative = null; }
    if (window.unsubscribeMarket) { try{window.unsubscribeMarket();}catch(e){} window.unsubscribeMarket = null; }
    if (window.unsubscribeMedia) { try{window.unsubscribeMedia();}catch(e){} window.unsubscribeMedia = null; }
    if (!keepCall) {
      if (window.unsubscribeCall) { try{window.unsubscribeCall();}catch(e){} window.unsubscribeCall = null; }
    }
    console.log('[Duckie] Listeners limpiados - keepCall:', keepCall);
  }

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  btnClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  shadow.querySelectorAll('.sidebar-menu a').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const menuName = item.getAttribute('data-menu');
      console.log(`[Duckie] Saltando a: ${menuName}`);

      if (menuName !== 'Media' && menuName !== 'MarketPlace') {
        lastPestana = menuName;
        localStorage.setItem('lastPestana', lastPestana);
      }

      switch(menuName) {
        case 'New chat':
        case 'AI Chat':
          window.cleanAllListeners(false);
          window.location.href = 'ai-chat.html';
          break;

        case 'Chats':
          window.cleanAllListeners(false);
          window.location.href = 'index.html';
          break;

        case 'Llamada':
        case 'Llamadas':
        case 'Llamada VIVO':
          window.cleanAllListeners(true);
          closeSidebar();
          if(window.initVivoCall) window.initVivoCall();
          else {
            const callContainer = document.getElementById('llamadaVivoContainer') || document.getElementById('callDialpad');
            if(callContainer) callContainer.style.display = 'block';
          }
          return;

        case 'Media':
        case 'MarketPlace':
          window.cleanAllListeners(false);
          const from = (lastPestana === 'New chat' || lastPestana === 'AI Chat') ? 'ai-chat.html' : 'index.html';
          window.location.href = `marketplace.html?from=${encodeURIComponent(from)}`;
          break;

        case 'Schedules':
        case 'Library':
        case 'Projects':
          alert(`${menuName} - En construcción`);
          closeSidebar();
          return;

        default:
          break;
      }

      closeSidebar();
    });
  });

  if (window.location.pathname.includes('marketplace.html')) {
    window.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(window.location.search);
      const fromPage = params.get('from') || 'index.html';
      const btnBack = document.getElementById('btnBackMarket') || document.getElementById('backBtn');
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          window.cleanAllListeners(false);
          window.location.href = fromPage;
        });
      }
    });
  }

  console.log('[DuckieTalkPro] pestana.js V2 - Llamada VIVO preservada + MarketPlace con regreso');
})();