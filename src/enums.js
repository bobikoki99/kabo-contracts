// Values the frontend and backend must agree on. Stored in the database as-is,
// so changing a value is a breaking change (major version + data migration).

export const DELIVERY_METHOD = Object.freeze({
    ECONT_OFFICE: 'econt-office',
    ECONT_ADDRESS: 'econt-address'
});

export const PAYMENT_METHOD = Object.freeze({
    ON_DELIVERY: 'on-delivery'
});

export const INVOICE_TYPE = Object.freeze({
    NATURAL_PERSON: 'NP',
    LEGAL_ENTITY: 'LE'
});

export const MESSAGE_TYPE = Object.freeze({
    CONTACT: 'contact',      // contacts page
    WHOLESALE: 'wholesale'   // for-resellers page
});

// Which storefront sells a product (products.category)
export const PRODUCT_CATEGORY = Object.freeze({
    SUBLIMATOR: 'sublimator',
    HONEY: 'honey'
});

// Who a sublimator model is for (products.audience)
export const PRODUCT_AUDIENCE = Object.freeze({
    HOBBY: 'hobby',
    PRO: 'pro'
});

export const CURRENCY = 'EUR';

export const MAX_ITEM_QUANTITY = 99;
