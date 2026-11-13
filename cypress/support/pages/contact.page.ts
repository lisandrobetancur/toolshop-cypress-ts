export interface Attachment {
  fileName: string;
  mimeType: string;
  contents: string;
}

export const contactPage = {
  visit(): void {
    cy.visit('/contact');
    cy.getByTest('contact-submit').should('be.visible');
  },

  fillSender(firstName: string, lastName: string, email: string): void {
    cy.getByTest('first-name').type(firstName);
    cy.getByTest('last-name').type(lastName);
    cy.getByTest('email').type(email);
  },

  fillMessage(subject: string, message: string): void {
    cy.getByTest('subject').select(subject);
    cy.getByTest('message').type(message);
  },

  attach({ fileName, mimeType, contents }: Attachment): void {
    cy.getByTest('attachment').selectFile({
      contents: Cypress.Buffer.from(contents),
      fileName,
      mimeType,
    });
  },

  submit(): void {
    cy.getByTest('contact-submit').click();
  },

  confirmation: () => cy.contains('[role="alert"]', 'Thanks for your message!'),
};
