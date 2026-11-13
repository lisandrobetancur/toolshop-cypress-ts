import { faker } from '@faker-js/faker';

import { apiRequest } from '../support/api/client';
import { createOrder } from '../support/api/invoices';
import { getPurchasableProducts } from '../support/api/products';
import { createCustomer, type Customer } from '../support/api/users';
import { money } from '../support/data/money';

describe('F09 Cuenta del cliente', { tags: ['@F09'] }, () => {
  let customer: Customer;

  beforeEach(() => {
    createCustomer().then((created) => {
      customer = created;
      cy.loginAs(customer);
    });
  });

  it('actualiza el perfil y persiste los cambios', { tags: ['@regression'] }, () => {
    const firstName = faker.person.firstName().replace(/[^a-zA-Z]/g, '');
    const phone = faker.string.numeric(10);

    cy.visit('/account/profile');
    cy.getByTest('email').should('have.value', customer.email);
    cy.getByTest('first-name').should('have.value', customer.first_name).clear();
    cy.getByTest('first-name').type(firstName);
    cy.getByTest('phone').clear();
    cy.getByTest('phone').type(phone);
    cy.getByTest('update-profile-submit').click();

    cy.get('[role="alert"]').should('contain.text', 'Your profile is successfully updated!');

    // Tras recargar, el formulario muestra lo guardado en el servidor.
    cy.reload();
    cy.getByTest('first-name').should('have.value', firstName);
    cy.getByTest('phone').should('have.value', phone);

    apiRequest<{ first_name: string; phone: string; last_name: string }>({
      method: 'GET',
      path: '/users/me',
      token: customer.token,
    }).then(({ body }) => {
      expect(body.first_name, 'nombre guardado').to.equal(firstName);
      expect(body.phone, 'teléfono guardado').to.equal(phone);
      expect(body.last_name, 'apellido sin cambios').to.equal(customer.last_name);
    });
  });

  // Equivalente a "facturas del pedido de F06": cada prueba crea su propio pedido por API para
  // poder ejecutarse sola y en paralelo.
  it('consulta la factura de su pedido', { tags: ['@smoke'] }, () => {
    getPurchasableProducts(1).then(([product]) => {
      if (!product) throw new Error('No hay productos comprables.');

      createOrder(customer, [{ product, quantity: 3 }], 'bank-transfer').then((invoice) => {
        cy.visit('/account/invoices');
        cy.getByTest('page-title').should('have.text', 'Invoices');

        cy.contains('tr', invoice.invoice_number)
          .should('contain.text', invoice.billing_street)
          .and('contain.text', money(invoice.total))
          .contains('a', 'Details')
          .click();

        cy.location('pathname').should('eq', `/account/invoices/${invoice.id}`);
        cy.getByTest('invoice-number').should('have.value', invoice.invoice_number);
        cy.get('#total').should('have.value', `$ ${invoice.total.toFixed(2)}`);
        cy.getByTest('payment-method').should('have.value', 'Bank Transfer');
        cy.getByTest('street').should('have.value', customer.address.street);
        cy.contains('tr', product.name).should('contain.text', '3');
      });
    });
  });
});
