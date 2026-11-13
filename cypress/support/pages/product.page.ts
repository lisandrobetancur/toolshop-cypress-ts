export const productPage = {
  visit(productId: string): void {
    cy.visit(`/product/${productId}`);
    cy.getByTest('add-to-cart').should('be.visible');
  },

  name: () => cy.getByTest('product-name').texts(),
  unitPrice: () => cy.getByTest('unit-price'),
  quantity: () => cy.getByTest('quantity'),

  increaseQuantity(times = 1): void {
    Cypress._.times(times, () => cy.getByTest('increase-quantity').click());
  },

  decreaseQuantity(times = 1): void {
    Cypress._.times(times, () => cy.getByTest('decrease-quantity').click());
  },

  addToCart(): void {
    cy.getByTest('add-to-cart').click();
  },

  addToFavorites(): void {
    cy.getByTest('add-to-favorites').click();
  },

  relatedProducts: () =>
    cy.contains('h2', 'Related products').parent().find('a[href^="/product/"]'),
};

export const header = {
  cartQuantity: () => cy.getByTest('cart-quantity'),
  openCart(): void {
    cy.getByTest('nav-cart').click();
  },
};

/** Notificación emergente (toast) con el resultado de la última acción. */
export const toast = () => cy.get('[role="alert"]');
