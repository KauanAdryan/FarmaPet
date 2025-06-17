

describe('Medicamentos - Teste modal Adicionar em Lote', () => {
 
 
  beforeEach(() => {
    // Intercepta GET /medicamentos para lista no modal e tela principal
    cy.intercept('GET', '**/medicamentos', {
      statusCode: 200,
      body: [
        { id: 1, nome: 'Dipirona', dataValidade: '2025-12-31', foto: null },
        { id: 2, nome: 'Amoxicilina', dataValidade: '2026-01-01', foto: null },
        { id: 3, nome: 'Paracetamol', dataValidade: '2024-05-30', foto: null }
      ]
    }).as('getMedicamentos');

    // Intercepta PUT para atualizar estoque em lote
    cy.intercept('PUT', '**/medicamentos/estoque/multiplos', (req) => {
      req.reply({
        statusCode: 200,
        body: ['Dipirona: 10 unidades adicionadas', 'Amoxicilina: 5 unidades adicionadas']
      });
    }).as('putEstoqueLote');
  });

  it('Deve abrir modal, filtrar medicamentos, inserir quantidade e salvar em lote', () => {
    cy.visit('http://127.0.0.1:5500/FarmaPet/telaInicial.html');
    cy.wait('@getMedicamentos');

    // Clica no botão para abrir modal
    cy.get('button.add-lot').click();

    // Modal deve ficar visível
    cy.get('#modalLote').should('not.have.class', 'hidden');

    // Verifica se lista contém os medicamentos mockados
    cy.get('#listaMedicamentosLote .item-medicamento').should('have.length', 3);
    cy.get('#listaMedicamentosLote').contains('Dipirona');
    cy.get('#listaMedicamentosLote').contains('Amoxicilina');
    cy.get('#listaMedicamentosLote').contains('Paracetamol');

    // Testa o filtro - digita 'amo' deve mostrar só Amoxicilina
    cy.get('#pesquisaMedicamento').type('amo');
    cy.get('#listaMedicamentosLote .item-medicamento')
      .should('have.length.at.least', 1)
      .each(item => {
        cy.wrap(item).invoke('text').should('match', /amo/i);
      });

    // Limpa o filtro para mostrar todos de novo
    cy.get('#pesquisaMedicamento').clear();
    cy.get('#listaMedicamentosLote .item-medicamento').should('have.length', 3);

    // Digita quantidade nos dois primeiros medicamentos
    cy.get('#qtd-1').clear().type('10');
    cy.get('#qtd-2').clear().type('5');

    // Clica em salvar no modal
    cy.get('#modalLote .btn-cadastrar').click();

    // Espera a requisição PUT para atualizar estoque em lote
    cy.wait('@putEstoqueLote').its('request.body').should('deep.equal', [
      { id: 1, tipo: 'ENTRADA', quantidade: 10 },
      { id: 2, tipo: 'ENTRADA', quantidade: 5 }
    ]);

    // Modal deve fechar
    cy.get('#modalLote').should('have.class', 'hidden');

    // Pode verificar se alerta foi exibido (caso use window.alert)
    // Por padrão, Cypress bloqueia alert, pode-se usar cy.on para verificar:
    cy.on('window:alert', (text) => {
      expect(text).to.contain('Movimentação realizada com sucesso');
    });
  });

  it('Deve mostrar alerta se tentar salvar sem quantidades', () => {
    cy.visit('http://127.0.0.1:5500/FarmaPet/telaInicial.html');
    cy.wait('@getMedicamentos');

    cy.get('button.add-lot').click();

    // Sem inserir quantidades
    cy.get('#modalLote .btn-cadastrar').click();

    cy.on('window:alert', (text) => {
      expect(text).to.eq('Preencha ao menos um campo com quantidade maior ou igual a 1.');
    });

    // Modal continua aberto
    cy.get('#modalLote').should('not.have.class', 'hidden');
  });
});
