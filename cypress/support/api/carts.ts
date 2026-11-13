import { apiRequest } from './client';
import type { Product } from './products';

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface SeededCart {
  id: string;
  lines: CartLine[];
}

/** Crea un carrito por API con las líneas indicadas, listo para inyectarse en la sesión de la UI. */
export function createCart(lines: CartLine[]): Cypress.Chainable<SeededCart> {
  return apiRequest<{ id: string }>({ method: 'POST', path: '/carts' }).then(({ body }) => {
    const cartId = body.id;
    lines.forEach(({ product, quantity }) => {
      apiRequest({
        method: 'POST',
        path: `/carts/${cartId}`,
        body: { product_id: product.id, quantity },
      });
    });
    return cy.wrap<SeededCart>({ id: cartId, lines }, { log: false });
  });
}
