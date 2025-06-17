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
        dataValidade: getElement('#data_validade').value, // deve ser YYYY-MM-DD
        receitaObrigatoria: getElement('#receita_obrigatoria').value === 'true',
        pesoIndicado: getElement('#peso_indicado').value ? parseFloat(getElement('#peso_indicado').value) : 0,
        idadeIndicada: getElement('#idade_indicada').value ? parseInt(getElement('#idade_indicada').value) : 0,
        tipoUso: getElement('#tipo_uso').value, // deve ser "INTERNO" ou "EXTERNO"
        medicamentoativo: getElement('#medicamentoativo').value, // deve ser "Ativo" ou "Inativo"
        foto: await toBase64(getElement('#foto').files[0]), // obrigatório - adicione validação
        quantidadeEstoque: 0 // campo obrigatório
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

// Função para carregar clientes
async function carregarClientes() {
  try {
    const response = await fetch(`${apiBaseUrl}/cliente`);
    if (!response.ok) {
      throw new Error('Erro ao carregar clientes');
    }
    const clientes = await response.json();
    const selectDono = document.getElementById('dono');
    
    // Limpa opções existentes (exceto a primeira)
    while (selectDono.options.length > 1) {
      selectDono.remove(1);
    }
    
    // Adiciona cada cliente como opção
    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = `${cliente.nome} (CPF: ${formatarCPF(cliente.cpf)})`;
      selectDono.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
    alert('Não foi possível carregar a lista de clientes');
  }
}

// Função auxiliar para formatar CPF
function formatarCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Carrega clientes quando a página é aberta
document.addEventListener('DOMContentLoaded', carregarClientes);

// Cadastro de Pet - Versão com seleção de dono
const petForm = document.querySelector('#CadastroPet .form-cadastro');
if (petForm) {
  petForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = petForm.querySelector('.btn-cadastrar');
    if (!btnSubmit) return;

    // Validação dos campos
    const requiredFields = ['nome', 'especie', 'raca', 'idade', 'peso', 'dono'];
    for (const field of requiredFields) {
      const elem = document.getElementById(field);
      if (!elem || !elem.value.trim()) {
        alert(`Por favor, preencha o campo ${field.replace('_', ' ')}!`);
        return;
      }
    }

    const originalText = btnSubmit.innerHTML;

    try {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

      // Objeto para envio
      const petData = {
        nome: document.getElementById('nome').value.trim(),
        especie: document.getElementById('especie').value.trim(),
        raca: document.getElementById('raca').value.trim(),
        idade: parseInt(document.getElementById('idade').value),
        peso: parseFloat(document.getElementById('peso').value),
        clienteId: parseInt(document.getElementById('dono').value)
      };

      console.log('Dados do pet:', petData);

      const response = await fetch(`${apiBaseUrl}/animal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(petData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Pet cadastrado com sucesso!');
        petForm.reset();
        // Mantém a seleção de dono após reset
        document.getElementById('dono').value = '';
      } else {
        throw new Error(result.message || 'Erro desconhecido ao cadastrar');
      }

    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro ao cadastrar pet: ${error.message || 'Erro desconhecido'}`);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  });
}

//======================================================================================================================

// Máscaras para os campos
document.getElementById('cpf').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
  if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
  if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
  e.target.value = value.substring(0, 14);
});

document.getElementById('telefone').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 2) value = value.replace(/^(\d{2})/, '($1) ');
  if (value.length > 10) value = value.replace(/^(\(\d{2}\)\s\d{5})/, '$1-');
  e.target.value = value.substring(0, 15);
});

document.getElementById('cep').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 5) value = value.replace(/^(\d{5})/, '$1-');
  e.target.value = value.substring(0, 9);
});

// Busca de CEP (opcional)
document.getElementById('buscarCep').addEventListener('click', async function() {
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    alert('CEP inválido! Deve conter 8 dígitos.');
    return;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    // Preenche automaticamente os campos
    document.getElementById('uf').value = data.uf || '';
    document.getElementById('cidade').value = data.localidade || '';
    document.getElementById('bairro').value = data.bairro || '';
    document.getElementById('rua').value = data.logradouro || '';
    document.getElementById('numero').focus();
    
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    alert(`Erro: ${error.message}`);
  }
});

// Cadastro de Cliente
document.getElementById('clienteForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validação básica
  const requiredFields = ['nome', 'cpf', 'dataNasc', 'email', 'telefone', 
                        'uf', 'cidade', 'bairro', 'rua', 'numero', 'cep'];
  
  for (const field of requiredFields) {
    const elem = document.getElementById(field);
    if (!elem || !elem.value.trim()) {
      alert(`Por favor, preencha o campo ${field}!`);
      return;
    }
  }

  // Validação de CPF
  const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
  if (cpf.length !== 11) {
    alert('CPF inválido! Deve conter 11 dígitos.');
    return;
  }

  // Validação de UF (2 caracteres)
  const uf = document.getElementById('uf').value;
  if (uf.length !== 2) {
    alert('UF inválido! Deve conter exatamente 2 caracteres.');
    return;
  }

  const btnSubmit = document.querySelector('.btn-cadastrar');
  const originalText = btnSubmit.innerHTML;

  try {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

    // Primeiro cadastra o endereço
    const enderecoResponse = await fetch(`${apiBaseUrl}/enderecos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cep: document.getElementById('cep').value.replace(/\D/g, ''),
        uf: uf,
        cidade: document.getElementById('cidade').value,
        bairro: document.getElementById('bairro').value,
        rua: document.getElementById('rua').value,
        numero: document.getElementById('numero').value,
        complemento: document.getElementById('complemento').value || null
      })
    });

    if (!enderecoResponse.ok) {
      const errorData = await enderecoResponse.json();
      throw new Error(errorData.message || 'Erro ao cadastrar endereço');
    }

    const enderecoResult = await enderecoResponse.json();

    // Agora cadastra o cliente
    const clienteResponse = await fetch(`${apiBaseUrl}/cliente`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: document.getElementById('nome').value,
        cpf: cpf,
        dataNasc: document.getElementById('dataNasc').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
        enderecoId: enderecoResult.idEndereco
      })
    });

    if (!clienteResponse.ok) {
      const errorData = await clienteResponse.json();
      throw new Error(errorData.message || 'Erro ao cadastrar cliente');
    }

    const result = await clienteResponse.json();
    alert('Cliente cadastrado com sucesso!');
    this.reset();

  } catch (error) {
    console.error('Erro no cadastro:', error);
    alert(`Erro: ${error.message}`);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;
  }
});

// Máscaras para os campos
document.getElementById('cpf').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 3) value = value.replace(/^(\d{3})/, '$1.');
  if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
  if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
  e.target.value = value.substring(0, 14);
});

document.getElementById('telefone').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 2) value = value.replace(/^(\d{2})/, '($1) ');
  if (value.length > 10) value = value.replace(/^(\(\d{2}\)\s\d{5})/, '$1-');
  e.target.value = value.substring(0, 15);
});

document.getElementById('cep').addEventListener('input', function(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 5) value = value.replace(/^(\d{5})/, '$1-');
  e.target.value = value.substring(0, 9);
});

// Busca de CEP (opcional)
document.getElementById('buscarCep').addEventListener('click', async function() {
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    alert('CEP inválido! Deve conter 8 dígitos.');
    return;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    // Preenche automaticamente os campos
    document.getElementById('uf').value = data.uf || '';
    document.getElementById('cidade').value = data.localidade || '';
    document.getElementById('bairro').value = data.bairro || '';
    document.getElementById('rua').value = data.logradouro || '';
    document.getElementById('numero').focus();
    
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    alert(`Erro: ${error.message}`);
  }
});

// Cadastro de Cliente
document.getElementById('clienteForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validação básica
  const requiredFields = ['nome', 'cpf', 'dataNasc', 'email', 'telefone', 
                        'uf', 'cidade', 'bairro', 'rua', 'numero', 'cep'];
  
  for (const field of requiredFields) {
    const elem = document.getElementById(field);
    if (!elem || !elem.value.trim()) {
      alert(`Por favor, preencha o campo ${field}!`);
      return;
    }
  }

  // Validação de CPF
  const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
  if (cpf.length !== 11) {
    alert('CPF inválido! Deve conter 11 dígitos.');
    return;
  }

  // Validação de UF (2 caracteres)
  const uf = document.getElementById('uf').value;
  if (uf.length !== 2) {
    alert('UF inválido! Deve conter exatamente 2 caracteres.');
    return;
  }

  const btnSubmit = document.querySelector('.btn-cadastrar');
  const originalText = btnSubmit.innerHTML;

  try {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

    // Primeiro cadastra o endereço
    const enderecoResponse = await fetch(`${apiBaseUrl}/model_endereco`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cep: document.getElementById('cep').value.replace(/\D/g, ''),
        uf: uf,
        cidade: document.getElementById('cidade').value,
        bairro: document.getElementById('bairro').value,
        rua: document.getElementById('rua').value,
        numero: document.getElementById('numero').value,
        complemento: document.getElementById('complemento').value || null
      })
    });

    if (!enderecoResponse.ok) {
      const errorData = await enderecoResponse.json();
      throw new Error(errorData.message || 'Erro ao cadastrar endereço');
    }

    const enderecoResult = await enderecoResponse.json();

    // Agora cadastra o cliente
    const clienteResponse = await fetch(`${apiBaseUrl}/cliente`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: document.getElementById('nome').value,
        cpf: cpf,
        dataNasc: document.getElementById('dataNasc').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
        enderecoId: enderecoResult.idEndereco
      })
    });

    if (!clienteResponse.ok) {
      const errorData = await clienteResponse.json();
      throw new Error(errorData.message || 'Erro ao cadastrar cliente');
    }

    const result = await clienteResponse.json();
    alert('Cliente cadastrado com sucesso!');
    this.reset();

  } catch (error) {
    console.error('Erro no cadastro:', error);
    alert(`Erro: ${error.message}`);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;
  }
});