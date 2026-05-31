// auth-header.js — Widget de usuário dinâmico para o header
// Inclua DEPOIS de api.js. Funciona em qualquer página com .icon-user no header.

(function () {

  // ── Injeta CSS uma única vez (funciona independente do CSS da página) ──
  if (!document.getElementById('auth-header-css')) {
    const style = document.createElement('style');
    style.id = 'auth-header-css';
    style.textContent = `
      .icon-user { position: relative; }

      /* Não logado */
      .avatar-link-login { display:flex; align-items:center; text-decoration:none; }
      .avatar-anonimo img {
        width:36px; height:36px; border-radius:50%;
        opacity:.5; filter:brightness(3);
        transition:opacity .2s; cursor:pointer;
      }
      .avatar-anonimo img:hover { opacity:.9; }

      /* Logado — círculo de iniciais */
      .avatar-usuario {
        width:38px; height:38px; border-radius:50%;
        background:linear-gradient(135deg,#4c49d6,#0B08C4);
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; position:relative; user-select:none;
        box-shadow:0 0 0 2px rgba(255,255,255,.25);
        transition:box-shadow .2s;
      }
      .avatar-usuario:hover { box-shadow:0 0 0 3px rgba(255,255,255,.5); }
      .avatar-iniciais { color:#fff; font-size:.75rem; font-weight:700; letter-spacing:.5px; }

      /* Badge admin */
      .avatar-admin-badge {
        position:absolute; bottom:-3px; right:-3px;
        width:15px; height:15px;
        background:#f1a240; color:#08068D;
        border-radius:50%; font-size:.55rem; font-weight:800;
        display:flex; align-items:center; justify-content:center;
        border:1.5px solid #08068D;
      }

      /* Dropdown */
      .avatar-dropdown {
        display:none; position:absolute; top:calc(100% + 10px); right:0;
        background:#fff; border-radius:12px;
        box-shadow:0 8px 24px rgba(8,6,141,.15);
        min-width:200px; z-index:9999; overflow:hidden;
        animation:authDropIn .18s ease;
      }
      .avatar-dropdown.aberto { display:block; }
      @keyframes authDropIn {
        from { opacity:0; transform:translateY(-6px); }
        to   { opacity:1; transform:translateY(0); }
      }

      .avatar-info {
        padding:14px 16px 10px; border-bottom:1px solid #E8ECF0;
        display:flex; flex-direction:column; gap:2px;
      }
      .avatar-info strong { font-size:.9rem; color:#151A1E; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .avatar-info span   { font-size:.75rem; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .avatar-papel {
        font-size:.7rem !important; color:#08068D !important; font-weight:600 !important;
        background:#EEF0FF; border-radius:4px; padding:2px 6px;
        display:inline-block; margin-top:2px;
      }

      .avatar-menu-item {
        display:block; padding:11px 16px; font-size:.85rem; color:#333;
        text-decoration:none; cursor:pointer; background:none; border:none;
        width:100%; text-align:left; font-family:"Poppins",sans-serif;
        transition:background .15s;
      }
      .avatar-menu-item:hover { background:#F6F9F9; }
      .avatar-sair { color:#d32f2f !important; border-top:1px solid #E8ECF0; }
    `;
    document.head.appendChild(style);
  }

  // ── Atualiza o ícone quando o DOM estiver pronto ──
  document.addEventListener('DOMContentLoaded', () => {
    const iconUser = document.querySelector('.icon-user');
    if (!iconUser) return;

    const token = api.getToken();
    const user  = api.getUser();

    if (!token || !user) {
      // Não autenticado: ícone cinza com link para login
      iconUser.innerHTML = `
        <a href="/paginas/login.html" class="avatar-link-login" title="Fazer login">
          <div class="avatar-anonimo">
            <img src="/assets/img/Avatar.png" alt="Entrar" />
          </div>
        </a>`;
      return;
    }

    // Autenticado: círculo com iniciais
    const iniciais = user.nome
      ? user.nome.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('')
      : '?';
    const isAdmin = user.papel === 'admin';

    iconUser.innerHTML = `
      <div class="avatar-usuario" id="avatar-btn" title="${user.nome}" role="button" tabindex="0">
        <span class="avatar-iniciais">${iniciais}</span>
        ${isAdmin ? '<span class="avatar-admin-badge" title="Admin">A</span>' : ''}
      </div>
      <div class="avatar-dropdown" id="avatar-dropdown" aria-hidden="true">
        <div class="avatar-info">
          <strong>${user.nome}</strong>
          ${user.email ? `<span>${user.email}</span>` : ''}
          ${isAdmin ? '<span class="avatar-papel">Administrador</span>' : ''}
        </div>
        ${isAdmin ? '<a href="/paginas/admin.html" class="avatar-menu-item">⚙ Painel Admin</a>' : ''}
        <button class="avatar-menu-item avatar-sair" id="btn-sair">↩ Sair</button>
      </div>`;

    const btn      = document.getElementById('avatar-btn');
    const dropdown = document.getElementById('avatar-dropdown');

    function toggleDropdown(e) {
      e.stopPropagation();
      const aberto = dropdown.classList.toggle('aberto');
      dropdown.setAttribute('aria-hidden', String(!aberto));
    }

    btn.addEventListener('click', toggleDropdown);
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(e); }
    });

    // Fecha ao clicar fora
    document.addEventListener('click', () => {
      dropdown.classList.remove('aberto');
      dropdown.setAttribute('aria-hidden', 'true');
    });

    document.getElementById('btn-sair').addEventListener('click', () => {
      api.encerrarSessao();
      window.location.href = '/paginas/login.html';
    });
  });

})();
