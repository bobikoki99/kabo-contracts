# Changelog

## 1.1.0 – 2026-11-08

- `endpoints`: every backend endpoint described once – method, path, `params` / `query` / `body`
  schemas and the `response` schema. The backend registers its routes from it and tests its real
  answers against `response`; the frontend builds its RTK Query endpoints from it.
- Response schemas: `orderSchema`, `citySchema`, `econtOfficeSchema`, `deliveryPricesSchema`,
  `errorResponseSchema`.
- `fillPath(path, params)` turns `/products/:productId` into a URL.
- `getProducts` takes an optional `category` query; `searchCities` limits `searchTerm` to 1–50 characters.

## 1.0.3 – 2026-11-08

- Published on npmjs.com as `kabo-contracts` (install as `@kabo/contracts` via `npm:kabo-contracts@^1.0.3`); a GitHub Action publishes every version tag. No schema changes.

## 1.0.2 – 2026-11-08

- Fix: Econt ids (`city`, `office`, `invoiceDetails.city`) accept `null`, so a parsed checkout can be parsed again. The form submits parsed values and the API rejected an unchosen office or invoice city.
- Tests: every request schema's output must parse again to the same value.

## 1.0.1 – 2026-11-08

- Unknown message `type` now gets the Bulgarian "Изберете една от възможностите." instead of zod's English default.

## 1.0.0 – 2026-11-08

First version, taken from the rules in kabobee-frontend (`CheckoutPage`, `ContactsPage`,
`ForResellersPage`, `utils/formValidations.js`) and kabobee-backend (`ordersService`, `messagesService`,
`cartService`, `orderConstants`). Where the two disagreed, the contract settles it:

- Order phone number must be a Bulgarian number on both sides (the backend accepted any text).
- Office delivery needs office id, code and name; the error is reported on `office`.
- Wholesale inquiries require `company` (the backend did not).
- Message field limits from the backend (name 100, email 200, phone 30, company 150, city 100, message 5000) now apply in the forms too.
- "Required" message spelled correctly ("задължително"); server errors are the same Bulgarian texts as the forms.
- `PRODUCT_CATEGORY` (`sublimator`, `honey`) added for the multi-store setup.
