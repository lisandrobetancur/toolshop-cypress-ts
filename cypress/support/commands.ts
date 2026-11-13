import { login } from './api/users';
import type { Credentials } from './data/users';

const TOKEN_KEY = 'auth-token';

declare global {
  namespace Cypress {
    interface Chainable {
      /** Localiza elementos por el atributo `data-test`, la convención de Toolshop. */
      getByTest(id: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery>;
      /** Variante de `getByTest` acotada al sujeto anterior. */
      findByTest(id: string, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery>;
      /**
       * Autentica por API y deja el token donde la aplicación lo espera. La sesión se guarda
       * con cy.session(), así que el login real ocurre una sola vez por usuario.
       */
      loginAs(credentials: Credentials): Chainable<void>;
      /** Igual que `loginAs`, con la cuenta de administrador definida en variables de entorno. */
      loginAsAdmin(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('getByTest', (id, options) => cy.get(`[data-test="${id}"]`, options));

Cypress.Commands.add('findByTest', { prevSubject: 'element' }, (subject, id, options) =>
  cy.wrap(subject, { log: false }).find(`[data-test="${id}"]`, options),
);

Cypress.Commands.add('loginAs', (credentials) => {
  cy.session(
    ['toolshop-user', credentials.email],
    () => {
      login(credentials).then((token) => {
        window.localStorage.setItem(TOKEN_KEY, token);
      });
    },
    {
      validate() {
        cy.window().then((win) => {
          expect(win.localStorage.getItem(TOKEN_KEY), 'token de sesión').to.be.a('string');
        });
      },
    },
  );
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.env(['ADMIN_EMAIL', 'ADMIN_PASSWORD']).then((env) => {
    const email: unknown = env.ADMIN_EMAIL;
    const password: unknown = env.ADMIN_PASSWORD;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD: defínelas en .env (ver .env.example).');
    }
    cy.loginAs({ email, password });
  });
});
