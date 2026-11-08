# kabo-contracts

The data contracts shared by `kabobee-frontend` and `kabobee-backend`: [zod](https://zod.dev) schemas
and enums, in plain JavaScript. A rule written here is enforced in the browser (form errors) **and**
on the server (400 responses) with the same Bulgarian message.

## What is in it

| File | Exports | Used by |
|---|---|---|
| `src/enums.js` | `DELIVERY_METHOD`, `PAYMENT_METHOD`, `INVOICE_TYPE`, `MESSAGE_TYPE`, `PRODUCT_CATEGORY`, `PRODUCT_AUDIENCE`, `CURRENCY`, `MAX_ITEM_QUANTITY` | both |
| `src/common.js` | `MESSAGES` (Bulgarian error texts), `EMAIL_REGEX`, `PHONE_NUMBER_REGEX`, building blocks (`requiredText`, `optionalText`, `econtId`, …) | both |
| `src/order.js` | `checkoutSchema` (checkout form), `createOrderSchema` (`POST /orders` = form + `products`) | form / API |
| `src/cart.js` | `cartItemSchema`, `cartItemsSchema`, `deliveryPriceRequestSchema` (`POST /econt/delivery/price`) | API |
| `src/message.js` | `contactMessageSchema`, `wholesaleMessageSchema` (forms), `createMessageSchema` (`POST /messages`) | form / API |
| `src/product.js` | `productInputSchema` (seed script), `productSchema` (`GET /products`) | both |
| `src/econt.js` | `citySchema`, `econtOfficeSchema`, `deliveryPricesSchema` (responses) | both |
| `src/endpoints.js` | **`endpoints`** – every backend endpoint: method, path, input and response schemas; `errorResponseSchema`, `fillPath` | both |

**Belongs here:** request bodies, response shapes and values that both sides must read the same way.
**Does not:** React or UI code (→ `@kabo/shared` in the frontend), business logic such as prices or
Econt calls (→ backend), secrets, environment config.

## Install

Published on npmjs.com as [`kabo-contracts`](https://www.npmjs.com/package/kabo-contracts); no login needed.
Install it under the name the code imports, `@kabo/contracts`, with an npm alias:

```bash
npm install @kabo/contracts@npm:kabo-contracts@^1.0.3
```

```json
"dependencies": { "@kabo/contracts": "npm:kabo-contracts@^1.0.3" }
```

`^1.0.3` takes new patch and minor versions on the next `npm update`; a major version (breaking
change) needs an explicit bump. Plain ES modules, no build step. The backend (CommonJS) can
`require()` it on Node ≥ 20.19.

## Use

```js
// frontend – checkout form
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema } from '@kabo/contracts';

const form = useForm({ defaultValues, resolver: zodResolver(checkoutSchema) });
```

```js
// backend – POST /orders
const { createOrderSchema } = require('@kabo/contracts');

const result = createOrderSchema.safeParse(req.body);
if (!result.success) {
    return res.status(400).json({ message: result.error.issues[0].message, issues: result.error.issues });
}
const order = result.data; // trimmed strings, numeric Econt ids, unknown fields removed
```

Editor types without TypeScript (VS Code reads JSDoc):

```js
/** @param {import('@kabo/contracts').CreateOrder} order */
```

### Endpoints: one description, both sides built from it

```js
endpoints.createOrder = {
    method: 'POST', path: '/orders',
    body: createOrderSchema,     // checked by the checkout form and by the backend
    response: orderSchema        // checked by backend tests and, in development, by the frontend
};
```

- **Backend**: routes are registered from the description (`contractRoute(router, endpoints.createOrder, handler)`),
  so path, method and input checks cannot drift; a contract test calls every endpoint and checks the
  real answer against `response`.
- **Frontend**: RTK Query endpoints are built from the same description (URL via `fillPath`); in
  development each answer is checked against `response` and a mismatch is logged.
- Errors (400, 404, 500) are always `{ message }` (`errorResponseSchema`).

Adding or changing an endpoint: describe it here first (minor version for a new endpoint or optional
field, major for anything that breaks existing callers), then implement it in the backend, then use it in
the frontend.

### Two rules worth knowing

- **All errors at once.** Zod skips an object's cross-field rules when any field fails, so the checkout
  schema keeps its fields loose and checks every "required" rule in one `superRefine`. A customer who
  submits an empty form sees every missing field, not just the first few.
- **An empty required field gets only "required"**, never "required" plus "invalid email".

## Change a rule

1. In a branch: edit the schema and its test in `test/`; `npm test`.
2. Bump `version` in `package.json` (see the table) and add a line to `CHANGELOG.md`; open a pull request.
   GitHub runs the tests on the PR.
3. Merge into `main`. The **Test and publish** action publishes the new version to npm and tags the
   commit `vX.Y.Z`. A merge without a version bump (e.g. README only) publishes nothing.
4. `npm update @kabo/contracts` in the **backend first**, then the frontend (for a major version,
   change the range in `package.json`, e.g. `npm:kabo-contracts@^2.0.0`).

| Change | Version | Example |
|---|---|---|
| Message text, bug fix | patch `1.0.1` | typo in an error message |
| New optional field, new enum value | minor `1.1.0` | `orders.store` |
| Field renamed, removed or newly required; enum value changed | major `2.0.0` | `phoneNumber` → `phone` – deploy backend before frontend |

## Publishing setup (once)

Releases are published from `main` by `.github/workflows/publish.yml` with npm **trusted publishing**: no token,
nothing expires. Configured on npmjs.com → kabo-contracts → Settings → Trusted Publisher →
GitHub Actions (`bobikoki99` / `kabo-contracts` / `publish.yml`), with publishing access set to
"Require two-factor authentication and disallow tokens". Nobody needs to log in to npm locally.

The very first version was published with a 7-day token in the `NPM_TOKEN` secret, because trusted
publishing can only be enabled for a package that already exists; that secret is deleted afterwards.

## Develop

```bash
npm install
npm test
```
