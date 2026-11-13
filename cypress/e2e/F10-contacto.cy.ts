import { faker } from '@faker-js/faker';

import { apiRequest } from '../support/api/client';
import { createCustomer, type Customer } from '../support/api/users';
import { buildUser } from '../support/data/users';
import { contactPage } from '../support/pages/contact.page';

/** Mensaje válido (mínimo 50 caracteres) con una marca única para encontrarlo luego. */
const buildMessage = (marker: string): string =>
  `${marker} ${faker.lorem.sentence({ min: 12, max: 16 })}`.padEnd(60, '.');

describe('F10 Formulario de contacto', { tags: ['@F10'] }, () => {
  describe('como cliente autenticado', () => {
    let customer: Customer;

    beforeEach(() => {
      createCustomer().then((created) => {
        customer = created;
        cy.loginAs(customer);
      });
    });

    it('envía un mensaje con archivo adjunto', { tags: ['@smoke'] }, () => {
      const marker = `QA-${faker.string.alphanumeric(10)}`;
      const message = buildMessage(marker);
      cy.intercept('POST', '**/messages/*/attach-file').as('attachFile');

      contactPage.visit();
      cy.contains(`Hello ${customer.first_name} ${customer.last_name}`).should('be.visible');
      contactPage.fillMessage('warranty', message);
      // La tienda solo acepta archivos .txt vacíos (0 bytes): es su regla de negocio.
      contactPage.attach({ fileName: 'evidencia.txt', mimeType: 'text/plain', contents: '' });
      contactPage.submit();

      cy.wait('@attachFile').its('response.statusCode').should('be.oneOf', [200, 201]);
      contactPage.confirmation().should('contain.text', 'We will contact you shortly.');

      // El mensaje queda registrado en la cuenta del cliente con el asunto elegido.
      apiRequest<{ data: { subject: string; message: string }[] }>({
        method: 'GET',
        path: '/messages',
        token: customer.token,
      }).then(({ body }) => {
        const sent = body.data.find((m) => m.message.startsWith(marker));
        expect(sent, 'mensaje registrado').to.not.equal(undefined);
        expect(sent?.subject, 'asunto').to.equal('warranty');
      });
    });
  });

  describe('como visitante', () => {
    beforeEach(() => {
      contactPage.visit();
    });

    it('exige los campos obligatorios', { tags: ['@regression'] }, () => {
      contactPage.submit();

      cy.getByTest('first-name-error').should('contain.text', 'First name is required');
      cy.getByTest('last-name-error').should('contain.text', 'Last name is required');
      cy.getByTest('email-error').should('contain.text', 'Email is required');
      cy.getByTest('subject-error').should('contain.text', 'Subject is required');
      cy.getByTest('message-error').should('contain.text', 'Message is required');
      contactPage.confirmation().should('not.exist');
    });

    it('valida el formato del correo y la longitud del mensaje', { tags: ['@regression'] }, () => {
      const visitor = buildUser();

      contactPage.fillSender(visitor.first_name, visitor.last_name, 'correo-invalido');
      contactPage.fillMessage('payments', 'Mensaje demasiado corto');
      contactPage.submit();

      cy.getByTest('email-error').should('contain.text', 'Email format is invalid');
      cy.getByTest('message-error').should('contain.text', 'Message must be minimal 50 characters');
      contactPage.confirmation().should('not.exist');
    });

    it('rechaza adjuntos con contenido o de otro tipo', { tags: ['@regression'] }, () => {
      const visitor = buildUser();

      contactPage.fillSender(visitor.first_name, visitor.last_name, visitor.email);
      contactPage.fillMessage('return', buildMessage('QA'));

      contactPage.attach({ fileName: 'nota.txt', mimeType: 'text/plain', contents: 'contenido' });
      contactPage.submit();
      cy.getByTest('attachment-error').should('contain.text', 'File should be empty.');

      contactPage.attach({ fileName: 'foto.png', mimeType: 'image/png', contents: '' });
      contactPage.submit();
      cy.getByTest('attachment-error').should('contain.text', 'File should have a txt extension.');
      contactPage.confirmation().should('not.exist');
    });
  });
});
