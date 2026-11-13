import { getPurchasableProducts, getRelatedProducts, type Product } from '../support/api/products';
import { money } from '../support/data/money';
import { header, productPage, toast } from '../support/pages/product.page';

describe('F04 Detalle de producto', { tags: ['@F04'] }, () => {
  let product: Product;

  beforeEach(() => {
    getPurchasableProducts(1).then(([first]) => {
      if (!first) throw new Error('No hay productos comprables.');
      product = first;
      productPage.visit(product.id);
    });
  });

  it('muestra nombre y precio del producto', { tags: ['@regression'] }, () => {
    productPage.name().should('deep.equal', [product.name]);
    productPage.unitPrice().should('have.text', money(product.price).replace('$', ''));
  });

  it('cambia la cantidad y agrega el producto al carrito', { tags: ['@smoke'] }, () => {
    productPage.quantity().should('have.value', '1');

    productPage.increaseQuantity(3);
    productPage.quantity().should('have.value', '4');
    productPage.decreaseQuantity();
    productPage.quantity().should('have.value', '3');

    productPage.addToCart();

    toast().should('contain.text', 'Product added to shopping cart.');
    header.cartQuantity().should('have.text', '3');

    // El carrito refleja el producto, la cantidad elegida y el importe de la línea.
    header.openCart();
    cy.location('pathname').should('eq', '/checkout');
    cy.getByTest('product-title').should('contain.text', product.name);
    cy.getByTest('product-quantity').should('have.value', '3');
    cy.getByTest('line-price').should('have.text', money(product.price * 3));
  });

  it('no permite bajar la cantidad de 1', { tags: ['@regression'] }, () => {
    productPage.decreaseQuantity();
    productPage.quantity().should('have.value', '1');
  });

  it('lista productos relacionados y navega a ellos', { tags: ['@regression'] }, () => {
    getRelatedProducts(product.id).then((related) => {
      const target = related[0];
      if (!target) throw new Error(`"${product.name}" no tiene productos relacionados.`);

      productPage.relatedProducts().should('have.length', related.length);
      related.forEach((item) => {
        productPage
          .relatedProducts()
          .filter(`[href="/product/${item.id}"]`)
          .should('contain.text', item.name);
      });

      productPage.relatedProducts().filter(`[href="/product/${target.id}"]`).click();

      cy.location('pathname').should('eq', `/product/${target.id}`);
      productPage.name().should('deep.equal', [target.name]);
    });
  });
});
