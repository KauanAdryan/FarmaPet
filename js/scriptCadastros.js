  // Envio do formulário Medicamento
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

//---------------------------------------------------------------------------------------

// Envio do formulário Pet

const petForm = getElement('#petForm');
if (petForm) {
  petForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = getElement('.btn-cadastrar');
    if (!btnSubmit) return;

    // Validação dos campos obrigatórios
    const requiredFields = ['nome', 'idade', 'peso', 'especie', 'raca'];
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
        peso: getElement('#peso').value,
        especie: getElement('#especie').value,
        raca: getElement('#raca').value,
      };

      console.log('Dados do formulário:', formData);

      const response = await fetch(`${apiBaseUrl}/pets`, {
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
      petForm.reset();

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

//---------------------------------------------------------------------------------------

// Envio do formulário Cliente