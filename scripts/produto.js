document.addEventListener("DOMContentLoaded", () => {
  // 1. Pegar o ID da URL (?id=1)
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    console.error("Nenhum ID de produto encontrado na URL.");
    document.getElementById("nome-produto").textContent = "Produto não encontrado.";
    return;
  }

  // 2. Buscar produto pela API
  api.get('/produtos/' + id)
    .then(response => {
      if (!response || !response.ok) throw new Error("Produto não encontrado");
      return response.json();
    })
    .then(json => {
      const produto = json.data;

      if (!produto) {
        document.getElementById("nome-produto").textContent = "Produto não encontrado.";
        return;
      }

      // 3. Preencher os dados no HTML
      document.getElementById("nome-produto").textContent = produto.nome;
      document.getElementById("descricao-produto").textContent = produto.descricao;
      document.getElementById("preco-produto").textContent = `R$ ${produto.preco.toFixed(2)}`;
      document.getElementById("foto-principal").src = `/assets/img/${produto.imagem}`;
      document.getElementById("link-afiliado").href = produto.linkAfiliado;
      document.getElementById("logo-marca").src = `/assets/img/${produto.lojalogo}`;
      document.getElementById("avaliacao-produto").innerHTML = `<h1>${produto.totalstar || 0}</h1> <img src="/assets/img/Icon.png" alt="estrela" /> <p>(${produto.totalavali || 0})</p>`;

      // 4. Tratar imagem ausente
      document.getElementById("foto-principal").addEventListener("error", () => {
        document.getElementById("foto-principal").src = "/assets/img/placeholder.jpg";
      });
    })
    .catch(error => {
      console.error("Erro ao carregar produto:", error);
      document.getElementById("nome-produto").textContent = "Erro ao carregar produto.";
    });
});


const sim = document.getElementById("sim");
const nao = document.getElementById("nao");
const fundo = document.getElementById("fundo");
const fundoRedi = document.getElementsByClassName("fundoRedi")[0];
const buttonPop = document.getElementById("buttonPop");
const redirecionamento = document.querySelector(".redirecionamento");

function abrirPopup() {
  if (!fundoRedi) return;
  fundoRedi.classList.remove("off");
  if (fundo) fundo.classList.add("blur");
}

function fecharPopup() {
  if (!fundoRedi) return;
  fundoRedi.classList.add("off");
  if (fundo) fundo.classList.remove("blur");
}

if (buttonPop) {
  buttonPop.addEventListener("click", abrirPopup);
}

if (nao) {
  nao.addEventListener("click", fecharPopup);
}

// "Sim" abre o parceiro em nova aba (<a target="_blank">) — fecha o popup na aba atual
if (sim) {
  sim.addEventListener("click", fecharPopup);
}

// Fechar ao clicar no fundo escuro (fora do card)
if (fundoRedi) {
  fundoRedi.addEventListener("click", (e) => {
    if (e.target === fundoRedi) fecharPopup();
  });
}

// Evita que cliques dentro do card propaguem e fechem o popup
if (redirecionamento) {
  redirecionamento.addEventListener("click", (e) => e.stopPropagation());
}

// Fechar com a tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharPopup();
});


// Funcionamento do botão de favoritos
document.addEventListener("DOMContentLoaded", () => {
  const bookmarkEl = document.querySelector(".bookmark img") || document.querySelector(".bookmark");
  if (!bookmarkEl) return;

  bookmarkEl.style.cursor = "pointer";
  bookmarkEl.setAttribute("role", "button");
  bookmarkEl.tabIndex = 0;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const ICONE_PADRAO   = "/assets/img/Component.png";
  const ICONE_FAVORITO = "/assets/img/icon-favorito-completo.png";

  function atualizarIcone() {
    if (bookmarkEl.classList.contains("favorito")) {
      bookmarkEl.src = ICONE_FAVORITO;
      bookmarkEl.alt = "Remover dos Favoritos";
    } else {
      bookmarkEl.src = ICONE_PADRAO;
      bookmarkEl.alt = "Favoritar";
    }
  }

  async function toggleFavorito() {
    try {
      const token = api.getToken();

      if (!token) {
        window.location.href = '/paginas/login.html';
        return;
      }

      if (bookmarkEl.classList.contains("favorito")) {
        // Remover favorito: busca o ID do favorito na lista
        const res = await api.get('/favoritos');
        if (!res || !res.ok) return;
        const { data: favoritos } = await res.json();
        const favorito = favoritos.find(f => String(f.produto_id) === String(id));
        if (favorito) {
          await api.delete('/favoritos/' + favorito.id);
        }
        bookmarkEl.classList.remove("favorito");
      } else {
        // Adicionar favorito
        const res = await api.post('/favoritos', { produtoId: Number(id) });
        if (res && (res.status === 201 || res.status === 422)) {
          bookmarkEl.classList.add("favorito");
        }
      }
      atualizarIcone();
    } catch (err) {
      console.error("Erro ao alternar favorito:", err);
    }
  }

  bookmarkEl.addEventListener("click", toggleFavorito);
  bookmarkEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFavorito();
    }
  });

  // Estado inicial: verifica se produto já é favorito
  (async () => {
    try {
      const token = api.getToken();
      if (!token) return;
      const res = await api.get('/favoritos');
      if (!res || !res.ok) return;
      const { data: favoritos } = await res.json();
      if (favoritos.find(f => String(f.produto_id) === String(id))) {
        bookmarkEl.classList.add("favorito");
      }
      atualizarIcone();
    } catch (err) {
      console.error(err);
    }
  })();
});


const botaoVoltar = document.getElementById("seta");
if (botaoVoltar) {
  botaoVoltar.addEventListener('click', () => {
    window.history.back();
  });
}


// Sistema de avaliações — integrado à API de comentários
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const PRODUTO_ID = urlParams.get("id");

  const ui = {
    btnAbrir:          document.getElementById("abrir"),
    formContainer:     document.getElementById("form"),
    containerAnalises: document.getElementById("analises"),
    stars:             document.querySelectorAll(".star"),
    btnEnviar:         document.getElementById("enviar"),
    inputComentario:   document.getElementById("comenta"),
  };

  if (!ui.btnAbrir || !PRODUTO_ID) return;

  let notaSelecionada = 0;

  const toggleFormulario = () => {
    const isFlex = ui.formContainer.style.display === "flex";
    ui.formContainer.style.display = isFlex ? "none" : "flex";
    ui.btnAbrir.textContent = isFlex ? "Adicionar avalição" : "Cancelar";
  };

  const atualizarEstrelas = (valor) => {
    notaSelecionada = valor;
    ui.stars.forEach((s) => s.classList.toggle("gold", parseInt(s.value) <= valor));
  };

  // criadoEm vem do SQLite como "YYYY-MM-DD HH:MM:SS" em UTC
  const formatarData = (criadoEm) => {
    const data = new Date(criadoEm.replace(" ", "T") + "Z");
    return isNaN(data) ? "" : data.toLocaleDateString("pt-BR");
  };

  const criarCardHTML = (comentario) => {
    const div = document.createElement("div");
    div.classList.add("avalia");
    const nomeEl       = document.createElement("h3"); nomeEl.textContent = comentario.usuarioNome;
    const dataEl       = document.createElement("h5"); dataEl.textContent = formatarData(comentario.criadoEm);
    const comentarioEl = document.createElement("h4"); comentarioEl.textContent = comentario.conteudo;
    const headerDiv    = document.createElement("div"); headerDiv.classList.add("nome-tempo");
    headerDiv.appendChild(nomeEl); headerDiv.appendChild(dataEl);
    const notaDiv = document.createElement("div"); notaDiv.classList.add("nota");
    notaDiv.style.color = "gold";
    notaDiv.textContent = comentario.nota ? "⭐".repeat(comentario.nota) : "";
    div.appendChild(headerDiv); div.appendChild(notaDiv); div.appendChild(comentarioEl);
    return div;
  };

  const carregarComentarios = async () => {
    ui.containerAnalises.innerHTML = "";
    const res = await api.get('/comentarios?produtoId=' + PRODUTO_ID);
    if (!res || !res.ok) {
      ui.containerAnalises.innerHTML = "<p style='padding:20px;color:#666'>Erro ao carregar avaliações.</p>";
      return;
    }
    const { data: comentarios } = await res.json();
    if (!comentarios || comentarios.length === 0) {
      ui.containerAnalises.innerHTML = "<p style='padding:20px;color:#666'>Seja o primeiro a avaliar!</p>";
      return;
    }
    comentarios.forEach(c => ui.containerAnalises.appendChild(criarCardHTML(c)));
  };

  const processarEnvio = async () => {
    if (!api.getToken()) {
      window.location.href = '/paginas/login.html';
      return;
    }

    const texto = ui.inputComentario.value.trim();
    if (!texto || notaSelecionada === 0) { alert("Escreva um comentário e selecione uma nota!"); return; }

    const res = await api.post('/comentarios', { produtoId: Number(PRODUTO_ID), conteudo: texto, nota: notaSelecionada });
    if (!res || !res.ok) {
      const corpo = res ? await res.json().catch(() => ({})) : {};
      alert(corpo.erro || "Erro ao enviar avaliação.");
      return;
    }

    const { data: novoComentario } = await res.json();
    const msgVazia = ui.containerAnalises.querySelector("p");
    if (msgVazia) msgVazia.remove();
    ui.containerAnalises.prepend(criarCardHTML(novoComentario));

    ui.inputComentario.value = "";
    atualizarEstrelas(0);
    toggleFormulario();
  };

  ui.btnAbrir.addEventListener("click", toggleFormulario);
  ui.btnEnviar.addEventListener("click", processarEnvio);
  ui.stars.forEach(star => star.addEventListener("click", e => atualizarEstrelas(parseInt(e.target.value))));
  carregarComentarios();
});
