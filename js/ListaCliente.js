const apiBaseUrl = 'http://localhost:8080';

// Função auxiliar para selecionar elementos
function getElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element && !selector.includes('modal')) {
    console.warn(`Elemento não encontrado: ${selector}`);
  }
  return element;
}

// Variáveis globais
let currentModal = null;
let editModal = null;
let clientesLista = [];

// Inicialização principal
document.addEventListener('DOMContentLoaded', function () {
  initModals();
  initEditModal();
  initDropdownMenu();
  setupEventListeners();
  getClientes();
});

// Inicialização dos modais
function initModals() {
  // Modal de detalhes
  const detalhesModal = getElement('#clienteModal');
  if (detalhesModal) {
    currentModal = {
      element: detalhesModal,
      closeBtn: getElement('.close-modal', detalhesModal),
      open: function (cliente) {
        showClienteDetails(cliente);
      },
      close: function () {
        this.element.style.display = 'none';
      }
    };

    if (currentModal.closeBtn) {
      currentModal.closeBtn.onclick = () => currentModal.close();
    }

    detalhesModal.onclick = function (e) {
      if (e.target === detalhesModal) {
        currentModal.close();
      }
    };
  }
}

// Inicialização do modal de edição
function initEditModal() {
  const editModalElement = getElement('#editClienteModal');
  if (!editModalElement) return;

  editModal = {
    element: editModalElement,
    closeBtn: getElement('.close-edit-modal', editModalElement),
    form: getElement('#formEditarCliente', editModalElement),
    open: function (cliente) {
      this.currentCliente = cliente;
      fillEditForm(cliente);
      this.element.style.display = 'block';
    },
    close: function () {
      this.element.style.display = 'none';
      this.form.reset();
    },
    currentCliente: null
  };

  if (editModal.closeBtn) {
    editModal.closeBtn.onclick = () => editModal.close();
  }

  editModalElement.onclick = function (e) {
    if (e.target === editModalElement) {
      editModal.close();
    }
  };

  // Configurar o botão de cancelar
  const cancelBtn = getElement('#btnCancelarEdicao');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => editModal.close());
  }

  // Configurar o formulário de edição
  if (editModal.form) {
    editModal.form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await updateCliente();
    });
  }
}

// Preenche o formulário de edição
function fillEditForm(cliente) {
  if (!cliente || !editModal) return;

  const form = editModal.form;
  if (!form) return;

  // Armazena os dados completos do cliente no modal
  editModal.currentCliente = cliente;

  getElement('#editNome', form).value = cliente.nome || '';
  getElement('#editCpf', form).value = cliente.cpf || '';
  getElement('#editDataNasc', form).value = cliente.dataNasc ? cliente.dataNasc.split('T')[0] : '';
  getElement('#editEmail', form).value = cliente.email || '';
  getElement('#editTelefone', form).value = cliente.telefone || '';
}

// Valida os dados do formulário
function validateClienteForm(formData) {
  if (!formData.nome || formData.nome.trim().length < 3) {
    return { isValid: false, message: 'Nome deve ter pelo menos 3 caracteres' };
  }
  if (!formData.cpf || !/^\d{11}$/.test(formData.cpf)) {
    return { isValid: false, message: 'CPF deve conter 11 dígitos' };
  }
  if (!formData.enderecoId) {
    return { isValid: false, message: 'Endereço é obrigatório' };
  }
  return { isValid: true };
}

// Atualiza um cliente
async function updateCliente() {
  if (!editModal || !editModal.currentCliente) return;

  const form = editModal.form;
  if (!form) return;

  const clienteId = editModal.currentCliente.id;
  
  // Prepara os dados no formato que o backend espera
  const formData = {
    id: clienteId,
    nome: getElement('#editNome', form).value,
    cpf: getElement('#editCpf', form).value,
    dataNasc: getElement('#editDataNasc', form).value,
    email: getElement('#editEmail', form).value,
    telefone: getElement('#editTelefone', form).value,
    enderecoId: editModal.currentCliente.endereco?.idEndereco || null,
    animaisIds: editModal.currentCliente.animais?.map(animal => animal.id) || []
  };

  // Validação dos dados
  const validation = validateClienteForm(formData);
  if (!validation.isValid) {
    showMessage(validation.message, 'error');
    return;
  }

  // Verifica se o endereço existe
  if (!formData.enderecoId) {
    showMessage('O cliente deve ter um endereço válido cadastrado', 'error');
    return;
  }

  try {
    console.log('Enviando dados:', formData); // Para depuração
    
    const response = await fetch(`${apiBaseUrl}/clientes/${clienteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.errors 
        ? Object.values(errorData.errors).join(', ')
        : errorData.message || 'Erro desconhecido';
      
      throw new Error(`Erro HTTP: ${response.status} - ${errorMessage}`);
    }

    showMessage('Cliente atualizado com sucesso!', 'success');
    editModal.close();
    getClientes(); // Recarrega a lista de clientes
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    showMessage(`Erro ao atualizar cliente: ${error.message}`, 'error');
  }
}

// Mostra mensagem de feedback
function showMessage(message, type = 'info') {
  const messageContainer = getElement('#message-container');
  if (!messageContainer) return;

  messageContainer.textContent = message;
  messageContainer.className = `message-${type}`;
  messageContainer.style.display = 'block';

  setTimeout(() => {
    messageContainer.style.display = 'none';
  }, 5000);
}

// Configuração dos event listeners
function setupEventListeners() {
  // Filtros e busca
  const searchInput = getElement('#searchInput');
  const searchButton = getElement('#searchButton');

  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (searchButton) searchButton.addEventListener('click', handleFilterChange);
}

// Menu dropdown
function initDropdownMenu() {
  const dropdownButtons = document.querySelectorAll('.btn-cadastros');

  dropdownButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      const dropdown = this.nextElementSibling;
      const isOpen = dropdown.style.display === 'block';

      document.querySelectorAll('.dropdown-cadastros').forEach(d => {
        d.style.display = 'none';
      });

      if (!isOpen) dropdown.style.display = 'block';
    });
  });

  document.addEventListener('click', function () {
    document.querySelectorAll('.dropdown-cadastros').forEach(dropdown => {
      dropdown.style.display = 'none';
    });
  });

  document.querySelectorAll('.dropdown-cadastros').forEach(dropdown => {
    dropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  });
}

// Carrega clientes da API
async function getClientes() {
  const grid = getElement('#gridClientes');
  if (!grid) return;

  try {
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando clientes...</div>';

    const response = await fetch(`${apiBaseUrl}/clientes`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    clientesLista = await response.json();
    renderClientes(clientesLista);
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    grid.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar. Tente recarregar.</div>';
  }
}

// Formata CPF
function formatCPF(cpf) {
  if (!cpf) return 'N/A';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Formata data
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Formata telefone
function formatPhone(phone) {
  if (!phone) return 'N/A';
  // Remove tudo que não é dígito
  const cleaned = phone.replace(/\D/g, '');
  
  // Formata de acordo com o tamanho
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    return phone;
  }
}

// Renderiza os clientes em cards
function renderClientes(lista) {
  const grid = getElement('#gridClientes');
  if (!grid) return;

  grid.innerHTML = '';

  if (!lista || lista.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-user-slash"></i> Nenhum cliente encontrado
      </div>`;
    return;
  }

  lista.forEach(cliente => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.dataset.id = cliente.id;

    // Primeira letra do nome para o avatar
    const firstLetter = cliente.nome ? cliente.nome.charAt(0).toUpperCase() : '?';
    
    // Formata os dados
    const nome = cliente.nome || 'Nome não informado';
    const cpf = formatCPF(cliente.cpf);
    const email = cliente.email || 'N/A';
    const telefone = formatPhone(cliente.telefone);
    
    card.innerHTML = `
      <div class="client-card-header">
        <div class="client-avatar">${firstLetter}</div>
        <div class="client-info">
          <h3>${nome}</h3>
          <p>${cpf}</p>
        </div>
      </div>
      <div class="client-details">
        <div class="detail-row">
          <strong>Email:</strong>
          <span>${email}</span>
        </div>
        <div class="detail-row">
          <strong>Telefone:</strong>
          <span>${telefone}</span>
        </div>
      </div>
      <div class="client-actions">
        <button type="button" class="btn-edit" aria-label="Editar cliente">Editar</button>
      </div>
    `;

    // Abertura do modal de detalhes ao clicar no card
    const header = card.querySelector('.client-card-header');
    if (header) {
      header.addEventListener('click', () => {
        if (currentModal) {
          currentModal.open(cliente);
        }
      });
    }

    // Abertura do modal de edição ao clicar no botão
    const editBtn = card.querySelector('.btn-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editModal) {
          editModal.open(cliente);
        }
      });
    }

    grid.appendChild(card);
  });
}

// Filtro e busca
function handleFilterChange() {
  const searchInput = getElement('#searchInput');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = clientesLista.filter(cliente => {
    const matchesSearch =
      (cliente.nome && cliente.nome.toLowerCase().includes(searchTerm)) ||
      (cliente.cpf && cliente.cpf.toLowerCase().includes(searchTerm)) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchTerm));

    return matchesSearch;
  });

  renderClientes(filtered);
}

function showClienteDetails(cliente) {
  if (!currentModal) return;

  const modal = currentModal.element;

  // Função auxiliar para definir valores
  const setTextContent = (selector, value) => {
    const el = getElement(selector, modal);
    if (el) el.textContent = value || 'N/A';
  };

  // Preenche os dados básicos
  setTextContent('#modalClienteTitle', cliente.nome || 'Detalhes do Cliente');
  setTextContent('#modalNome', cliente.nome);
  setTextContent('#modalCpf', formatCPF(cliente.cpf));
  setTextContent('#modalDataNasc', formatDate(cliente.dataNasc));
  setTextContent('#modalEmail', cliente.email);
  setTextContent('#modalTelefone', formatPhone(cliente.telefone));

  // Preenche endereço com a estrutura atualizada
  const enderecoObj = cliente.endereco;
  const endereco = enderecoObj
    ? `${enderecoObj.rua?.descricao || 'Rua não informada'}, ${enderecoObj.numero || 'Nº não informado'} - ${enderecoObj.bairro?.descricao || 'Bairro não informado'}, ${enderecoObj.cidade?.descricao || 'Cidade não informada'}/${enderecoObj.uf?.sigla || enderecoObj.cidade?.uf?.sigla || 'UF'}`
    : 'N/A';
  
  setTextContent('#modalEndereco', endereco);

  // Pets
  const pets = cliente.animais && cliente.animais.length > 0
    ? cliente.animais.map(pet => pet.nome).join(', ')
    : 'Nenhum pet cadastrado';
  setTextContent('#modalPets', pets);

  modal.style.display = 'block';
}
