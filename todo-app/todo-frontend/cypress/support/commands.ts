/// <reference types="cypress" />

// Login via API then inject tokens into the browser's sessionStorage.
// Visits the app first to ensure a window context exists for sessionStorage.
Cypress.Commands.add('loginByApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/v1/auth/login',
    body: { email, password },
    failOnStatusCode: false,
  }).then((res) => {
    if (res.status === 200) {
      const { accessToken, refreshToken, user } = res.body
      // Visit the app so sessionStorage is available, then set tokens
      cy.visit('/', { failOnStatusCode: false })
      cy.window().then((win) => {
        win.sessionStorage.setItem('accessToken', accessToken)
        win.sessionStorage.setItem('refreshToken', refreshToken)
        win.sessionStorage.setItem('user', JSON.stringify(user))
      })
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
