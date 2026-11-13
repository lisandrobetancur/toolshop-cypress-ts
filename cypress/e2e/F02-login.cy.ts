import { createCustomer, type Customer } from '../support/api/users';
import { buildPassword, buildUser } from '../support/data/users';
import { loginPage } from '../support/pages/login.page';

const TOKEN_KEY = 'auth-token';

const expectNoSession = (): void => {
  cy.location('pathname').should('eq', '/auth/login');
  cy.window().then((win) => {
    expect(win.localStorage.getItem(TOKEN_KEY), 'token de sesión').to.equal(null);
  });
};

describe('F02 Login', { tags: ['@F02'] }, () => {
  describe('con un cliente existente', () => {
    let customer: Customer;

    // Cada prueba registra su propio cliente: no depende de cuentas compartidas ni de otras
    // pruebas, y los intentos fallidos nunca bloquean una cuenta por defecto.
    beforeEach(() => {
      createCustomer().then((created) => {
        customer = created;
      });
      loginPage.visit();
    });

    it('inicia sesión con credenciales válidas', { tags: ['@smoke'] }, () => {
      loginPage.login(customer);

      cy.location('pathname').should('eq', '/account');
      cy.getByTest('page-title').should('have.text', 'My account');
      cy.getByTest('nav-menu').should(
        'contain.text',
        `${customer.first_name} ${customer.last_name}`,
      );
      cy.window().then((win) => {
        expect(win.localStorage.getItem(TOKEN_KEY), 'token de sesión')
          .to.be.a('string')
          .and.have.length.greaterThan(0);
      });
    });

    it('rechaza una contraseña incorrecta', { tags: ['@regression'] }, () => {
      loginPage.login({ email: customer.email, password: buildPassword() });

      loginPage.formError().should('be.visible').and('contain.text', 'Invalid email or password');
      expectNoSession();
    });
  });

  describe('sin sesión previa', () => {
    beforeEach(() => {
      loginPage.visit();
    });

    it('rechaza un correo no registrado', { tags: ['@regression'] }, () => {
      const unknown = buildUser();

      loginPage.login(unknown);

      loginPage.formError().should('be.visible').and('contain.text', 'Invalid email or password');
      expectNoSession();
    });

    it('exige correo y contraseña', { tags: ['@regression'] }, () => {
      loginPage.submit();

      loginPage.emailError().should('contain.text', 'Email is required');
      loginPage.passwordError().should('contain.text', 'Password is required');
      expectNoSession();
    });

    it(
      'valida el formato del correo y la longitud de la contraseña',
      { tags: ['@regression'] },
      () => {
        loginPage.login({ email: 'correo-sin-arroba', password: 'ab' });

        loginPage.emailError().should('contain.text', 'Email format is invalid');
        loginPage.passwordError().should('contain.text', 'Password length is invalid');
        expectNoSession();
      },
    );
  });
});
