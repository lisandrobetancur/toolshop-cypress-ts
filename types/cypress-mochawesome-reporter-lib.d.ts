// El paquete no publica tipos para su entrada `lib`; se declaran solo los hooks utilizados.
declare module 'cypress-mochawesome-reporter/lib' {
  export function beforeRunHook(details: Cypress.BeforeRunDetails): Promise<void>;
  export function afterRunHook(): Promise<void>;
}
