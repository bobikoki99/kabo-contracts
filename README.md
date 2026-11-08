# @kabo/contracts

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

**Belongs here:** request bodies, response shapes and values that both sides must read the same way.
**Does not:** React or UI code (→ `@kabo/shared` in the frontend), business logic such as prices or
Econt calls (→ backend), secrets, environment config.

## Install

From a Git tag, no registry needed:

```bash
npm install github:bobikoki99/kabo-contracts#v1.0.0
```

```json
"dependencies": { "@kabo/contracts": "github:bobikoki99/kabo-contracts#v1.0.0" }
```

Plain ES modules, no build step. The backend (CommonJS) can `require()` it on Node ≥ 20.19.

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

### Two rules worth knowing

- **All errors at once.** Zod skips an object's cross-field rules when any field fails, so the checkout
  schema keeps its fields loose and checks every "required" rule in one `superRefine`. A customer who
  submits an empty form sees every missing field, not just the first few.
- **An empty required field gets only "required"**, never "required" plus "invalid email".

## Change a rule

1. Edit the schema and its test in `test/`; `npm test`.
2. Bump `version` in `package.json`, add a line to `CHANGELOG.md`, commit, `git tag vX.Y.Z`, push with tags.
3. Update the tag in the **backend first**, then the frontend.

| Change | Version | Example |
|---|---|---|
| Message text, bug fix | patch `1.0.1` | typo in an error message |
| New optional field, new enum value | minor `1.1.0` | `orders.store` |
| Field renamed, removed or newly required; enum value changed | major `2.0.0` | `phoneNumber` → `phone` – deploy backend before frontend |

## Develop

```bash
npm install
npm test
```
