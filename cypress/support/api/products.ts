import { apiRequest } from './client';

export interface Product {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
  is_location_offer: boolean;
  co2_rating: string | null;
  category: { id: string; name: string };
  brand: { id: string; name: string };
}

export interface Paginated<T> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  sub_categories: Category[];
}

export interface Brand {
  id: string;
  name: string;
}

export type ProductQuery = Partial<{
  q: string;
  sort: string;
  by_category: string;
  by_brand: string;
  page: number;
}>;

/** Criterios que la página de catálogo aplica por defecto: sin alquileres y precio entre 1 y 100. */
const CATALOG_DEFAULTS = { page: 1, is_rental: 'false', between: 'price,1,100' };

/**
 * Consulta el catálogo con los mismos criterios que aplica la UI.
 * Sirve de oráculo independiente para lo que la página debe mostrar.
 */
export function listProducts(query: ProductQuery = {}): Cypress.Chainable<Paginated<Product>> {
  return apiRequest<Paginated<Product>>({
    method: 'GET',
    path: '/products',
    qs: { ...CATALOG_DEFAULTS, ...query },
  }).then(({ body }) => body);
}

export function getProduct(id: string): Cypress.Chainable<Product> {
  return apiRequest<Product>({ method: 'GET', path: `/products/${id}` }).then(({ body }) => body);
}

export function getRelatedProducts(id: string): Cypress.Chainable<Product[]> {
  return apiRequest<Product[]>({ method: 'GET', path: `/products/${id}/related` }).then(
    ({ body }) => body,
  );
}

export function getCategoryTree(): Cypress.Chainable<Category[]> {
  return apiRequest<Category[]>({ method: 'GET', path: '/categories/tree' }).then(
    ({ body }) => body,
  );
}

export function getBrands(): Cypress.Chainable<Brand[]> {
  return apiRequest<Brand[]>({ method: 'GET', path: '/brands' }).then(({ body }) => body);
}

/**
 * Productos comprables a precio de lista: en stock, sin alquiler y sin oferta por ubicación,
 * para que los totales esperados no dependan de descuentos ajenos a la prueba.
 */
export function getPurchasableProducts(count: number): Cypress.Chainable<Product[]> {
  return listProducts({ sort: 'name,asc' }).then(({ data }) => {
    const candidates = data.filter(
      (product) => product.in_stock && !product.is_rental && !product.is_location_offer,
    );
    if (candidates.length < count) {
      throw new Error(
        `Se necesitan ${String(count)} productos comprables y hay ${String(candidates.length)}.`,
      );
    }
    return candidates.slice(0, count);
  });
}
