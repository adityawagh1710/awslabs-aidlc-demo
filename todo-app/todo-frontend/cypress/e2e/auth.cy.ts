const EMAIL = `cypress-auth-${Date.now()}@example.com`
const PASSWORD = 'Cypress1!'

describe('Authentication', () => {
  it('shows login page at root when unauthenticated', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
    cy.get('[data-testid="login-form"]').should('be.visible')
  })

  it('shows validation errors on empty submit', () => {
    cy.visit('/login')
    cy.get('[data-testid="login-form-submit-button"]').click()
    cy.contains('valid email').should('be.visible')
  })

  it('registers a new account and lands on dashboard', () => {
    cy.visit('/register')
    cy.get('[data-testid="register-form-email-input"]').type(EMAIL)
    cy.get('[data-testid="register-form-password-input"]').type(PASSWORD)
    cy.get('[data-testid="register-form-confirm-password-input"]').type(PASSWORD)
    cy.get('[data-testid="register-form-submit-button"]').click()
    // Wait for redirect — PersistAuth may take a moment to initialise
    cy.url().should('eq', Cypress.config('baseUrl') + '/', { timeout: 15000 })
    cy.get('[data-testid="app-shell"]', { timeout: 15000 }).should('be.visible')
  })

  it('shows error on wrong password', () => {
    cy.visit('/login')
    cy.get('[data-testid="login-form-email-input"]').type(EMAIL)
    cy.get('[data-testid="login-form-password-input"]').type('WrongPass1!')
    cy.get('[data-testid="login-form-submit-button"]').click()
    cy.contains('Invalid email or password').should('be.visible')
  })

  it('logs in with correct credentials', () => {
    cy.visit('/login')
    cy.get('[data-testid="login-form-email-input"]').type(EMAIL)
    cy.get('[data-testid="login-form-password-input"]').type(PASSWORD)
    cy.get('[data-testid="login-form-submit-button"]').click()
    cy.url().should('eq', Cypress.config('baseUrl') + '/', { timeout: 15000 })
    cy.get('[data-testid="app-shell-user-email"]', { timeout: 15000 }).should('contain', EMAIL)
  })

  it('logs out and redirects to login', () => {
    cy.registerUser(EMAIL + '.logout', PASSWORD)
    cy.visit('/login')
    cy.get('[data-testid="login-form-email-input"]').type(EMAIL + '.logout')
    cy.get('[data-testid="login-form-password-input"]').type(PASSWORD)
    cy.get('[data-testid="login-form-submit-button"]').click()
    cy.get('[data-testid="app-shell-logout-button"]', { timeout: 15000 }).click()
    cy.url().should('include', '/login')
  })

  it('redirects authenticated user away from /login', () => {
    cy.registerUser(EMAIL + '.redir', PASSWORD)
    cy.loginByApi(EMAIL + '.redir', PASSWORD)
    cy.visit('/login')
    cy.url().should('eq', Cypress.config('baseUrl') + '/', { timeout: 15000 })
  })
})
