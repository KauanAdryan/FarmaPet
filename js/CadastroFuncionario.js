import { getElement, toggleButtonState, showMessage, aplicarMascaras, checkUserLoggedIn, performLogout } from './scriptCadastros.js';
import { cadastrarEndereco } from './EnderecoService.js';

// Configuração inicial
const apiBaseUrl = 'http://localhost:8080';

// Função para validar campos do formulário
function validateFormFields(form) {
  let isValid = true;
  
  // Valida todos os campos obrigatórios
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    field.classList.remove('is-invalid');
    
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      isValid = false;
    }
  });

  // Validação específica para CPF
  const cpfField = form.querySelector('#cpf');
  if (cpfField) {
    try {
      validarCPF(cpfField.value);
      cpfField.classList.remove('is-invalid');
    } catch (err) {
      cpfField.classList.add('is-invalid');
      cpfField.nextElementSibling.textContent = err.message;
      isValid = false;
    }
  }

  // Validação de senha
  const senhaField = form.querySelector('#senha');
  const confirmarSenhaField = form.querySelector('#confirmarSenha');
  if (senhaField && confirmarSenhaField) {
    try {
      validarSenha(senhaField.value, confirmarSenhaField.value);
      senhaField.classList.remove('is-invalid');
      confirmarSenhaField.classList.remove('is-invalid');
    } catch (err) {
      senhaField.classList.add('is-invalid');
      confirmarSenhaField.classList.add('is-invalid');
      confirmarSenhaField.nextElementSibling.textContent = err.message;
      isValid = false;
    }
  }

  // Validação de email
  const emailField = form.querySelector('#email');
  if (emailField) {
    try {
      validarEmail(emailField.value);
      emailField.classList.remove('is-invalid');
    } catch (err) {
      emailField.classList.add('is-invalid');
      emailField.nextElementSibling.textContent = err.message;
      isValid = false;
    }
  }

  return isValid;
}

// Função para buscar CEP
async function buscarCep(cep) {
  cep = cep.replace(/\D/g, '');
  if (cep.length !== 8) throw new Error('CEP inválido. Deve conter 8 dígitos.');

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!res.ok) throw new Error('Erro ao buscar CEP na API ViaCEP');

  const dados = await res.json();
  if (dados.erro) throw new Error('CEP não encontrado.');

  return dados;
}

// Validação de senha
function validarSenha(senha, confirmarSenha) {
  if (senha.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }
  
  if (senha !== confirmarSenha) {
    throw new Error('As senhas não coincidem.');
  }
  
  return true;
}

// Validação de CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) {
    throw new Error('CPF deve conter 11 dígitos.');
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) {
    throw new Error('CPF inválido.');
  }
  
  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let dv1 = resto < 2 ? 0 : resto;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let dv2 = resto < 2 ? 0 : resto;
  
  if (parseInt(cpf.charAt(9)) !== dv1 || parseInt(cpf.charAt(10)) !== dv2) {
    throw new Error('CPF inválido.');
  }
  
  return true;
}

// Validação de email
function validarEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Email inválido.');
  }
  return true;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Verifica autenticação primeiro
  checkUserLoggedIn();
  
  // Aplica máscaras nos campos
  aplicarMascaras();
  
  const form = getElement('#funcionarioForm');
  const cepInput = document.getElementById('cep');
  const btnBuscarCep = document.getElementById('buscarCep');

  if (!form || !cepInput) return;

  // Configura a data máxima para o campo de nascimento (18 anos atrás)
  const dataNascInput = document.getElementById('dataNasc');
  if (dataNascInput) {
    const hoje = new Date();
    const dataMinima = new Date(hoje.getFullYear() - 100, hoje.getMonth(), hoje.getDate());
    const dataMaxima = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
    
    dataNascInput.min = dataMinima.toISOString().split('T')[0];
    dataNascInput.max = dataMaxima.toISOString().split('T')[0];
  }

  // Submissão do formulário
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-cadastrar');
    toggleButtonState(btn, true);

    // Valida todos os campos antes de enviar
    if (!validateFormFields(form)) {
      toggleButtonState(btn, false);
      showMessage('Por favor, corrija os campos destacados', 'error');
      return;
    }

    try {
      // Coleta os dados do formulário
      const funcionario = {
        nome: form.nome.value.trim(),
        cpf: form.cpf.value.replace(/\D/g, ''),
        dataNasc: form.dataNasc.value,
        telefone: form.telefone.value.replace(/\D/g, ''),
        email: form.email.value.trim(),
        tipoCadastroId: parseInt(form.tipoCadastro.value),
        nomeUsuario: form.nomeUsuario.value.trim(),
        senha: form.senha.value,
        usuarioAtivo: form.usuarioAtivo.checked,
        endereco: {
          cep: form.cep.value.replace(/\D/g, ''),
          ufSigla: form.uf.value.trim().toUpperCase(),
          cidadeNome: form.cidade.value.trim(),
          bairroNome: form.bairro.value.trim(),
          ruaNome: form.rua.value.trim(),
          numero: form.numero.value.trim(),
          complemento: form.complemento.value.trim() || null
        }
      };

      console.log('Dados do funcionário a serem enviados:', funcionario);

      // Primeiro cadastra o endereço
      console.log('Iniciando cadastro do endereço...');
      const endereco = await cadastrarEndereco(funcionario.endereco);
      console.log('Endereço cadastrado com sucesso:', endereco);
      
      // Depois cadastra o funcionário com o ID do endereço
      const { endereco: _, ...funcionarioSemEndereco } = funcionario;
      const payload = {
        ...funcionarioSemEndereco,
        enderecoId: endereco.idEndereco
      };
      
      console.log('Enviando dados do funcionário para a API:', payload);
      
      const res = await fetch(`${apiBaseUrl}/funcionario`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('Resposta da API:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Erro detalhado da API:', errorData);
        throw new Error(errorData.message || 'Erro ao cadastrar funcionário');
      }

      const result = await res.json();
      console.log('Funcionário cadastrado com sucesso:', result);

      showMessage('Funcionário cadastrado com sucesso!', 'success');
      form.reset();
      
    } catch (err) {
      console.error('Erro no cadastro:', err);
      showMessage(`Erro: ${err.message}`, 'error');
    } finally {
      toggleButtonState(btn, false);
    }
  });

  // Busca de CEP ao sair do campo
  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.trim();
    if (!cep) return;

    try {
      const dados = await buscarCep(cep);
      form.uf.value = dados.uf || '';
      form.cidade.value = dados.localidade || '';
      form.bairro.value = dados.bairro || '';
      form.rua.value = dados.logradouro || '';
      
      // Limpa qualquer erro anterior
      cepInput.classList.remove('is-invalid');
    } catch (err) {
      console.error('Erro ao buscar CEP:', err.message);
      cepInput.classList.add('is-invalid');
      cepInput.nextElementSibling.textContent = err.message;
    }
  });

  // Busca de CEP pelo botão
  if (btnBuscarCep) {
    btnBuscarCep.addEventListener('click', async () => {
      const cep = cepInput.value.trim();
      if (!cep) {
        cepInput.classList.add('is-invalid');
        cepInput.nextElementSibling.textContent = 'Digite um CEP para buscar';
        cepInput.focus();
        return;
      }

      try {
        const dados = await buscarCep(cep);
        form.uf.value = dados.uf || '';
        form.cidade.value = dados.localidade || '';
        form.bairro.value = dados.bairro || '';
        form.rua.value = dados.logradouro || '';
        
        // Limpa qualquer erro anterior
        cepInput.classList.remove('is-invalid');
      } catch (err) {
        console.error('Erro ao buscar CEP:', err.message);
        cepInput.classList.add('is-invalid');
        cepInput.nextElementSibling.textContent = err.message;
      }
    });
  }

  // Configura o logout se o botão existir
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      performLogout();
    });
  }

  // Validação em tempo real para a confirmação de senha
  const senhaField = document.getElementById('senha');
  const confirmarSenhaField = document.getElementById('confirmarSenha');
  
  if (senhaField && confirmarSenhaField) {
    confirmarSenhaField.addEventListener('input', () => {
      try {
        validarSenha(senhaField.value, confirmarSenhaField.value);
        confirmarSenhaField.classList.remove('is-invalid');
      } catch (err) {
        confirmarSenhaField.classList.add('is-invalid');
        confirmarSenhaField.nextElementSibling.textContent = err.message;
      }
    });
  }
});