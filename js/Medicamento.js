import { apiBaseUrl, getElement, toBase64, toggleButtonState } from './scriptCadastros.js';

// Preview da imagem ao escolher arquivo
const fotoInput = getElement('#foto');
const photoPreview = getElement('#photoPreview');

if (fotoInput && photoPreview) {
  fotoInput.addEventListener('change', () => {
    const file = fotoInput.files[0];
    if (!file) {
      photoPreview.innerHTML = '📷';
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
  medicamentoForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btnSubmit = getElement('.btn-cadastrar');
    if (!btnSubmit) return;

    // Validação da data
    const dataValidade = getElement('#data_validade').value.trim();
    if (!dataValidade) {
      alert('Por favor, preencha a data de validade!');
      return;
    }

    // Validação dos campos obrigatórios
    const requiredFields = [
      'nome',
      'principio_ativo',
      'dosagem',
      'especie_indicada',
      'tipo_uso',
      'medicamentoativo',
      'receita_obrigatoria'
    ];

    for (const field of requiredFields) {
      const elem = getElement(`#${field}`);
      if (!elem || !elem.value.trim()) {
        alert(`Por favor, preencha o campo ${field.replace('_', ' ')}!`);
        return;
      }
    }

    // Garantir que estoque comece em 0 (ou use valor real se permitir)
    const estoqueInput = getElement('#quantidade_estoque');
    if (estoqueInput) estoqueInput.value = 0;

    toggleButtonState(btnSubmit, true);

    try {
      const fotoFile = getElement('#foto')?.files[0];
      let fotoBase64 = null;

      if (fotoFile) {
        try {
          fotoBase64 = await toBase64(fotoFile);
        } catch (e) {
          alert('Erro ao carregar a imagem. Tente novamente.');
          return;
        }
      }

      const formData = {
        nome: getElement('#nome').value.trim(),
        principioAtivo: getElement('#principio_ativo').value.trim(),
        dosagem: getElement('#dosagem').value.trim(),
        especieIndicada: getElement('#especie_indicada').value.trim(),
        dataValidade: dataValidade,
        receitaObrigatoria: getElement('#receita_obrigatoria').value === 'true',
        pesoIndicado: parseFloat(getElement('#peso_indicado')?.value || 0),
        idadeIndicada: parseInt(getElement('#idade_indicada')?.value || 0),
        tipoUso: getElement('#tipo_uso').value.trim(),
        medicamentoativo: getElement('#medicamentoativo').value.trim(),
        foto: fotoBase64,
        quantidadeEstoque: 0
      };

      const response = await fetch(`${apiBaseUrl}/medicamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'  // <-- adicionado aqui
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      alert('Medicamento cadastrado com sucesso!');
      medicamentoForm.reset();

      if (fotoInput) fotoInput.value = '';
      if (photoPreview) photoPreview.innerHTML = '📷';

    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      toggleButtonState(btnSubmit, false);
    }
  });
}
