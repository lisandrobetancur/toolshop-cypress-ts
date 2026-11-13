import type { Credentials } from '../data/users';
import { apiRequest } from './client';
import { login } from './users';

/** Credenciales de administrador desde variables de entorno (nunca en el código). */
export function getAdminCredentials(): Cypress.Chainable<Credentials> {
  return cy.env(['ADMIN_EMAIL', 'ADMIN_PASSWORD']).then((env) => {
    const email: unknown = env.ADMIN_EMAIL;
    const password: unknown = env.ADMIN_PASSWORD;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw new Error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD: defínelas en .env (ver .env.example).');
    }
    return { email, password };
  });
}

export function adminToken(): Cypress.Chainable<string> {
  return getAdminCredentials().then((credentials) => login(credentials));
}

/**
 * Busca productos por nombre exacto con el listado filtrado (`/products?q=`), que no depende del
 * índice FULLTEXT ni de la caché de `/products/search`.
 */
export function findProductIdsByName(name: string): Cypress.Chainable<string[]> {
  return apiRequest<{ data: { id: string; name: string }[] }>({
    method: 'GET',
    path: '/products',
    qs: { q: name },
  }).then(({ body }) => body.data.filter((p) => p.name === name).map((p) => p.id));
}

/** Limpieza de buen vecino: el entorno es compartido, así que se borra lo que crea la prueba. */
export function deleteProduct(id: string, token: string): void {
  apiRequest({ method: 'DELETE', path: `/products/${id}`, token, failOnStatusCode: false });
}
