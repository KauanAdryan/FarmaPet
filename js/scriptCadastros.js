// Configurações globais
export const apiBaseUrl = 'http://localhost:8080';

// ==============================================
// Módulo de Autenticação
// ==============================================

export function checkUserLoggedIn() {
  const isLoggedIn = localStorage.getItem('userLoggedIn');
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;

  if (!isLoggedIn &&
      !currentPath.includes('login.html') &&
      !currentHref.includes('login.html')) {
    console.log('Redirecionando para login...');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

export function getLoggedInUsername() {
  return localStorage.getItem('username');
}

export async function performLogout() {
  try {
    const response = await fetch(`${apiBaseUrl}/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('username');
      showMessage('Logout realizado com sucesso', 'success');
      setTimeout(() => window.location.href = 'login.html', 1000);
    } else {
      showMessage('Erro ao fazer logout', 'error');
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    showMessage('Erro ao conectar com o servidor', 'error');
  }
}

// ==============================================
// Módulo de Utilitários DOM
// ==============================================

export function getElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element) console.warn(`Elemento não encontrado: ${selector}`);
  return element;
}

export function showMessage(message, type = 'info') {
  const mensagemEl = getElement('#mensagemSistema');

  if (mensagemEl) {
    mensagemEl.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    mensagemEl.textContent = message;
    mensagemEl.style.display = 'block';
    setTimeout(() => mensagemEl.style.display = 'none', 4000);
  } else {
    alert(`${type.toUpperCase()}: ${message}`);
  }
}

export function showFieldError(input, message) {
  if (!input) return;

  clearFieldError(input);
  input.classList.add('is-invalid');

  const errorDiv = input.parentNode.querySelector('.invalid-feedback');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

export function clearFieldError(input) {
  if (!input) return;

  input.classList.remove('is-invalid');
  const errorDiv = input.parentNode.querySelector('.invalid-feedback');
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
}

// ==============================================
// Módulo de Formulários e Validação
// ==============================================

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

export function formatarCPF(cpf) {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

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

// ==============================================
// Módulo de Utilitários de Interface
// ==============================================

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

export function toBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo fornecido'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ==============================================
// Inicialização
// ==============================================

let alreadySetup = false;

function setup() {
  if (alreadySetup) return;
  alreadySetup = true;

  aplicarMascaras();
  checkUserLoggedIn();

  const logoutBtn = getElement('#btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      performLogout();
    });
  }
}

document.addEventListener('DOMContentLoaded', setup);
