import { addFavorite, listFavorites } from '../support/api/favorites';
import { getPurchasableProducts, type Product } from '../support/api/products';
import { createCustomer, type Customer } from '../support/api/users';
import { productPage, toast } from '../support/pages/product.page';

const favoritesPage = {
  visit(): void {
    cy.visit('/account/favorites');
    cy.getByTest('page-title').should('have.text', 'Favorites');
  },
  names: () => cy.getByTest('product-name').texts(),
  card: (favoriteId: string) => cy.getByTest(`favorite-${favoriteId}`),
};

describe('F08 Favoritos', { tags: ['@F08'] }, () => {
  let customer: Customer;
  let products: Product[];

  beforeEach(() => {
    createCustomer().then((created) => {
      customer = created;
      cy.loginAs(customer);
    });
    getPurchasableProducts(2).then((found) => {
      products = found;
    });
  });

  it('agrega un producto desde su detalle y lo lista en la cuenta', { tags: ['@smoke'] }, () => {
    const [product] = products as [Product];

    productPage.visit(product.id);
    productPage.addToFavorites();
    toast().should('contain.text', 'Product added to your favorites list.');

    favoritesPage.visit();
    favoritesPage.names().should('deep.equal', [product.name]);
    listFavorites(customer.token).its('length').should('eq', 1);
  });

  it('avisa si el producto ya está en favoritos', { tags: ['@regression'] }, () => {
    const [product] = products as [Product];
    addFavorite(product.id, customer.token);

    productPage.visit(product.id);
    productPage.addToFavorites();

    toast().should('contain.text', 'Product already in your favorites list.');
    listFavorites(customer.token).its('length').should('eq', 1);
  });

  it('elimina un favorito y conserva los demás', { tags: ['@regression'] }, () => {
    const [first, second] = products as [Product, Product];
    addFavorite(first.id, customer.token).then((favorite) => {
      addFavorite(second.id, customer.token);

      favoritesPage.visit();
      favoritesPage.names().should('have.members', [first.name, second.name]);

      favoritesPage.card(favorite.id).findByTest('delete').click();

      favoritesPage.card(favorite.id).should('not.exist');
      favoritesPage.names().should('deep.equal', [second.name]);
      listFavorites(customer.token).then((favorites) => {
        expect(
          favorites.map((f) => f.product_id),
          'favoritos en la API',
        ).to.deep.equal([second.id]);
      });
    });
  });

  it('muestra el estado vacío cuando no hay favoritos', { tags: ['@regression'] }, () => {
    favoritesPage.visit();
    cy.contains('There are no favorites yet.').should('be.visible');
    cy.getByTest('product-name').should('not.exist');
  });
});
