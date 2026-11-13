import {
  buildHouseNumber,
  buildPostalCode,
  buildUser,
  DEFAULT_COUNTRY,
  type Address,
  type Credentials,
  type NewUser,
} from '../data/users';
import { apiRequest } from './client';

export interface Customer extends NewUser {
  id: string;
  address: Address;
  token: string;
}

interface LookupResponse {
  street: string;
  house_number: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
}

/**
 * Dirección coherente para el país dado. La API valida que ciudad y estado correspondan al
 * código postal, así que se obtienen de la misma fuente que usa la UI.
 */
export function lookupAddress(
  country = DEFAULT_COUNTRY,
  postalCode = buildPostalCode(),
  houseNumber = buildHouseNumber(),
): Cypress.Chainable<Address> {
  return apiRequest<LookupResponse>({
    method: 'GET',
    path: '/postcode-lookup',
    qs: { country, postcode: postalCode, house_number: houseNumber },
  }).then(({ body }) => ({
    street: body.street,
    house_number: houseNumber,
    city: body.city,
    state: body.state,
    country,
    postal_code: postalCode,
  }));
}

export function login(credentials: Credentials): Cypress.Chainable<string> {
  return apiRequest<{ access_token: string }>({
    method: 'POST',
    path: '/users/login',
    body: { email: credentials.email, password: credentials.password },
  }).then(({ body }) => body.access_token);
}

/** Registra un cliente nuevo por API y devuelve sus datos junto con un token vigente. */
export function createCustomer(overrides: Partial<NewUser> = {}): Cypress.Chainable<Customer> {
  const user = buildUser(overrides);

  return lookupAddress().then((address) =>
    apiRequest<{ id: string }>({
      method: 'POST',
      path: '/users/register',
      body: { ...user, address },
    }).then(({ body }) => login(user).then((token) => ({ ...user, id: body.id, address, token }))),
  );
}
