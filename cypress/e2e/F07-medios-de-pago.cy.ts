import { createCart } from '../support/api/carts';
import { findInvoiceByNumber } from '../support/api/invoices';
import { getPurchasableProducts } from '../support/api/products';
import { createCustomer, type Customer } from '../support/api/users';
import { buildPaymentCases } from '../support/data/payments';
import { checkoutPage } from '../support/pages/checkout.page';

// F06 ya cubre tarjeta de crédito; aquí se parametrizan los demás medios de pago.
const cases = buildPaymentCases().filter(({ method }) => method !== 'credit-card');

// Etiquetas literales: @cypress/grep las lee de forma estática al prefiltrar specs.
describe('F07 Checkout con distintos medios de pago', { tags: ['@F07', '@regression'] }, () => {
  let customer: Customer;

  beforeEach(() => {
    createCustomer().then((created) => {
      customer = created;
      cy.loginAs(customer);
    });
    getPurchasableProducts(1).then(([product]) => {
      if (!product) throw new Error('No hay productos comprables.');
      createCart([{ product, quantity: 1 }]).then((cart) => {
        cy.visitWithCart('/checkout', cart);
      });
    });
  });

  cases.forEach((payment) => {
    it(`confirma el pedido pagando con ${payment.label}`, () => {
      checkoutPage.proceedToAddress();
      checkoutPage.address.proceed();
      checkoutPage.fillPayment(payment);
      checkoutPage.confirm();

      checkoutPage.invoiceNumber().then((invoiceNumber) => {
        findInvoiceByNumber(invoiceNumber, customer.token)
          .its('payment.payment_method')
          .should('eq', payment.method);
      });
    });
  });
});
