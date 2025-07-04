const apiBaseUrl = 'http://localhost:8080';

// Verificação de autenticação
function checkUserLoggedIn() {
  const isLoggedIn = localStorage.getItem('userLoggedIn');
  const currentPath = window.location.pathname;
  const currentHref = window.location.href;

  if (!isLoggedIn && 
      !currentPath.includes('login.html') && 
      !currentHref.includes('login.html')) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function getLoggedInUsername() {
  return localStorage.getItem('username');
}

async function performLogout() {
  try {
    const response = await fetch(`${apiBaseUrl}/logout`, {
      method: 'POST',
      credentials: 'include'
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

// Funções auxiliares
function getElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element && !selector.includes('modal')) {
    console.warn(`Elemento não encontrado: ${selector}`);
  }
  return element;
}

function escapeHTML(str) {
  return str ? str.replace(/"/g, '&quot;') : '';
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${apiBaseUrl}${url}`;
}

function formatStatus(status) {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatTipoUso(tipo) {
  if (!tipo) return 'N/A';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
}

function showLoading(show, mensagem = 'Carregando...') {
  const loadingOverlay = getElement('#loadingOverlay');
  if (!loadingOverlay) return;

  if (show) {
    loadingOverlay.innerHTML = `<div class="spinner-border text-primary" role="status"></div><p>${mensagem}</p>`;
    loadingOverlay.style.display = 'flex';
  } else {
    loadingOverlay.style.display = 'none';
  }
}

function showMessage(text, tipo = 'info') {
  const mensagemEl = getElement('#mensagemSistema');
  if (!mensagemEl) {
    alert(text);
    return;
  }

  mensagemEl.className = 'alert';
  mensagemEl.classList.add(tipo === 'success' ? 'alert-success' : 
                          tipo === 'error' ? 'alert-danger' : 'alert-info');
  mensagemEl.innerHTML = text;
  mensagemEl.style.display = 'block';

  setTimeout(() => {
    mensagemEl.style.display = 'none';
  }, 4000);
}

// Variáveis globais
let medicamentosLista = [];

// Funções principais
function setupEventListeners() {
  // Filtros e busca
  const searchInput = getElement('#searchInput');
  const searchButton = getElement('#searchButton');
  const statusFilter = getElement('#statusFilter');
  const clearFilters = getElement('#clearFilters');
  const estoqueFilter = getElement('#estoqueFilter');

  if (estoqueFilter) estoqueFilter.addEventListener('change', handleFilterChange);
  if (searchInput) searchInput.addEventListener('input', handleFilterChange);
  if (searchButton) searchButton.addEventListener('click', handleFilterChange);
  if (statusFilter) statusFilter.addEventListener('change', handleFilterChange);
  if (clearFilters) clearFilters.addEventListener('click', resetFilters);

  // Formulário de edição
  const editForm = getElement('#editarMedicamentoForm');
  if (editForm) {
    editForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleEditSubmit(e).catch(console.error);
    });
  }

  // Eventos para modal de lote
  const loteButton = getElement('#btnAdicionarLote');
  if (loteButton) loteButton.addEventListener('click', abrirModalLote);

  const salvarLoteButton = getElement('#btnSalvarLote');
  if (salvarLoteButton) {
    salvarLoteButton.addEventListener('click', () => salvarMedicamentoLote().catch(console.error));
  }

  const pesquisaInput = getElement('#pesquisaMedicamento');
  if (pesquisaInput) pesquisaInput.addEventListener('input', filtrarMedicamentos);

  const removerLoteButton = getElement('#btnRemoverLote');
  if (removerLoteButton) removerLoteButton.addEventListener('click', abrirModalRemoverLote);

  const btnRemoverLote = getElement('#btnRemoverLote1');
  if (btnRemoverLote) {
    btnRemoverLote.addEventListener('click', () => removerMedicamentoLote().catch(console.error));
  }

  // Botão de relatório
  const gerarRelatorioBtn = getElement('#btnGerarRelatorio');
  if (gerarRelatorioBtn) {
    gerarRelatorioBtn.addEventListener('click', gerarRelatorioMedicamentos);
  }
}

async function getMedicamentos() {
  const grid = getElement('#gridMedicamentos');
  if (!grid) return;

  try {
    grid.innerHTML = '<div class="col-12 text-center py-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Carregando medicamentos...</p></div>';

    const response = await fetch(`${apiBaseUrl}/medicamentos`, {
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    medicamentosLista = await response.json();
    renderMedicamentos(medicamentosLista);
  } catch (error) {
    console.error('Erro ao carregar medicamentos:', error);
    grid.innerHTML = '<div class="col-12 text-center py-5 text-danger"><i class="fas fa-exclamation-triangle fa-2x"></i><p>Erro ao carregar. Tente recarregar.</p></div>';
  }
}

function renderMedicamentos(lista) {
  const grid = getElement('#gridMedicamentos');
  if (!grid) return;

  grid.innerHTML = '';

  if (!lista || lista.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="fas fa-box-open fa-2x mb-2"></i>
        <p class="mb-0">Nenhum medicamento encontrado</p>
      </div>`;
    return;
  }

  lista.forEach(med => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4 col-lg-3 mb-4';

    const card = document.createElement('div');
    card.className = 'med-card shadow-sm rounded border h-100 position-relative overflow-hidden';
    card.dataset.id = med.id;

    const dataValidade = med.dataValidade || med.data_validade;
    const dataFormatada = dataValidade ? new Date(dataValidade).toLocaleDateString('pt-BR') : 'N/A';
    const estaVencido = dataValidade && new Date(dataValidade) < new Date();
    const imageUrl = formatImageUrl(med.foto);
    const nomeSeguro = escapeHTML(med.nome || 'Sem nome');

    const badgeVencido = estaVencido ? `<span class="badge bg-danger position-absolute top-0 end-0 m-2">Vencido</span>` : '';
    const badgeInativo = med.medicamentoativo === 'Inativo' ? `<span class="badge bg-secondary position-absolute top-0 start-0 m-2">Inativo</span>` : '';

    const imagemHTML = imageUrl ? `
      <img src="${imageUrl}" class="w-100 object-fit-cover border-bottom"
           alt="${nomeSeguro}" style="height: 180px;"
           onerror="this.onerror=null;this.remove();this.parentElement.innerHTML='<div class=&quot;med-card-placeholder text-center text-muted py-5&quot;><i class=&quot;fas fa-pills fa-2x&quot;></i></div>'">` : 
      `<div class="med-card-placeholder text-center text-muted py-5"><i class="fas fa-pills fa-2x"></i></div>`;

    card.innerHTML = `
      <div class="position-relative">
        ${imagemHTML}
        ${badgeVencido}
        ${badgeInativo}
      </div>
      <div class="p-3">
        <h6 class="fw-semibold mb-1 text-truncate" title="${nomeSeguro}">${nomeSeguro}</h6>
        <p class="mb-3 text-muted small">
          <i class="fas fa-calendar-alt me-1"></i> ${dataFormatada}
        </p>
        <div class="d-flex gap-2">
          <button class="edit-btn btn btn-sm btn-outline-primary w-50" 
                  data-id="${med.id}" 
                  aria-label="Editar medicamento ${nomeSeguro}" 
                  title="Editar medicamento">
            <i class="fas fa-edit me-1"></i> Editar
          </button>
          <button class="ver-mais-btn btn btn-sm btn-outline-secondary w-50" 
                  data-id="${med.id}" 
                  aria-label="Ver mais sobre ${nomeSeguro}" 
                  title="Ver detalhes do medicamento">
            <i class="fas fa-info-circle me-1"></i> Ver Mais
          </button>
        </div>
      </div>
    `;

    // Eventos dos cards
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.edit-btn') && !e.target.closest('.ver-mais-btn')) {
        const modal = new bootstrap.Modal(getElement('#medicamentoModal'));
        showMedicamentoDetails(med);
        modal.show();
      }
    });

    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modal = new bootstrap.Modal(getElement('#editarMedicamentoModal'));
        openEditModal(med);
        modal.show();
      });
    }

    const verMaisBtn = card.querySelector('.ver-mais-btn');
    if (verMaisBtn) {
      verMaisBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modal = new bootstrap.Modal(getElement('#medicamentoModal'));
        showMedicamentoDetails(med);
        modal.show();
      });
    }

    col.appendChild(card);
    grid.appendChild(col);
  });
}

function handleFilterChange() {
  const searchInput = getElement('#searchInput');
  const statusFilter = getElement('#statusFilter');
  const estoqueFilter = getElement('#estoqueFilter');

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const statusValue = statusFilter ? statusFilter.value : 'all';
  const estoqueValue = estoqueFilter ? estoqueFilter.value : 'all';

  const filtered = medicamentosLista.filter(med => {
    // Filtra por busca de texto
    const matchesSearch =
      (med.nome && med.nome.toLowerCase().includes(searchTerm)) ||
      (med.principioAtivo && med.principioAtivo.toLowerCase().includes(searchTerm)) ||
      (med.especieIndicada && med.especieIndicada.toLowerCase().includes(searchTerm));

    // Filtra por status ativo/inativo
    const matchesStatus = statusValue === 'all' || med.medicamentoativo === statusValue;

    // Filtra por estoque: 
    // 'com' = quantidadeEstoque > 0
    // 'sem' = quantidadeEstoque === 0 ou undefined/null
    let matchesEstoque = true;
    if (estoqueValue === 'com') {
      matchesEstoque = med.quantidadeEstoque > 0;
    } else if (estoqueValue === 'sem') {
      matchesEstoque = !med.quantidadeEstoque || med.quantidadeEstoque === 0;
    }

    return matchesSearch && matchesStatus && matchesEstoque;
  });

  renderMedicamentos(filtered);
}



function resetFilters() {
  const searchInput = getElement('#searchInput');
  const statusFilter = getElement('#statusFilter');
  const estoqueFilter = getElement('#estoqueFilter'); // novo

  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = 'all';
  if (estoqueFilter) estoqueFilter.value = 'all'; // limpa estoque também

  handleFilterChange();
}


function showMedicamentoDetails(med) {
  const modal = getElement('#medicamentoModal');
  if (!modal) return;

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
    photoPreview.innerHTML = imageUrl ? 
      `<img src="${imageUrl}" class="modal-image" alt="${med.nome}" onerror="this.onerror=null;this.replaceWith('<i class=\\'fas fa-pills\\'></i>')">` : 
      '<i class="fas fa-pills"></i>';
  }
}

function openEditModal(medicamento) {
  const modal = getElement('#editarMedicamentoModal');
  if (!modal) {
    console.error('Modal de edição não encontrado');
    return;
  }

  // Preencher o formulário
  const setValue = (selector, value) => {
    const el = getElement(selector);
    if (el) el.value = value || '';
  };

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
    photoPreview.innerHTML = imageUrl ? 
      `<img src="${imageUrl}" class="preview-image" onerror="this.onerror=null;this.replaceWith('<i class=\\'fas fa-pills\\'></i>')">` : 
      '<i class="fas fa-pills"></i>';
  }

  // Resetar input de arquivo
  const fileInput = getElement('#editarFoto');
  if (fileInput) fileInput.value = '';
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const form = e.target;
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Validação avançada
  const validationErrors = [];
  const requiredFields = [
    { field: 'nome', name: 'Nome' },
    { field: 'principioAtivo', name: 'Princípio Ativo' },
    { field: 'dosagem', name: 'Dosagem' },
    { field: 'especieIndicada', name: 'Espécie Indicada' },
    { field: 'dataValidade', name: 'Data de Validade' },
    { field: 'quantidadeEstoque', name: 'Quantidade em Estoque' }
  ];

  requiredFields.forEach(({ field, name }) => {
    if (!form[field]?.value?.trim()) validationErrors.push(`${name} é obrigatório`);
  });

  if (form.dataValidade.value) {
    const data = new Date(form.dataValidade.value);
    if (isNaN(data.getTime())) {
      validationErrors.push('Data de Validade inválida');
    } else if (data < new Date()) {
      validationErrors.push('Data de Validade deve ser no futuro');
    }
  }

  if (form.idadeIndicada.value && isNaN(parseInt(form.idadeIndicada.value))) {
    validationErrors.push('Idade Indicada deve ser um número inteiro');
  }

  if (form.pesoIndicado.value && isNaN(parseFloat(form.pesoIndicado.value))) {
    validationErrors.push('Peso Indicada deve ser um número');
  }

  if (form.quantidadeEstoque.value && isNaN(parseInt(form.quantidadeEstoque.value))) {
    validationErrors.push('Quantidade em Estoque deve ser um número inteiro');
  }

  if (!['true', 'false'].includes(form.receitaObrigatoria.value)) {
    validationErrors.push('Receita Obrigatória inválida');
  }

  if (validationErrors.length > 0) {
    showMessage(validationErrors.join('<br>'), 'error');
    return;
  }

  // Construir objeto para envio
  const medicamentoData = {
    id: parseInt(form.editarId.value),
    nome: form.editarNome.value.trim(),
    principioAtivo: form.editarPrincipioAtivo.value.trim(),
    dosagem: form.editarDosagem.value.trim(),
    especieIndicada: form.editarEspecie.value.trim(),
    dataValidade: form.editarValidade.value,
    receitaObrigatoria: form.editarReceita.value === 'true',
    pesoIndicado: form.editarPeso.value ? parseFloat(form.editarPeso.value) : null,
    idadeIndicada: form.editarIdade.value ? parseInt(form.editarIdade.value) : null,
    medicamentoativo: form.editarStatus.value,
    tipoUso: form.editarTipoUso.value,
    quantidadeEstoque: parseInt(form.editarQuantidadeEstoque.value)
  };

  showLoading(true, 'Salvando dados...');

  try {
    const response = await fetch(`${apiBaseUrl}/medicamentos/${medicamentoData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(medicamentoData),
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.errors ? Object.values(errorData.errors).flat().join('<br>') : 
                     errorData.message || errorMessage;
      } catch (e) {
        console.error('Erro ao parsear resposta:', e);
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();

    // Upload da foto se houver arquivo selecionado
    const fileInput = getElement('#editarFoto');
    if (fileInput?.files?.length > 0) {
      await uploadFoto(medicamentoData.id, fileInput.files[0]);
    }

    // Atualiza a lista local
    const index = medicamentosLista.findIndex(m => m.id == medicamentoData.id);
    if (index !== -1) {
      medicamentosLista[index] = responseData;
      renderMedicamentos(medicamentosLista);
    }

    // Fecha modal e mostra mensagem
    const modal = bootstrap.Modal.getInstance(getElement('#editarMedicamentoModal'));
    modal.hide();
    showMessage('Medicamento atualizado com sucesso!', 'success');

  } catch (error) {
    console.error('Erro ao atualizar medicamento:', error);
    showMessage(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function uploadFoto(medicamentoId, file) {
  try {
    if (!file) throw new Error('Nenhum arquivo selecionado');
    if (file.size > 10 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 10MB');

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) throw new Error('Apenas imagens JPEG, PNG ou GIF são permitidas');

    const formData = new FormData();
    formData.append('foto', file);

    showLoading(true, 'Enviando foto...');

    const response = await fetch(`${apiBaseUrl}/medicamentos/${medicamentoId}/foto`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
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

// Funções para gestão de lotes
function abrirModalLote() {
  const modal = new bootstrap.Modal(getElement('#modalLote'));
  if (!modal) return;

  // Limpa pesquisa e lista
  const pesquisa = getElement('#pesquisaMedicamento');
  if (pesquisa) pesquisa.value = '';

  const lista = getElement('#listaMedicamentosLote');
  if (lista) lista.innerHTML = '';

  // Adiciona todos os medicamentos
  medicamentosLista.forEach(med => {
    const item = criarItemMedicamentoLote(med, 'qtd-');
    lista.appendChild(item);
  });

  modal.show();
}

function criarItemMedicamentoLote(med, prefixoId) {
  const item = document.createElement('div');
  item.className = 'item-medicamento d-flex align-items-center justify-content-between mb-2';
  item.style.gap = '10px';

  const nomeSpan = document.createElement('span');
  nomeSpan.textContent = med.nome;
  nomeSpan.className = 'flex-grow-1 text-truncate';
  nomeSpan.title = med.nome;

  const input = document.createElement('input');
  input.type = 'number';
  input.min = 0;
  input.value = 0;
  input.id = `${prefixoId}${med.id}`;
  input.className = 'form-control form-control-sm w-25';

  item.appendChild(nomeSpan);
  item.appendChild(input);

  return item;
}

function filtrarMedicamentos() {
  const filtro = getElement('#pesquisaMedicamento').value.toLowerCase();
  const lista = getElement('#listaMedicamentosLote');
  if (!lista) return;

  Array.from(lista.children).forEach(item => {
    const nome = item.querySelector('span')?.textContent.toLowerCase();
    item.style.display = nome && nome.includes(filtro) ? 'flex' : 'none';
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
        movimentacoes.push({ id, tipo: "ENTRADA", quantidade });
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
      body: JSON.stringify(movimentacoes),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Erro ao atualizar estoque em lote.');
    }

    showMessage('Movimentação realizada com sucesso!', 'success');
    bootstrap.Modal.getInstance(getElement('#modalLote')).hide();
    getMedicamentos();

  } catch (error) {
    console.error('Erro ao salvar estoque em lote:', error);
    showMessage('Erro ao salvar estoque em lote: ' + error.message, 'error');
  }
}

function abrirModalRemoverLote() {
  const modal = new bootstrap.Modal(getElement('#modalRemoverLote'));
  if (!modal) return;

  // Limpa pesquisa e lista
  const pesquisa = getElement('#pesquisaMedicamentoRemover');
  if (pesquisa) pesquisa.value = '';

  const lista = getElement('#listaMedicamentosRemoverLote');
  if (lista) lista.innerHTML = '';

  medicamentosLista.forEach(med => {
    const item = criarItemMedicamentoLote(med, 'remove-qtd-');
    lista.appendChild(item);
  });

  modal.show();
}

async function removerMedicamentoLote() {
  try {
    const listaContainer = getElement('#listaMedicamentosRemoverLote');
    const itens = listaContainer.querySelectorAll('.item-medicamento');
    const movimentacoes = [];

    itens.forEach(item => {
      const input = item.querySelector('input');
      const id = parseInt(input.id.replace('remove-qtd-', ''), 10);
      const quantidade = parseInt(input.value, 10);
      if (!isNaN(id) && !isNaN(quantidade) && quantidade >= 1) {
        movimentacoes.push({ id, tipo: "SAIDA", quantidade });
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
      body: JSON.stringify(movimentacoes),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Erro ao atualizar estoque em lote.');
    }

    showMessage('Medicamentos removidos do estoque com sucesso!', 'success');
    bootstrap.Modal.getInstance(getElement('#modalRemoverLote')).hide();
    getMedicamentos();

  } catch (error) {
    console.error('Erro ao remover medicamentos em lote:', error);
    showMessage(error.message, 'error');
  }
}

async function gerarRelatorioMedicamentos() {
  try {
    const gerarRelatorioBtn = getElement('#btnGerarRelatorio');
    if (!gerarRelatorioBtn) return;

    const originalText = gerarRelatorioBtn.innerHTML;
    gerarRelatorioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando relatório...';
    gerarRelatorioBtn.disabled = true;

    const response = await fetch(`${apiBaseUrl}/medicamentos/relatorio-pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar relatório: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_medicamentos.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showMessage('Relatório gerado com sucesso!', 'success');

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    showMessage('Erro ao gerar relatório: ' + error.message, 'error');
  } finally {
    const gerarRelatorioBtn = getElement('#btnGerarRelatorio');
    if (gerarRelatorioBtn) {
      gerarRelatorioBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Gerar Relatório';
      gerarRelatorioBtn.disabled = false;
    }
  }
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', function () {
  // Verifica autenticação primeiro
  checkUserLoggedIn();

  // Configura o logout se o botão existir
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      performLogout();
    });
  }

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