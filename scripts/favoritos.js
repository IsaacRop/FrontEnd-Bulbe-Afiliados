// favoritos.js — usa a API em vez do localStorage

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const produtosContainer = document.querySelector('.caixa');

document.addEventListener('DOMContentLoaded', async () => {
  if (!produtosContainer) {
    console.error('Container de produtos não encontrado.');
    return;
  }

  const botaoMais = document.querySelector('.botao-mais');
  if (botaoMais) {
    botaoMais.addEventListener('click', () => { window.location.href = '/index.html'; });
  }

  const botaoVoltar = document.getElementById("seta");
  if (botaoVoltar) {
    botaoVoltar.addEventListener('click', () => window.history.back());
  }

  // Redireciona para login se não tiver token
  if (!api.getToken()) {
    window.location.href = '/paginas/login.html';
    return;
  }

  await carregarFavoritos();
  configurarListenersDoContainer(produtosContainer);
});

async function carregarFavoritos() {
  produtosContainer.innerHTML = '';

  const res = await api.get('/favoritos');
  if (!res || !res.ok) {
    produtosContainer.innerHTML = '<div class="nenhumProd"><h1>Erro ao carregar favoritos.</h1></div>';
    return;
  }

  const { data: favoritos } = await res.json();

  if (!favoritos || favoritos.length === 0) {
    produtosContainer.innerHTML = '<div class="nenhumProd"><h1>Nenhum produto favorito</h1></div>';
    return;
  }

  favoritos.forEach(item => {
    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto');
    produtoDiv.dataset.favoritoId = item.id;
    produtoDiv.dataset.produtoId  = item.produto_id;

    produtoDiv.innerHTML = `
      <div class="x"></div>
      <div class="imagem-card">
        <img src="/assets/img/${escapeHtml(item.imagem || '')}" alt="${escapeHtml(item.produto_nome || '')}" class="imgfavoritos">
      </div>
      <div class="espe">
        <span class="nome-produto">${escapeHtml(item.produto_nome || '')}</span>
        <span class="preco">R$ ${escapeHtml(String(item.preco || ''))}</span>
        <a href="/paginas/produto.html?id=${item.produto_id}">
          <button class="comprar">Comprar</button>
        </a>
      </div>
    `;
    produtosContainer.appendChild(produtoDiv);
  });
}

function configurarListenersDoContainer(container) {
  container.addEventListener('click', async (e) => {
    if (e.target.classList.contains('x')) {
      const produto = e.target.closest('.produto');
      if (!produto) return;

      const favoritoId = produto.dataset.favoritoId;
      const res = await api.delete('/favoritos/' + favoritoId);
      if (res && (res.ok || res.status === 204)) {
        produto.remove();
        if (produtosContainer.querySelectorAll('.produto').length === 0) {
          produtosContainer.innerHTML = '<div class="nenhumProd"><h1>Nenhum produto favorito</h1></div>';
        }
      }
    }
  });
}
