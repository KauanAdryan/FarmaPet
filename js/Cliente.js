import { getElement, toggleButtonState, showMessage } from './scriptCadastros.js';
import { cadastrarEndereco } from './EnderecoService.js';

const apiBaseUrl = 'http://localhost:8080';

async function buscarCep(cep) {
  cep = cep.replace(/\D/g, '');
  if (cep.length !== 8) throw new Error('CEP inválido. Deve conter 8 dígitos.');

  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!res.ok) throw new Error('Erro ao buscar CEP na API ViaCEP');

  const dados = await res.json();
  if (dados.erro) throw new Error('CEP não encontrado.');

  return dados;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = getElement('#clienteForm');
  const cepInput = document.getElementById('cep');

  if (!form || !cepInput) return;

  // Submissão do formulário
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-cadastrar');
    toggleButtonState(btn, true);

    try {
      const ufSigla = form.uf.value.trim().toUpperCase();
      const cidadeNome = form.cidade.value.trim();
      const bairroNome = form.bairro.value.trim();
      const ruaNome = form.rua.value.trim();
      const cep = form.cep.value.replace(/\D/g, '');
      const numero = form.numero.value.trim();
      const complemento = form.complemento.value.trim() || null;

      if (!ufSigla || !cidadeNome || !bairroNome || !ruaNome || !cep || !numero) {
        throw new Error('Preencha todos os campos de endereço.');
      }

      const endereco = await cadastrarEndereco({
        cep,
        numero,
        complemento,
        ufSigla,
        cidadeNome,
        bairroNome,
        ruaNome
      });

      const cliente = {
        nome: form.nome.value.trim(),
        cpf: form.cpf.value.replace(/\D/g, ''),
        dataNasc: form.dataNasc.value,
        email: form.email.value.trim(),
        telefone: form.telefone.value.replace(/\D/g, ''),
        enderecoId: endereco.idEndereco
      };

      const res = await fetch(`${apiBaseUrl}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente),
        credentials: 'include' // <-- Aqui!
      });

      if (!res.ok) throw new Error('Erro ao cadastrar cliente');

      showMessage('Cliente cadastrado com sucesso!', 'success');
      form.reset();
    } catch (err) {
      console.error(err);
      showMessage(`Erro: ${err.message}`, 'error');
    } finally {
      toggleButtonState(btn, false);
    }
  });

  // Busca de CEP ao sair do campo
  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.trim();
    if (!cep) {
      form.uf.value = '';
      form.cidade.value = '';
      form.bairro.value = '';
      form.rua.value = '';
      return;
    }

    try {
      const dados = await buscarCep(cep);
      form.uf.value = dados.uf || '';
      form.cidade.value = dados.localidade || '';
      form.bairro.value = dados.bairro || '';
      form.rua.value = dados.logradouro || '';
    } catch (err) {
      console.error('Erro ao buscar CEP:', err.message);
      alert(`Erro: ${err.message}`);
      form.uf.value = '';
      form.cidade.value = '';
      form.bairro.value = '';
      form.rua.value = '';
    }
  });
});
