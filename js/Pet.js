import { apiBaseUrl, getElement, formatarCPF, toggleButtonState } from './scriptCadastros.js';

// Função para carregar clientes (para seleção no cadastro de pet)
async function carregarClientes() {
  try {
    const response = await fetch(`${apiBaseUrl}/clientes`, {
      credentials: 'include'
    });
    const clientes = await response.json();
    const selectDono = document.getElementById('dono');

    while (selectDono.options.length > 1) {
      selectDono.remove(1);
    }

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

document.addEventListener('DOMContentLoaded', carregarClientes);

const petForm = document.querySelector('#CadastroPet .form-cadastro');
if (petForm) {
  petForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = petForm.querySelector('.btn-cadastrar');
    if (!btnSubmit) return;

    const requiredFields = ['nome', 'especie', 'raca', 'idade', 'peso', 'dono'];
    let hasError = false;

    requiredFields.forEach(fieldId => {
      const field = getElement(`#${fieldId}`);
      const value = field.value.trim();
      const errorElement = field.nextElementSibling;
      if (!value) {
        field.classList.add('is-invalid');
        if (errorElement && errorElement.classList.contains('invalid-feedback')) {
          errorElement.textContent = 'Campo obrigatório';
        }
        hasError = true;
      } else {
        field.classList.remove('is-invalid');
        if (errorElement && errorElement.classList.contains('invalid-feedback')) {
          errorElement.textContent = '';
        }
      }
    });

    const idade = parseInt(getElement('#idade').value);
    if (idade < 0) {
      const idadeInput = getElement('#idade');
      idadeInput.classList.add('is-invalid');
      idadeInput.nextElementSibling.textContent = 'Idade inválida';
      hasError = true;
    }

    const peso = parseFloat(getElement('#peso').value);
    if (peso <= 0) {
      const pesoInput = getElement('#peso');
      pesoInput.classList.add('is-invalid');
      pesoInput.nextElementSibling.textContent = 'Peso inválido';
      hasError = true;
    }

    if (hasError) return;

    toggleButtonState(btnSubmit, true);

    try {
      const petData = {
        nome: getElement('#nome').value.trim(),
        especie: getElement('#especie').value.trim(),
        raca: getElement('#raca').value.trim(),
        idade: idade,
        peso: peso,
        clienteId: parseInt(getElement('#dono').value)
      };

      const response = await fetch(`${apiBaseUrl}/animal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData),
        credentials: 'include'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `Erro HTTP: ${response.status}`);
      }

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
