const apiBaseUrl = 'http://localhost:8080';

// Função auxiliar melhorada para verificar elementos
function getElement(selector, parent = document) {
  const element = parent.querySelector(selector);
  if (!element) {
    console.warn(`Elemento não encontrado: ${selector}`);
    return null;
  }
  return element;
}

// Função principal que roda quando o DOM está carregado
document.addEventListener('DOMContentLoaded', function() {
  initDropdownMenu();
  initMedicamentoForm();
  
  // Só carrega medicamentos se estiver na página correta
  if (getElement('#gridMedicamentos')) {
    getMedicamentos();
  }
});

// Configura o menu dropdown
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

// Configura o formulário de medicamento
function initMedicamentoForm() {
  const medicamentoForm = getElement('#medicamentoForm');
  if (!medicamentoForm) return;

  // Preview da foto
  const fotoInput = getElement('#foto');
  const photoPreview = getElement('#photoPreview');
  
  if (fotoInput && photoPreview) {
    fotoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview do medicamento">`;
        }
        
        reader.readAsDataURL(file);
      } else {
        photoPreview.innerHTML = '<i class="fas fa-camera"></i>';
      }
    });
  }
  
  // Envio do formulário
  medicamentoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btnSubmit = getElement('.btn-cadastrar');
    if (!btnSubmit) return;
    
    // Validação dos campos obrigatórios
    const dataValidade = getElement('#data_validade').value;
    if (!dataValidade) {
      alert('Por favor, preencha a data de validade!');
      return;
    }
    
    const requiredFields = ['nome', 'principio_ativo', 'dosagem', 'especie_indicada', 'tipo_uso'];
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
      
      // Converter FormData para objeto JSON com tratamento de campos
      const formData = {
        nome: getElement('#nome').value,
        principio_ativo: getElement('#principio_ativo').value,
        dosagem: getElement('#dosagem').value,
        especie_indicada: getElement('#especie_indicada').value,
        tipo_uso: getElement('#tipo_uso').value,
        data_validade: dataValidade,
        idade_indicada: getElement('#idade_indicada').value || null,
        peso_indicado: getElement('#peso_indicado').value || null,
        receita_obrigatoria: getElement('#receita_obrigatoria').value === '1',
        medicamento_ativo: getElement('#medicamento_ativo').value === '1',
        foto: fotoInput.files[0] ? await toBase64(fotoInput.files[0]) : null
      };
      
      console.log('Dados do formulário:', formData);
      
      const response = await fetch(`${apiBaseUrl}/medicamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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

// Função para converter arquivo para base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

// Obtém a lista de medicamentos da API
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
    grid.innerHTML = '<div class="error"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar medicamentos. Tente recarregar a página.</div>';
  }
}

// Renderiza os medicamentos na tela
function renderMedicamentos(lista) {
  const grid = getElement('#gridMedicamentos');
  if (!grid) return;

  grid.innerHTML = '';
  
  if (!lista || lista.length === 0) {
    grid.innerHTML = '<div class="no-results"><i class="fas fa-box-open"></i> Nenhum medicamento encontrado</div>';
    return;
  }
  
  lista.forEach(med => {
    const card = document.createElement('div');
    card.className = 'med-card';
    
    const dataFormatada = med.dataValidade || med.data_validade
      ? new Date(med.dataValidade || med.data_validade).toLocaleDateString('pt-BR') 
      : 'N/A';

    // Verifica se está vencido
    const hoje = new Date();
    const dataValidade = (med.dataValidade || med.data_validade) ? new Date(med.dataValidade || med.data_validade) : null;
    const estaVencido = dataValidade && dataValidade < hoje;

    card.innerHTML = `
      <div class="med-card-image-container">
        ${med.foto ? `<img src="${med.foto}" alt="${med.nome}" class="med-card-image">` : 
          '<div class="med-card-placeholder"><i class="fas fa-pills"></i></div>'}
        ${estaVencido ? '<span class="expired-badge">Vencido</span>' : ''}
      </div>
      <div class="med-card-info">
        <h3 class="med-card-title">${med.nome || 'Nome não disponível'}</h3>
        <p class="med-card-expiry ${estaVencido ? 'expired' : ''}">
          <i class="fas fa-calendar-alt"></i> ${dataFormatada}
        </p>
        <button class="edit-button" data-id="${med.id}">
          <i class="fas fa-edit"></i> Editar
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Configura os botões de edição
  document.querySelectorAll('.edit-button').forEach(button => {
    button.addEventListener('click', function() {
      const medicamentoId = this.getAttribute('data-id');
      editarMedicamento(medicamentoId);
    });
  });
}

// Função para editar medicamento
function editarMedicamento(id) {
  console.log('Editar medicamento com ID:', id);
  // Redireciona para a página de edição com o ID
  window.location.href = `editar-medicamento.html?id=${id}`;
}

// Adiciona estilos dinâmicos
const style = document.createElement('style');
style.textContent = `
  /* Container principal */
  #gridMedicamentos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Card individual */
  .med-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    border: 1px solid #e0e0e0;
  }

  .med-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }

  /* Container da imagem */
  .med-card-image-container {
    height: 200px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }

  /* Imagem do medicamento */
  .med-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .med-card:hover .med-card-image {
    transform: scale(1.05);
  }

  /* Placeholder quando não tem imagem */
  .med-card-placeholder {
    color: #999;
    font-size: 16px;
  }

  .med-card-placeholder i {
    font-size: 40px;
    color: #ddd;
  }

  /* Área de informações */
  .med-card-info {
    padding: 15px;
    text-align: center;
  }

  /* Título do medicamento */
  .med-card-title {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }

  /* Data de validade */
  .med-card-expiry {
    margin: 10px 0;
    color: #666;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .med-card-expiry.expired {
    color: #e74c3c;
    font-weight: bold;
  }

  /* Botão de editar */
  .edit-button {
    background-color: #6df0b1;
    color: #2c3e50;
    border: none;
    border-radius: 5px;
    padding: 8px 15px;
    margin-top: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .edit-button:hover {
    background-color: #5ad89c;
    transform: translateY(-2px);
  }

  /* Badge de vencido */
  .expired-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: #e74c3c;
    color: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }

  /* Mensagens de estado */
  .loading, .error, .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .loading i, .error i, .no-results i {
    font-size: 24px;
    margin-bottom: 10px;
    display: block;
  }

  .loading i {
    color: #6df0b1;
    animation: spin 1s linear infinite;
  }

  .error i {
    color: #e74c3c;
  }

  .no-results i {
    color: #999;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsividade */
  @media (max-width: 768px) {
    #gridMedicamentos {
      grid-template-columns: 1fr;
      padding: 15px;
    }
  }
`;
document.head.appendChild(style);