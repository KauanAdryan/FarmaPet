import { 
  getElement, 
  toggleButtonState, 
  showMessage, 
  aplicarMascaras, 
  checkUserLoggedIn, 
  performLogout 
} from './scriptCadastros.js';
import { cadastrarEndereco } from './EnderecoService.js';

const apiBaseUrl = 'http://localhost:8080';

// ==============================================
// Módulo de Validação
// ==============================================

/**
 * Valida um CPF
 * @param {string} cpf - CPF a ser validado
 * @throws {Error} Se o CPF for inválido
 */
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) {
    throw new Error('CPF deve conter 11 dígitos');
  }
  
  if (/^(\d)\1{10}$/.test(cpf)) {
    throw new Error('CPF inválido');
  }
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let dv1 = resto < 2 ? 0 : resto;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let dv2 = resto < 2 ? 0 : resto;
  
  if (parseInt(cpf.charAt(9)) !== dv1 || parseInt(cpf.charAt(10)) !== dv2) {
    throw new Error('CPF inválido');
  }
}

/**
 * Valida uma senha
 * @param {string} senha - Senha a ser validada
 * @param {string} confirmacao - Confirmação da senha
 * @throws {Error} Se a senha for inválida
 */
function validarSenha(senha, confirmacao) {
  if (senha.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres');
  }
  
  if (senha !== confirmacao) {
    throw new Error('As senhas não coincidem');
  }
}

/**
 * Valida um email
 * @param {string} email - Email a ser validado
 * @throws {Error} Se o email for inválido
 */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    throw new Error('Email inválido');
  }
}

/**
 * Valida um campo de formulário
 * @param {HTMLElement} campo - Elemento do campo
 * @param {boolean} condicao - Condição de validação
 * @param {string} mensagem - Mensagem de erro
 */
function validarCampo(campo, condicao, mensagem) {
  const feedback = campo.nextElementSibling;
  
  if (!condicao) {
    campo.classList.add('is-invalid');
    if (feedback && feedback.classList.contains('invalid-feedback')) {
      feedback.textContent = mensagem;
    }
  } else {
    campo.classList.remove('is-invalid');
    if (feedback && feedback.classList.contains('invalid-feedback')) {
      feedback.textContent = '';
    }
  }
}

// ==============================================
// Módulo de Busca de CEP
// ==============================================

/**
 * Busca informações de endereço pelo CEP
 * @param {string} cep - CEP a ser consultado
 * @returns {Promise<Object>} Dados do endereço
 * @throws {Error} Se o CEP for inválido ou não encontrado
 */
async function buscarEnderecoPorCep(cep) {
  cep = cep.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) {
    throw new Error('Erro ao buscar CEP');
  }

  const dados = await response.json();
  if (dados.erro) {
    throw new Error('CEP não encontrado');
  }

  return dados;
}

// ==============================================
// Módulo de Formulário
// ==============================================

/**
 * Configura a validação em tempo real dos campos
 */
function setupValidacaoEmTempoReal() {
  const nome = getElement('#nome');
  const cpf = getElement('#cpf');
  const telefone = getElement('#telefone');
  const email = getElement('#email');
  const dataNasc = getElement('#dataNasc');
  const senha = getElement('#senha');
  const confirmarSenha = getElement('#confirmarSenha');

  // Validação do nome
  if (nome) {
    nome.addEventListener('input', () => {
      nome.value = nome.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
      validarCampo(nome, nome.value.trim().length >= 3, 'Nome deve ter pelo menos 3 letras');
    });
  }

  // Validação do CPF
  if (cpf) {
    cpf.addEventListener('input', () => {
      try {
        validarCPF(cpf.value);
        validarCampo(cpf, true, '');
      } catch (error) {
        validarCampo(cpf, false, error.message);
      }
    });
  }

  // Validação do telefone
  if (telefone) {
    telefone.addEventListener('input', () => {
      const valido = /^\(\d{2}\) \d{4,5}-\d{4}$/.test(telefone.value);
      validarCampo(telefone, valido, 'Telefone inválido');
    });
  }

  // Validação do email
  if (email) {
    email.addEventListener('input', () => {
      try {
        validarEmail(email.value);
        validarCampo(email, true, '');
      } catch (error) {
        validarCampo(email, false, error.message);
      }
    });
  }

  // Validação da data de nascimento
  if (dataNasc) {
    dataNasc.addEventListener('change', () => {
      const hoje = new Date();
      const nascimento = new Date(dataNasc.value);
      validarCampo(dataNasc, nascimento < hoje, 'Data inválida');
    });
  }

  // Validação da senha
  if (senha && confirmarSenha) {
    confirmarSenha.addEventListener('input', () => {
      try {
        validarSenha(senha.value, confirmarSenha.value);
        validarCampo(confirmarSenha, true, '');
      } catch (error) {
        validarCampo(confirmarSenha, false, error.message);
      }
    });
  }
}

/**
 * Configura a busca de CEP
 */
function setupBuscaCEP() {
  const cep = getElement('#cep');
  const btnBuscarCep = getElement('#buscarCep');
  const uf = getElement('#uf');
  const cidade = getElement('#cidade');
  const bairro = getElement('#bairro');
  const rua = getElement('#rua');

  if (!cep) return;

  const buscarCepHandler = async () => {
    try {
      const dados = await buscarEnderecoPorCep(cep.value);
      
      if (uf) uf.value = dados.uf || '';
      if (cidade) cidade.value = dados.localidade || '';
      if (bairro) bairro.value = dados.bairro || '';
      if (rua) rua.value = dados.logradouro || '';
      
      validarCampo(cep, true, '');
    } catch (error) {
      validarCampo(cep, false, error.message);
    }
  };

  cep.addEventListener('blur', buscarCepHandler);
  if (btnBuscarCep) {
    btnBuscarCep.addEventListener('click', buscarCepHandler);
  }
}

/**
 * Valida todos os campos do formulário
 * @returns {boolean} True se todos os campos são válidos
 */
function validarFormulario() {
  const camposObrigatorios = [
    'nome', 'cpf', 'telefone', 'email', 'dataNasc', 
    'tipoCadastro', 'nomeUsuario', 'senha', 'confirmarSenha',
    'cep', 'uf', 'cidade', 'bairro', 'rua', 'numero'
  ];

  let valido = true;

  camposObrigatorios.forEach(id => {
    const campo = getElement(`#${id}`);
    if (campo && !campo.value.trim()) {
      validarCampo(campo, false, 'Campo obrigatório');
      valido = false;
    }
  });

  return valido;
}

// ==============================================
// Módulo de Cadastro
// ==============================================

/**
 * Cadastra um novo funcionário
 * @param {Object} funcionario - Dados do funcionário
 * @returns {Promise<Object>} Resposta da API
 * @throws {Error} Em caso de falha no cadastro
 */
async function cadastrarFuncionario(funcionario) {
  const response = await fetch(`${apiBaseUrl}/funcionario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(funcionario)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro ao cadastrar funcionário');
  }

  return await response.json();
}

/**
 * Configura o evento de submit do formulário
 */
function setupFormSubmit() {
  const form = getElement('#funcionarioForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSubmit = form.querySelector('.btn-cadastrar');
    if (!btnSubmit) return;

    // Valida o formulário
    if (!validarFormulario()) {
      showMessage('Por favor, corrija os campos destacados', 'error');
      return;
    }

    toggleButtonState(btnSubmit, true);

    try {
      // Prepara os dados do endereço
      const endereco = {
        cep: getElement('#cep').value.replace(/\D/g, ''),
        ufSigla: getElement('#uf').value.trim().toUpperCase(),
        cidadeNome: getElement('#cidade').value.trim(),
        bairroNome: getElement('#bairro').value.trim(),
        ruaNome: getElement('#rua').value.trim(),
        numero: getElement('#numero').value.trim(),
        complemento: getElement('#complemento').value.trim() || null
      };

      // Cadastra o endereço primeiro
      const enderecoSalvo = await cadastrarEndereco(endereco);

      // Prepara os dados do funcionário
      const funcionario = {
        nome: getElement('#nome').value.trim(),
        cpf: getElement('#cpf').value.replace(/\D/g, ''),
        dataNasc: getElement('#dataNasc').value,
        telefone: getElement('#telefone').value.replace(/\D/g, ''),
        email: getElement('#email').value.trim(),
        tipoCadastroId: parseInt(getElement('#tipoCadastro').value),
        nomeUsuario: getElement('#nomeUsuario').value.trim(),
        senha: getElement('#senha').value,
        usuarioAtivo: getElement('#usuarioAtivo').checked,
        enderecoId: enderecoSalvo.idEndereco
      };

      // Cadastra o funcionário
      await cadastrarFuncionario(funcionario);

      // Feedback de sucesso
      showMessage('Funcionário cadastrado com sucesso!', 'success');
      form.reset();

    } catch (error) {
      console.error('Erro no cadastro:', error);
      showMessage(`Erro: ${error.message}`, 'error');
    } finally {
      toggleButtonState(btnSubmit, false);
    }
  });
}

// ==============================================
// Inicialização
// ==============================================

/**
 * Configura a data máxima para o campo de nascimento (18 anos atrás)
 */
function setupDataNascimento() {
  const dataNascInput = getElement('#dataNasc');
  if (!dataNascInput) return;

  const hoje = new Date();
  const dataMinima = new Date(hoje.getFullYear() - 100, hoje.getMonth(), hoje.getDate());
  const dataMaxima = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
  
  dataNascInput.min = dataMinima.toISOString().split('T')[0];
  dataNascInput.max = dataMaxima.toISOString().split('T')[0];
}

/**
 * Configura o botão de logout
 */
function setupLogout() {
  const logoutBtn = getElement('#btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performLogout();
    });
  }
}

/**
 * Inicializa a aplicação
 */
function init() {
  // Verifica autenticação
  checkUserLoggedIn();
  
  // Configurações iniciais
  aplicarMascaras();
  setupDataNascimento();
  setupValidacaoEmTempoReal();
  setupBuscaCEP();
  setupFormSubmit();
  setupLogout();
}

// Inicia quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);