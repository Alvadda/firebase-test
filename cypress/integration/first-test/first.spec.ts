describe('example', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/')
  })

  it('first-test', () => {
    cy.get('h1').should('exist')
  })
})

export {}
