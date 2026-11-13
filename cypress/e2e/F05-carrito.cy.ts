import { createCart, type SeededCart } from '../support/api/carts';
import { getPurchasableProducts, type Product } from '../support/api/products';
import { money, sumLines } from '../support/data/money';
import { cartPage } from '../support/pages/cart.page';
import { header, toast } from '../support/pages/product.page';

describe('F05 Carrito', { tags: ['@F05'] }, () => {
  let first: Product;
  let second: Product;
  let cart: SeededCart;

  // Precondición por API: un carrito con dos productos. La UI se usa solo para lo que se valida.
  beforeEach(() => {
    getPurchasableProducts(2).then(([a, b]) => {
      if (!a || !b) throw new Error('Se necesitan dos productos comprables.');
      first = a;
      second = b;
      createCart([
        { product: first, quantity: 1 },
        { product: second, quantity: 2 },
      ]).then((created) => {
        cart = created;
        cy.visitWithCart('/checkout', cart);
      });
    });
  });

  it('calcula los importes por línea y el total', { tags: ['@smoke'] }, () => {
    cartPage.titles().should('deep.equal', [first.name, second.name]);
    cartPage.linePrice(first.name).should('have.text', money(first.price));
    cartPage
      .linePrice(second.name)
      .should('have.text', money(sumLines([{ price: second.price, quantity: 2 }])));
    cartPage.total().should(
      'have.text',
      money(
        sumLines([
          { price: first.price, quantity: 1 },
          { price: second.price, quantity: 2 },
        ]),
      ),
    );
    header.cartQuantity().should('have.text', '3');
  });

  it('recalcula el total al editar una cantidad', { tags: ['@regression'] }, () => {
    cartPage.setQuantity(first.name, 4);

    toast().should('contain.text', 'Product quantity updated.');
    cartPage.quantity(first.name).should('have.value', '4');
    cartPage
      .linePrice(first.name)
      .should('have.text', money(sumLines([{ price: first.price, quantity: 4 }])));
    cartPage.total().should(
      'have.text',
      money(
        sumLines([
          { price: first.price, quantity: 4 },
          { price: second.price, quantity: 2 },
        ]),
      ),
    );
    header.cartQuantity().should('have.text', '6');
  });

  it('elimina un ítem y actualiza el total', { tags: ['@regression'] }, () => {
    cartPage.remove(second.name);

    toast().should('contain.text', 'Product deleted.');
    cartPage.titles().should('deep.equal', [first.name]);
    cartPage.total().should('have.text', money(first.price));
    header.cartQuantity().should('have.text', '1');
  });

  it('muestra el carrito vacío al eliminar todos los ítems', { tags: ['@regression'] }, () => {
    cartPage.remove(first.name);
    cartPage.titles().should('deep.equal', [second.name]);
    cartPage.remove(second.name);

    cy.contains('The cart is empty. Nothing to display.').should('be.visible');
    cy.getByTest('cart-total').should('not.exist');
  });
});
