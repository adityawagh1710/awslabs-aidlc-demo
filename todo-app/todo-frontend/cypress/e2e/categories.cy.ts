const EMAIL = `cypress-cats-${Date.now()}@example.com`
const PASSWORD = 'Cypress1!'

describe('Categories', () => {
  before(() => {
    cy.registerUser(EMAIL, PASSWORD)
  })

  beforeEach(() => {
    cy.loginByApi(EMAIL, PASSWORD)
    // Navigate via URL — app shell is already rendered so ProtectedRoute is initialised
    cy.get('[data-testid="app-shell"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="app-shell-categories-link"]').click()
    cy.get('[data-testid="category-manager"]', { timeout: 15000 }).should('be.visible')
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
    cy.get('[data-testid="category-manager-new-input"]').type('Duplicate')
    cy.contains('button', 'Add').click()
    cy.contains('Duplicate').should('be.visible')
    cy.get('[data-testid="category-manager-new-input"]').type('Duplicate')
    cy.contains('button', 'Add').click()
    // Error shown inline (persists, no toast timing issues)
    cy.get('[data-testid="category-create-error"]', { timeout: 8000 }).should('be.visible')
    cy.contains('already have a category').should('be.visible')
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
