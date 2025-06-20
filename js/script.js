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
let medicamentosLista = [];

// Inicialização principal
document.addEventListener('DOMContentLoaded', function () {
  initModals();
  setupEventListeners();
  getMedicamentos();

  // Configurar preview de imagem
  const fileInput = getElement('#editarFoto');
  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      const preview = getElement('#editarPhotoPreview');

      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          preview.innerHTML = `<img src="${event.target.result}" class="preview-image" onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\"fas fa-pills\"></i>'">`;
        };
        reader.onerror = function () {
          preview.innerHTML = '<i class="fas fa-pills"></i>';
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
      open: function (medicamento) {
        showMedicamentoDetails(medicamento);
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
    initRemoverLoteModal(); // Adicione no final da função

  }

  // Modal de edição
  const editarModal = getElement('#editarMedicamentoModal');
  if (editarModal) {
    const closeBtn = getElement('.close-modal', editarModal);
    if (closeBtn) {
      closeBtn.onclick = function () {
        editarModal.style.display = 'none';
      };
    }

    editarModal.onclick = function (e) {
      if (e.target === editarModal) {
        editarModal.style.display = 'none';
      }
    };

    // Botão cancelar
    const cancelBtn = getElement('.btn-cancelar', editarModal);
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        editarModal.style.display = 'none';
      });
    }
  }

  // Modal de lote
  const loteModal = getElement('#modalLote');
  if (loteModal) {
    const closeBtn = getElement('.modal-lote-close', loteModal);
    if (closeBtn) {
      closeBtn.onclick = function () {
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
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleEditSubmit(e).catch(error => {
        console.error('Erro no submit:', error);
      });
    });
  }

  // Eventos para modal de lote
  const loteButton = getElement('#btnAdicionarLote');
  if (loteButton) {
    loteButton.addEventListener('click', abrirModalLote);
  }

  const salvarLoteButton = getElement('#btnSalvarLote');
  if (salvarLoteButton) {
    salvarLoteButton.addEventListener('click', function () {
      salvarMedicamentoLote().catch(error => {
        console.error('Erro ao salvar lote:', error);
      });
    });
  }

  const pesquisaInput = getElement('#pesquisaMedicamento');
  if (pesquisaInput) {
    pesquisaInput.addEventListener('input', filtrarMedicamentos);
  }

  // Modifique esta parte no setupEventListeners()
  const removerLoteButton = getElement('.remove-lot'); // Seleciona pelo classe
  if (removerLoteButton) {
    removerLoteButton.addEventListener('click', abrirModalRemoverLote);
  }
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
  }
}
function escapeHTML(str) {
  return str ? str.replace(/"/g, '&quot;') : '';
}

function renderMedicamentos(lista) {
  const grid = getElement('#gridMedicamentos');
  if (!grid) return;

  grid.innerHTML = '';

  if (!lista || lista.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fas fa-box-open"></i> Nenhum medicamento encontrado
      </div>`;
    return;
  }

  lista.forEach(med => {
    const card = document.createElement('div');
    card.className = 'med-card';
    card.dataset.id = med.id;

    const dataValidade = med.dataValidade || med.data_validade;
    const dataFormatada = dataValidade
      ? new Date(dataValidade).toLocaleDateString('pt-BR')
      : 'N/A';
    const estaVencido = dataValidade && new Date(dataValidade) < new Date();
    const imageUrl = formatImageUrl(med.foto);
    const nomeSeguro = escapeHTML(med.nome || 'Sem nome');

    const badgeVencido = estaVencido
      ? `<span class="expired-badge">Vencido</span>`
      : '';
    const badgeInativo = med.medicamentoativo === 'Inativo'
      ? `<span class="inactive-badge">Inativo</span>`
      : '';

    const imagemHTML = imageUrl
      ? `
        <img 
          src="${imageUrl}" 
          class="med-card-image" 
          alt="${nomeSeguro}"
          onerror="this.onerror=null;this.remove();this.parentElement.innerHTML='<div class=&quot;med-card-placeholder&quot;><i class=&quot;fas fa-pills&quot;></i></div>'"
        >`
      : `<div class="med-card-placeholder"><i class="fas fa-pills"></i></div>`;

    card.innerHTML = `
      <div class="med-card-actions">
        <button class="edit-btn" data-id="${med.id}" title="Editar medicamento">
          <i class="fas fa-edit"></i>
        </button>
      </div>
      <div class="med-card-image-container">
        ${imagemHTML}
        ${badgeVencido}
        ${badgeInativo}
      </div>
      <div class="med-card-info">
        <h3 class="med-card-title">${nomeSeguro}</h3>
        <p class="med-card-expiry ${estaVencido ? 'expired' : ''}">
          <i class="fas fa-calendar-alt"></i> ${dataFormatada}
        </p>
      </div>
    `;

    // Abertura do modal ao clicar no card (exceto botão de edição)
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.edit-btn') && currentModal) {
        currentModal.open(med);
      }
    });

    // Abertura do modal de edição ao clicar no botão
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(med);
      });
    }

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
  const setTextContent = (selector, value) => {
    const el = getElement(selector, modal);
    if (el) el.textContent = value || 'N/A';
  };

  setTextContent('#modalTitle', med.nome || 'Detalhes');
  setTextContent('#modalNome', med.nome);
  setTextContent('#modalPrincipioAtivo', med.principioAtivo);
  setTextContent('#modalDosagem', med.dosagem);
  setTextContent('#modalEspecie', med.especieIndicada);
  setTextContent('#modalTipoUso', formatTipoUso(med.tipoUso));

  const validadeEl = getElement('#modalValidade', modal);
  if (validadeEl) {
    validadeEl.innerHTML = `${dataFormatada} ${estaVencido ? '<span class="expired-badge">Vencido</span>' : ''}`;
  }

  setTextContent('#modalIdade', med.idadeIndicada);
  setTextContent('#modalPeso', med.pesoIndicado ? `${med.pesoIndicado} kg` : null);
  setTextContent('#modalReceita', med.receitaObrigatoria ? 'Sim' : 'Não');
  setTextContent('#modalStatus', formatStatus(med.medicamentoativo));
  setTextContent('#modalQuantidadeEstoque', med.quantidadeEstoque);

  // Imagem
  const photoPreview = getElement('#modalPhotoPreview', modal);
  if (photoPreview) {
    if (imageUrl) {
      photoPreview.innerHTML = `<img src="${imageUrl}" class="modal-image" alt="${med.nome}" onerror="this.onerror=null;this.replaceWith('<i class=\\'fas fa-pills\\'></i>')">`;
    } else {
      photoPreview.innerHTML = '<i class="fas fa-pills"></i>';
    }
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

  // Função auxiliar para definir valores
  const setValue = (selector, value) => {
    const el = getElement(selector);
    if (el) el.value = value || '';
  };

  // Preencher o formulário
  setValue('#editarId', medicamento.id);
  setValue('#editarNome', medicamento.nome);
  setValue('#editarPrincipioAtivo', medicamento.principioAtivo);
  setValue('#editarDosagem', medicamento.dosagem);
  setValue('#editarEspecie', medicamento.especieIndicada);
  setValue('#editarTipoUso', medicamento.tipoUso || 'INTERNO');
  setValue('#editarValidade', formatDateForInput(medicamento.dataValidade));
  setValue('#editarIdade', medicamento.idadeIndicada);
  setValue('#editarPeso', medicamento.pesoIndicado);
  setValue('#editarReceita', medicamento.receitaObrigatoria ? 'true' : 'false');
  setValue('#editarStatus', medicamento.medicamentoativo || 'Ativo');
  setValue('#editarQuantidadeEstoque', medicamento.quantidadeEstoque);

  // Foto preview
  const photoPreview = getElement('#editarPhotoPreview');
  if (photoPreview) {
    const imageUrl = formatImageUrl(medicamento.foto);
    if (imageUrl) {
      photoPreview.innerHTML = `<img src="${imageUrl}" class="preview-image" onerror="this.onerror=null;this.replaceWith('<i class=\\'fas fa-pills\\'></i>')">`;
    } else {
      photoPreview.innerHTML = '<i class="fas fa-pills"></i>';
    }
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

// Manipula o envio do formulário de edição - VERSÃO FINAL CORRIGIDA
async function handleEditSubmit(e) {
  e.preventDefault();

  const form = e.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Validação avançada dos campos
  const validationErrors = [];

  // 1. Validação de campos obrigatórios
  const requiredFields = [
    { field: 'nome', name: 'Nome' },
    { field: 'principioAtivo', name: 'Princípio Ativo' },
    { field: 'dosagem', name: 'Dosagem' },
    { field: 'especieIndicada', name: 'Espécie Indicada' },
    { field: 'dataValidade', name: 'Data de Validade' },
    { field: 'quantidadeEstoque', name: 'Quantidade em Estoque' }
  ];

  requiredFields.forEach(({ field, name }) => {
    const value = form[field]?.value?.trim();
    if (!value) validationErrors.push(`${name} é obrigatório`);
  });

  // 2. Validação de formato da data
  if (form.dataValidade.value) {
    const data = new Date(form.dataValidade.value);
    if (isNaN(data.getTime())) {
      validationErrors.push('Data de validade inválida');
    }
  }

  // 3. Validação de quantidade em estoque
  const quantidade = parseInt(form.quantidadeEstoque.value);
  if (isNaN(quantidade) || quantidade < 0) {
    validationErrors.push('Quantidade em estoque deve ser um número positivo');
  }

  // 4. Validação de peso indicado (se preenchido)
  if (form.pesoIndicado.value && isNaN(parseFloat(form.pesoIndicado.value))) {
    validationErrors.push('Peso indicado deve ser um número válido');
  }

  // 5. Validação de idade indicada (se preenchida)
  if (form.idadeIndicada.value && isNaN(parseInt(form.idadeIndicada.value))) {
    validationErrors.push('Idade indicada deve ser um número válido');
  }

  // Se houver erros, exibe e aborta
  if (validationErrors.length > 0) {
    showMessage(validationErrors.join('<br>'), 'error');
    return;
  }

  // Preparar os dados no formato EXATO que o backend espera
  const medicamentoData = {
    id: parseInt(form.id.value),
    nome: form.nome.value.trim(),
    principioAtivo: form.principioAtivo.value.trim(),
    dosagem: form.dosagem.value.trim(),
    especieIndicada: form.especieIndicada.value.trim(),
    dataValidade: form.dataValidade.value,
    receitaObrigatoria: form.receitaObrigatoria.value === 'true',
    pesoIndicado: form.pesoIndicado.value ? parseFloat(form.pesoIndicado.value) : null,
    idadeIndicada: form.idadeIndicada.value ? parseInt(form.idadeIndicada.value) : null,
    medicamentoativo: form.medicamentoativo.value,
    tipoUso: form.tipoUso.value,
    quantidadeEstoque: parseInt(form.quantidadeEstoque.value)
  };

  console.log('Dados sendo enviados:', medicamentoData);

  showLoading(true, 'Salvando dados...');

  try {
    // 1. Atualizar dados básicos do medicamento
    const response = await fetch(`${apiBaseUrl}/medicamentos/${medicamentoData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(medicamentoData)
    });

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      try {
        const errorData = await response.json();

        // Tratamento especial para erros de validação do Spring
        if (errorData.errors) {
          errorMessage = Object.values(errorData.errors)
            .flatMap(err => Array.isArray(err) ? err : [err])
            .join('<br>');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        console.error('Erro ao parsear resposta:', e);
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    // 2. Atualizar foto se necessário (em chamada separada)
    const fileInput = getElement('#editarFoto');
    if (fileInput?.files?.length > 0) {
      await uploadFoto(medicamentoData.id, fileInput.files[0]);
    }

    // 3. Atualizar a lista local
    const index = medicamentosLista.findIndex(m => m.id == medicamentoData.id);
    if (index !== -1) {
      medicamentosLista[index] = responseData;
      renderMedicamentos(medicamentosLista);
    }

    getElement('#editarMedicamentoModal').style.display = 'none';
    showMessage('Medicamento atualizado com sucesso!', 'success');

  } catch (error) {
    console.error('Erro ao atualizar medicamento:', error);
    showMessage(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// Função para upload da foto
async function uploadFoto(medicamentoId, file) {
  try {
    // Validar arquivo
    if (!file) throw new Error('Nenhum arquivo selecionado');
    if (file.size > 10 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 10MB');

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Apenas imagens JPEG, PNG ou GIF são permitidas');
    }

    const formData = new FormData();
    formData.append('foto', file);

    showLoading(true, 'Enviando foto...');

    const response = await fetch(`${apiBaseUrl}/medicamentos/${medicamentoId}/foto`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao enviar foto');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
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

  // Remove mensagens anteriores
  messageContainer.innerHTML = '';

  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
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

    // Renderização com layout mais elegante
    listaContainer.innerHTML = medicamentos.map(med => {
      const nome = med.nome || 'Sem nome';
      return `
        <div class="item-medicamento">
           <label for="qtd-${med.id}" title="${nome}">${nome}<span class="stock-info">(Estoque: ${med.quantidadeEstoque})</span></label>
          <input type="number"
                 id="qtd-${med.id}"
                 name="qtd-${med.id}"
                 min="0"
                 aria-label="Quantidade para ${nome}"
                 placeholder="0" />
        </div>`;
    }).join('');

  } catch (error) {
    console.error('Erro ao carregar medicamentos:', error);
    listaContainer.innerHTML = '<p>Erro ao carregar medicamentos.</p>';
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
    if (!listaContainer) throw new Error('Container de lista não encontrado');

    const itens = listaContainer.querySelectorAll('.item-medicamento');
    const movimentacoes = [];

    itens.forEach(item => {
      const input = item.querySelector('input');
      if (!input) return;

      const id = parseInt(input.id.replace('qtd-', ''), 10);
      const quantidade = parseInt(input.value, 10);

      if (!isNaN(id) && !isNaN(quantidade) && quantidade >= 1) {
        movimentacoes.push({
          id: id,
          tipo: "ENTRADA",
          quantidade: quantidade
        });
      }
    });

    if (movimentacoes.length === 0) {
      showMessage('Preencha ao menos um campo com quantidade maior ou igual a 1.', 'error');
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
    showMessage('Movimentação realizada com sucesso!', 'success');
    fecharModalLote();
    getMedicamentos();

  } catch (error) {
    console.error('Erro ao salvar estoque em lote:', error);
    showMessage('Erro ao salvar estoque em lote: ' + error.message, 'error');
  }
}
// Modal de remover lote - VERSÃO COMPATÍVEL COM SEU CÓDIGO
function initRemoverLoteModal() {
  const modal = getElement('#modalRemoverLote');
  if (!modal) return;

  const closeBtn = getElement('.modal-lote-close', modal);
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.add('hidden');
  }

  modal.onclick = function (e) {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  };

  // Evento de pesquisa
  const pesquisaInput = getElement('#pesquisaMedicamentoRemover');
  if (pesquisaInput) {
    pesquisaInput.addEventListener('input', filtrarMedicamentosRemover);
  }

  // Evento do botão remover
  const removerBtn = getElement('#btnRemoverLote1');
  if (removerBtn) {
    removerBtn.addEventListener('click', function () {
      removerMedicamentoLote().catch(error => {
        console.error('Erro ao remover lote:', error);
        showMessage('Erro ao remover medicamentos: ' + error.message, 'error');
      });
    });
  }
}

// Filtrar medicamentos no modal de remoção
function filtrarMedicamentosRemover() {
  const filtro = getElement('#pesquisaMedicamentoRemover').value.toLowerCase();
  const listaContainer = getElement('#listaMedicamentosRemoverLote');
  if (!listaContainer) return;

  const itens = listaContainer.querySelectorAll('.item-medicamento');
  itens.forEach(item => {
    const label = item.querySelector('label');
    if (!label) return;
    const texto = label.textContent.toLowerCase();
    item.style.display = texto.includes(filtro) ? 'flex' : 'none';
  });
}

// Abrir modal de remover lote
function abrirModalRemoverLote() {
  const modal = getElement('#modalRemoverLote');
  if (!modal) return;

  // Limpa mensagens de erro ao abrir
  const messageContainer = getElement('#message-container');
  if (messageContainer) messageContainer.innerHTML = '';

  modal.classList.remove('hidden');

  const listaContainer = getElement('#listaMedicamentosRemoverLote');
  if (!listaContainer) return;

  listaContainer.innerHTML = '<p>Carregando medicamentos...</p>';

  // Carrega apenas medicamentos com estoque > 0
  const medicamentosComEstoque = medicamentosLista.filter(m => m.quantidadeEstoque > 0);

  if (medicamentosComEstoque.length === 0) {
    listaContainer.innerHTML = '<p>Nenhum medicamento com estoque disponível.</p>';
    return;
  }

  listaContainer.innerHTML = medicamentosComEstoque.map(med => {
    const nome = med.nome || 'Sem nome';
    return `
      <div class="item-medicamento">
        <label for="remove-qtd-${med.id}" title="${nome}">
          ${nome} <span class="stock-info">(Estoque: ${med.quantidadeEstoque})</span>
        </label>
        <input type="number"
               id="remove-qtd-${med.id}"
               name="remove-qtd-${med.id}"
               min="1"
               max="${med.quantidadeEstoque}"
               aria-label="Quantidade para remover de ${nome}"
               placeholder="0" />
      </div>`;
  }).join('');
}

// Remover medicamentos em lote
async function removerMedicamentoLote() {
  try {
    const listaContainer = getElement('#listaMedicamentosRemoverLote');
    if (!listaContainer) throw new Error('Container de lista não encontrado');

    const itens = listaContainer.querySelectorAll('.item-medicamento');
    const movimentacoes = [];

    itens.forEach(item => {
      const input = item.querySelector('input');
      if (!input) return;

      const id = parseInt(input.id.replace('remove-qtd-', ''), 10);
      const quantidade = parseInt(input.value, 10);

      if (!isNaN(id) && !isNaN(quantidade) && quantidade >= 1) {
        const medicamento = medicamentosLista.find(m => m.id === id);
        if (medicamento && quantidade > medicamento.quantidadeEstoque) {
          throw new Error(`Quantidade para ${medicamento.nome} excede o estoque`);
        }

        movimentacoes.push({
          id: id,
          tipo: "SAIDA",
          quantidade: quantidade
        });
      }
    });

    if (movimentacoes.length === 0) {
      showMessage('Preencha ao menos um campo com quantidade maior ou igual a 1.', 'error');
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

    showMessage('Medicamentos removidos do estoque com sucesso!', 'success');
    fecharModalRemoverLote();
    getMedicamentos();

  } catch (error) {
    console.error('Erro ao remover medicamentos em lote:', error);
    showMessage(error.message, 'error');
    throw error;
  }
}

function fecharModalRemoverLote() {
  const modal = getElement('#modalRemoverLote');
  if (!modal) return;
  modal.classList.add('hidden');
}