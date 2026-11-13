import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import cypress from 'eslint-plugin-cypress';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['node_modules', 'cypress/reports', 'cypress/videos', 'cypress/screenshots'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['cypress/**/*.ts'],
    extends: [cypress.configs.recommended],
    rules: {
      // Sin sleeps fijos: solo esperas automáticas o por condición.
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/no-force': 'error',
      'cypress/no-pause': 'error',
      'cypress/no-debug': 'error',
      // Los comandos personalizados se declaran aumentando el namespace global de Cypress.
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  { files: ['**/*.mjs'], extends: [tseslint.configs.disableTypeChecked] },
  prettier,
);
