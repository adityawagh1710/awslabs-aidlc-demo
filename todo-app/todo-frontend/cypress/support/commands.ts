/// <reference types="cypress" />

// Login via API then inject tokens into the browser's sessionStorage.
// Sets tokens directly without relying on PersistAuth's async refresh flow.
Cypress.Commands.add('loginByApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/auth/login',
    body: { email, password },
    failOnStatusCode: false,
  }).then((res) => {
    if (res.status === 200) {
      const { accessToken, refreshToken, user } = res.body
      // Visit app, set tokens, then reload so PersistAuth picks them up fresh
      cy.visit('/', { failOnStatusCode: false })
      cy.window().then((win) => {
        win.sessionStorage.setItem('accessToken', accessToken)
        win.sessionStorage.setItem('refreshToken', refreshToken)
        win.sessionStorage.setItem('user', JSON.stringify(user))
      })
      // Reload so the app initialises with the tokens already in sessionStorage
      cy.reload()
      // Wait for the dashboard to be ready
      cy.get('[data-testid="dashboard-page"]', { timeout: 15000 }).should('be.visible')
    }
  })
})

// Register a fresh user — ignores 409 if already exists
Cypress.Commands.add('registerUser', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/auth/register',
    body: { email, password },
    failOnStatusCode: false,
  })
})

export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginByApi(email: string, password: string): Chainable
      registerUser(email: string, password: string): Chainable
    }
  }
}
