import { createCart } from '../support/api/carts';
import { findInvoiceByNumber } from '../support/api/invoices';
import { getPurchasableProducts, type Product } from '../support/api/products';
import { createCustomer, type Customer } from '../support/api/users';
import { money, sumLines } from '../support/data/money';
import { getPaymentCase } from '../support/data/payments';
import { checkoutPage } from '../support/pages/checkout.page';
import { header } from '../support/pages/product.page';

describe('F06 Checkout como cliente autenticado', { tags: ['@F06'] }, () => {
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

  it('completa dirección, pago y confirmación del pedido', { tags: ['@smoke'] }, () => {
    const payment = getPaymentCase('credit-card');
    const [first, second] = products as [Product, Product];
    const lines = [
      { product: first, quantity: 2 },
      { product: second, quantity: 1 },
    ];
    const expectedTotal = sumLines(
      lines.map((l) => ({ price: l.product.price, quantity: l.quantity })),
    );

    createCart(lines).then((cart) => {
      cy.visitWithCart('/checkout', cart);
    });
    cy.getByTest('cart-total').should('have.text', money(expectedTotal));

    // Paso de sesión: la app reconoce al cliente autenticado.
    cy.getByTest('proceed-1').click();
    cy.contains(
      `Hello ${customer.first_name} ${customer.last_name}, you are already logged in`,
    ).should('be.visible');
    cy.getByTest('proceed-2').should('be.enabled').click();

    // Dirección de facturación precargada desde el perfil del cliente.
    checkoutPage.address.field('street').should('have.value', customer.address.street);
    checkoutPage.address.field('city').should('have.value', customer.address.city);
    checkoutPage.address.field('state').should('have.value', customer.address.state);
    checkoutPage.address.field('postal_code').should('have.value', customer.address.postal_code);
    checkoutPage.address.field('country').should('have.value', customer.address.country);
    checkoutPage.address.proceed();

    checkoutPage.fillPayment(payment);
    checkoutPage.confirm();

    checkoutPage.invoiceNumber().then((invoiceNumber) => {
      // El carrito se vacía al confirmar.
      header.cartQuantity().should('not.exist');

      // La factura registrada refleja exactamente lo comprado.
      findInvoiceByNumber(invoiceNumber, customer.token).then((invoice) => {
        expect(invoice.total, 'total facturado').to.equal(expectedTotal);
        expect(invoice.billing_street, 'calle de facturación').to.equal(customer.address.street);
        expect(invoice.billing_city, 'ciudad de facturación').to.equal(customer.address.city);
        expect(invoice.payment?.payment_method, 'medio de pago').to.equal(payment.method);
        expect(
          invoice.invoicelines?.map((line) => [line.product_id, line.quantity]),
          'líneas facturadas',
        ).to.have.deep.members(lines.map((line) => [line.product.id, line.quantity]));
      });
    });
  });

  it(
    'bloquea la confirmación sin medio de pago o con tarjeta inválida',
    { tags: ['@regression'] },
    () => {
      const [first] = products as [Product];

      createCart([{ product: first, quantity: 1 }]).then((cart) => {
        cy.visitWithCart('/checkout', cart);
      });
      checkoutPage.proceedToAddress();
      checkoutPage.address.proceed();

      cy.getByTest('finish').should('be.disabled');
      cy.getByTest('payment-method').select('credit-card');
      cy.getByTest('credit_card_number').type('1234');
      cy.getByTest('expiration_date').type('01/2000');
      cy.getByTest('cvv').type('1');
      cy.getByTest('card_holder_name').type('QA');
      cy.contains('Invalid card number format.').should('be.visible');
      cy.contains('Expiration date must be in the future.').should('be.visible');
      cy.contains('CVV must be 3 or 4 digits.').should('be.visible');
      cy.getByTest('finish').should('be.disabled');
    },
  );
});
