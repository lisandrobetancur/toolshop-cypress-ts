import { apiRequest } from './client';

export interface Favorite {
  id: string;
  product_id: string;
  product: { name: string };
}

export function addFavorite(productId: string, token: string): Cypress.Chainable<Favorite> {
  return apiRequest<Favorite>({
    method: 'POST',
    path: '/favorites',
    token,
    body: { product_id: productId },
  }).then(({ body }) => body);
}

export function listFavorites(token: string): Cypress.Chainable<Favorite[]> {
  return apiRequest<Favorite[]>({ method: 'GET', path: '/favorites', token }).then(
    ({ body }) => body,
  );
}
