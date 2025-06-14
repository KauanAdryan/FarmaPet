const apiBaseUrl = 'http://localhost:8080';

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

//--------------------------------------------------------------------------------

// Configura o formulário de pets

function initAnimalForm() {
  const animalForm = getElement('#animalForm');
  if (!animalForm) return;

  // Envio do formulário
  animalForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btnSubmit = getElement('.btn-cadastrar');
    if (!btnSubmit) return;
    
    const requiredFields = ['nome', 'idade', 'especie', 'peso', 'raca', 'dono'];
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
        idade: getElement('#idade').value,
        especie: getElement('#especie').value,
        peso: getElement('#peso').value,
        raca: getElement('#raca').value,
        dono: getElement('#dono').value,
      };
      
      console.log('Dados do formulário:', formData);

      const response = await fetch(`${apiBaseUrl}/animal`, {
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

      alert('Pet cadastrado com sucesso!');
      animalForm.reset();

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

//--------------------------------------------------------------------------------

// Configura o formulário de clientes

function initClienteForm() {
  const clienteForm = getElement('#clienteForm');
  if (!clienteForm) return;

  // Envio do formulário
  clienteForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = getElement('.btn-cadastrar');
    if (!btnSubmit) return;

    const requiredFields = ['nome', 'cpf', 'telefone', 'email'];
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
        cpf: getElement('#cpf').value,
        telefone: getElement('#telefone').value,
        email: getElement('#email').value,
      };

      console.log('Dados do formulário:', formData);

      const response = await fetch(`${apiBaseUrl}/clientes`, {
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

      alert('Cliente cadastrado com sucesso!');
      clienteForm.reset();

    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  });
}
