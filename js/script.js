const apiBaseUrl = 'http://localhost:8080';

// Função auxiliar para selecionar elementos
function getElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element && !selector.includes('modal')) {
  if (!element && !selector.includes('modal')) {
    console.warn(`Elemento não encontrado: ${selector}`);
  }
  return element;
}

// Variáveis globais
let currentModal = null;
let medicamentosLista = [];

// Inicialização principal
document.addEventListener('DOMContentLoaded', function() {
  initModals();
  initDropdownMenu();
  setupEventListeners();
  getMedicamentos();

  // Configurar preview de imagem
  const fileInput = getElement('#editarFoto');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      const preview = getElement('#editarPhotoPreview');
     
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          preview.innerHTML = `<img src="${event.target.result}" class="preview-image">`;
        };
        reader.readAsDataURL(file);
      } else {
        preview.innerHTML = '<i class="fas fa-pills"></i>';
      }
    });
  }
});

// Inicialização dos modais
function initModals() {
  // Modal de detalhes
  const detalhesModal = getElement('#medicamentoModal');
  if (detalhesModal) {
    currentModal = {
      element: detalhesModal,
      closeBtn: getElement('.close-modal', detalhesModal),
      open: function(medicamento) {
        showMedicamentoDetails(medicamento);
      },
      close: function() {
        this.element.style.display = 'none';
      }
    };

    currentModal.closeBtn.onclick = () => currentModal.close();
    detalhesModal.onclick = function(e) {
      if (e.target === detalhesModal) {
        currentModal.close();
      }
    };
  }

  // Modal de edição
  const editarModal = getElement('#editarMedicamentoModal');
  if (editarModal) {
    const closeBtn = getElement('.close-modal', editarModal);
    if (closeBtn) {
      closeBtn.onclick = function() {
        editarModal.style.display = 'none';
      };
    }
   
    editarModal.onclick = function(e) {
      if (e.target === editarModal) {
        editarModal.style.display = 'none';
      }
    };

    // Botão cancelar
    const cancelBtn = getElement('.btn-cancelar', editarModal);
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        editarModal.style.display = 'none';
      });
    }
  }

  // Modal de lote
  const loteModal = getElement('#modalLote');
  if (loteModal) {
    const closeBtn = getElement('.close-modal', loteModal);
    if (closeBtn) {
      closeBtn.onclick = function() {
        loteModal.classList.add('hidden');
      };
    }
  }
}

// Configuração dos event listeners
function setupEventListeners() {
  // Filtros e busca
  const searchInput = getElement('#searchInput');
  const searchButton = getElement('#searchButton');
  const statusFilter = getElement('#statusFilter');
  const clearFilters = getElement('#clearFilters');

  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (searchButton) searchButton.addEventListener('click', handleFilterChange);
  if (statusFilter) statusFilter.addEventListener('change', handleFilterChange);
  if (clearFilters) clearFilters.addEventListener('click', resetFilters);

  // Formulário de edição
  const editForm = getElement('#editarMedicamentoForm');
  if (editForm) {
    editForm.addEventListener('submit', handleEditSubmit);
  }

  // Eventos para modal de lote
  const loteButton = getElement('#btnAdicionarLote');
  if (loteButton) {
    loteButton.addEventListener('click', abrirModalLote);
  }

  const salvarLoteButton = getElement('#btnSalvarLote');
  if (salvarLoteButton) {
    salvarLoteButton.addEventListener('click', salvarMedicamentoLote);
  }

  const pesquisaInput = getElement('#pesquisaMedicamento');
  if (pesquisaInput) {
    pesquisaInput.addEventListener('input', filtrarMedicamentos);
  }
}

// Menu dropdown
function initDropdownMenu() {
  const dropdownButtons = document.querySelectorAll('.btn-cadastros');

  dropdownButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      const dropdown = this.nextElementSibling;
      const isOpen = dropdown.style.display === 'block';

      document.querySelectorAll('.dropdown-cadastros').forEach(d => {
        d.style.display = 'none';
      });

      if (!isOpen) dropdown.style.display = 'block';
    });
  });

  document.addEventListener('click', function() {
    document.querySelectorAll('.dropdown-cadastros').forEach(dropdown => {
      dropdown.style.display = 'none';
    });
  });

  document.querySelectorAll('.dropdown-cadastros').forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
}

// Carrega medicamentos da API
async function getMedicamentos() {
  const grid = getElement('#gridMedicamentos');
  if (!grid) return;

  try {
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando medicamentos...</div>';

    const response = await fetch(`${apiBaseUrl}/medicamentos`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    medicamentosLista = await response.json();
    renderMedicamentos(medicamentosLista);
  } catch (error) {
    console.error('Erro ao carregar medicamentos:', error);
    grid.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar. Tente recarregar.</div>';
    grid.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar. Tente recarregar.</div>';
  }
}

// Renderiza os cards de medicamentos
function renderMedicamentos(lista) {
  const grid = getElement('#gridMedicamentos');
  if (!grid) return;

  grid.innerHTML = '';

  if (!lista || lista.length === 0) {
    grid.innerHTML = '<div class="no-results"><i class="fas fa-box-open"></i> Nenhum medicamento</div>';
    return;
  }

  lista.forEach(med => {
    const card = document.createElement('div');
    card.className = 'med-card';
    card.dataset.id = med.id;

    const dataValidade = med.dataValidade || med.data_validade;
    const dataFormatada = dataValidade ? new Date(dataValidade).toLocaleDateString('pt-BR') : 'N/A';
    const estaVencido = dataValidade && new Date(dataValidade) < new Date();
    const imageUrl = formatImageUrl(med.foto);

    card.innerHTML = `
      <div class="med-card-actions">
        <button class="edit-btn" data-id="${med.id}" title="Editar medicamento">
          <i class="fas fa-edit"></i>
        </button>
      </div>
      <div class="med-card-image-container">
        ${imageUrl
          ? `<img src="${imageUrl}" class="med-card-image" alt="${med.nome}">`
          : '<div class="med-card-placeholder"><i class="fas fa-pills"></i></div>'}
        ${estaVencido ? '<span class="expired-badge">Vencido</span>' : ''}
        ${med.medicamentoativo === 'Inativo' ? '<span class="inactive-badge">Inativo</span>' : ''}
      </div>
      <div class="med-card-info">
        <h3 class="med-card-title">${med.nome || 'Sem nome'}</h3>
        <h3 class="med-card-title">${med.nome || 'Sem nome'}</h3>
        <p class="med-card-expiry ${estaVencido ? 'expired' : ''}">
          <i class="fas fa-calendar-alt"></i> ${dataFormatada}
        </p>
      </div>
    `;

    // Evento de clique no card
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.edit-btn') && currentModal) {
        currentModal.open(med);
      }
    });

    // Evento de clique no botão de edição
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(med);
    });

    grid.appendChild(card);
  });
}

// Filtro e busca
function handleFilterChange() {
  const searchInput = getElement('#searchInput');
  const statusFilter = getElement('#statusFilter');

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const statusValue = statusFilter ? statusFilter.value : 'all';

  const filtered = medicamentosLista.filter(med => {
    const matchesSearch =
      (med.nome && med.nome.toLowerCase().includes(searchTerm)) ||
      (med.principioAtivo && med.principioAtivo.toLowerCase().includes(searchTerm)) ||
      (med.especieIndicada && med.especieIndicada.toLowerCase().includes(searchTerm));
   
    const matchesStatus = statusValue === 'all' || med.medicamentoativo === statusValue;
   
    return matchesSearch && matchesStatus;
  });

  renderMedicamentos(filtered);
}

// Limpa todos os filtros
function resetFilters() {
  const searchInput = getElement('#searchInput');
  const statusFilter = getElement('#statusFilter');

  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = 'all';

  handleFilterChange();
}

// Mostra detalhes no modal
function showMedicamentoDetails(med) {
  if (!currentModal) return;

  const modal = currentModal.element;
  const dataFormatada = med.dataValidade ? new Date(med.dataValidade).toLocaleDateString('pt-BR') : 'N/A';
  const estaVencido = med.dataValidade && new Date(med.dataValidade) < new Date();
  const imageUrl = formatImageUrl(med.foto);

  // Preenche os dados
  getElement('#modalTitle', modal).textContent = med.nome || 'Detalhes';
  getElement('#modalNome', modal).textContent = med.nome || 'N/A';
  getElement('#modalPrincipioAtivo', modal).textContent = med.principioAtivo || 'N/A';
  getElement('#modalDosagem', modal).textContent = med.dosagem || 'N/A';
  getElement('#modalEspecie', modal).textContent = med.especieIndicada || 'N/A';
  getElement('#modalTipoUso', modal).textContent = formatTipoUso(med.tipoUso);
  getElement('#modalValidade', modal).innerHTML = `
    ${dataFormatada} ${estaVencido ? '<span class="expired-badge">Vencido</span>' : ''}
  `;
  getElement('#modalIdade', modal).textContent = med.idadeIndicada ?? 'N/A';
  getElement('#modalPeso', modal).textContent = med.pesoIndicado ? `${med.pesoIndicado} kg` : 'N/A';
  getElement('#modalReceita', modal).textContent = med.receitaObrigatoria ? 'Sim' : 'Não';
  getElement('#modalStatus', modal).textContent = formatStatus(med.medicamentoativo);
  getElement('#modalQuantidadeEstoque', modal).textContent = med.quantidadeEstoque ?? 'N/A';

  // Imagem
  const photoPreview = getElement('#modalPhotoPreview', modal);
  if (imageUrl) {
    photoPreview.innerHTML = `<img src="${imageUrl}" class="modal-image" alt="${med.nome}" onerror="this.onerror=null;this.replaceWith('<i class=\\'fas fa-pills\\'></i>')">`;
  } else {
    photoPreview.innerHTML = '<i class="fas fa-pills"></i>';
  }

  modal.style.display = 'block';
}

// Abre o modal de edição
function openEditModal(medicamento) {
  const modal = getElement('#editarMedicamentoModal');
  if (!modal) {
    console.error('Modal de edição não encontrado');
    return;
  }

  // Preencher o formulário
  getElement('#editarId').value = medicamento.id;
  getElement('#editarNome').value = medicamento.nome || '';
  getElement('#editarPrincipioAtivo').value = medicamento.principioAtivo || '';
  getElement('#editarDosagem').value = medicamento.dosagem || '';
  getElement('#editarEspecie').value = medicamento.especieIndicada || '';
  getElement('#editarTipoUso').value = medicamento.tipoUso || 'INTERNO';
  getElement('#editarValidade').value = formatDateForInput(medicamento.dataValidade);
  getElement('#editarIdade').value = medicamento.idadeIndicada || '';
  getElement('#editarPeso').value = medicamento.pesoIndicado || '';
  getElement('#editarReceita').value = medicamento.receitaObrigatoria ? 'true' : 'false';
  getElement('#editarStatus').value = medicamento.medicamentoativo || 'Ativo';
  getElement('#editarQuantidadeEstoque').value = medicamento.quantidadeEstoque || 0;

  // Foto preview
  const photoPreview = getElement('#editarPhotoPreview');
  const imageUrl = formatImageUrl(medicamento.foto);
  if (imageUrl) {
    photoPreview.innerHTML = `<img src="${imageUrl}" class="preview-image">`;
  } else {
    photoPreview.innerHTML = '<i class="fas fa-pills"></i>';
  }

  // Resetar input de arquivo
  const fileInput = getElement('#editarFoto');
  if (fileInput) {
    fileInput.value = '';
  }

  modal.style.display = 'block';
}

// Função auxiliar para formatar data para input type="date"
function formatDateForInput(dateString) {
  if (!dateString) return '';

  // Se já estiver no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Se for um objeto Date ou string de data
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Manipula o envio do formulário de edição
async function handleEditSubmit(e) {
  e.preventDefault();

  if (!e.target.checkValidity()) {
    e.target.reportValidity();
    return;
  }

  const form = e.target;
  const medicamentoId = form.id.value;
  const fileInput = getElement('#editarFoto');
  const hasNewPhoto = fileInput.files.length > 0;

  // Validações adicionais
  if (!form.dataValidade.value) {
    showMessage('Data de validade é obrigatória', 'error');
    return;
  }

  // Converter valores
  const idadeIndicada = form.idadeIndicada.value ? parseInt(form.idadeIndicada.value) : 0;
  const pesoIndicado = form.pesoIndicado.value ? parseFloat(form.pesoIndicado.value) : 0.0;
  const quantidadeEstoque = form.quantidadeEstoque.value ? parseInt(form.quantidadeEstoque.value) : 0;

  // Construir objeto de dados
  const medicamentoData = {
    id: parseInt(medicamentoId),
    nome: form.nome.value.trim(),
    principioAtivo: form.principioAtivo.value.trim(),
    dosagem: form.dosagem.value.trim(),
    especieIndicada: form.especieIndicada.value.trim(),
    dataValidade: form.dataValidade.value,
    receitaObrigatoria: form.receitaObrigatoria.value === 'true',
    pesoIndicado: pesoIndicado,
    idadeIndicada: idadeIndicada,
    medicamentoativo: form.medicamentoativo.value,
    tipoUso: form.tipoUso.value,
    foto: null,
    quantidadeEstoque: quantidadeEstoque
  };

  console.log('Dados sendo enviados:', medicamentoData);

  // Mostrar loading
  showLoading(true, 'Salvando dados...');

  try {
    // 1. Atualizar dados básicos do medicamento
    const response = await fetch(`${apiBaseUrl}/medicamentos/${medicamentoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(medicamentoData)
    });

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}: ${response.statusText}`;
     
      try {
        const errorData = await response.json();
        if (errorData.errors) {
          errorMessage = Object.entries(errorData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        console.error('Erro ao parsear resposta de erro:', e);
      }
     
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    // 2. Atualizar foto se necessário
    if (hasNewPhoto) {
      await uploadFoto(medicamentoId, fileInput.files[0]);
    }

    // 3. Atualizar a lista de medicamentos
    const index = medicamentosLista.findIndex(m => m.id == medicamentoId);
    if (index !== -1) {
      medicamentosLista[index] = responseData;
    }

    renderMedicamentos(medicamentosLista);
    getElement('#editarMedicamentoModal').style.display = 'none';
    showMessage('Medicamento atualizado com sucesso!', 'success');
   
  } catch (error) {
    console.error('Erro completo:', error);
    showMessage(error.message || 'Erro ao atualizar medicamento', 'error');
  } finally {
    showLoading(false);
  }
}

// Função para upload da foto
async function uploadFoto(medicamentoId, file) {
  // Validar tamanho da foto (máximo 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 10MB');
  }

  // Validar tipo de arquivo
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Apenas imagens JPEG, PNG ou GIF são permitidas');
  }

  const formData = new FormData();
  formData.append('foto', file);

  showLoading(true, 'Enviando foto...');

  try {
    const response = await fetch(`${apiBaseUrl}/medicamentos/${medicamentoId}/foto`, {
      method: 'POST',
      body: formData
    });
   
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao atualizar foto');
    }
   
    return await response.json();
  } finally {
    showLoading(false);
  }
}

// Função para mostrar/ocultar loading
function showLoading(show, message = '') {
  const submitBtn = getElement('#editarMedicamentoForm .btn-salvar');
  if (submitBtn) {
    submitBtn.disabled = show;
    submitBtn.innerHTML = show
      ? `<i class="fas fa-spinner fa-spin"></i> ${message}`
      : '<i class="fas fa-save"></i> Salvar Alterações';
  }
}

// Função para exibir mensagens
function showMessage(text, type) {
  const messageContainer = getElement('#message-container');
  if (!messageContainer) return;

  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;

  // Remove mensagens anteriores
  while (messageContainer.firstChild) {
    messageContainer.removeChild(messageContainer.firstChild);
  }

  messageContainer.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 5000);
}

// Funções auxiliares
function formatImageUrl(imageData) {
  if (!imageData) return null;
  if (/^https?:\/\//.test(imageData)) return imageData;
  if (/^[A-Za-z0-9+/=]+$/.test(imageData)) return `data:image/jpeg;base64,${imageData}`;
  if (/^data:image\//.test(imageData)) return imageData;
  return null;
}

function formatTipoUso(tipo) {
  const map = { 'INTERNO': 'Uso Interno', 'EXTERNO': 'Uso Externo' };
  return map[tipo] || tipo || 'N/A';
}

function formatStatus(status) {
  const map = { 'Ativo': 'Ativo', 'Inativo': 'Inativo' };
  return map[status] || status || 'N/A';
}

// Funções para modal de lote
async function abrirModalLote() {
  const modal = getElement('#modalLote');
  if (!modal) return;
  modal.classList.remove('hidden');

  const listaContainer = getElement('#listaMedicamentosLote');
  if (!listaContainer) return;
  listaContainer.innerHTML = '<p>Carregando medicamentos...</p>';

  try {
    const response = await fetch(`${apiBaseUrl}/medicamentos`);
    if (!response.ok) throw new Error('Erro ao carregar medicamentos');
    const medicamentos = await response.json();

    if (!medicamentos.length) {
      listaContainer.innerHTML = '<p>Nenhum medicamento cadastrado.</p>';
      return;
    }

    listaContainer.innerHTML = '';
    medicamentos.forEach(med => {
      const item = document.createElement('div');
      item.className = 'item-medicamento';
      item.innerHTML = `
        <label for="qtd-${med.id}">${med.nome}</label>
        <input type="number" id="qtd-${med.id}" min="0" placeholder="Qtd" value="0" />
      `;
      listaContainer.appendChild(item);
    });
  } catch (error) {
    listaContainer.innerHTML = '<p>Erro ao carregar medicamentos.</p>';
    console.error(error);
  }
}

function fecharModalLote() {
  const modal = getElement('#modalLote');
  if (!modal) return;
  modal.classList.add('hidden');
}

function filtrarMedicamentos() {
  const filtro = getElement('#pesquisaMedicamento').value.toLowerCase();
  const listaContainer = getElement('#listaMedicamentosLote');
  if (!listaContainer) return;

  const itens = listaContainer.querySelectorAll('.item-medicamento');
  itens.forEach(item => {
    const label = item.querySelector('label');
    if (!label) return;
    const texto = label.textContent.toLowerCase();
    item.style.display = texto.includes(filtro) ? 'flex' : 'none';
  });
}

async function salvarMedicamentoLote() {
  try {
    const listaContainer = getElement('#listaMedicamentosLote');
    const itens = listaContainer.querySelectorAll('.item-medicamento');
    const movimentacoes = [];

    itens.forEach(item => {
      const input = item.querySelector('input');
      const id = parseInt(input.id.replace('qtd-', ''), 10);
      const quantidade = parseInt(input.value, 10);

      if (!isNaN(id) && !isNaN(quantidade) && quantidade >= 1) {
        movimentacoes.push({
          id: id,
          tipo: "ENTRADA",  // ou ajuste se quiser permitir SAIDA
          quantidade: quantidade
        });
      }
    });

    if (movimentacoes.length === 0) {
      alert('Preencha ao menos um campo com quantidade maior ou igual a 1.');
      return;
    }

    const response = await fetch(`${apiBaseUrl}/medicamentos/estoque/multiplos`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(movimentacoes)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Erro ao atualizar estoque em lote.');
    }

    const resultado = await response.json();
    alert('Movimentação realizada com sucesso:\n' + (Array.isArray(resultado) ? resultado.join('\n') : resultado));

    fecharModalLote();
    getMedicamentos(); // atualiza a tela

  } catch (error) {
    console.error('Erro ao salvar estoque em lote:', error);
    alert('Erro ao salvar estoque em lote: ' + error.message);
  }
}}