import { faker } from '@faker-js/faker';

import { adminToken, deleteProduct, findProductIdsByName } from '../support/api/admin';
import { money } from '../support/data/money';
import { catalogPage } from '../support/pages/catalog.page';

describe('F11 Administrador: alta de producto', { tags: ['@F11'] }, () => {
  const created: string[] = [];

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  // El entorno es público y compartido: se eliminan los productos creados por la prueba.
  afterEach(() => {
    if (created.length === 0) return;
    adminToken().then((token) => {
      created.splice(0).forEach((name) => {
        findProductIdsByName(name).then((ids) => {
          ids.forEach((id) => {
            deleteProduct(id, token);
          });
        });
      });
    });
  });

  it('crea un producto y lo muestra en el catálogo', { tags: ['@smoke'] }, () => {
    // Sin palabras de menos de 3 letras: la búsqueda del sitio usa FULLTEXT de MySQL y exige
    // todos los términos, así que un término corto (p. ej. "QA") impide cualquier coincidencia.
    const name = `Automation Tool ${faker.string.alpha(10).toUpperCase()}`;
    // Dentro del rango de precio que el catálogo muestra por defecto (1–100).
    const price = faker.number.float({ min: 10, max: 90, fractionDigits: 2 });
    created.push(name);

    cy.visit('/admin/products');
    cy.getByTest('product-add').click();
    cy.getByTest('page-title').should('have.text', 'Add Product');

    cy.getByTest('name').type(name);
    cy.getByTest('description').type(faker.commerce.productDescription());
    cy.getByTest('stock').type('25');
    cy.getByTest('price').type(price.toFixed(2));
    (['brand-id', 'category-id', 'product-image-id'] as const).forEach((select) => {
      cy.getByTest(select).find('option').should('have.length.greaterThan', 1);
      cy.getByTest(select).select(1);
    });
    cy.getByTest('product-submit').click();

    cy.contains('[role="alert"]', 'Product saved!').should('be.visible');

    // Reflejo en el catálogo público: la búsqueda encuentra exactamente el producto creado.
    catalogPage.visit();
    catalogPage.search(name);
    catalogPage.waitFor('search_completed');
    cy.getByTest('search-result-count').should('contain.text', `1 product found for '${name}'`);
    catalogPage.productNames().should('deep.equal', [name]);
    catalogPage.productPrices().should('deep.equal', [money(price)]);
  });
});
