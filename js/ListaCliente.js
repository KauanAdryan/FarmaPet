const apiBaseUrl = 'http://localhost:8080';

// Variáveis globais
let clientesLista = [];
let currentModalInstance = null;
let editModalInstance = null;

// Verificação de autenticação
function checkUserLoggedIn() {
  const isLoggedIn = localStorage.getItem('userLoggedIn');
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;

  console.log('Verificando autenticação:', {
    isLoggedIn,
    currentPath,
    currentHref,
  });

  if (isLoggedIn !== 'true' && !currentPath.includes('login.html') && !currentHref.includes('login.html')) {
    console.log('Usuário não autenticado, redirecionando para login...');
    window.location.href = 'login.html';
    return false;
  }

  console.log('Usuário autenticado ou na página de login');
  return true;
}

// Função para obter username logado
function getLoggedInUsername() {
  return localStorage.getItem('username');
}

// Função para logout
async function performLogout() {
  try {
    const response = await fetch('http://localhost:8080/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('username');

      showMessage('Logout realizado com sucesso', 'success');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    } else {
      showMessage('Erro ao fazer logout', 'error');
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    showMessage('Erro ao conectar com o servidor', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkUserLoggedIn();

  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performLogout();
    });
  }

  initModals();
  initMap(); // Inicializa o mapa
  setupEventListeners();
  getClientes();
  updateDashboard(); // Carrega os dados do dashboard
});

// Variável global para o mapa
let clientesMap = null;

// Função para inicializar o mapa
function initMap() {
  if (!document.getElementById('mapaClientes')) return;

  // Coordenadas iniciais do Brasil
  clientesMap = L.map('mapaClientes').setView([-14.2350, -51.9253], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(clientesMap);
}

// Função para atualizar o dashboard
async function updateDashboard() {
  try {
    const response = await fetch(`${apiBaseUrl}/clientes/cidades`, {
      credentials: 'include'
    });
    const cidadesData = await response.json();

    renderTopCidades(cidadesData);
    renderMapaCalor(cidadesData);
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  }
}

// Função para renderizar a lista de top cidades
function renderTopCidades(cidadesData) {
  const topCidadesList = document.getElementById('topCidadesList');
  if (!topCidadesList) return;

  // Ordena por quantidade e pega as top 5
  const topCidades = [...cidadesData]
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  topCidadesList.innerHTML = topCidades.map(cidade => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <span class="cidade-nome">${cidade.cidade}</span>
      <span class="badge bg-primary rounded-pill">${cidade.quantidade}</span>
    </li>
  `).join('');
}

// Função para renderizar o mapa de calor
function renderMapaCalor(cidadesData) {
  if (!clientesMap) return;

  const coordenadasCapitais = {
    'São Paulo': [-23.5505, -46.6333],
    'Rio de Janeiro': [-22.9068, -43.1729],
    'Belo Horizonte': [-19.9167, -43.9345],
    'Blumenau': [-26.9151, -49.0707],
    // Adicione mais cidades conforme necessidade
  };

  const pontosCalor = cidadesData
    .map(obj => {
      const nomeCidade = obj.cidade;
      const qtd = obj.quantidade || 1;

      if (coordenadasCapitais[nomeCidade]) {
        const coord = coordenadasCapitais[nomeCidade];
        const intensidade = Math.min(qtd / 10, 1); // escala de 0.1 a 1.0
        return [...coord, intensidade];
      }
      return null;
    })
    .filter(p => p !== null);

  if (window.currentHeatLayer) {
    clientesMap.removeLayer(window.currentHeatLayer);
  }

  if (window.L.heatLayer && pontosCalor.length > 0) {
    window.currentHeatLayer = L.heatLayer(pontosCalor, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    }).addTo(clientesMap);
  }
}


// === Inicializa instâncias Bootstrap Modal ===
function initModals() {
  const clienteModalEl = document.getElementById('clienteModal');
  const editClienteModalEl = document.getElementById('editClienteModal');

  if (clienteModalEl) {
    currentModalInstance = new bootstrap.Modal(clienteModalEl);
  }
  if (editClienteModalEl) {
    editModalInstance = new bootstrap.Modal(editClienteModalEl);
  }
}

// === UTILITÁRIOS ===
function getElement(selector, parent = document) {
  const el = parent.querySelector(selector);
  if (!el && !selector.includes('modal')) {
    console.warn(`Elemento não encontrado: ${selector}`);
  }
  return el;
}

function formatCPF(cpf) {
  return cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : 'N/A';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';

  try {
    // Se a data já está no formato YYYY-MM-DD, usa diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    // Para outras datas, cria um objeto Date e ajusta para fuso horário local
    const date = new Date(dateStr);

    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateStr);
      return 'N/A';
    }

    // Usa toLocaleDateString para evitar problemas de fuso horário
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', dateStr, error);
    return 'N/A';
  }
}

function formatPhone(phone) {
  const cleaned = phone?.replace(/\D/g, '') || '';
  if (cleaned.length === 11) return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (cleaned.length === 10) return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return phone || 'N/A';
}

function showMessage(message, type = 'info') {
  const container = getElement('#message-container');
  if (!container) return;

  container.textContent = message;
  container.className = `message message-${type}`;
  container.style.display = 'block';

  setTimeout(() => {
    container.style.display = 'none';
    container.textContent = '';
  }, 4000);
}

// === RENDERIZAÇÃO ===
function renderClientes(lista) {
  const grid = getElement('#gridClientes');
  if (!grid) return;

  grid.innerHTML = '';

  if (!lista || lista.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="fas fa-user-slash fa-2x"></i>
        <p>Nenhum cliente encontrado</p>
      </div>`;
    return;
  }

  lista.forEach(cliente => grid.appendChild(createClienteCard(cliente)));
}

function createClienteCard(cliente) {
  const col = document.createElement('div');
  col.className = 'col-sm-6 col-md-4 col-lg-3 mb-4';

  const card = document.createElement('div');
  card.className = 'card h-100 shadow-sm client-card';
  card.dataset.id = cliente.id;

  const firstLetter = cliente.nome?.charAt(0).toUpperCase() || '?';
  const nome = cliente.nome || 'Nome não informado';
  const email = cliente.email || 'N/A';
  const telefone = formatPhone(cliente.telefone);

  card.innerHTML = `
    <div class="card-body d-flex flex-column">
      <div class="d-flex align-items-center mb-3">
        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 shadow-sm" 
             style="width: 48px; height: 48px; font-weight: bold; font-size: 1.1rem;">
          ${firstLetter}
        </div>
        <div>
          <h5 class="card-title mb-0 text-truncate" title="${nome}">${nome}</h5>
        </div>
      </div>

      <div class="mb-3 small text-muted">
        <p class="mb-1" title="${email}"><strong>Email:</strong> ${email}</p>
        <p class="mb-0"><strong>Telefone:</strong> ${telefone}</p>
      </div>

      <div class="mt-auto d-flex justify-content-center gap-2 pt-3">

        <button type="button" 
                class="btn btn-sm btn-outline-secondary w-100 me-1 btn-detalhes" 
                title="Ver detalhes do cliente" 
                aria-label="Ver detalhes de ${nome}">
          <i class="fas fa-eye me-1"></i> Detalhes
        </button>
        <button type="button" 
                class="btn btn-sm btn-outline-primary w-100 ms-1 btn-edit" 
                title="Editar cliente" 
                aria-label="Editar ${nome}">
          <i class="fas fa-edit me-1"></i> Editar
        </button>
      </div>
    </div>
  `;
  // Botão editar abre modal de edição
  card.querySelector('.btn-edit')?.addEventListener('click', e => {
    e.stopPropagation();
    openEditModal(cliente);
  });

  // Clique no card abre modal detalhes
  card.querySelector('.card-body')?.addEventListener('click', () => {
    showClienteDetails(cliente);
  });

  col.appendChild(card);
  return col;
}

// === MODAIS ===
function showClienteDetails(cliente) {
  const modalEl = document.getElementById('clienteModal');
  if (!modalEl) return;

  // Instância do modal
  const clienteModalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

  // Preenche os dados do cliente
  modalEl.querySelector('#modalClienteTitle').textContent = cliente.nome || '';
  modalEl.querySelector('#modalNome').textContent = cliente.nome || 'N/A';
  modalEl.querySelector('#modalCpf').textContent = formatCPF(cliente.cpf);

  // Usa o campo dataNasc conforme a DTO
  const dataNascimento = cliente.dataNasc || cliente.idade || cliente.nascimento || cliente.dataNascimento;
  modalEl.querySelector('#modalDataNasc').textContent = formatDate(dataNascimento);

  modalEl.querySelector('#modalEmail').textContent = cliente.email || 'N/A';
  modalEl.querySelector('#modalTelefone').textContent = formatPhone(cliente.telefone);

  const end = cliente.endereco;
  modalEl.querySelector('#modalEndereco').textContent = end
    ? `${end.rua?.descricao || ''}, ${end.numero || ''} - ${end.bairro?.descricao || ''}, ${end.cidade?.descricao || ''}/${end.uf?.sigla || ''}`
    : 'N/A';

  // Preenche pets com botão para abrir modal pet e botão para remover
  const container = modalEl.querySelector('#modalPetsContainer');
  container.innerHTML = '';
  if (cliente.animais?.length > 0) {
    cliente.animais.forEach(pet => {
      const petDiv = document.createElement('div');
      petDiv.classList.add('pet-detail', 'p-2', 'mb-2', 'border', 'rounded', 'd-flex', 'justify-content-between', 'align-items-center');

      petDiv.innerHTML = `
      <div class="pe-3">
        <p class="mb-1"><strong>🐾 Nome:</strong> ${pet.nome || 'N/A'}</p>
        <p class="mb-1"><strong>Espécie:</strong> ${pet.especie || 'N/A'}</p>
        <p class="mb-1"><strong>Raça:</strong> ${pet.raca || 'N/A'}</p>
        <p class="mb-0"><strong>Nascimento:</strong> ${formatDate(pet.idade)}</p>
      </div>
      <div class="d-flex flex-column gap-2 mt-2 mt-md-0">
  <button class="btn btn-sm btn-outline-primary" title="Ver detalhes do pet">
    <i class="fas fa-eye me-1"></i> Ver detalhes
  </button>
  <button class="btn btn-sm btn-outline-success" title="Editar pet">
    <i class="fas fa-edit me-1"></i> Editar
  </button>
  <button class="btn btn-sm btn-outline-danger" title="Remover pet">
    <i class="fas fa-trash-alt me-1"></i> Remover
  </button>
</div>

    `;

      const btnDetalhes = petDiv.querySelector('button.btn-outline-primary');
      const btnRemover = petDiv.querySelector('button.btn-outline-danger');

      btnDetalhes.addEventListener('click', () => abrirModalPet(pet));
      btnRemover.addEventListener('click', () => removerPetDoCliente(pet.id));

      container.appendChild(petDiv);
    });
  } else {
    container.innerHTML = '<p class="text-muted">Nenhum pet cadastrado.</p>';
  }

  // Mostra o modal cliente
  clienteModalInstance.show();
}

function openEditModal(cliente) {
  const modalEl = document.getElementById('editClienteModal');
  const form = document.getElementById('formEditarCliente');
  if (!modalEl || !form || !editModalInstance) return;

  fillEditForm(cliente);

  editModalInstance.show();
  editModalInstance.currentCliente = cliente; // Guarda para update
}

function fillEditForm(cliente) {
  const form = document.getElementById('formEditarCliente');
  if (!form || !cliente) return;

  form.querySelector('#editNome').value = cliente.nome || '';
  form.querySelector('#editCpf').value = cliente.cpf || '';

  // Usa o campo dataNasc conforme a DTO
  const dataNascimento = cliente.dataNasc || cliente.idade || cliente.nascimento || cliente.dataNascimento;

  // Garante que a data seja exibida no formato correto para o input date
  if (dataNascimento) {
    // Se já está no formato YYYY-MM-DD, usa diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
      form.querySelector('#editDataNasc').value = dataNascimento;
    } else {
      // Se não, converte para o formato correto
      const date = new Date(dataNascimento);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        form.querySelector('#editDataNasc').value = `${year}-${month}-${day}`;
      } else {
        form.querySelector('#editDataNasc').value = '';
      }
    }
  } else {
    form.querySelector('#editDataNasc').value = '';
  }

  form.querySelector('#editEmail').value = cliente.email || '';
  form.querySelector('#editTelefone').value = cliente.telefone || '';
}

// === API ===
async function getClientes() {
  const grid = getElement('#gridClientes');
  if (!grid) return;

  try {
    grid.innerHTML = '<div class="loading text-center py-3"><i class="fas fa-spinner fa-spin"></i> Carregando clientes...</div>';
    const res = await fetch(`${apiBaseUrl}/clientes`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
    clientesLista = await res.json();
    renderClientes(clientesLista);
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="error text-center py-3"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar.</div>';
  }
}

async function updateCliente() {
  const form = document.getElementById('formEditarCliente');
  const cliente = editModalInstance.currentCliente;
  if (!form || !cliente) return;

  // Prepara os dados do formulário conforme a DTO
  const formData = {
    nome: form.querySelector('#editNome').value.trim(),
    cpf: form.querySelector('#editCpf').value.trim(),
    dataNasc: form.querySelector('#editDataNasc').value,
    email: form.querySelector('#editEmail').value.trim(),
    telefone: form.querySelector('#editTelefone').value.trim(),
    enderecoId: cliente.endereco?.idEndereco || cliente.endereco?.id || null
  };

  const valid = validateClienteForm(formData);
  if (!valid.isValid) {
    showMessage(valid.message, 'error');
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/clientes/${cliente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Erro ${res.status}: ${res.statusText}`);
    }

    showMessage('Cliente atualizado com sucesso!', 'success');
    editModalInstance.hide();
    getClientes();
  } catch (err) {
    showMessage(`Erro: ${err.message}`, 'error');
  }
}

function validateClienteForm(data) {
  if (!data.nome || data.nome.length < 3) {
    return { isValid: false, message: 'Nome deve ter ao menos 3 caracteres' };
  }

  if (!data.cpf || !/^\d{11}$/.test(data.cpf)) {
    return { isValid: false, message: 'CPF deve conter 11 dígitos numéricos' };
  }

  if (!data.email || !data.email.includes('@')) {
    return { isValid: false, message: 'Email deve ser válido' };
  }

  if (!data.dataNasc) {
    return { isValid: false, message: 'Data de nascimento é obrigatória' };
  }

  // Valida se a data é válida
  const dataNasc = new Date(data.dataNasc);
  if (isNaN(dataNasc.getTime())) {
    return { isValid: false, message: 'Data de nascimento deve ser válida' };
  }

  // enderecoId é opcional na DTO, então não validamos

  return { isValid: true };
}

// === FILTROS ===
function setupEventListeners() {
  const input = getElement('#searchInput');
  const btn = getElement('#searchButton');
  input?.addEventListener('input', handleFilterChange);
  btn?.addEventListener('click', handleFilterChange);

  // Listener submit do form de edição
  const formEditar = document.getElementById('formEditarCliente');
  formEditar?.addEventListener('submit', e => {
    e.preventDefault();
    updateCliente();
  });
}

function handleFilterChange() {
  const termo = getElement('#searchInput')?.value.toLowerCase() || '';
  const filtrado = clientesLista.filter(cli =>
    [cli.nome, cli.cpf, cli.email].some(v => v?.toLowerCase().includes(termo))
  );
  renderClientes(filtrado);
}

function abrirModalPet(pet) {
  const nomeEl = document.getElementById('modalPetNome');
  const racaEl = document.getElementById('modalPetRaca');
  const especieEl = document.getElementById('modalPetEspecie');
  const nascimentoEl = document.getElementById('modalPetNascimento');
  const pesoEl = document.getElementById('modalPetPeso');
  const modalEl = document.getElementById('petModal');

  if (!modalEl || !nomeEl || !racaEl || !especieEl || !nascimentoEl || !pesoEl) {
    console.warn('Elemento do modal não encontrado.');
    return;
  }

  nomeEl.textContent = pet.nome || 'N/A';
  racaEl.textContent = pet.raca || 'N/A';
  especieEl.textContent = pet.especie || 'N/A';
  nascimentoEl.textContent = formatDate(pet.idade);
  pesoEl.textContent = pet.peso ? `${pet.peso} kg` : 'N/A';

  // Adiciona uma animação leve ao abrir o modal
  modalEl.classList.add('fade');
  const modalInstance = new bootstrap.Modal(modalEl);
  modalInstance.show();

  // Aplica animação personalizada se quiser
  modalEl.addEventListener('shown.bs.modal', () => {
    const content = modalEl.querySelector('.modal-content');
    if (content) {
      content.classList.add('animate__animated', 'animate__fadeInDown');
    }
  }, { once: true });
}


// === REMOVER PET (DESVINCULAR) ===
async function removerPetDoCliente(petId) {
  if (!confirm('Deseja realmente remover este pet do cliente?')) return;

  try {
    const res = await fetch(`${apiBaseUrl}/animal/${petId}/desvincular`, {
      method: 'PUT',
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao remover pet.');
    }

    const data = await res.json();
    showMessage(data.message || 'Pet removido com sucesso!', 'success');

    // Atualiza lista de clientes da API
    await getClientes();

    // Atualiza modal cliente se estiver aberto
    const modalEl = document.getElementById('clienteModal');
    if (modalEl && bootstrap.Modal.getInstance(modalEl)?._isShown) {
      // Pega cliente atual pelo id (que tinha esse pet)
      const clienteAberto = clientesLista.find(c =>
        c.animais?.some(a => a.id === petId)
      );

      if (clienteAberto) {
        showClienteDetails(clienteAberto);
      } else {
        // Se não achou cliente (pet removido), fecha modal
        bootstrap.Modal.getInstance(modalEl).hide();
      }
    }

  } catch (error) {
    showMessage(error.message, 'error');
  }
}

// === VARIÁVEL GLOBAL DO MODAL DE EDIÇÃO DE PET ===
let editPetModalInstance = null;

// === INICIALIZAÇÃO DE MODAIS ===
function initModals() {
  const clienteModalEl = document.getElementById('clienteModal');
  const editClienteModalEl = document.getElementById('editClienteModal');
  const editPetModalEl = document.getElementById('editPetModal');

  if (clienteModalEl) currentModalInstance = new bootstrap.Modal(clienteModalEl);
  if (editClienteModalEl) editModalInstance = new bootstrap.Modal(editClienteModalEl);
  if (editPetModalEl) editPetModalInstance = new bootstrap.Modal(editPetModalEl);
}

// === ABRIR MODAL DE EDIÇÃO DE PET ===
function abrirModalEditarPet(pet) {
  const form = document.getElementById('formEditarPet');
  if (!form || !editPetModalInstance) return;

  form.querySelector('#editPetId').value = pet.id;
  form.querySelector('#editPetNome').value = pet.nome || '';
  form.querySelector('#editPetRaca').value = pet.raca || '';
  form.querySelector('#editPetEspecie').value = pet.especie || '';

  const dataNasc = pet.idade?.substring(0, 10) || '';
  form.querySelector('#editPetNascimento').value = dataNasc;

  form.querySelector('#editPetPeso').value = pet.peso || '';

  editPetModalInstance.show();
}

// === VALIDAR E ENVIAR EDIÇÃO DE PET ===
async function salvarEdicaoPet() {
  const form = document.getElementById('formEditarPet');

  const id = form.querySelector('#editPetId').value;
  const nome = form.querySelector('#editPetNome').value.trim();
  const raca = form.querySelector('#editPetRaca').value.trim();
  const especie = form.querySelector('#editPetEspecie').value.trim();
  const nascimento = form.querySelector('#editPetNascimento').value;
  const peso = form.querySelector('#editPetPeso').value;

  if (!nome || nome.length < 2) {
    showMessage('Nome do pet deve ter ao menos 2 caracteres', 'error');
    return;
  }

  if (!nascimento) {
    showMessage('Data de nascimento é obrigatória', 'error');
    return;
  }

  const nascimentoDate = new Date(nascimento);
  if (isNaN(nascimentoDate.getTime())) {
    showMessage('Data de nascimento inválida', 'error');
    return;
  }

  if (peso && (isNaN(peso) || parseFloat(peso) < 0)) {
    showMessage('Peso deve ser um número positivo', 'error');
    return;
  }

  const petAtualizado = {
    nome,
    raca,
    especie,
    idade: nascimento,
    peso: peso ? parseFloat(peso) : null
  };

  try {
    const res = await fetch(`${apiBaseUrl}/animal/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(petAtualizado),
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Erro ao atualizar pet.');

    showMessage('Pet atualizado com sucesso!', 'success');
    editPetModalInstance.hide();
    await getClientes();
  } catch (error) {
    console.error(error);
    showMessage(error.message || 'Erro ao atualizar pet', 'error');
  }
}

// === EVENTO DE SUBMISSÃO ===
function setupEventListeners() {
  const formEditarPet = document.getElementById('formEditarPet');
  formEditarPet?.addEventListener('submit', e => {
    e.preventDefault();
    salvarEdicaoPet();
  });
}
