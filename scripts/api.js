// api.js — cliente centralizado da Bulbe Energia API
// Todas as páginas devem importar este arquivo antes dos seus scripts.

const BASE_URL = 'http://localhost:3000/api/v1';

// ----- Gerenciamento de sessão -----

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function isAdmin() {
  const user = getUser();
  return user && user.papel === 'admin';
}

function salvarSessao(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function encerrarSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ----- Cliente HTTP -----

async function request(path, options = {}) {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...options,
  };

  const response = await fetch(BASE_URL + path, config);

  if (response.status === 401) {
    encerrarSessao();
    // Não redireciona se já estamos na página de login (evita loop infinito)
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/paginas/login.html';
      return null;
    }
    return response;
  }

  return response;
}

// ----- API pública -----

const api = {
  get:    (path)       => request(path, { method: 'GET' }),
  post:   (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),

  // Auth
  async login(email, senha) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    if (!res || !res.ok) throw new Error('Credenciais inválidas.');
    const { token, user } = await res.json();
    salvarSessao(token, user);
    return user;
  },

  async register(nome, email, senha) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });
    if (!res || !res.ok) {
      const { erro } = await res.json();
      throw new Error(erro || 'Erro ao cadastrar.');
    }
    return res.json();
  },

  logout() {
    encerrarSessao();
    window.location.href = '/index.html';
  },

  // Sessão
  getToken,
  getUser,
  isAdmin,
  salvarSessao,
  encerrarSessao,
};
