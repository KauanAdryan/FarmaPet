import { apiBaseUrl, getElement, formatarCPF, toggleButtonState } from './scriptCadastros.js';

// Função para carregar clientes (para seleção no cadastro de pet)
async function carregarClientes() {
  try {
    const response = await fetch(`${apiBaseUrl}/clientes`, {
      credentials: 'include'  // <- inserido aqui
    });
    const clientes = await response.json();
    const selectDono = document.getElementById('dono');
    
    // Limpa opções existentes (exceto a primeira)
    while (selectDono.options.length > 1) {
      selectDono.remove(1);
    }
    
    // Adiciona cada cliente como opção
    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = `${cliente.nome} (CPF: ${formatarCPF(cliente.cpf)})`;
      selectDono.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    alert('Não foi possível carregar a lista de clientes');
  }
}

// Carrega clientes quando a página é aberta
document.addEventListener('DOMContentLoaded', carregarClientes);

// Formulário de pet
const petForm = document.querySelector('#CadastroPet .form-cadastro');
if (petForm) {
  petForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = petForm.querySelector('.btn-cadastrar');
    if (!btnSubmit) return;

    // Validação dos campos
    const requiredFields = ['nome', 'especie', 'raca', 'idade', 'peso', 'dono'];
    for (const field of requiredFields) {
      const elem = getElement(`#${field}`);
      if (!elem || !elem.value.trim()) {
        alert(`Por favor, preencha o campo ${field.replace('_', ' ')}!`);
        return;
      }
    }

    toggleButtonState(btnSubmit, true);

    try {
      // Objeto para envio
      const petData = {
        nome: getElement('#nome').value.trim(),
        especie: getElement('#especie').value.trim(),
        raca: getElement('#raca').value.trim(),
        idade: parseInt(getElement('#idade').value),
        peso: parseFloat(getElement('#peso').value),
        clienteId: parseInt(getElement('#dono').value)
      };

      const response = await fetch(`${apiBaseUrl}/animal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData),
        credentials: 'include'  // <- inserido aqui
      });

      const result = await response.json();
      console.log('Resposta do backend:', result);

      if (!response.ok) {
        throw new Error(result.message || `Erro HTTP: ${response.status}`);
      }

      // Aqui removemos a checagem por result.success porque o backend não envia esse campo
      alert('Pet cadastrado com sucesso!');
      petForm.reset();

    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar pet: ${error.message || 'Erro desconhecido'}`);
    } finally {
      toggleButtonState(btnSubmit, false);
    }
  });
}
