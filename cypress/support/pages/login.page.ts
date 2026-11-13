import type { Credentials } from '../data/users';

export const loginPage = {
  visit(): void {
    cy.visit('/auth/login');
    cy.getByTest('login-form').should('be.visible');
  },

  fill({ email, password }: Partial<Credentials>): void {
    if (email) cy.getByTest('email').type(email);
    if (password) cy.getByTest('password').type(password, { log: false });
  },

  submit(): void {
    cy.getByTest('login-submit').click();
  },

  login(credentials: Credentials): void {
    this.fill(credentials);
    this.submit();
  },

  emailError: () => cy.getByTest('email-error'),
  passwordError: () => cy.getByTest('password-error'),
  formError: () => cy.getByTest('login-error'),
};
