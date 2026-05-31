// login.js — Lógica da página de autenticação

document.addEventListener('DOMContentLoaded', () => {
  // Se já está autenticado, volta para a home
  if (api.getToken()) {
    window.location.href = '/index.html';
    return;
  }

  // Botão voltar
  const seta = document.getElementById('seta');
  if (seta) seta.addEventListener('click', () => window.history.back());

  // ── ABAS ──
  const tabLogin       = document.getElementById('tab-login');
  const tabCadastro    = document.getElementById('tab-cadastro');
  const painelLogin    = document.getElementById('painel-login');
  const painelCadastro = document.getElementById('painel-cadastro');

  function ativarAba(aba) {
    const isLogin = aba === 'login';
    tabLogin.classList.toggle('ativa', isLogin);
    tabCadastro.classList.toggle('ativa', !isLogin);
    painelLogin.classList.toggle('ativo', isLogin);
    painelCadastro.classList.toggle('ativo', !isLogin);
    limparMensagens();
  }

  tabLogin.addEventListener('click', () => ativarAba('login'));
  tabCadastro.addEventListener('click', () => ativarAba('cadastro'));

  // ── MENSAGENS ──
  function mostrarMensagem(idMsg, texto, tipo) {
    const el = document.getElementById(idMsg);
    if (!el) return;
    el.textContent = texto;
    el.className = `msg-feedback ${tipo}`;
  }

  function limparMensagens() {
    ['msg-login', 'msg-cadastro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = 'msg-feedback';
    });
  }

  function setCarregando(btn, ativo) {
    btn.disabled = ativo;
    btn.classList.toggle('carregando', ativo);
  }

  // ── LOGIN ──
  const btnLogin = document.getElementById('btn-login');
  const inpEmail = document.getElementById('login-email');
  const inpSenha = document.getElementById('login-senha');

  async function fazerLogin() {
    const email = inpEmail.value.trim();
    const senha = inpSenha.value;

    if (!email || !senha) {
      mostrarMensagem('msg-login', 'Preencha e-mail e senha.', 'erro');
      return;
    }

    setCarregando(btnLogin, true);

    try {
      // Usa api.post para ir pelo cliente centralizado (sem auto-save de sessão)
      const res = await api.post('/auth/login', { email, senha });

      if (!res || !res.ok) {
        const body = res ? await res.json().catch(() => ({})) : {};
        mostrarMensagem('msg-login', body.erro || 'E-mail ou senha incorretos.', 'erro');
        return;
      }

      const { token, user } = await res.json();
      api.salvarSessao(token, user);

      // Redireciona para a página de origem ou para a home
      const params = new URLSearchParams(window.location.search);
      const origem = params.get('redirect');
      window.location.href = origem ? decodeURIComponent(origem) : '/index.html';

    } catch (err) {
      mostrarMensagem('msg-login', 'Erro de conexão. Tente novamente.', 'erro');
    } finally {
      setCarregando(btnLogin, false);
    }
  }

  btnLogin.addEventListener('click', fazerLogin);
  inpSenha.addEventListener('keydown', e => {
    if (e.key === 'Enter') fazerLogin();
  });

  // ── CADASTRO ──
  const btnCadastro = document.getElementById('btn-cadastro');
  const inpNome     = document.getElementById('cad-nome');
  const inpCadEmail = document.getElementById('cad-email');
  const inpCadSenha = document.getElementById('cad-senha');
  const inpConfirma = document.getElementById('cad-confirma');

  async function fazerCadastro() {
    const nome     = inpNome.value.trim();
    const email    = inpCadEmail.value.trim();
    const senha    = inpCadSenha.value;
    const confirma = inpConfirma.value;

    if (!nome || !email || !senha || !confirma) {
      mostrarMensagem('msg-cadastro', 'Preencha todos os campos.', 'erro');
      return;
    }

    if (senha.length < 6) {
      mostrarMensagem('msg-cadastro', 'A senha deve ter pelo menos 6 caracteres.', 'erro');
      return;
    }

    if (senha !== confirma) {
      mostrarMensagem('msg-cadastro', 'As senhas não coincidem.', 'erro');
      return;
    }

    setCarregando(btnCadastro, true);

    try {
      const res = await api.post('/auth/register', { nome, email, senha });

      if (!res || !res.ok) {
        const body = res ? await res.json().catch(() => ({})) : {};
        mostrarMensagem('msg-cadastro', body.erro || 'Não foi possível criar a conta.', 'erro');
        return;
      }

      mostrarMensagem('msg-cadastro', 'Conta criada! Faça login para continuar.', 'sucesso');

      // Pré-preenche o e-mail na aba login e troca de aba
      setTimeout(() => {
        inpEmail.value = email;
        ativarAba('login');
      }, 1500);

    } catch (err) {
      mostrarMensagem('msg-cadastro', 'Erro de conexão. Tente novamente.', 'erro');
    } finally {
      setCarregando(btnCadastro, false);
    }
  }

  btnCadastro.addEventListener('click', fazerCadastro);
  inpConfirma.addEventListener('keydown', e => {
    if (e.key === 'Enter') fazerCadastro();
  });
});
