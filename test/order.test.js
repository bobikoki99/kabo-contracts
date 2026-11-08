import { describe, expect, test } from 'vitest';

import { checkoutSchema, createOrderSchema, MESSAGES, DELIVERY_METHOD, INVOICE_TYPE, PAYMENT_METHOD } from '../src/index.js';

// What the checkout form holds for a customer who filled in everything (office delivery)
const validCheckout = {
    firstName: ' Иван ',
    lastName: 'Петров',
    phoneNumber: '0888 123 456',
    email: 'ivan@example.bg',
    city: 1234,
    cityName: 'Видин',
    regionName: 'Видин',
    postCode: '3700',
    countryCode: 'BGR',
    countryName: 'България',
    deliveryMethod: DELIVERY_METHOD.ECONT_OFFICE,
    office: 55,
    officeCode: '760',
    officeName: 'Видин Център',
    officeAddress: 'ул. Примерна 1',
    address: '',
    paymentMethod: PAYMENT_METHOD.ON_DELIVERY,
    isInvoice: false,
    invoiceDetails: { invoiceType: INVOICE_TYPE.NATURAL_PERSON, city: '', address: '' },
    termsAccepted: true
};

const errorsOf = (schema, value) => {
    const result = schema.safeParse(value);
    return result.success ? {} : Object.fromEntries(result.error.issues.map(issue => [issue.path.join('.'), issue.message]));
};

describe('checkoutSchema', () => {
    test('a complete form passes, trimmed and with numeric Econt ids', () => {
        const result = checkoutSchema.parse(validCheckout);

        expect(result.firstName).toBe('Иван');
        expect(result.city).toBe(1234);
        expect(result.office).toBe(55);
        expect(result.paymentMethod).toBe(PAYMENT_METHOD.ON_DELIVERY);
    });

    test('an empty form reports every missing field at once', () => {
        expect(errorsOf(checkoutSchema, {})).toEqual({
            firstName: MESSAGES.REQUIRED,
            lastName: MESSAGES.REQUIRED,
            phoneNumber: MESSAGES.REQUIRED,
            email: MESSAGES.REQUIRED,
            city: MESSAGES.REQUIRED,
            deliveryMethod: MESSAGES.REQUIRED,
            termsAccepted: MESSAGES.TERMS_REQUIRED
        });
    });

    test('the form as initialised by the frontend (empty strings) reports the same', () => {
        const empty = { ...validCheckout, firstName: '', city: '', deliveryMethod: '', termsAccepted: false };

        expect(Object.keys(errorsOf(checkoutSchema, empty))).toEqual(['firstName', 'city', 'deliveryMethod', 'termsAccepted']);
    });

    test('invalid phone number and email', () => {
        const errors = errorsOf(checkoutSchema, { ...validCheckout, phoneNumber: '123', email: 'ivan@' });

        expect(errors).toEqual({ phoneNumber: MESSAGES.INVALID_PHONE, email: MESSAGES.INVALID_EMAIL });
    });

    test('phone numbers are accepted with spaces, dashes, brackets and +359', () => {
        ['0888123456', '+359 888 123 456', '00359888123456', '(02) 987-6543'].forEach(phoneNumber => {
            expect(checkoutSchema.safeParse({ ...validCheckout, phoneNumber }).success).toBe(true);
        });
    });

    test('unknown delivery method', () => {
        expect(errorsOf(checkoutSchema, { ...validCheckout, deliveryMethod: 'pigeon' })).toEqual({ deliveryMethod: MESSAGES.INVALID_CHOICE });
    });

    test('office delivery needs a chosen office (id, code and name)', () => {
        expect(errorsOf(checkoutSchema, { ...validCheckout, office: '' })).toEqual({ office: MESSAGES.REQUIRED });
        expect(errorsOf(checkoutSchema, { ...validCheckout, officeCode: '' })).toEqual({ office: MESSAGES.REQUIRED });
    });

    test('address delivery needs an address, not an office', () => {
        const toAddress = { ...validCheckout, deliveryMethod: DELIVERY_METHOD.ECONT_ADDRESS, office: '', officeCode: '', officeName: '' };

        expect(errorsOf(checkoutSchema, toAddress)).toEqual({ address: MESSAGES.REQUIRED });
        expect(checkoutSchema.safeParse({ ...toAddress, address: 'ул. Дунав 5' }).success).toBe(true);
    });

    test('invoice for a natural person', () => {
        const withInvoice = { ...validCheckout, isInvoice: true };

        expect(errorsOf(checkoutSchema, withInvoice)).toEqual({
            'invoiceDetails.city': MESSAGES.REQUIRED,
            'invoiceDetails.address': MESSAGES.REQUIRED,
            'invoiceDetails.firstName': MESSAGES.REQUIRED,
            'invoiceDetails.lastName': MESSAGES.REQUIRED
        });

        const filled = { ...withInvoice, invoiceDetails: { invoiceType: 'NP', firstName: 'Иван', lastName: 'Петров', city: '1234', address: 'ул. Дунав 5' } };
        expect(checkoutSchema.parse(filled).invoiceDetails.city).toBe(1234);
    });

    test('invoice for a company, VAT number only when VAT registered', () => {
        const company = {
            invoiceType: INVOICE_TYPE.LEGAL_ENTITY, companyName: 'Кабо ЕООД', materialResponsiblePerson: 'Иван Петров',
            companyIdentificationNumber: '123456789', city: 1234, address: 'ул. Дунав 5'
        };

        expect(checkoutSchema.safeParse({ ...validCheckout, isInvoice: true, invoiceDetails: company }).success).toBe(true);
        expect(errorsOf(checkoutSchema, { ...validCheckout, isInvoice: true, invoiceDetails: { ...company, isVATRegistered: true } }))
            .toEqual({ 'invoiceDetails.vatNumber': MESSAGES.REQUIRED });
    });

    test('invoice fields are ignored without an invoice', () => {
        expect(checkoutSchema.safeParse({ ...validCheckout, invoiceDetails: { invoiceType: 'LE' } }).success).toBe(true);
    });

    test('over-long text is rejected', () => {
        expect(errorsOf(checkoutSchema, { ...validCheckout, address: 'x'.repeat(301), deliveryMethod: DELIVERY_METHOD.ECONT_ADDRESS }))
            .toEqual({ address: MESSAGES.TOO_LONG });
    });

    test('unknown fields are dropped', () => {
        expect(checkoutSchema.parse({ ...validCheckout, totalPrice: 0 })).not.toHaveProperty('totalPrice');
    });
});

describe('createOrderSchema', () => {
    const products = [{ _id: '66116cd169abda882949e942', quantity: 2 }];

    test('the checkout form plus cart lines passes', () => {
        expect(createOrderSchema.parse({ ...validCheckout, products }).products).toEqual(products);
    });

    test('an order needs a non-empty, valid cart', () => {
        expect(errorsOf(createOrderSchema, { ...validCheckout, products: [] })).toEqual({ products: MESSAGES.CART_EMPTY });
        expect(createOrderSchema.safeParse({ ...validCheckout, products: [{ _id: 'abc', quantity: 1 }] }).success).toBe(false);
        expect(createOrderSchema.safeParse({ ...validCheckout, products: [{ ...products[0], quantity: 100 }] }).success).toBe(false);
    });

    test('the same customer rules apply as in the form', () => {
        expect(errorsOf(createOrderSchema, { ...validCheckout, email: 'nope', products })).toEqual({ email: MESSAGES.INVALID_EMAIL });
    });
});
