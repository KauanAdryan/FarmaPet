// Configuração inicial
export const apiBaseUrl = 'http://localhost:8080';

// Verificação de autenticação - deve ser executada antes de qualquer outra coisa
export function checkUserLoggedIn() {
  const isLoggedIn = localStorage.getItem('userLoggedIn');
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;

  console.log('Verificando autenticação:', { isLoggedIn, currentPath, currentHref });

  if (!isLoggedIn &&
    !currentPath.includes('login.html') &&
    !currentHref.includes('login.html')) {
    console.log('Usuário não autenticado, redirecionando para login...');
    window.location.href = 'login.html';
    return false;
  }

  console.log('Usuário autenticado ou na página de login');
  return true;
}

// Função para obter o username do usuário logado
export function getLoggedInUsername() {
  return localStorage.getItem('username');
}

// Função para fazer logout
export async function performLogout() {
  try {
    const response = await fetch(`${apiBaseUrl}/logout`, {
      method: 'POST',
      credentials: 'include'  // <- Adicionado aqui
    });

    if (response.ok) {
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('username');

      alert('Logout realizado com sucesso');
      setTimeout(() => window.location.href = 'login.html', 1000);
    } else {
      alert('Erro ao fazer logout');
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    alert('Erro ao conectar com o servidor');
  }
}

// Função helper para pegar elemento
export function getElement(selector) {
  return document.querySelector(selector);
}

// Converte arquivo para base64
export function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Formata CPF
export function formatarCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Aplica máscaras de input
export function aplicarMascaras() {
  const cpfInput = getElement('#cpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
      if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
      if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
      e.target.value = value.substring(0, 14);
    });
  }

  const telefoneInput = getElement('#telefone');
  if (telefoneInput) {
    telefoneInput.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 2) value = value.replace(/^(\d{2})/, '($1) ');
      if (value.length > 10) value = value.replace(/^(\(\d{2}\)\s\d{5})/, '$1-');
      e.target.value = value.substring(0, 15);
    });
  }

  const cepInput = getElement('#cep');
  if (cepInput) {
    cepInput.addEventListener('input', e => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 5) value = value.replace(/^(\d{5})/, '$1-');
      e.target.value = value.substring(0, 9);
    });
  }
}

// Valida e busca CEP via API
export async function buscarCEP(cep) {
  cep = cep.replace(/\D/g, '');
  if (!/^\d{8}$/.test(cep)) {
    throw new Error('CEP inválido. Deve conter 8 dígitos numéricos.');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) throw new Error('CEP não encontrado');
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
}

// Habilita/desabilita botão com spinner
export function toggleButtonState(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent.trim();
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${button.dataset.originalText}`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.textContent;
    delete button.dataset.originalText;
  }
}

// Exibe mensagens
export function showMessage(message, type = 'info') {
  alert(message);
  // Ou use notificações visuais com Bootstrap como alternativa
}
