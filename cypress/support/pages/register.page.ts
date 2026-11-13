import type { NewUser } from '../data/users';

export interface RegistrationAddress {
  country: string;
  postalCode: string;
  houseNumber: string;
}

export const registerPage = {
  visit(): void {
    cy.visit('/auth/register');
    cy.getByTest('register-form').should('be.visible');
  },

  fillPersonalData(user: NewUser): void {
    cy.getByTest('first-name').type(user.first_name);
    cy.getByTest('last-name').type(user.last_name);
    cy.getByTest('dob').type(user.dob);
    cy.getByTest('phone').type(user.phone);
    cy.getByTest('email').type(user.email);
    cy.getByTest('password').type(user.password, { log: false });
  },

  /** País, código postal y número; calle, ciudad y estado los completa la búsqueda automática. */
  fillAddress({ country, postalCode, houseNumber }: RegistrationAddress): void {
    cy.getByTest('country').select(country);
    cy.getByTest('postal_code').type(postalCode);
    cy.getByTest('house_number').type(houseNumber);
  },

  submit(): void {
    cy.getByTest('register-submit').click();
  },
};
