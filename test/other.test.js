import { describe, expect, test } from 'vitest';

import {
    contactMessageSchema, wholesaleMessageSchema, createMessageSchema,
    deliveryPriceRequestSchema, productInputSchema, productSchema,
    MESSAGES, MESSAGE_TYPE, PRODUCT_CATEGORY
} from '../src/index.js';

const message = { name: 'Иван', email: 'ivan@example.bg', phoneNumber: '', message: 'Здравейте!' };

describe('messages', () => {
    test('contact form: name, email and message are required, all reported at once', () => {
        const result = contactMessageSchema.safeParse({ name: '', email: '', phoneNumber: '', message: '' });

        expect(result.error.issues.map(issue => issue.path[0])).toEqual(['name', 'email', 'message']);
        expect(result.error.issues.every(issue => issue.message === MESSAGES.REQUIRED)).toBe(true);
    });

    test('contact form: phone is optional but must be valid when given', () => {
        expect(contactMessageSchema.safeParse(message).success).toBe(true);
        expect(contactMessageSchema.safeParse({ ...message, phoneNumber: '12' }).error.issues[0].message).toBe(MESSAGES.INVALID_PHONE);
    });

    test('field length limits', () => {
        expect(contactMessageSchema.safeParse({ ...message, message: 'x'.repeat(5001) }).success).toBe(false);
        expect(contactMessageSchema.safeParse({ ...message, name: 'x'.repeat(101) }).success).toBe(false);
    });

    test('wholesale form needs the company', () => {
        expect(wholesaleMessageSchema.safeParse(message).error.issues[0].path).toEqual(['company']);
        expect(wholesaleMessageSchema.safeParse({ ...message, company: 'Пчеларски магазин' }).success).toBe(true);
    });

    test('POST /messages: missing type means contact; wholesale is checked as wholesale', () => {
        expect(createMessageSchema.parse(message).type).toBe(MESSAGE_TYPE.CONTACT);
        expect(createMessageSchema.safeParse({ ...message, type: 'wholesale' }).success).toBe(false);
        expect(createMessageSchema.parse({ ...message, type: 'wholesale', company: 'Магазин' }).company).toBe('Магазин');
        expect(createMessageSchema.safeParse({ ...message, type: 'spam' }).error.issues[0].message).toBe(MESSAGES.INVALID_CHOICE);
    });
});

describe('delivery price request', () => {
    test('needs a city and cart items', () => {
        expect(deliveryPriceRequestSchema.parse({ city: '1234', items: [{ _id: '66116cd169abda882949e942', quantity: 1 }] }).city).toBe(1234);
        expect(deliveryPriceRequestSchema.safeParse({ city: '', items: [] }).error.issues.map(issue => issue.path[0])).toEqual(['city', 'items']);
    });
});

describe('products', () => {
    const honey = {
        modelKey: 'honey-acacia-450', category: PRODUCT_CATEGORY.HONEY, name: 'Акациев мед',
        price: 9.5, weight: 0.7, sortOrder: 4, specs: { netWeight: '450 г' }
    };

    test('a honey product needs no sublimator fields', () => {
        expect(productInputSchema.parse(honey).highlights).toEqual([]);
    });

    test('API products carry an id, category must be known', () => {
        expect(productSchema.safeParse({ ...honey, _id: '6af0317bb730d7520dd4d3d8' }).success).toBe(true);
        expect(productInputSchema.safeParse({ ...honey, category: 'shoes' }).success).toBe(false);
    });
});

describe('product categories', () => {
    test('has parts and other equipment next to sublimators and honey, each sold by a site', async () => {
        const { PRODUCT_CATEGORY, SITE, SITE_OF_CATEGORY, productInputSchema, endpoints } = await import('../src/index.js');
        expect(Object.values(PRODUCT_CATEGORY).sort()).toEqual(['honey', 'other', 'part', 'sublimator']);
        for (const category of Object.values(PRODUCT_CATEGORY)) {
            expect(Object.values(SITE)).toContain(SITE_OF_CATEGORY[category]);
            expect(endpoints.getProducts.query.safeParse({ category }).success).toBe(true);
        }
        const part = productInputSchema.parse({
            modelKey: 'nozzle', category: 'part', name: 'Дюза', price: 8, weight: 0.1, sortOrder: 1, fitsModels: ['gas', 'gas-pro']
        });
        expect(part.fitsModels).toEqual(['gas', 'gas-pro']);
        expect(productInputSchema.safeParse({ ...part, category: 'spare' }).success).toBe(false);
    });
});

describe('site of a message', () => {
    test('POST /messages keeps the site it came from; older pages may leave it out', () => {
        expect(createMessageSchema.parse({ ...message, site: 'honey' }).site).toBe('honey');
        expect(createMessageSchema.parse({ ...message, type: MESSAGE_TYPE.WHOLESALE, company: 'Магазин', site: 'equipment' }).site).toBe('equipment');
        expect(createMessageSchema.parse(message).site).toBeUndefined();
        expect(createMessageSchema.safeParse({ ...message, site: 'landing' }).success).toBe(false);
    });
});
