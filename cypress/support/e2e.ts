import 'cypress-mochawesome-reporter/register';
import './commands';

import { register as registerGrep } from '@cypress/grep';

registerGrep();

// Evidencia también en pruebas exitosas: captura del estado final de la vista. El reporter adjunta
// automáticamente toda captura tomada durante la prueba. Las fallidas ya tienen su captura
// automática (screenshotOnRunFailure), así que aquí se omiten para no duplicarla.
afterEach(function (this: Mocha.Context) {
  const test = this.currentTest;
  if (test?.state !== 'passed') return;
  cy.screenshot(`${test.title} -- estado final`, { capture: 'viewport', log: false });
});
