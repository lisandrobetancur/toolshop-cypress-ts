export type ResultState = 'search_completed' | 'filter_completed' | 'sorting_completed';

export const catalogPage = {
  visit(): void {
    cy.visit('/');
    cy.getByTest('product-name').should('have.length.greaterThan', 0);
  },

  search(query: string): void {
    cy.getByTest('search-query').type(query);
    cy.getByTest('search-submit').click();
  },

  sortBy(value: 'name,asc' | 'name,desc' | 'price,asc' | 'price,desc'): void {
    cy.getByTest('sort').select(value);
  },

  toggleCategory(categoryId: string): void {
    cy.getByTest(`category-${categoryId}`).check();
  },

  toggleBrand(brandId: string): void {
    cy.getByTest(`brand-${brandId}`).check();
  },

  goToPage(page: number): void {
    cy.get(`[aria-label="Page-${String(page)}"]`).click();
  },

  nextPage(): void {
    cy.getByTest('pagination-next').click();
  },

  /** La app marca el contenedor de resultados con el estado de la última operación. */
  waitFor(state: ResultState): void {
    cy.getByTest(state).should('exist');
  },

  productNames: () => cy.getByTest('product-name').texts(),
  productPrices: () => cy.getByTest('product-price').texts(),
};
