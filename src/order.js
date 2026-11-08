import { z } from 'zod';

import { MESSAGES, optionalText, econtId, isEmail, isPhoneNumber, mongoId } from './common.js';
import { cartItemsSchema } from './cart.js';
import { DELIVERY_METHOD, PAYMENT_METHOD, INVOICE_TYPE, CURRENCY } from './enums.js';

// The fields are deliberately loose (missing → '') and every "required" rule lives in
// checkCheckout below. Zod skips an object's refinements when any field fails, so this
// is what lets a customer see all missing fields at once after the first submit.

const invoiceDetailsFields = z.object({
    invoiceType: z.enum(Object.values(INVOICE_TYPE), { error: MESSAGES.INVALID_CHOICE }).default(INVOICE_TYPE.NATURAL_PERSON),
    // Natural person (NP)
    firstName: optionalText(),
    lastName: optionalText(),
    nationalIdentityNumber: optionalText(),   // ЕГН, optional on purpose (less personal data)
    // Legal entity (LE)
    companyName: optionalText(),
    materialResponsiblePerson: optionalText(), // МОЛ
    companyIdentificationNumber: optionalText(), // ЕИК
    isVATRegistered: z.boolean().default(false),
    vatNumber: optionalText(),
    // Invoice address
    city: econtId,
    cityName: optionalText(),
    regionName: optionalText(),
    postCode: optionalText(),
    countryCode: optionalText(),
    countryName: optionalText(),
    address: optionalText()
});

const checkoutFields = z.object({
    // Contact
    firstName: optionalText(),
    lastName: optionalText(),
    phoneNumber: optionalText(),
    email: optionalText(),
    // Delivery city (Econt city code + display data)
    city: econtId,
    cityName: optionalText(),
    regionName: optionalText(),
    postCode: optionalText(),
    countryCode: optionalText(),
    countryName: optionalText(),
    // Delivery method: office fields or address
    deliveryMethod: optionalText(),
    office: econtId,
    officeCode: optionalText(),
    officeName: optionalText(),
    officeAddress: optionalText(),
    address: optionalText(),
    // Payment and invoice
    paymentMethod: z.enum(Object.values(PAYMENT_METHOD), { error: MESSAGES.INVALID_CHOICE }).default(PAYMENT_METHOD.ON_DELIVERY),
    isInvoice: z.boolean().default(false),
    invoiceDetails: invoiceDetailsFields.prefault({}),
    termsAccepted: z.boolean().default(false)
});

const requireValue = (ctx, value, path, message = MESSAGES.REQUIRED) => {
    if (value === '' || value === null) {
        ctx.addIssue({ code: 'custom', path, message });
        return false;
    }
    return true;
};

const checkCheckout = (order, ctx) => {
    ['firstName', 'lastName'].forEach(field => requireValue(ctx, order[field], [field]));

    if (requireValue(ctx, order.phoneNumber, ['phoneNumber']) && !isPhoneNumber(order.phoneNumber)) {
        ctx.addIssue({ code: 'custom', path: ['phoneNumber'], message: MESSAGES.INVALID_PHONE });
    }
    if (requireValue(ctx, order.email, ['email']) && !isEmail(order.email)) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: MESSAGES.INVALID_EMAIL });
    }

    requireValue(ctx, order.city, ['city']);

    if (requireValue(ctx, order.deliveryMethod, ['deliveryMethod']) && !Object.values(DELIVERY_METHOD).includes(order.deliveryMethod)) {
        ctx.addIssue({ code: 'custom', path: ['deliveryMethod'], message: MESSAGES.INVALID_CHOICE });
    }
    if (order.deliveryMethod === DELIVERY_METHOD.ECONT_OFFICE) {
        // The office is picked from a list that fills all three; any one missing means "no office chosen"
        const hasOffice = order.office !== null && order.officeCode !== '' && order.officeName !== '';
        requireValue(ctx, hasOffice ? order.office : null, ['office']);
    }
    if (order.deliveryMethod === DELIVERY_METHOD.ECONT_ADDRESS) {
        requireValue(ctx, order.address, ['address']);
    }

    if (order.isInvoice) {
        const invoice = order.invoiceDetails;
        const at = field => ['invoiceDetails', field];

        requireValue(ctx, invoice.city, at('city'));
        requireValue(ctx, invoice.address, at('address'));

        if (invoice.invoiceType === INVOICE_TYPE.NATURAL_PERSON) {
            ['firstName', 'lastName'].forEach(field => requireValue(ctx, invoice[field], at(field)));
        }
        if (invoice.invoiceType === INVOICE_TYPE.LEGAL_ENTITY) {
            ['companyName', 'materialResponsiblePerson', 'companyIdentificationNumber'].forEach(field => requireValue(ctx, invoice[field], at(field)));
            if (invoice.isVATRegistered) {
                requireValue(ctx, invoice.vatNumber, at('vatNumber'));
            }
        }
    }

    if (order.termsAccepted !== true) {
        ctx.addIssue({ code: 'custom', path: ['termsAccepted'], message: MESSAGES.TERMS_REQUIRED });
    }
};

// The checkout form (frontend): everything the customer fills in
export const checkoutSchema = checkoutFields.superRefine(checkCheckout);

// POST /orders: the checkout form plus the cart lines
export const createOrderSchema = checkoutFields
    .extend({ products: cartItemsSchema })
    .superRefine(checkCheckout);

/** @typedef {import('zod').infer<typeof checkoutSchema>} Checkout */
/** @typedef {import('zod').infer<typeof createOrderSchema>} CreateOrder */

// ---- What the backend returns for an order (POST /orders, GET /orders/:orderId) ----

const orderLineSchema = z.object({
    _id: mongoId,
    name: z.string(),
    price: z.number().nonnegative(),   // price paid, EUR
    quantity: z.number().int().positive()
});

const orderInvoiceSchema = z.object({
    invoiceType: z.enum(Object.values(INVOICE_TYPE)),
    city: z.number().int(),
    cityName: z.string(),
    postCode: z.string(),
    countryCode: z.string(),
    countryName: z.string(),
    address: z.string(),
    // natural person
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    nationalIdentityNumber: z.string().optional(),
    // legal entity
    companyName: z.string().optional(),
    materialResponsiblePerson: z.string().optional(),
    companyIdentificationNumber: z.string().optional(),
    isVATRegistered: z.boolean().optional(),
    vatNumber: z.string().optional()
});

export const orderSchema = z.object({
    _id: mongoId,
    orderNumber: z.number().int().positive(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string(),
    email: z.string(),
    city: z.number().int(),
    cityName: z.string(),
    regionName: z.string().optional(),
    postCode: z.string(),
    countryCode: z.string(),
    countryName: z.string(),
    deliveryMethod: z.enum(Object.values(DELIVERY_METHOD)),
    // office delivery
    office: z.number().int().nullable().optional(),
    officeCode: z.string().optional(),
    officeName: z.string().optional(),
    officeAddress: z.string().optional(),
    // address delivery
    address: z.string().optional(),
    paymentMethod: z.enum(Object.values(PAYMENT_METHOD)),
    isInvoice: z.boolean(),
    invoiceDetails: orderInvoiceSchema.nullable(),
    products: z.array(orderLineSchema).min(1),
    productsPrice: z.number().nonnegative(),
    deliveryPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    currency: z.literal(CURRENCY),
    isDelivered: z.boolean(),
    isPaid: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    termsAcceptedAt: z.string()
});

/** @typedef {import('zod').infer<typeof orderSchema>} Order */
