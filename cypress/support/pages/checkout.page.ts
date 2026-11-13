import type { PaymentCase } from '../data/payments';

export const checkoutPage = {
  /** Paso 1 → 2 → 3: carrito, confirmación de sesión y dirección de facturación. */
  proceedToAddress(): void {
    cy.getByTest('proceed-1').click();
    cy.getByTest('proceed-2').should('be.enabled').click();
  },

  address: {
    field: (name: 'street' | 'city' | 'state' | 'country' | 'postal_code' | 'house_number') =>
      cy.getByTest(name),
    proceed(): void {
      cy.getByTest('proceed-3').should('be.enabled').click();
    },
  },

  fillPayment({ method, fields }: PaymentCase): void {
    cy.getByTest('payment-method').select(method);
    Object.entries(fields).forEach(([name, value]) => {
      cy.getByTest(name).then(($field) => {
        if ($field.is('select')) {
          cy.wrap($field).select(value);
        } else {
          cy.wrap($field).type(value);
        }
      });
    });
  },

  /**
   * La tienda confirma en dos tiempos: el primer clic valida el pago y muestra el mensaje; el
   * segundo crea la factura. Se espera por cada condición en lugar de por tiempo.
   */
  confirm(): void {
    cy.getByTest('finish').should('be.enabled').click();
    cy.getByTest('payment-success-message').should('have.text', 'Payment was successful');
    cy.getByTest('finish').click();
  },

  /**
   * Número de factura mostrado en la confirmación. Angular sanea el HTML del mensaje y quita el
   * `id` del span, así que se extrae del texto.
   */
  invoiceNumber: (): Cypress.Chainable<string> =>
    cy
      .get('#order-confirmation')
      .should('contain.text', 'Thanks for your order!')
      .invoke('text')
      .should('match', /INV-\d+/)
      .then((text) => /INV-\d+/.exec(text)?.[0] ?? ''),
};
