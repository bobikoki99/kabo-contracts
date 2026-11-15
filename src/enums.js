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

// What a product is (products.category). Each storefront asks for its own categories:
// Kabo Пчелар shows sublimators on "Модели" (lineup + comparison table) and parts/other on "Части и оборудване".
export const PRODUCT_CATEGORY = Object.freeze({
    SUBLIMATOR: 'sublimator',
    PART: 'part',     // spare parts and accessories, can name the models they fit (fitsModels)
    OTHER: 'other',   // other equipment, e.g. a fruit dryer
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

// The storefront that sells each product category
export const SITE_OF_CATEGORY = Object.freeze({
    [PRODUCT_CATEGORY.SUBLIMATOR]: SITE.EQUIPMENT,
    [PRODUCT_CATEGORY.PART]: SITE.EQUIPMENT,
    [PRODUCT_CATEGORY.OTHER]: SITE.EQUIPMENT,
    [PRODUCT_CATEGORY.HONEY]: SITE.HONEY
});

// Image types the admin can upload (POST /admin/images)
export const IMAGE_CONTENT_TYPE = Object.freeze({
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp'
});
