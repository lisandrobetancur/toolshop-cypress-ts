import 'dotenv/config';

import { rm } from 'node:fs/promises';

import { plugin as grepPlugin } from '@cypress/grep/plugin';
import { defineConfig } from 'cypress';
import { afterRunHook, beforeRunHook } from 'cypress-mochawesome-reporter/lib';
import cypressSplit from 'cypress-split';

const isCI = Boolean(process.env.CI);

/**
 * Cypress conserva un único manejador por evento de Node. Este adaptador permite que varios
 * plugins (y esta configuración) se suscriban al mismo evento sin pisarse entre sí.
 */
function composableOn(on: Cypress.PluginEvents): Cypress.PluginEvents {
  type Handler = (...args: unknown[]) => unknown;
  const handlers = new Map<string, Handler[]>();

  return (event: string, handler: Handler | object) => {
    if (typeof handler !== 'function') {
      // `task` recibe un objeto, no una función: se registra tal cual.
      (on as (e: string, h: object) => void)(event, handler);
      return;
    }
    const registered = handlers.get(event);
    if (registered) {
      registered.push(handler as Handler);
      return;
    }
    const list: Handler[] = [handler as Handler];
    handlers.set(event, list);
    (on as (e: string, h: Handler) => void)(event, async (...args: unknown[]) => {
      let result: unknown;
      for (const fn of list) {
        const value = await fn(...args);
        if (value !== undefined) result = value;
      }
      return result;
    });
  };
}

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'Toolshop E2E — Cypress',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    videoOnFailOnly: true,
    saveAllAttempts: false,
  },

  // Evidencia solo en fallos: capturas automáticas y video (los de specs en verde se borran).
  screenshotOnRunFailure: true,
  video: true,

  // Reintentos únicamente en CI; en local un fallo debe verse de inmediato.
  retries: { runMode: isCI ? 2 : 0, openMode: 0 },

  viewportWidth: 1366,
  viewportHeight: 900,
  defaultCommandTimeout: 10_000,
  requestTimeout: 15_000,
  responseTimeout: 30_000,

  // Configuración pública (no sensible), accesible con Cypress.expose().
  expose: {
    apiUrl: process.env.API_URL ?? 'https://api.practicesoftwaretesting.com',
  },

  // Secretos: solo accesibles con cy.env(), nunca quedan en el código.
  env: {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  },

  e2e: {
    baseUrl: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    experimentalWebKitSupport: true,

    setupNodeEvents(cypressOn, config) {
      const on = composableOn(cypressOn);

      on('before:run', async (details) => {
        await beforeRunHook(details);
      });
      on('after:run', async () => {
        await afterRunHook();
      });

      // Video solo en fallos: se elimina el de cualquier spec sin intentos fallidos.
      on('after:spec', async (_spec, results) => {
        const failed = results.tests.some((test) =>
          test.attempts.some((attempt) => attempt.state === 'failed'),
        );
        if (!failed && results.video) {
          await rm(results.video, { force: true });
        }
      });

      cypressSplit(on, config);
      grepPlugin(config);
      return config;
    },
  },
});
