import { createOrder, getInvoice, type Invoice } from '../support/api/invoices';
import { getPurchasableProducts } from '../support/api/products';
import { createCustomer, type Customer } from '../support/api/users';

// El sitio no muestra el estado del pedido al cliente en ninguna pantalla; la verificación del
// lado del cliente se hace con su propio token contra la API (equivalente más cercano).
// Se usa COMPLETED porque el job `order:update` del servidor avanza los estados cada 10 minutos
// y COMPLETED es el único estado final que ese job no modifica.
describe('F12 Administrador: estado de un pedido', { tags: ['@F12'] }, () => {
  let customer: Customer;
  let order: Invoice;

  beforeEach(() => {
    createCustomer().then((created) => {
      customer = created;
      getPurchasableProducts(1).then(([product]) => {
        if (!product) throw new Error('No hay productos comprables.');
        createOrder(customer, [{ product, quantity: 1 }]).then((invoice) => {
          order = invoice;
        });
      });
    });
    cy.loginAsAdmin();
  });

  it('cambia el estado y el cliente lo ve actualizado', { tags: ['@smoke'] }, () => {
    cy.visit(`/admin/orders/edit/${order.id}`);
    cy.getByTest('invoice-number').should('have.value', order.invoice_number);

    cy.getByTest('order-status').select('COMPLETED');
    cy.getByTest('update-status-submit').click();
    cy.contains('[role="alert"]', 'Status updated!').should('be.visible');

    getInvoice(order.id, customer.token).its('status').should('eq', 'COMPLETED');
  });

  it('no ofrece estados anteriores al actual', { tags: ['@regression'] }, () => {
    cy.visit(`/admin/orders/edit/${order.id}`);
    cy.getByTest('order-status')
      .find('option:disabled')
      .should('contain.text', 'AWAITING_FULFILLMENT');
  });
});
