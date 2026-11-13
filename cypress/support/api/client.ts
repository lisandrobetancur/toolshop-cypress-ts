export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: Cypress.RequestBody;
  token?: string;
  qs?: Record<string, string | number>;
  failOnStatusCode?: boolean;
}

/** Envuelve cy.request contra la API de Toolshop con la URL base y el token ya resueltos. */
export function apiRequest<T>(options: ApiRequestOptions): Cypress.Chainable<Cypress.Response<T>> {
  const { method, path, body, token, qs, failOnStatusCode = true } = options;
  const apiUrl = String(Cypress.expose('apiUrl'));

  return cy.request<T>({
    method,
    url: `${apiUrl}${path}`,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    failOnStatusCode,
    ...(body === undefined ? {} : { body }),
    ...(qs === undefined ? {} : { qs }),
  });
}
