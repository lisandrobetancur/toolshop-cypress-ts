import { faker } from '@faker-js/faker';

export interface Address {
  street: string;
  house_number: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface NewUser {
  first_name: string;
  last_name: string;
  dob: string;
  phone: string;
  email: string;
  password: string;
}

export interface Credentials {
  email: string;
  password: string;
}

/** País y código postal de partida; calle, ciudad y estado los resuelve /postcode-lookup. */
export const DEFAULT_COUNTRY = 'US';

export function buildPostalCode(): string {
  return faker.string.numeric({ length: 5, allowLeadingZeros: false });
}

export function buildHouseNumber(): string {
  return String(faker.number.int({ min: 1, max: 999 }));
}

/**
 * Contraseña aleatoria que cumple la política del registro: 8+ caracteres, mayúsculas,
 * minúsculas, número, símbolo y no presente en listas de contraseñas filtradas.
 */
export function buildPassword(): string {
  return `${faker.string.alphanumeric(14)}aZ7!`;
}

/** Usuario único por ejecución: el correo combina marca de tiempo y sufijo aleatorio. */
export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const unique = `${String(Date.now())}.${faker.string.alphanumeric(6).toLowerCase()}`;
  return {
    first_name: faker.person.firstName().replace(/[^a-zA-Z]/g, ''),
    last_name: faker.person.lastName().replace(/[^a-zA-Z]/g, ''),
    dob: faker.date.birthdate({ mode: 'age', min: 25, max: 60 }).toISOString().slice(0, 10),
    phone: faker.string.numeric(10),
    email: `qa.${unique}@example.test`,
    password: buildPassword(),
    ...overrides,
  };
}
