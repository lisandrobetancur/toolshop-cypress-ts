export const cartPage = {
  /** Fila del carrito correspondiente a un producto. */
  row: (productName: string) =>
    cy.contains('[data-test="product-title"]', productName).closest('tr'),

  setQuantity(productName: string, quantity: number): void {
    // Al escribir sobre el valor seleccionado se reemplaza; el cambio se confirma al salir del campo.
    this.row(productName)
      .findByTest('product-quantity')
      .type(`{selectall}${String(quantity)}`);
    this.row(productName).findByTest('product-quantity').blur();
  },

  remove(productName: string): void {
    // El botón de eliminar no tiene data-test ni nombre accesible: es el único enlace de la fila.
    this.row(productName).find('td').last().find('a').click();
  },

  linePrice: (productName: string) => cartPage.row(productName).findByTest('line-price'),
  quantity: (productName: string) => cartPage.row(productName).findByTest('product-quantity'),
  total: () => cy.getByTest('cart-total'),
  titles: () => cy.getByTest('product-title').texts(),
};
