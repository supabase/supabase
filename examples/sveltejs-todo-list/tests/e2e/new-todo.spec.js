describe('New todo', () => {
  it('it should create new todo', () => {
    cy.visit('/');
    cy.contains('h1', 'todos');

    cy.get('.new-todo')
      .type('Demo')
      .type('{enter}');

    cy.get('.main .todo-list .view').contains('Demo');
  });
});
