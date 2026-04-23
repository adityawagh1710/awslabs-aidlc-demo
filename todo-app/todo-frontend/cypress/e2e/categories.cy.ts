const EMAIL = `cypress-cats-${Date.now()}@example.com`
const PASSWORD = 'Cypress1!'

describe('Categories', () => {
  before(() => {
    cy.registerUser(EMAIL, PASSWORD)
  })

  beforeEach(() => {
    cy.loginByApi(EMAIL, PASSWORD)
    cy.visit('/categories')
    // Wait for the page to fully load
    cy.get('[data-testid="category-manager"]').should('be.visible')
  })

  it('shows empty state when no categories', () => {
    cy.get('[data-testid="category-manager-empty"]').should('be.visible')
  })

  it('creates a category', () => {
    cy.get('[data-testid="category-manager-new-input"]').type('Work')
    cy.contains('button', 'Add').click()
    cy.contains('Work').should('be.visible')
  })

  it('rejects duplicate category name', () => {
    // Create first
    cy.get('[data-testid="category-manager-new-input"]').type('Duplicate')
    cy.contains('button', 'Add').click()
    cy.contains('Duplicate').should('be.visible')
    // Try to create again immediately
    cy.get('[data-testid="category-manager-new-input"]').type('Duplicate')
    cy.contains('button', 'Add').click()
    // Toast appears briefly — catch it quickly
    cy.contains('You already have a category with this name', { timeout: 6000 }).should('be.visible')
  })

  it('deletes a category', () => {
    cy.get('[data-testid="category-manager-new-input"]').type('ToDelete')
    cy.contains('button', 'Add').click()
    cy.contains('ToDelete').should('be.visible')

    cy.contains('ToDelete')
      .closest('[data-testid^="category-item"]')
      .find('[data-testid^="category-item-delete"]')
      .click({ force: true })

    // Confirm dialog
    cy.contains('button', 'Delete').click({ force: true })
    cy.contains('ToDelete').should('not.exist')
  })
})
