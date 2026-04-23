const EMAIL = `cypress-filters-${Date.now()}@example.com`
const PASSWORD = 'Cypress1!'

describe('Search & Filters', () => {
  before(() => {
    // Register and seed tasks in one chain using the token from register response
    cy.request('POST', 'http://localhost:3000/api/v1/auth/register', {
      email: EMAIL,
      password: PASSWORD,
    }).then((res) => {
      const token = res.body.accessToken
      cy.request({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/tasks',
        headers: { Authorization: `Bearer ${token}` },
        body: { title: 'High priority task', priority: 'High' },
      })
      cy.request({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/tasks',
        headers: { Authorization: `Bearer ${token}` },
        body: { title: 'Low priority task', priority: 'Low' },
      })
    })
  })

  beforeEach(() => {
    cy.loginByApi(EMAIL, PASSWORD)
    // loginByApi already navigates to / and waits for dashboard
  })

  it('renders filter bar', () => {
    cy.get('[data-testid="filter-bar"]').should('be.visible')
    cy.get('[data-testid="filter-status-all"]').should('be.visible')
    cy.get('[data-testid="filter-priority-High"]').should('be.visible')
  })

  it('renders search input', () => {
    cy.get('[data-testid="search-input-field"]').should('be.visible')
  })

  it('filters by priority High', () => {
    cy.get('[data-testid="filter-priority-High"]').click()
    cy.get('[data-testid="active-filters-bar"]').should('be.visible')
    cy.contains('Priority: High').should('be.visible')
  })

  it('clears filters', () => {
    cy.get('[data-testid="filter-priority-High"]').click()
    cy.get('[data-testid="active-filters-clear-all"]').click()
    cy.get('[data-testid="active-filters-bar"]').should('not.exist')
  })

  it('searches by title', () => {
    cy.get('[data-testid="search-input-field"]').type('High priority')
    cy.get('[data-testid="search-input-button"]').click()
    cy.contains('High priority task').should('be.visible')
  })

  it('sorts by priority', () => {
    cy.get('[data-testid="sort-by-select"]').click()
    cy.contains('[role="option"]', 'Priority').click({ force: true })
    cy.url().should('include', 'sortBy=priority')
  })
})
