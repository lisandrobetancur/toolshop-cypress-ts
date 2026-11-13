import { getBrands, getCategoryTree, listProducts } from '../support/api/products';
import { parseMoney } from '../support/data/money';
import { catalogPage } from '../support/pages/catalog.page';

const names = (products: { name: string }[]): string[] => products.map((product) => product.name);

describe('F03 Catálogo', { tags: ['@F03'] }, () => {
  beforeEach(() => {
    catalogPage.visit();
  });

  it('busca productos por texto', { tags: ['@smoke'] }, () => {
    const query = 'pliers';

    listProducts({ q: query }).then((expected) => {
      expect(expected.total, 'coincidencias según la API').to.be.greaterThan(0);

      catalogPage.search(query);
      catalogPage.waitFor('search_completed');

      cy.getByTest('search-term').should('have.text', query);
      cy.getByTest('search-result-count').should('contain.text', String(expected.total));
      catalogPage.productNames().should('deep.equal', names(expected.data));
    });
  });

  it('informa cuando la búsqueda no tiene resultados', { tags: ['@regression'] }, () => {
    catalogPage.search('zzz-producto-inexistente');
    catalogPage.waitFor('search_completed');

    cy.getByTest('no-results').should('have.text', 'There are no products found.');
    cy.getByTest('product-name').should('not.exist');
  });

  it('filtra por categoría', { tags: ['@regression'] }, () => {
    getCategoryTree().then((tree) => {
      const category = tree.flatMap((parent) => parent.sub_categories)[0];
      if (!category) throw new Error('La API no devolvió subcategorías.');

      listProducts({ by_category: category.id }).then((expected) => {
        expect(expected.data, 'productos de la categoría').to.have.length.greaterThan(0);
        expected.data.forEach((product) => {
          expect(product.category.id, `categoría de ${product.name}`).to.equal(category.id);
        });

        catalogPage.toggleCategory(category.id);
        catalogPage.waitFor('filter_completed');

        catalogPage.productNames().should('deep.equal', names(expected.data));
      });
    });
  });

  it('filtra por marca', { tags: ['@regression'] }, () => {
    getBrands().then((brands) => {
      const brand = brands[0];
      if (!brand) throw new Error('La API no devolvió marcas.');

      listProducts({ by_brand: brand.id }).then((expected) => {
        expect(expected.data, 'productos de la marca').to.have.length.greaterThan(0);
        expected.data.forEach((product) => {
          expect(product.brand.id, `marca de ${product.name}`).to.equal(brand.id);
        });

        catalogPage.toggleBrand(brand.id);
        catalogPage.waitFor('filter_completed');

        catalogPage.productNames().should('deep.equal', names(expected.data));
      });
    });
  });

  it('ordena por precio ascendente y por nombre descendente', { tags: ['@regression'] }, () => {
    catalogPage.sortBy('price,asc');
    catalogPage.waitFor('sorting_completed');
    catalogPage.productPrices().should((prices) => {
      const values = prices.map(parseMoney);
      expect(values, 'precios en pantalla').to.have.length.greaterThan(1);
      expect(values, 'precios de menor a mayor').to.deep.equal([...values].sort((a, b) => a - b));
    });

    listProducts({ sort: 'name,desc' }).then((expected) => {
      catalogPage.sortBy('name,desc');
      catalogPage.productNames().should('deep.equal', names(expected.data));
    });
  });

  it('pagina los resultados', { tags: ['@regression'] }, () => {
    listProducts({ page: 1 }).then((firstPage) => {
      expect(firstPage.last_page, 'páginas del catálogo').to.be.greaterThan(1);
      catalogPage.productNames().should('deep.equal', names(firstPage.data));

      listProducts({ page: 2 }).then((secondPage) => {
        expect(names(secondPage.data), 'la página 2 trae otros productos').to.not.have.members(
          names(firstPage.data),
        );

        catalogPage.nextPage();
        catalogPage.productNames().should('deep.equal', names(secondPage.data));

        catalogPage.goToPage(1);
        catalogPage.productNames().should('deep.equal', names(firstPage.data));
      });
    });
  });
});
