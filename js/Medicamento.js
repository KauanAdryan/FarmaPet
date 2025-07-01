import { apiBaseUrl, getElement, toBase64, toggleButtonState } from './scriptCadastros.js';

// ==============================================
// Configuração inicial
// ==============================================

// Mapeamento de campos do formulário
const campos = {
  nome: getElement('#nome'),
  principio_ativo: getElement('#principio_ativo'),
  dosagem: getElement('#dosagem'),
  especie_indicada: getElement('#especie_indicada'),
  tipo_uso: getElement('#tipo_uso'),
  medicamentoativo: getElement('#medicamentoativo'),
  receita_obrigatoria: getElement('#receita_obrigatoria'),
  data_validade: getElement('#data_validade'),
  peso_indicado: getElement('#peso_indicado'),
  idade_indicada: getElement('#idade_indicada'),
  foto: getElement('#foto')
};

// Mapeamento de elementos de erro
const erros = {
  nome: getElement('#nome-error'),
  principio_ativo: getElement('#principio_ativo-error'),
  dosagem: getElement('#dosagem-error'),
  especie_indicada: getElement('#especie_indicada-error'),
  tipo_uso: getElement('#tipo_uso-error'),
  medicamentoativo: getElement('#medicamentoativo-error'),
  receita_obrigatoria: getElement('#receita_obrigatoria-error'),
  data_validade: getElement('#data_validade-error'),
  peso_indicado: getElement('#peso_indicado-error'),
  idade_indicada: getElement('#idade_indicada-error')
};

// Referência ao formulário
const medicamentoForm = getElement('#medicamentoForm');

// ==============================================
// Funções de Validação
// ==============================================

/**
 * Limpa todos os erros de validação
 */
function limparErros() {
  Object.values(erros).forEach(div => {
    if (div) {
      div.textContent = '';
      div.style.display = 'none';
    }
  });
  
  Object.values(campos).forEach(input => {
    if (input) input.classList.remove('is-invalid');
  });
}

/**
 * Exibe mensagem de erro para um campo específico
 * @param {string} campo - Nome do campo
 * @param {string} mensagem - Mensagem de erro
 */
function mostrarErro(campo, mensagem) {
  if (erros[campo]) {
    erros[campo].textContent = mensagem;
    erros[campo].style.display = 'block';
  }
  if (campos[campo]) {
    campos[campo].classList.add('is-invalid');
  }
}

/**
 * Valida todos os campos do formulário
 * @returns {boolean} True se todos os campos são válidos
 */
function validarCampos() {
  limparErros();
  let valido = true;

  // Validação do campo Nome
  if (!campos.nome.value.trim()) {
    mostrarErro('nome', 'Por favor, preencha o nome do medicamento!');
    valido = false;
  }

  // Validação do campo Princípio Ativo
  if (!campos.principio_ativo.value.trim()) {
    mostrarErro('principio_ativo', 'Por favor, preencha o princípio ativo!');
    valido = false;
  }

  // Validação do campo Dosagem
  if (!campos.dosagem.value.trim()) {
    mostrarErro('dosagem', 'Por favor, preencha a dosagem!');
    valido = false;
  } else {
    const valorDosagem = parseFloat(campos.dosagem.value.replace(',', '.'));
    if (!isNaN(valorDosagem) && valorDosagem < 0) {
      mostrarErro('dosagem', 'Dosagem não pode ser negativa!');
      valido = false;
    }
  }

  // Validação do campo Espécie Indicada
  if (!campos.especie_indicada.value.trim()) {
    mostrarErro('especie_indicada', 'Por favor, preencha a espécie indicada!');
    valido = false;
  }

  // Validação do campo Tipo de Uso
  if (!campos.tipo_uso.value.trim()) {
    mostrarErro('tipo_uso', 'Por favor, selecione o tipo de uso!');
    valido = false;
  }

  // Validação do campo Medicamento Ativo
  if (!campos.medicamentoativo.value.trim()) {
    mostrarErro('medicamentoativo', 'Por favor, selecione se o produto está ativo!');
    valido = false;
  }

  // Validação do campo Receita Obrigatória
  if (!campos.receita_obrigatoria.value.trim()) {
    mostrarErro('receita_obrigatoria', 'Por favor, selecione se a receita é obrigatória!');
    valido = false;
  }

  // Validação do campo Data de Validade
  if (!campos.data_validade.value) {
    mostrarErro('data_validade', 'Por favor, preencha a data de validade!');
    valido = false;
  } else {
    const hoje = new Date();
    const validade = new Date(campos.data_validade.value);
    hoje.setHours(0, 0, 0, 0);
    if (validade < hoje) {
      mostrarErro('data_validade', 'A data de validade não pode ser no passado!');
      valido = false;
    }
  }

  // Validação do campo Peso Indicado
  if (campos.peso_indicado.value) {
    const peso = parseFloat(campos.peso_indicado.value);
    if (isNaN(peso) || peso < 0) {
      mostrarErro('peso_indicado', 'Peso indicado deve ser um número maior ou igual a 0!');
      valido = false;
    }
  }

  // Validação do campo Idade Indicada
  if (campos.idade_indicada.value) {
    const idade = parseInt(campos.idade_indicada.value);
    if (isNaN(idade) || idade < 0) {
      mostrarErro('idade_indicada', 'Idade indicada deve ser um número inteiro maior ou igual a 0!');
      valido = false;
    }
  }

  return valido;
}

// ==============================================
// Manipulação de Imagem
// ==============================================

/**
 * Atualiza o preview da imagem selecionada
 */
function setupImagePreview() {
  const photoPreview = getElement('#photoPreview');
  if (!campos.foto || !photoPreview) return;

  campos.foto.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
      photoPreview.innerHTML = '📷';
      return;
    }

    // Verifica se é uma imagem
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido!');
      campos.foto.value = '';
      photoPreview.innerHTML = '📷';
      return;
    }

    // Verifica tamanho máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB!');
      campos.foto.value = '';
      photoPreview.innerHTML = '📷';
      return;
    }

    try {
      const base64 = await toBase64(file);
      photoPreview.innerHTML = `<img src="${base64}" class="img-thumbnail" style="max-height: 200px;">`;
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      campos.foto.value = '';
      photoPreview.innerHTML = '📷';
      alert('Erro ao carregar a imagem. Tente novamente.');
    }
  });
}

// ==============================================
// Submissão do Formulário
// ==============================================

/**
 * Envia os dados do medicamento para a API
 * @param {Object} formData - Dados do formulário
 * @returns {Promise<Object>} Resposta da API
 */
async function cadastrarMedicamento(formData) {
  const response = await fetch(`${apiBaseUrl}/medicamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  return await response.json();
}

/**
 * Configura o evento de submit do formulário
 */
function setupFormSubmit() {
  if (!medicamentoForm) return;

  medicamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida todos os campos antes de enviar
    if (!validarCampos()) return;

    const btnSubmit = getElement('.btn-cadastrar');
    toggleButtonState(btnSubmit, true);

    try {
      // Converte a imagem para base64 se existir
      let fotoBase64 = null;
      if (campos.foto?.files[0]) {
        try {
          fotoBase64 = await toBase64(campos.foto.files[0]);
        } catch (error) {
          console.error('Erro ao converter imagem:', error);
          alert('Erro ao processar a imagem. Tente novamente.');
          toggleButtonState(btnSubmit, false);
          return;
        }
      }

      // Prepara os dados para envio
      const formData = {
        nome: campos.nome.value.trim(),
        principioAtivo: campos.principio_ativo.value.trim(),
        dosagem: campos.dosagem.value.trim(),
        especieIndicada: campos.especie_indicada.value.trim(),
        dataValidade: campos.data_validade.value,
        receitaObrigatoria: campos.receita_obrigatoria.value === 'true',
        pesoIndicado: campos.peso_indicado.value ? parseFloat(campos.peso_indicado.value) : null,
        idadeIndicada: campos.idade_indicada.value ? parseInt(campos.idade_indicada.value) : null,
        tipoUso: campos.tipo_uso.value,
        medicamentoativo: campos.medicamentoativo.value,
        foto: fotoBase64,
        quantidadeEstoque: 0 // Valor padrão para novo medicamento
      };

      // Envia para a API
      await cadastrarMedicamento(formData);

      // Feedback de sucesso e limpeza do formulário
      alert('Medicamento cadastrado com sucesso!');
      medicamentoForm.reset();
      getElement('#photoPreview').innerHTML = '📷';

    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      toggleButtonState(btnSubmit, false);
    }
  });
}

// ==============================================
// Inicialização
// ==============================================

// Configura tudo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  setupImagePreview();
  setupFormSubmit();
});