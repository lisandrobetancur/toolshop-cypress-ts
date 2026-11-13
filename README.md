# toolshop-cypress-ts

Suite E2E de [Toolshop (Practice Software Testing)](https://practicesoftwaretesting.com) con
**Cypress + TypeScript**. Cubre los flujos F01–F12 (41 pruebas) contra la UI y la API públicas.

## Requisitos

- Node.js 22, 24 o ≥ 26 (el repo fija 24 en `.nvmrc`).
- npm 12 o superior (usa `allowScripts` para aprobar los scripts de instalación de Cypress y WebKit).
- Chrome o Firefox instalados localmente. WebKit se instala con `playwright-webkit`.

## Configuración

```bash
cp .env.example .env   # completa ADMIN_EMAIL y ADMIN_PASSWORD
npm ci
```

| Variable         | Uso                                                            | Por defecto                               |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------- |
| `BASE_URL`       | URL de la UI                                                   | `https://practicesoftwaretesting.com`     |
| `API_URL`        | URL de la API (precondiciones y oráculos)                      | `https://api.practicesoftwaretesting.com` |
| `ADMIN_EMAIL`    | Cuenta de administrador (F11, F12)                             | —                                         |
| `ADMIN_PASSWORD` | Contraseña de esa cuenta                                       | —                                         |
| `BROWSER`        | Navegador de `npm test`: `chrome`, `firefox`, `edge`, `webkit` | `chrome`                                  |

Las cuentas por defecto están en el
[README de Toolshop](https://github.com/testsmith-io/practice-software-testing#default-accounts).
Los secretos solo se leen con `cy.env()` y nunca quedan en el código. En CI se cargan desde los
_secrets_ del repositorio `ADMIN_EMAIL` y `ADMIN_PASSWORD`; las URL pueden cambiarse con las
_variables_ `BASE_URL` y `API_URL`.

## Ejecución

```bash
npm test                         # toda la suite en $BROWSER (chrome por defecto)
npm run test:smoke               # solo @smoke
npm run test:regression          # solo @regression
npm run cy:run -- --expose grepTags=@F06,grepFilterSpecs=true   # un flujo por ID
npm run test:firefox             # navegador específico
npm run test:webkit              # requiere: npx playwright-webkit install webkit
npm run cy:open                  # modo interactivo
npm run check                    # tipos + lint + formato
```

Cada prueba lleva una etiqueta de flujo (`@F01`…`@F12`) y una de tipo (`@smoke` o
`@regression`). El reporte HTML queda en `cypress/reports/index.html` como un único archivo
autocontenido (unos 8,5 MB con la suite completa):

- **Capturas en todas las pruebas.** Las que pasan llevan una captura del estado final de la
  vista ("estado final"), tomada en un `afterEach` de `cypress/support/e2e.ts`. Las que fallan
  llevan la captura automática del momento del fallo ("Failed screenshot").
- **Video solo en fallos.** Se graba cada spec, pero el video se borra si el spec no tuvo
  intentos fallidos.

## Estructura

```
cypress/
  e2e/                  F01-registro.cy.ts … F12-admin-pedido.cy.ts
  support/
    api/                cliente HTTP y precondiciones: usuarios, carritos, pedidos, favoritos, admin
    data/               factories con faker (usuarios, pagos) y utilidades de importes
    pages/              objetos de página livianos (selectores y acciones)
    commands.ts         getByTest, loginAs/loginAsAdmin (cy.session), visitWithCart, texts
    e2e.ts              registro de grep y del reporter
cypress.config.ts       reporter, reintentos solo en CI, video solo en fallos, grep + split
.github/workflows/e2e.yml
```

## Decisiones de diseño

- **Comandos personalizados + objetos de página livianos.** Es el patrón idiomático de Cypress:
  la cadena de comandos ya resuelve esperas y reintentos, así que las páginas son objetos
  planos con selectores y acciones, sin estado ni herencia. Lo transversal (login, carrito,
  `data-test`) vive en comandos personalizados tipados.
- **Precondiciones por API, UI solo para lo que se valida.** Usuarios, carritos, pedidos y
  favoritos se crean con `cy.request`. Cada prueba registra su propio cliente con correo único,
  así que puede correr sola y en paralelo, y los casos negativos nunca bloquean cuentas
  compartidas (la API bloquea tras varios intentos fallidos).
- **Sesión con `cy.session()`.** El login se hace por API y el token se guarda donde lo espera
  la app (`localStorage["auth-token"]`). Como el token expira a los 5 minutos, la validación de
  la sesión consulta `/users/me` y fuerza un login nuevo si ya no sirve. F01 y F02 usan login
  por UI porque es lo que validan.
- **La API como oráculo.** Las aserciones comparan la UI con lo que devuelve la API usando los
  mismos criterios que la página (búsqueda, filtros, orden, paginación) y verifican resultados
  de negocio: totales en centavos, facturas registradas, medio de pago y estado del pedido.
- **Selectores.** Siempre `data-test` (`cy.getByTest`). Cuando el sitio no lo tiene, se usa
  texto o atributos accesibles (`aria-label="Page-2"`, encabezado "Related products"). Hay un
  único caso estructural: el botón de eliminar del carrito no tiene `data-test` ni nombre
  accesible.
- **Sin esperas fijas.** La regla `cypress/no-unnecessary-waiting` está en `error`. Se espera por
  condiciones que expone la app (`data-test="search_completed"`, mensajes, valores
  autocompletados) o por alias de `cy.intercept`.
- **Entorno compartido.** F11 elimina por API los productos que crea.

## Versiones

Consultadas en npm y en las releases de GitHub el **2026-11-12**, y fijadas como versiones exactas.

| Dependencia                  | Versión | Nota                                                   |
| ---------------------------- | ------- | ------------------------------------------------------ |
| cypress                      | 16.3.0  |                                                        |
| typescript                   | 6.0.3   | La última es 7.0.2; `typescript-eslint` exige `<6.1.0` |
| eslint                       | 10.14.0 | Flat config                                            |
| @eslint/js                   | 10.0.1  |                                                        |
| typescript-eslint            | 8.72.2  | `strictTypeChecked` + `stylisticTypeChecked`           |
| eslint-plugin-cypress        | 7.0.4   |                                                        |
| eslint-config-prettier       | 10.1.8  |                                                        |
| prettier                     | 3.10.1  |                                                        |
| @cypress/grep                | 7.0.0   | Parámetros con `--expose` (API de Cypress ≥ 15.10)     |
| cypress-mochawesome-reporter | 5.0.0   | Reporte HTML con capturas y video                      |
| cypress-split                | 1.25.0  | Shards en CI sin Cypress Cloud                         |
| playwright-webkit            | 1.65.0  | Motor WebKit para Cypress (experimental)               |
| @faker-js/faker              | 10.6.0  |                                                        |
| dotenv                       | 18.0.10 |                                                        |
| @types/node                  | 26.6.6  |                                                        |
| globals                      | 17.14.0 |                                                        |
| actions/checkout             | v7.0.1  | GitHub Actions                                         |
| actions/setup-node           | v7.1.0  |                                                        |
| actions/upload-artifact      | v7.0.2  |                                                        |
| cypress-io/github-action     | v7.4.9  | Caché de npm y del binario de Cypress                  |

Se usan las APIs vigentes de Cypress 16: `expose` / `Cypress.expose()` para configuración pública
y `cy.env()` para secretos, en lugar del `Cypress.env()` deprecado.

## Cobertura

Estado: ✅ = cada flujo pasó 3 ejecuciones seguidas en Chrome, más una corrida final completa
(41/41). En WebKit pasaron todos los specs; F11 y F12 tuvieron que repetirse porque su primera
corrida coincidió con el reinicio horario de la base (login de admin 401 y registro 500 a las
21:00).
Firefox: sin verificar localmente (no está instalado en la máquina de desarrollo); se ejecuta en CI.

| ID  | Flujo                                               | Pruebas | Estado | Notas                                                                                       |
| --- | --------------------------------------------------- | ------: | :----: | ------------------------------------------------------------------------------------------- |
| F01 | Registro de cliente nuevo y primer login            |       3 |   ✅   | Incluye obligatorios y correo duplicado                                                     |
| F02 | Login: válidas, inválidas y validaciones            |       5 |   ✅   |                                                                                             |
| F03 | Catálogo: búsqueda, filtros, orden y paginación     |       6 |   ✅   | Categoría, marca, precio y nombre, sin resultados                                           |
| F04 | Detalle: cantidad, carrito, relacionados            |       4 |   ✅   |                                                                                             |
| F05 | Carrito: cantidades, eliminar, totales              |       4 |   ✅   |                                                                                             |
| F06 | Checkout autenticado: dirección, pago, confirmación |       2 |   ✅   | Verifica la factura creada por API                                                          |
| F07 | Checkout parametrizado por medio de pago            |       4 |   ✅   | Contra reembolso, transferencia, pago a plazos y tarjeta regalo (tarjeta de crédito en F06) |
| F08 | Favoritos: agregar, listar, eliminar                |       4 |   ✅   | Incluye duplicado y estado vacío                                                            |
| F09 | Cuenta: perfil y facturas                           |       2 |   ≈    | Equivalente: consulta la factura de un pedido propio, no la de F06 (ver abajo)              |
| F10 | Contacto con adjunto y validaciones                 |       4 |   ✅   | El sitio solo acepta `.txt` de 0 bytes                                                      |
| F11 | Admin: crear producto y verlo en el catálogo        |       1 |   ✅   | Elimina el producto al terminar                                                             |
| F12 | Admin: cambiar estado y verificarlo como cliente    |       2 |   ≈    | Equivalente: el cliente lo verifica por API (ver abajo)                                     |

### Diferencias con la especificación

- **F09.** Reutilizar el pedido de F06 acoplaría las pruebas y rompería la ejecución aislada y en
  paralelo. F09 crea su propio pedido por API y consulta esa factura por la UI.
- **F12.** Ninguna pantalla del cliente muestra el estado del pedido (ni la lista ni el detalle
  de facturas). El administrador cambia el estado por la UI y el cliente lo consulta con su
  propio token en `GET /invoices/{id}`. Se usa `COMPLETED` porque un job del servidor
  (`order:update`, cada 10 minutos) avanza los demás estados por su cuenta.

## Hallazgos sobre el sitio

- **La base se reinicia cada hora** (`migrate:fresh --seed` en producción). El README de Toolshop
  no lo menciona: está en `sprint5/API/app/Console/Kernel.php`. Una ejecución que cruce el
  reinicio puede fallar con timeouts o datos inexistentes; en CI lo absorben los reintentos.
- **La búsqueda ignora términos de menos de 3 caracteres** (FULLTEXT de MySQL en modo booleano
  con todos los términos obligatorios). Buscar "QA Tool" no encuentra un producto llamado así,
  mientras que `GET /products?q=` sí lo encuentra. F11 genera nombres sin palabras cortas.
- **`/products/search` cachea resultados** y no aplica los filtros de precio ni de alquiler del
  listado. Por eso F03 usa ese mismo endpoint como oráculo de la búsqueda.
- **El checkout confirma en dos clics**: el primero valida el pago y el segundo crea la factura.
- **El mensaje de confirmación pierde el `id="invoice-number"`** porque Angular sanea el HTML, así
  que el número de factura se extrae del texto.
- **El menú no refresca el nombre** tras actualizar el perfil hasta recargar la página.

## Limitaciones de Cypress frente a los flujos

- **Trazas.** Cypress no genera trazas locales como Playwright; su equivalente (Test Replay)
  requiere Cypress Cloud. El reporte incluye una captura de cada prueba, y video solo de los
  specs con fallos (el resto se borra en `after:spec`).
- **WebKit es experimental** (`experimentalWebKitSupport`). Pasa la suite completa, pero en CI se
  marca como no bloqueante. Safari real no está soportado.
- **Paralelismo por spec.** Cypress no paraleliza dentro de un proceso. En CI se reparten los
  specs entre 3 shards por navegador con `cypress-split`.
- **Etiquetas estáticas.** `grepFilterSpecs` lee las etiquetas sin ejecutar el código, así que
  deben ser literales. Por eso F07 etiqueta el `describe` y no cada caso calculado.

## CI

`.github/workflows/e2e.yml`:

1. **quality**: tipos, lint y formato, sin descargar el binario de Cypress.
2. **e2e**: matriz Chrome × Firefox × WebKit, con 3 shards cada uno. La caché de npm y del binario
   la maneja `cypress-io/github-action`. Hay 2 reintentos solo en CI (`CI=true`), y WebKit
   tiene `continue-on-error`.
3. Cada shard publica `cypress/reports`, las capturas y los videos como artefacto
   `reporte-<navegador>-shard-<n>`.

El disparo manual (`workflow_dispatch`) acepta `grepTags`, por ejemplo `@smoke` o `@F06`.
