const apiBaseUrl = 'http://localhost:8080';

/**
 * Busca bairro por nome. Se não encontrar, cadastra um novo.
 */
async function buscarOuCriarBairro(nome) {
  const res = await fetch(`${apiBaseUrl}/bairros`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar bairros');
  const bairros = await res.json();

  const existente = bairros.find(b => b.descricao.toLowerCase() === nome.toLowerCase());
  if (existente) return existente;

  const resPost = await fetch(`${apiBaseUrl}/bairros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ descricao: nome })
  });

  if (!resPost.ok) throw new Error('Erro ao cadastrar bairro');
  return await resPost.json();
}

/**
 * Busca rua por nome. Se não encontrar, cadastra uma nova.
 */
async function buscarOuCriarRua(nome) {
  const res = await fetch(`${apiBaseUrl}/ruas/por-nome/${encodeURIComponent(nome)}`, { credentials: 'include' });
  if (res.ok) return await res.json();

  const resPost = await fetch(`${apiBaseUrl}/ruas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ descricao: nome })
  });

  if (!resPost.ok) throw new Error('Erro ao cadastrar rua');
  return await resPost.json();
}

/**
 * Busca UF por sigla. Se não encontrar, cadastra uma nova.
 */
async function buscarOuCriarUF(sigla) {
  const res = await fetch(`${apiBaseUrl}/uf/sigla/${sigla}`, { credentials: 'include' });
  if (res.ok) return await res.json();

  const resPost = await fetch(`${apiBaseUrl}/uf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sigla, descricao: sigla })
  });

  if (!resPost.ok) throw new Error('Erro ao cadastrar UF');
  return await resPost.json();
}

/**
 * Busca cidade por nome e UF. Se não encontrar, cadastra uma nova.
 */
async function buscarOuCriarCidade(nome, idUf) {
  const res = await fetch(`${apiBaseUrl}/cidade`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar cidades');
  const cidades = await res.json();

  const existente = cidades.find(
    c => c.descricao.toLowerCase() === nome.toLowerCase() && c.uf.idUf === idUf
  );
  if (existente) return existente;

  const resPost = await fetch(`${apiBaseUrl}/cidade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ descricao: nome, uf: { idUf } })
  });

  if (!resPost.ok) throw new Error('Erro ao cadastrar cidade');
  return await resPost.json();
}

/**
 * Faz o cadastro completo do endereço: busca ou cria os dados relacionados
 * e envia o endereço final ao backend.
 */
async function cadastrarEndereco({ cep, numero, complemento, ufSigla, cidadeNome, bairroNome, ruaNome }) {
  try {
    console.log('[1] Buscando ou cadastrando Bairro...');
    const bairro = await buscarOuCriarBairro(bairroNome);
    if (!bairro?.idBairro) throw new Error('Bairro inválido');

    console.log('[2] Buscando ou cadastrando Rua...');
    const rua = await buscarOuCriarRua(ruaNome);
    if (!rua?.idRua) throw new Error('Rua inválida');

    console.log('[3] Buscando ou cadastrando UF...');
    const uf = await buscarOuCriarUF(ufSigla);
    if (!uf?.idUf) throw new Error('UF inválida');

    console.log('[4] Buscando ou cadastrando Cidade...');
    const cidade = await buscarOuCriarCidade(cidadeNome, uf.idUf);
    if (!cidade?.idCidade) throw new Error('Cidade inválida');

    const payload = {
      cep,
      numero,
      complemento,
      bairroId: bairro.idBairro,
      ruaId: rua.idRua,
      cidadeId: cidade.idCidade,
      ufId: uf.idUf
    };

    console.log('[5] Enviando endereço ao backend:', payload);

    const res = await fetch(`${apiBaseUrl}/enderecos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Erro ao cadastrar endereço: ${msg}`);
    }

    const endereco = await res.json();
    console.log('[6] Endereço cadastrado com sucesso:', endereco);
    return endereco;

  } catch (err) {
    console.error('Erro no cadastro de endereço:', err);
    throw err;
  }
}

// Exportações
export {
  buscarOuCriarUF,
  buscarOuCriarCidade,
  buscarOuCriarBairro,
  buscarOuCriarRua,
  cadastrarEndereco
};
