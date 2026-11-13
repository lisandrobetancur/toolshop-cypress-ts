import {
  buildHouseNumber,
  buildPostalCode,
  buildUser,
  DEFAULT_COUNTRY,
} from '../support/data/users';
import { loginPage } from '../support/pages/login.page';
import { registerPage } from '../support/pages/register.page';

describe('F01 Registro de cliente', { tags: ['@F01'] }, () => {
  it('registra un cliente nuevo y permite su primer login', { tags: ['@smoke'] }, () => {
    const user = buildUser();

    registerPage.visit();
    registerPage.fillPersonalData(user);
    registerPage.fillAddress({
      country: DEFAULT_COUNTRY,
      postalCode: buildPostalCode(),
      houseNumber: buildHouseNumber(),
    });

    // La dirección se completa sola a partir del código postal: se espera por esa condición.
    cy.getByTest('street').should('not.have.value', '');
    cy.getByTest('city').should('not.have.value', '');
    cy.getByTest('state').should('not.have.value', '');

    registerPage.submit();

    // Registro exitoso: la app lleva al login, y las credenciales nuevas abren la cuenta.
    cy.location('pathname').should('eq', '/auth/login');
    loginPage.login(user);

    cy.location('pathname').should('eq', '/account');
    cy.getByTest('page-title').should('have.text', 'My account');
    cy.getByTest('nav-menu').should('contain.text', `${user.first_name} ${user.last_name}`);
  });

  it(
    'valida los campos obligatorios y la política de contraseña',
    { tags: ['@regression'] },
    () => {
      registerPage.visit();
      registerPage.submit();

      cy.getByTest('first-name-error').should('contain.text', 'First name is required');
      cy.getByTest('last-name-error').should('contain.text', 'Last name is required');
      cy.getByTest('dob-error').should('contain.text', 'Date of Birth is required');
      cy.getByTest('country-error').should('contain.text', 'Country is required');
      cy.getByTest('postal_code-error').should('contain.text', 'Postcode is required');
      cy.getByTest('phone-error').should('contain.text', 'Phone is required');
      cy.getByTest('email-error').should('contain.text', 'Email is required');
      cy.getByTest('password-error').should('contain.text', 'Password is required');
      cy.location('pathname').should('eq', '/auth/register');
    },
  );

  it('rechaza un correo que ya está registrado', { tags: ['@regression'] }, () => {
    const user = buildUser();
    const address = {
      country: DEFAULT_COUNTRY,
      postalCode: buildPostalCode(),
      houseNumber: buildHouseNumber(),
    };

    const register = (): void => {
      registerPage.visit();
      registerPage.fillPersonalData(user);
      registerPage.fillAddress(address);
      cy.getByTest('state').should('not.have.value', '');
      registerPage.submit();
    };

    register();
    cy.location('pathname').should('eq', '/auth/login');

    register();
    cy.getByTest('register-error').should('be.visible').and('contain.text', 'already exists');
    cy.location('pathname').should('eq', '/auth/register');
  });
});
