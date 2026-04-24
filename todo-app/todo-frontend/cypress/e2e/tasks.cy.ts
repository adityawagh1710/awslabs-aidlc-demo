const EMAIL = `cypress-tasks-${Date.now()}@example.com`
const PASSWORD = 'Cypress1!'

function goToNewTask() {
  cy.get('[data-testid="dashboard-new-task-button"]', { timeout: 15000 }).click()
  cy.get('[data-testid="task-form"]', { timeout: 15000 }).should('be.visible')
}

describe('Task Management', () => {
  before(() => {
    cy.registerUser(EMAIL, PASSWORD)
  })

  beforeEach(() => {
    cy.loginByApi(EMAIL, PASSWORD)
    cy.get('[data-testid="dashboard-page"]', { timeout: 15000 }).should('be.visible')
  })

  it('shows empty state when no tasks', () => {
    cy.get('[data-testid="task-list"]').should('be.visible')
    cy.contains('No tasks yet').should('be.visible')
  })

  it('navigates to new task form', () => {
    cy.get('[data-testid="dashboard-new-task-button"]').click()
    cy.url().should('include', '/tasks/new')
    cy.get('[data-testid="task-form"]', { timeout: 10000 }).should('be.visible')
  })

  it('shows validation error when title is empty', () => {
    goToNewTask()
    cy.get('[data-testid="task-form-submit"]').click()
    cy.contains('Title is required').should('be.visible')
  })

  it('creates a task and shows it in the list', () => {
    goToNewTask()
    cy.get('[data-testid="task-form-title"]').type('Buy groceries')
    cy.get('[data-testid="task-form-submit"]').click()
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
    cy.contains('Buy groceries').should('be.visible')
  })

  it('toggles task completion', () => {
    goToNewTask()
    cy.get('[data-testid="task-form-title"]').type('Toggle me')
    cy.get('[data-testid="task-form-submit"]').click()
    cy.visit('/')
    cy.contains('Toggle me')
      .closest('[data-testid^="task-row-"]')
      .find('input[type="checkbox"]')
      .click()
    cy.contains('Toggle me').should('have.class', 'line-through')
  })

  it('deletes a task', () => {
    goToNewTask()
    cy.get('[data-testid="task-form-title"]').type('Delete me')
    cy.get('[data-testid="task-form-submit"]').click()
    cy.visit('/')
    cy.contains('Delete me')
      .closest('[data-testid^="task-row-"]')
      .find('[aria-label="Delete task"]')
      .click({ force: true })
    cy.contains('Are you sure').should('be.visible')
    cy.contains('button', 'Delete').click()
    cy.contains('Delete me').should('not.exist')
  })

  it('edits a task', () => {
    goToNewTask()
    cy.get('[data-testid="task-form-title"]').type('Edit me')
    cy.get('[data-testid="task-form-submit"]').click()
    cy.visit('/')
    cy.contains('Edit me')
      .closest('[data-testid^="task-row-"]')
      .find('[aria-label="Edit task"]')
      .click({ force: true })
    cy.get('[data-testid="task-form"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="task-form-title"]').clear().type('Edited title')
    cy.get('[data-testid="task-form-submit"]').click()
    cy.contains('Edited title').should('be.visible')
  })
})
