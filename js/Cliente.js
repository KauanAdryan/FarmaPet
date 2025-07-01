import { getElement, toggleButtonState, showMessage } from './scriptCadastros.js';
import { cadastrarEndereco } from './EnderecoService.js';

const apiBaseUrl = 'http://localhost:8080';

// ==============================================
// Módulo de Validação e Formatação
// ==============================================

/**
 * Formata CPF no padrão 000.000.000-00
 * @param {string} value - CPF sem formatação
 * @returns {string} CPF formatado
 */
function formatCPF(value) {
  let v = value.replace(/\D/g, '').substring(0, 11);
  if (v.length > 9) {
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  } else if (v.length > 6) {
    return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (v.length > 3) {
    return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  return v;
}

/**
 * Formata telefone no padrão (00) 00000-0000
 * @param {string} value - Telefone sem formatação
 * @returns {string} Telefone formatado
 */
function formatTelefone(value) {
  let v = value.replace(/\D/g, '').substring(0, 11);
  if (v.length > 6) {
    return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  } else if (v.length > 2) {
    return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  }
  return v;
}

/**
 * Valida CPF usando algoritmo oficial
 * @param {string} cpf - CPF sem formatação (apenas dígitos)
 * @returns {boolean} True se CPF é válido
 */
function validarCPF(cpf) {
  if (!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let dig1 = 11 - (soma % 11);
  dig1 = dig1 >= 10 ? 0 : dig1;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  let dig2 = 11 - (soma % 11);
  dig2 = dig2 >= 10 ? 0 : dig2;
  
  return dig1 == cpf[9] && dig2 == cpf[10];
}

/**
 * Exibe mensagem de erro em um campo
 * @param {HTMLElement} input - Elemento de input
 * @param {string} message - Mensagem de erro
 */
function setError(input, message) {
  input.classList.add('is-invalid');
  let feedback = input.nextElementSibling;
  
  if (!feedback || !feedback.classList.contains('invalid-feedback')) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    input.parentNode.appendChild(feedback);
  }
  
  feedback.textContent = message;
}

/**
 * Remove mensagem de erro de um campo
 * @param {HTMLElement} input - Elemento de input
 */
function clearError(input) {
  input.classList.remove('is-invalid');
  const feedback = input.nextElementSibling;
  if (feedback && feedback.classList.contains('invalid-feedback')) {
    feedback.textContent = '';
  }
}

// ==============================================
// Validações Específicas por Campo
// ==============================================

function validarCampoNome(input) {
  const valor = input.value.trim();
  if (!valor) {
    setError(input, 'O nome é obrigatório.');
    return false;
  }
  if (!/^[A-Za-zÀ-ÿ\s']+$/.test(valor)) {
    setError(input, 'O nome deve conter apenas letras e espaços.');
    return false;
  }
  clearError(input);
  return true;
}

function validarCampoDataNasc(input) {
  const valor = input.value;
  if (!valor) {
    setError(input, 'A data de nascimento é obrigatória.');
    return false;
  }
  
  const hoje = new Date();
  const nascimento = new Date(valor);
  const idadeMinima = new Date();
  idadeMinima.setFullYear(hoje.getFullYear() - 120);
  
  if (nascimento >= hoje) {
    setError(input, 'Data deve ser anterior a hoje.');
    return false;
  }
  if (nascimento < idadeMinima) {
    setError(input, 'Data inválida (idade máxima 120 anos).');
    return false;
  }
  
  clearError(input);
  return true;
}

function validarCampoCPF(input) {
  const valor = input.value.trim();
  const cpfSemMascara = valor.replace(/\D/g, '');
  
  if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(valor)) {
    setError(input, 'Formato inválido (use 000.000.000-00).');
    return false;
  }
  if (!validarCPF(cpfSemMascara)) {
    setError(input, 'CPF inválido.');
    return false;
  }
  
  clearError(input);
  return true;
}

function validarCampoTelefone(input) {
  const valor = input.value.trim();
  const telefoneSemMascara = valor.replace(/\D/g, '');
  
  if (!/^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(valor)) {
    setError(input, 'Formato inválido (use (00) 00000-0000).');
    return false;
  }
  if (telefoneSemMascara.length < 10) {
    setError(input, 'Telefone incompleto.');
    return false;
  }
  
  clearError(input);
  return true;
}

function validarCampoEmail(input) {
  const valor = input.value.trim();
  if (!valor) {
    setError(input, 'O e-mail é obrigatório.');
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    setError(input, 'E-mail inválido.');
    return false;
  }
  
  clearError(input);
  return true;
}

function validarEndereco(form) {
  const cep = form.cep.value.replace(/\D/g, '');
  const numero = form.numero.value.trim();
  
  if (cep.length !== 8) {
    showMessage('CEP inválido. Deve conter 8 dígitos.', 'error');
    return false;
  }
  if (!numero) {
    showMessage('Número do endereço é obrigatório.', 'error');
    return false;
  }
  
  return true;
}

// ==============================================
// Integração com APIs
// ==============================================

/**
 * Busca informações de endereço pelo CEP
 * @param {string} cep - CEP a ser consultado
 * @returns {Promise<Object>} Dados do endereço
 * @throws {Error} Se CEP for inválido ou não encontrado
 */
async function buscarCep(cep) {
  cep = cep.replace(/\D/g, '');
  if (cep.length !== 8) throw new Error('CEP inválido. Deve conter 8 dígitos.');

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!res.ok) throw new Error('Erro ao buscar CEP na API ViaCEP');

  const dados = await res.json();
  if (dados.erro) throw new Error('CEP não encontrado.');

  return dados;
}

/**
 * Cadastra um novo cliente
 * @param {Object} cliente - Dados do cliente
 * @returns {Promise<Object>} Resposta da API
 */
async function cadastrarCliente(cliente) {
  const res = await fetch(`${apiBaseUrl}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente),
    credentials: 'include'
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Erro ao cadastrar cliente');
  }
  
  return await res.json();
}

// ==============================================
// Configuração do Formulário
// ==============================================

/**
 * Configura os eventos do formulário
 */
function setupForm() {
  const form = getElement('#clienteForm');
  if (!form) return;

  const cepInput = getElement('#cep', form);
  const nomeInput = getElement('#nome', form);
  const cpfInput = getElement('#cpf', form);
  const telefoneInput = getElement('#telefone', form);
  const dataNascInput = getElement('#dataNasc', form);
  const emailInput = getElement('#email', form);
  const btnCadastrar = form.querySelector('.btn-cadastrar');

  // Formatação em tempo real
  cpfInput.addEventListener('input', () => {
    cpfInput.value = formatCPF(cpfInput.value);
  });
  
  telefoneInput.addEventListener('input', () => {
    telefoneInput.value = formatTelefone(telefoneInput.value);
  });

  // Validação em tempo real
  nomeInput.addEventListener('blur', () => validarCampoNome(nomeInput));
  cpfInput.addEventListener('blur', () => validarCampoCPF(cpfInput));
  telefoneInput.addEventListener('blur', () => validarCampoTelefone(telefoneInput));
  dataNascInput.addEventListener('change', () => validarCampoDataNasc(dataNascInput));
  emailInput.addEventListener('blur', () => validarCampoEmail(emailInput));

  // Busca automática de CEP
  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
      const dados = await buscarCep(cep);
      form.uf.value = dados.uf || '';
      form.cidade.value = dados.localidade || '';
      form.bairro.value = dados.bairro || '';
      form.rua.value = dados.logradouro || '';
    } catch (err) {
      showMessage(`Erro ao buscar CEP: ${err.message}`, 'error');
    }
  });

  // Submissão do formulário
  form.addEventListener('submit', async e => {
    e.preventDefault();
    toggleButtonState(btnCadastrar, true);

    // Valida todos os campos
    const camposValidos = [
      validarCampoNome(nomeInput),
      validarCampoCPF(cpfInput),
      validarCampoTelefone(telefoneInput),
      validarCampoDataNasc(dataNascInput),
      validarCampoEmail(emailInput),
      validarEndereco(form)
    ].every(Boolean);

    if (!camposValidos) {
      toggleButtonState(btnCadastrar, false);
      return;
    }

    try {
      // Cadastra endereço primeiro
      const endereco = await cadastrarEndereco({
        cep: form.cep.value.replace(/\D/g, ''),
        numero: form.numero.value.trim(),
        complemento: form.complemento.value.trim() || null,
        ufSigla: form.uf.value.trim().toUpperCase(),
        cidadeNome: form.cidade.value.trim(),
        bairroNome: form.bairro.value.trim(),
        ruaNome: form.rua.value.trim()
      });

      // Depois cadastra o cliente
      await cadastrarCliente({
        nome: nomeInput.value.trim(),
        cpf: cpfInput.value.replace(/\D/g, ''),
        dataNasc: dataNascInput.value,
        email: emailInput.value.trim(),
        telefone: telefoneInput.value.replace(/\D/g, ''),
        enderecoId: endereco.idEndereco
      });

      showMessage('Cliente cadastrado com sucesso!', 'success');
      form.reset();
    } catch (err) {
      console.error('Erro no cadastro:', err);
      showMessage(`Erro: ${err.message}`, 'error');
    } finally {
      toggleButtonState(btnCadastrar, false);
    }
  });
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', setupForm);