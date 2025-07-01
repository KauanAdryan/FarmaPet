const apiBaseUrl = 'http://localhost:8080';

// ==============================================
// Módulo de Serviços de Localização
// ==============================================

/**
 * Busca ou cria um bairro
 * @param {string} nome - Nome do bairro
 * @returns {Promise<Object>} Dados do bairro
 * @throws {Error} Se ocorrer erro na requisição
 */
async function buscarOuCriarBairro(nome) {
  try {
    // Busca todos os bairros
    const res = await fetch(`${apiBaseUrl}/bairros`, { 
      credentials: 'include' 
    });
    if (!res.ok) throw new Error('Erro ao buscar bairros');
    
    const bairros = await res.json();
    const existente = bairros.find(b => 
      b.descricao.toLowerCase() === nome.toLowerCase()
    );
    
    if (existente) return existente;

    // Cria novo bairro se não existir
    const resPost = await fetch(`${apiBaseUrl}/bairros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ descricao: nome })
    });

    if (!resPost.ok) throw new Error('Erro ao cadastrar bairro');
    return await resPost.json();
  } catch (error) {
    console.error('Erro em buscarOuCriarBairro:', error);
    throw error;
  }
}

/**
 * Busca ou cria uma rua
 * @param {string} nome - Nome da rua
 * @returns {Promise<Object>} Dados da rua
 * @throws {Error} Se ocorrer erro na requisição
 */
async function buscarOuCriarRua(nome) {
  try {
    // Tenta buscar por nome exato
    const res = await fetch(`${apiBaseUrl}/ruas/por-nome/${encodeURIComponent(nome)}`, { 
      credentials: 'include' 
    });
    
    if (res.ok) return await res.json();

    // Cria nova rua se não existir
    const resPost = await fetch(`${apiBaseUrl}/ruas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ descricao: nome })
    });

    if (!resPost.ok) throw new Error('Erro ao cadastrar rua');
    return await resPost.json();
  } catch (error) {
    console.error('Erro em buscarOuCriarRua:', error);
    throw error;
  }
}

/**
 * Busca ou cria uma UF
 * @param {string} sigla - Sigla da UF (ex: "SP")
 * @returns {Promise<Object>} Dados da UF
 * @throws {Error} Se ocorrer erro na requisição
 */
async function buscarOuCriarUF(sigla) {
  try {
    // Tenta buscar por sigla
    const res = await fetch(`${apiBaseUrl}/uf/sigla/${sigla}`, { 
      credentials: 'include' 
    });
    
    if (res.ok) return await res.json();

    // Cria nova UF se não existir
    const resPost = await fetch(`${apiBaseUrl}/uf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        sigla, 
        descricao: sigla 
      })
    });

    if (!resPost.ok) throw new Error('Erro ao cadastrar UF');
    return await resPost.json();
  } catch (error) {
    console.error('Erro em buscarOuCriarUF:', error);
    throw error;
  }
}

/**
 * Busca ou cria uma cidade
 * @param {string} nome - Nome da cidade
 * @param {number} idUf - ID da UF relacionada
 * @returns {Promise<Object>} Dados da cidade
 * @throws {Error} Se ocorrer erro na requisição
 */
async function buscarOuCriarCidade(nome, idUf) {
  try {
    // Busca todas as cidades
    const res = await fetch(`${apiBaseUrl}/cidade`, { 
      credentials: 'include' 
    });
    if (!res.ok) throw new Error('Erro ao buscar cidades');
    
    const cidades = await res.json();
    const existente = cidades.find(c => 
      c.descricao.toLowerCase() === nome.toLowerCase() && 
      c.uf.idUf === idUf
    );
    
    if (existente) return existente;

    // Cria nova cidade se não existir
    const resPost = await fetch(`${apiBaseUrl}/cidade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        descricao: nome, 
        uf: { idUf } 
      })
    });

    if (!resPost.ok) throw new Error('Erro ao cadastrar cidade');
    return await resPost.json();
  } catch (error) {
    console.error('Erro em buscarOuCriarCidade:', error);
    throw error;
  }
}

// ==============================================
// Serviço Principal de Endereços
// ==============================================

/**
 * Cadastra um endereço completo
 * @param {Object} endereco - Dados do endereço
 * @param {string} endereco.cep - CEP
 * @param {string} endereco.numero - Número
 * @param {string} [endereco.complemento] - Complemento
 * @param {string} endereco.ufSigla - Sigla da UF
 * @param {string} endereco.cidadeNome - Nome da cidade
 * @param {string} endereco.bairroNome - Nome do bairro
 * @param {string} endereco.ruaNome - Nome da rua
 * @returns {Promise<Object>} Endereço cadastrado
 * @throws {Error} Se ocorrer erro em qualquer etapa
 */
async function cadastrarEndereco({ 
  cep, 
  numero, 
  complemento, 
  ufSigla, 
  cidadeNome, 
  bairroNome, 
  ruaNome 
}) {
  try {
    // Validação básica dos parâmetros
    if (!cep || !numero || !ufSigla || !cidadeNome || !bairroNome || !ruaNome) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos');
    }

    // 1. Busca ou cria UF
    const uf = await buscarOuCriarUF(ufSigla);
    if (!uf?.idUf) throw new Error('Falha ao obter/registrar UF');

    // 2. Busca ou cria Cidade
    const cidade = await buscarOuCriarCidade(cidadeNome, uf.idUf);
    if (!cidade?.idCidade) throw new Error('Falha ao obter/registrar cidade');

    // 3. Busca ou cria Bairro
    const bairro = await buscarOuCriarBairro(bairroNome);
    if (!bairro?.idBairro) throw new Error('Falha ao obter/registrar bairro');

    // 4. Busca ou cria Rua
    const rua = await buscarOuCriarRua(ruaNome);
    if (!rua?.idRua) throw new Error('Falha ao obter/registrar rua');

    // Prepara payload para cadastro do endereço
    const payload = {
      cep: cep.replace(/\D/g, ''),
      numero,
      complemento: complemento || null,
      bairroId: bairro.idBairro,
      ruaId: rua.idRua,
      cidadeId: cidade.idCidade,
      ufId: uf.idUf
    };

    // 5. Cadastra o endereço completo
    const res = await fetch(`${apiBaseUrl}/enderecos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao cadastrar endereço');
    }

    return await res.json();
  } catch (error) {
    console.error('Erro no cadastro de endereço:', error);
    throw error;
  }
}

// ==============================================
// Exportação dos Serviços
// ==============================================

export {
  buscarOuCriarUF,
  buscarOuCriarCidade,
  buscarOuCriarBairro,
  buscarOuCriarRua,
  cadastrarEndereco
};