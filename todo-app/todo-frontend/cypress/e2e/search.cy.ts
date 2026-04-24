const EMAIL = `cypress-search-${Date.now()}@example.com`
const PASSWORD = 'Cypress1!'

describe('Elasticsearch-like Search', () => {
  before(() => {
    cy.request('POST', 'http://localhost:3000/api/v1/auth/register', {
      email: EMAIL,
      password: PASSWORD,
    }).then((res) => {
      const token = res.body.accessToken
      const headers = { Authorization: `Bearer ${token}` }
      // Seed tasks with distinct titles for search testing
      cy.request({ method: 'POST', url: 'http://localhost:3000/api/v1/tasks', headers, body: { title: 'Buy groceries today' } })
      cy.request({ method: 'POST', url: 'http://localhost:3000/api/v1/tasks', headers, body: { title: 'Buy birthday gift' } })
      cy.request({ method: 'POST', url: 'http://localhost:3000/api/v1/tasks', headers, body: { title: 'Call the dentist' } })
      cy.request({ method: 'POST', url: 'http://localhost:3000/api/v1/tasks', headers, body: { title: 'Schedule team meeting' } })
    })
  })

  beforeEach(() => {
    cy.loginByApi(EMAIL, PASSWORD)
    cy.get('[data-testid="dashboard-page"]', { timeout: 15000 }).should('be.visible')
  })

  it('shows all tasks before searching', () => {
    cy.contains('Buy groceries today').should('be.visible')
    cy.contains('Buy birthday gift').should('be.visible')
    cy.contains('Call the dentist').should('be.visible')
    cy.contains('Schedule team meeting').should('be.visible')
  })

  it('filters results live as user types (debounced)', () => {
    cy.get('[data-testid="search-input-field"]').type('buy')
    // Live search — results update without pressing Enter
    cy.contains('Buy groceries today', { timeout: 5000 }).should('be.visible')
    cy.contains('Buy birthday gift').should('be.visible')
    cy.contains('Call the dentist').should('not.exist')
    cy.contains('Schedule team meeting').should('not.exist')
  })

  it('shows suggestions dropdown after 2+ characters', () => {
    cy.get('[data-testid="search-input-field"]').type('buy')
    cy.get('[data-testid="search-suggestions"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-testid="search-suggestions"] li').should('have.length.gte', 1)
  })

  it('prefix-matches partial words (elasticsearch-style)', () => {
    // "gro" should match "groceries"
    cy.get('[data-testid="search-input-field"]').type('gro')
    cy.contains('Buy groceries today', { timeout: 5000 }).should('be.visible')
    cy.contains('Buy birthday gift').should('not.exist')
  })

  it('selects a suggestion with keyboard and searches', () => {
    cy.get('[data-testid="search-input-field"]').type('buy')
    cy.get('[data-testid="search-suggestions"]', { timeout: 5000 }).should('be.visible')
    // Arrow down to first suggestion, Enter to select
    cy.get('[data-testid="search-input-field"]').type('{downarrow}{enter}')
    cy.get('[data-testid="search-suggestions"]').should('not.exist')
    // URL should reflect the search
    cy.url().should('include', 'search=')
  })

  it('clears search with × button and restores all tasks', () => {
    cy.get('[data-testid="search-input-field"]').type('dentist')
    cy.contains('Call the dentist', { timeout: 5000 }).should('be.visible')
    cy.contains('Buy groceries today').should('not.exist')

    // Click the clear (×) button
    cy.get('[aria-label="Clear search"]').click()
    cy.contains('Buy groceries today', { timeout: 5000 }).should('be.visible')
    cy.contains('Call the dentist').should('be.visible')
  })

  it('shows empty state when no results match', () => {
    cy.get('[data-testid="search-input-field"]').type('xyznonexistent')
    cy.get('[data-testid="task-list-empty-message"]', { timeout: 5000 }).should('be.visible')
    cy.contains('No tasks match').should('be.visible')
  })

  it('search term appears in URL (shareable/bookmarkable)', () => {
    cy.get('[data-testid="search-input-field"]').type('meeting')
    cy.url({ timeout: 5000 }).should('include', 'search=meeting')
  })
})
