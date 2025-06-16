const apiBaseUrl = 'http://localhost:8080';


// Função helper para pegar elemento
function getElement(selector) {
  return document.querySelector(selector);
}

// Função para converter arquivo para base64 (para enviar a imagem no JSON)
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Preview da imagem ao escolher arquivo
const fotoInput = getElement('#foto');
const photoPreview = getElement('#photoPreview');
if (fotoInput && photoPreview) {
  fotoInput.addEventListener('change', () => {
    const file = fotoInput.files[0];
    if (!file) {
      photoPreview.textContent = '📷';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      photoPreview.innerHTML = `<img src="${reader.result}" alt="Foto do medicamento" style="max-width: 150px; max-height: 150px; border-radius: 6px;">`;
    };
    reader.readAsDataURL(file);
  });
}

// Envio do formulário Medicamento
const medicamentoForm = getElement('#medicamentoForm');
if (medicamentoForm) {
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

    const requiredFields = ['nome', 'principio_ativo', 'dosagem', 'especie_indicada', 'tipo_uso', 'medicamentoativo', 'receita_obrigatoria'];
    for (const field of requiredFields) {
      const elem = getElement(`#${field}`);
      if (!elem || !elem.value) {
        alert(`Por favor, preencha o campo ${field.replace('_', ' ')}!`);
        return;
      }
    }

    // Garantir que estoque começa em 0
    const estoqueInput = getElement('#quantidade_estoque');
    if (estoqueInput) estoqueInput.value = 0;

    const originalText = btnSubmit.innerHTML;

    try {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

      // Construir o objeto para envio
      const formData = {
        nome: getElement('#nome').value,
        principioAtivo: getElement('#principio_ativo').value,
        dosagem: getElement('#dosagem').value,
        especieIndicada: getElement('#especie_indicada').value,
        tipoUso: getElement('#tipo_uso').value,
        dataValidade: getElement('#data_validade').value,
        idadeIndicada: getElement('#idade_indicada').value ? Number(getElement('#idade_indicada').value) : null,
        pesoIndicado: getElement('#peso_indicado').value ? parseFloat(getElement('#peso_indicado').value) : null,
        receitaObrigatoria: getElement('#receita_obrigatoria').value === 'true',
        medicamentoativo: getElement('#medicamentoativo').value,
        quantidadeEstoque: 0,  // sempre começa zero
        foto: fotoInput.files[0] ? await toBase64(fotoInput.files[0]) : null
      };

      console.log('Dados do formulário:', formData);

      const apiBaseUrl = 'http://localhost:8080'; 

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
      if (photoPreview) photoPreview.textContent = '📷';

      // Reiniciar estoque em zero depois do reset
      if (estoqueInput) estoqueInput.value = 0;

    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  });
}