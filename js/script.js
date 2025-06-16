const apiBaseUrl = 'http://localhost:8080';

// Função auxiliar melhorada
function getElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element && !selector.includes('modal')) {
    console.warn(`Elemento não encontrado: ${selector}`);
  }
  return element;
}

// Variável para controle do modal
let currentModal = null;

// Inicialização principal
document.addEventListener('DOMContentLoaded', function() {
  initDropdownMenu();
  initModal();
  
  if (getElement('#medicamentoForm')) {
    initMedicamentoForm();
  }
  
  if (getElement('#gridMedicamentos')) {
    getMedicamentos();
  }
});

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

// Inicialização do modal
function initModal() {
  const modal = getElement('#medicamentoModal');
  if (!modal) return;

  currentModal = {
    element: modal,
    closeBtn: getElement('.close-modal', modal),
    open: function(medicamento) {
      showMedicamentoDetails(medicamento);
    },
    close: function() {
      this.element.style.display = 'none';
    }
  };

  currentModal.closeBtn.onclick = () => currentModal.close();
  modal.onclick = function(e) {
    if (e.target === modal) {
      currentModal.close();
    }
  };
}

// Formulário de medicamento
function initMedicamentoForm() {
  const medicamentoForm = getElement('#medicamentoForm');
  if (!medicamentoForm) return;

  const fotoInput = getElement('#foto');
  const photoPreview = getElement('#photoPreview');
  
  if (fotoInput && photoPreview) {
    fotoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width:100%;">`;
        }
        
        reader.readAsDataURL(file);
      } else {
        photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
      }
    });
  }
  
  medicamentoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btnSubmit = getElement('.btn-cadastrar');
    if (!btnSubmit) return;
    
    // Validação dos campos
    const requiredFields = ['nome', 'principio_ativo', 'dosagem', 'especie_indicada', 'tipo_uso', 'data_validade'];
    for (const field of requiredFields) {
      if (!getElement(`#${field}`).value) {
        alert(`Por favor, preencha o campo ${field.replace('_', ' ')}!`);
        return;
      }
    }
    
    const originalText = btnSubmit.innerHTML;
    
    try {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
      
      const formData = new FormData(medicamentoForm);
      formData.append('medicamentoativo', getElement('#medicamento_ativo').value === '1' ? 'Ativo' : 'Inativo');

      const response = await fetch(`${apiBaseUrl}/medicamentos`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }
      
      alert('Medicamento cadastrado com sucesso!');
      medicamentoForm.reset();
      
      if (photoPreview) photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  });
}

// Carrega medicamentos
async function getMedicamentos() {
  const grid = getElement('#gridMedicamentos');
  if (!grid) return;

  try {
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando medicamentos...</div>';
    
    const response = await fetch(`${apiBaseUrl}/medicamentos`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
 
    const medicamentos = await response.json();
    renderMedicamentos(medicamentos);
  } catch (error) {
    console.error('Erro ao carregar medicamentos:', error);
    grid.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar. Tente recarregar.</div>';
  }
}

// Renderiza os cards
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
    
    const dataFormatada = med.dataValidade ? new Date(med.dataValidade).toLocaleDateString('pt-BR') : 'N/A';
    const estaVencido = med.dataValidade && new Date(med.dataValidade) < new Date();
    const imageUrl = formatImageUrl(med.foto);

    card.innerHTML = `
      <div class="med-card-image-container">
        ${imageUrl ? `<img src="${imageUrl}" class="med-card-image">` 
         : '<div class="med-card-placeholder"><i class="fas fa-pills"></i></div>'}
        ${estaVencido ? '<span class="expired-badge">Vencido</span>' : ''}
      </div>
      <div class="med-card-info">
        <h3 class="med-card-title">${med.nome || 'Sem nome'}</h3>
        <p class="med-card-expiry ${estaVencido ? 'expired' : ''}">
          <i class="fas fa-calendar-alt"></i> ${dataFormatada}
        </p>
      </div>
    `;
    
    card.addEventListener('click', () => {
      if (currentModal) {
        currentModal.open(med);
      } else {
        showMedicamentoDetails(med);
      }
    });
    
    grid.appendChild(card);
  });
}

// Mostra detalhes no modal
function showMedicamentoDetails(med) {
  if (!currentModal) initModal();
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

  // Imagem
  const photoPreview = getElement('#modalPhotoPreview', modal);
  if (imageUrl) {
    photoPreview.innerHTML = `<img src="${imageUrl}" class="modal-image" onerror="this.onerror=null;this.replaceWith('<i class=\\'fas fa-pills\\'></i>')">`;
  } else {
    photoPreview.innerHTML = '<i class="fas fa-pills"></i>';
  }

  // Exibe o modal
  modal.style.display = 'block';
}

// Funções auxiliares
function formatImageUrl(imageData) {
  if (!imageData) return null;
  
  // Se já for uma URL completa
  if (/^https?:\/\//.test(imageData)) {
    return imageData;
  }
  
  // Se for base64 sem prefixo
  if (/^[A-Za-z0-9+/=]+$/.test(imageData)) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  
  // Se já estiver formatado
  if (/^data:image\//.test(imageData)) {
    return imageData;
  }
  
  return null;
}

function formatTipoUso(tipo) {
  const map = {
    'INTERNO': 'Uso Interno',
    'EXTERNO': 'Uso Externo'
  };
  return map[tipo] || tipo || 'N/A';
}

function formatStatus(status) {
  const map = {
    'Ativo': 'Ativo',
    'Inativo': 'Inativo'
  };
  return map[status] || status || 'N/A';
}