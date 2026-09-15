(function() {
    // 1. Crear el contenedor host para el Shadow DOM
    const host = document.createElement('div');
    host.id = 'pestana-sidebar-host';
    document.body.appendChild(host);

    // 2. Adjuntar el Shadow DOM (Escudo protector de estilos y variables)
    const shadow = host.attachShadow({ mode: 'open' });

    // 3. Inyectar Estilos y Estructura HTML encapsulados
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
            .sidebar.open {
                left: 0;
            }
            .sidebar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 35px;
                border-bottom: 1px solid #1f3622;
                padding-bottom: 15px;
            }
            .sidebar-header h3 {
                margin: 0;
                color: #4CAF50;
                font-size: 18px;
            }
            .close-btn {
                background: none;
                border: none;
                color: #aaa;
                font-size: 22px;
                cursor: pointer;
            }
            .close-btn:hover {
                color: #fff;
            }
            .sidebar-menu {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .sidebar-menu li {
                margin: 18px 0;
            }
            .sidebar-menu a {
                color: #e0e0e0;
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 15px;
                transition: color 0.2s;
            }
            .sidebar-menu a:hover {
                color: #4CAF50;
            }
        </style>

        <div class="sidebar" id="appSidebar">
            <div class="sidebar-header">
                <h3>Duckie Duck Pro</h3>
                <button class="close-btn" id="btnCloseSidebar">&times;</button>
            </div>
            <ul class="sidebar-menu">
                <li><a href="#" data-menu="New chat">✨ New chat</a></li>
                <li><a href="#" data-menu="Chats">💬 Chats</a></li>
                <li><a href="#" data-menu="Media">📁 Media</a></li>
                <li><a href="#" data-menu="Schedules">📅 Schedules</a></li>
                <li><a href="#" data-menu="Library">📚 Library</a></li>
                <li><a href="#" data-menu="Projects">📂 Projects</a></li>
            </ul>
        </div>
    `;

    // 4. Lógica de control interna
    const sidebar = shadow.getElementById('appSidebar');
    const btnClose = shadow.getElementById('btnCloseSidebar');

    // Función global accesible desde el index.html para abrir/cerrar
    window.togglePestanaSidebar = function() {
        sidebar.classList.toggle('open');
    };

    btnClose.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Manejador de selección de menús
    shadow.querySelectorAll('.sidebar-menu a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const menuName = item.getAttribute('data-menu');
            console.log(`Opción seleccionada: ${menuName}`);
            sidebar.classList.remove('open');
        });
    });
})();