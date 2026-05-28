// scripts/admin.js

const URL_PADRAO = 'http://localhost:3000/api/v1';

// ─── Verificação de acesso ────────────────────────────────────────────────────
(function verificarAcesso() {
  if (!api.isAdmin()) {
    document.getElementById('acesso-negado').style.display = 'flex';
    return;
  }
  const user = api.getUser();
  document.getElementById('nome-admin').textContent = `👤 ${user.nome || user.email || 'Admin'}`;
  document.getElementById('conteudo-admin').style.display = 'block';
  inicializar();
})();

document.getElementById('btn-sair').addEventListener('click', () => api.logout());

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${tipo}`;
  setTimeout(() => { el.className = ''; }, 3000);
}

// ─── Abas ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.aba').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
    btn.classList.add('ativa');
    document.getElementById('secao-' + btn.dataset.aba).classList.add('ativa');
  });
});

// ─── Inicializar ──────────────────────────────────────────────────────────────
async function inicializar() {
  await Promise.all([
    carregarAfiliados(),
    carregarProdutos(),
    carregarUsuarios(),
    inicializarAbaApi(),
  ]);
}

// ══════════════════════════════════════════════════════════════════════════════
// ABA PRODUTOS
// ══════════════════════════════════════════════════════════════════════════════

async function carregarProdutos() {
  const lista = document.getElementById('lista-produtos');
  lista.innerHTML = '<p class="loading">Carregando...</p>';

  try {
    const res = await api.get('/produtos');
    if (!res || !res.ok) throw new Error();
    const { data } = await res.json();

    if (!data || data.length === 0) {
      lista.innerHTML = '<p class="loading">Nenhum produto cadastrado.</p>';
      return;
    }
    lista.innerHTML = '';
    data.forEach(p => lista.appendChild(criarItemProduto(p)));
  } catch {
    lista.innerHTML = '<p class="loading" style="color:var(--erro)">Erro ao carregar produtos.</p>';
  }
}

function criarItemProduto(produto) {
  const div = document.createElement('div');
  div.className = 'item-produto';
  div.innerHTML = `
    <img src="/assets/img/${produto.imagem || 'imagem-card.png'}"
         alt="${produto.nome}"
         onerror="this.src='/assets/img/imagem-card.png'" />
    <div class="item-info">
      <strong>${produto.nome}</strong>
      <span>R$ ${Number(produto.preco).toFixed(2)} · ${produto.categoria || '—'} · ${produto.loja || '—'}</span>
    </div>
    <div class="item-acoes">
      <button class="btn-editar">Editar</button>
      <button class="btn-excluir">Excluir</button>
    </div>
  `;
  div.querySelector('.btn-editar').addEventListener('click', () => abrirEdicao(produto));
  div.querySelector('.btn-excluir').addEventListener('click', () => excluirProduto(produto.id, produto.nome));
  return div;
}

// Criar produto
document.getElementById('form-produto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-criar-produto');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  const body = {
    nome:         document.getElementById('p-nome').value.trim(),
    preco:        Number(document.getElementById('p-preco').value),
    categoria:    document.getElementById('p-categoria').value,
    loja:         document.getElementById('p-loja').value,
    descricao:    document.getElementById('p-descricao').value.trim(),
    imagem:       document.getElementById('p-imagem').value.trim(),
    linkAfiliado: document.getElementById('p-link').value.trim(),
  };

  try {
    const res = await api.post('/produtos', body);
    if (res && res.status === 201) {
      toast('Produto cadastrado com sucesso!', 'ok');
      e.target.reset();
      await carregarProdutos();
    } else {
      const json = await res.json();
      toast(json.erro || 'Erro ao cadastrar produto.', 'erro');
    }
  } catch {
    toast('Erro de conexão.', 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cadastrar Produto';
  }
});

// Edição
function abrirEdicao(produto) {
  document.getElementById('edit-id').value        = produto.id;
  document.getElementById('edit-nome').value      = produto.nome;
  document.getElementById('edit-preco').value     = produto.preco;
  document.getElementById('edit-categoria').value = produto.categoria || '';
  document.getElementById('edit-imagem').value    = produto.imagem || '';
  document.getElementById('edit-descricao').value = produto.descricao || '';
  document.getElementById('edit-link').value      = produto.linkAfiliado || '';
  document.getElementById('overlay').classList.add('aberto');
}

function fecharModal() {
  document.getElementById('overlay').classList.remove('aberto');
}

document.getElementById('btn-cancelar-edicao').addEventListener('click', fecharModal);
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) fecharModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
});

document.getElementById('btn-salvar-edicao').addEventListener('click', async () => {
  const btn = document.getElementById('btn-salvar-edicao');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const id = document.getElementById('edit-id').value;
  const body = {
    nome:         document.getElementById('edit-nome').value.trim(),
    preco:        Number(document.getElementById('edit-preco').value),
    categoria:    document.getElementById('edit-categoria').value,
    imagem:       document.getElementById('edit-imagem').value.trim(),
    descricao:    document.getElementById('edit-descricao').value.trim(),
    linkAfiliado: document.getElementById('edit-link').value.trim(),
  };
  Object.keys(body).forEach(k => { if (body[k] === '' || body[k] === 0) delete body[k]; });

  try {
    const res = await api.put('/produtos/' + id, body);
    if (res && res.ok) {
      toast('Produto atualizado!', 'ok');
      fecharModal();
      await carregarProdutos();
    } else {
      const json = await res.json();
      toast(json.erro || 'Erro ao atualizar produto.', 'erro');
    }
  } catch {
    toast('Erro de conexão.', 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar alterações';
  }
});

// Exclusão
async function excluirProduto(id, nome) {
  if (!confirm(`Deseja remover "${nome}"?\nEsta ação não pode ser desfeita.`)) return;
  try {
    const res = await api.delete('/produtos/' + id);
    if (res && (res.status === 200 || res.status === 204)) {
      toast('Produto removido.', 'ok');
      await carregarProdutos();
    } else {
      const json = await res.json();
      toast(json.erro || 'Erro ao remover produto.', 'erro');
    }
  } catch {
    toast('Erro de conexão.', 'erro');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ABA AFILIADOS
// ══════════════════════════════════════════════════════════════════════════════

async function carregarAfiliados() {
  try {
    const res = await api.get('/afiliados');
    if (!res || !res.ok) return;
    const { data } = await res.json();

    // Popular select do formulário de produto
    const select = document.getElementById('p-loja');
    select.innerHTML = '<option value="">Selecione...</option>';
    (data || []).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.nome;
      opt.textContent = a.nome;
      select.appendChild(opt);
    });

    // Popular lista da aba afiliados
    const lista = document.getElementById('lista-afiliados');
    if (!data || data.length === 0) {
      lista.innerHTML = '<p class="loading">Nenhum afiliado cadastrado.</p>';
      return;
    }
    lista.innerHTML = '';
    data.forEach(a => lista.appendChild(criarItemAfiliado(a)));
  } catch (err) {
    console.error('Erro ao carregar afiliados:', err);
  }
}

function criarItemAfiliado(afiliado) {
  const div = document.createElement('div');
  div.className = 'item-afiliado';
  div.innerHTML = `
    <div class="info">
      <strong>${afiliado.nome}</strong>
      <span>${afiliado.url || afiliado.site || '—'}</span>
    </div>
    <span class="badge-slug">${afiliado.slug || ''}</span>
  `;
  return div;
}

document.getElementById('form-afiliado').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-criar-afiliado');
  btn.disabled = true;
  btn.textContent = 'Cadastrando...';

  const body = {
    nome: document.getElementById('a-nome').value.trim(),
    slug: document.getElementById('a-slug').value.trim(),
    logo: document.getElementById('a-logo').value.trim() || 'icon-default.png',
    site: document.getElementById('a-site').value.trim(),
  };

  try {
    const res = await api.post('/afiliados', body);
    if (res && res.status === 201) {
      toast('Afiliado cadastrado com sucesso!', 'ok');
      e.target.reset();
      await carregarAfiliados();
    } else {
      const json = await res.json();
      toast(json.erro || 'Erro ao cadastrar afiliado.', 'erro');
    }
  } catch {
    toast('Erro de conexão.', 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cadastrar Afiliado';
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ABA API
// ══════════════════════════════════════════════════════════════════════════════

function inicializarAbaApi() {
  const urlSalva = localStorage.getItem('bulbe_api_url') || URL_PADRAO;
  document.getElementById('api-url').value = urlSalva;
  verificarConexao(urlSalva);
}

async function verificarConexao(url) {
  const indicador = document.getElementById('indicador-status');
  const texto = document.getElementById('texto-status');
  indicador.className = 'indicador';
  texto.textContent = 'Verificando...';

  try {
    const res = await fetch(url + '/produtos', {
      headers: { Authorization: 'Bearer ' + (api.getToken() || '') },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok || res.status === 401) {
      indicador.classList.add('online');
      texto.textContent = 'Online — API respondendo normalmente';
    } else {
      throw new Error();
    }
  } catch {
    indicador.classList.add('offline');
    texto.textContent = 'Offline — API não está respondendo';
  }
}

document.getElementById('btn-salvar-url').addEventListener('click', () => {
  const url = document.getElementById('api-url').value.trim();
  if (!url) { toast('Insira uma URL válida.', 'erro'); return; }
  localStorage.setItem('bulbe_api_url', url);
  toast('URL salva! Recarregue a página para aplicar.', 'ok');
});

document.getElementById('btn-testar-url').addEventListener('click', async () => {
  const btn = document.getElementById('btn-testar-url');
  const resultado = document.getElementById('resultado-teste');
  const url = document.getElementById('api-url').value.trim();
  btn.disabled = true;
  btn.textContent = 'Testando...';
  resultado.style.display = 'none';

  try {
    const res = await fetch(url + '/produtos', {
      headers: { Authorization: 'Bearer ' + (api.getToken() || '') },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok || res.status === 401) {
      resultado.className = 'resultado-teste ok';
      resultado.textContent = `✅ Conexão bem-sucedida! Status: ${res.status}`;
    } else {
      resultado.className = 'resultado-teste erro';
      resultado.textContent = `⚠️ API respondeu com status ${res.status}.`;
    }
  } catch {
    resultado.className = 'resultado-teste erro';
    resultado.textContent = '❌ Sem resposta. Verifique se a API está rodando e a URL está correta.';
  } finally {
    resultado.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Testar conexão';
  }
});

document.getElementById('btn-resetar-url').addEventListener('click', () => {
  localStorage.setItem('bulbe_api_url', URL_PADRAO);
  document.getElementById('api-url').value = URL_PADRAO;
  toast('URL resetada para o padrão.', 'ok');
  verificarConexao(URL_PADRAO);
});

// ══════════════════════════════════════════════════════════════════════════════
// ABA USUÁRIOS
// ══════════════════════════════════════════════════════════════════════════════

async function carregarUsuarios() {
  const lista = document.getElementById('lista-usuarios');
  lista.innerHTML = '<p class="loading">Carregando...</p>';

  try {
    const res = await api.get('/usuarios');

    // Endpoint não existe ainda
    if (!res || res.status === 404) {
      lista.innerHTML = `
        <div class="aviso">
          ⚠️ O endpoint <strong>GET /api/v1/usuarios</strong> ainda não foi implementado no backend.
          Para ativar esta aba, crie a rota, controller e service correspondentes no projeto da API.
        </div>`;
      return;
    }

    if (!res.ok) throw new Error();
    const { data } = await res.json();

    if (!data || data.length === 0) {
      lista.innerHTML = '<p class="loading">Nenhum usuário encontrado.</p>';
      return;
    }
    lista.innerHTML = '';
    data.forEach(u => lista.appendChild(criarItemUsuario(u)));
  } catch {
    lista.innerHTML = `
      <div class="aviso">
        ⚠️ O endpoint <strong>GET /api/v1/usuarios</strong> ainda não foi implementado no backend.
        Para ativar esta aba, crie a rota, controller e service correspondentes no projeto da API.
      </div>`;
  }
}

function criarItemUsuario(usuario) {
  const div = document.createElement('div');
  div.className = 'item-usuario';
  const isAdmin = usuario.papel === 'admin';
  div.innerHTML = `
    <div class="info">
      <strong>${usuario.nome || '—'}</strong>
      <span>${usuario.email}</span>
    </div>
    <span class="badge-papel ${usuario.papel}">${usuario.papel}</span>
    ${!isAdmin ? `<button class="btn-promover" data-id="${usuario.id}">Tornar admin</button>` : ''}
  `;

  if (!isAdmin) {
    div.querySelector('.btn-promover').addEventListener('click', () => promoverUsuario(usuario.id, usuario.nome));
  }
  return div;
}

async function promoverUsuario(id, nome) {
  if (!confirm(`Promover "${nome}" a admin?\nEsta ação dá acesso total ao painel.`)) return;
  try {
    const res = await api.patch
      ? await api.patch('/usuarios/' + id + '/papel', { papel: 'admin' })
      : await fetch((localStorage.getItem('bulbe_api_url') || URL_PADRAO) + '/usuarios/' + id + '/papel', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + api.getToken(),
          },
          body: JSON.stringify({ papel: 'admin' }),
        });

    if (res && res.ok) {
      toast(`${nome} agora é admin!`, 'ok');
      await carregarUsuarios();
    } else if (res && res.status === 404) {
      toast('Endpoint de promoção não implementado no backend.', 'erro');
    } else {
      toast('Erro ao promover usuário.', 'erro');
    }
  } catch {
    toast('Erro de conexão.', 'erro');
  }
}