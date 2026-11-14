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

// Where an order is (orders.status), changed in the admin panel. Older orders have none: treat as NEW.
export const ORDER_STATUS = Object.freeze({
    NEW: 'new',             // just placed
    CONFIRMED: 'confirmed', // called / confirmed with the customer
    SENT: 'sent',           // handed to Econt
    DELIVERED: 'delivered', // received and paid on delivery
    CANCELLED: 'cancelled'
});

export const CURRENCY = 'EUR';

export const MAX_ITEM_QUANTITY = 99;

// Which storefront an article belongs to (articles.site)
export const SITE = Object.freeze({
    EQUIPMENT: 'equipment',
    HONEY: 'honey'
});

// Image types the admin can upload (POST /admin/images)
export const IMAGE_CONTENT_TYPE = Object.freeze({
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp'
});
