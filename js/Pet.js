import { apiBaseUrl, getElement, formatarCPF, toggleButtonState } from './scriptCadastros.js';

// ==============================================
// Módulo de Gerenciamento de Clientes
// ==============================================

/**
 * Carrega a lista de clientes para seleção no formulário de pets
 * @returns {Promise<void>}
 */
async function carregarClientes() {
  try {
    const response = await fetch(`${apiBaseUrl}/clientes`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const clientes = await response.json();
    const selectDono = getElement('#dono');
    
    // Limpa opções existentes (exceto a primeira)
    while (selectDono.options.length > 1) {
      selectDono.remove(1);
    }
    
    // Adiciona cada cliente como opção formatada
    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = `${cliente.nome} (CPF: ${formatarCPF(cliente.cpf)})`;
      selectDono.appendChild(option);
    });

  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    showMessage('Não foi possível carregar a lista de clientes', 'error');
  }
}

// ==============================================
// Módulo de Validação de Formulário
// ==============================================

/**
 * Valida todos os campos do formulário de pet
 * @returns {boolean} True se todos os campos são válidos
 */
function validarFormularioPet() {
  const requiredFields = ['nome', 'especie', 'raca', 'idade', 'peso', 'dono'];
  let isValid = true;

  requiredFields.forEach(fieldId => {
    const field = getElement(`#${fieldId}`);
    const errorElement = field.nextElementSibling;
    const value = field.value.trim();

    // Validação de campo obrigatório
    if (!value) {
      field.classList.add('is-invalid');
      if (errorElement?.classList.contains('invalid-feedback')) {
        errorElement.textContent = 'Campo obrigatório';
      }
      isValid = false;
    } else {
      field.classList.remove('is-invalid');
      if (errorElement?.classList.contains('invalid-feedback')) {
        errorElement.textContent = '';
      }
    }
  });

  // Validação específica para idade
  const idadeInput = getElement('#idade');
  const idade = parseInt(idadeInput.value);
  if (idade < 0 || isNaN(idade)) {
    idadeInput.classList.add('is-invalid');
    idadeInput.nextElementSibling.textContent = 'Idade deve ser um número positivo';
    isValid = false;
  }

  // Validação específica para peso
  const pesoInput = getElement('#peso');
  const peso = parseFloat(pesoInput.value);
  if (peso <= 0 || isNaN(peso)) {
    pesoInput.classList.add('is-invalid');
    pesoInput.nextElementSibling.textContent = 'Peso deve ser um número positivo';
    isValid = false;
  }

  return isValid;
}

// ==============================================
// Módulo de Serviço de Pets
// ==============================================

/**
 * Cadastra um novo pet na API
 * @param {Object} petData - Dados do pet
 * @returns {Promise<Object>} Resposta da API
 * @throws {Error} Em caso de falha na requisição
 */
async function cadastrarPet(petData) {
  const response = await fetch(`${apiBaseUrl}/animal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(petData),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  return await response.json();
}

// ==============================================
// Configuração do Formulário
// ==============================================

/**
 * Configura o evento de submit do formulário de pet
 */
function setupPetForm() {
  const petForm = getElement('#CadastroPet .form-cadastro');
  if (!petForm) return;

  petForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = petForm.querySelector('.btn-cadastrar');
    if (!btnSubmit) return;

    // Valida o formulário antes de enviar
    if (!validarFormularioPet()) return;

    toggleButtonState(btnSubmit, true);

    try {
      // Prepara os dados para envio
      const petData = {
        nome: getElement('#nome').value.trim(),
        especie: getElement('#especie').value.trim(),
        raca: getElement('#raca').value.trim(),
        idade: parseInt(getElement('#idade').value),
        peso: parseFloat(getElement('#peso').value),
        clienteId: parseInt(getElement('#dono').value)
      };

      // Envia para a API
      await cadastrarPet(petData);

      // Feedback de sucesso e limpeza do formulário
      showMessage('Pet cadastrado com sucesso!', 'success');
      petForm.reset();

    } catch (error) {
      console.error('Erro no cadastro:', error);
      showMessage(`Erro ao cadastrar pet: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      toggleButtonState(btnSubmit, false);
    }
  });
}

// ==============================================
// Funções Auxiliares
// ==============================================

/**
 * Exibe uma mensagem para o usuário
 * @param {string} message - Texto da mensagem
 * @param {string} type - Tipo de mensagem (success, error, etc.)
 */
function showMessage(message, type = 'info') {
  // Implementação pode ser substituída por um sistema de notificação mais sofisticado
  alert(`${type.toUpperCase()}: ${message}`);
}

// ==============================================
// Inicialização
// ==============================================

/**
 * Configura tudo quando o DOM estiver pronto
 */
function init() {
  // Carrega a lista de clientes
  carregarClientes();
  
  // Configura o formulário de pet
  setupPetForm();
}

document.addEventListener('DOMContentLoaded', init);