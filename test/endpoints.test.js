import { describe, expect, test } from 'vitest';

import { endpoints, fillPath, errorResponseSchema, DELIVERY_METHOD } from '../src/index.js';

const ID = '66116cd169abda882949e942';
const product = { _id: ID, modelKey: 'hobby', category: 'sublimator', name: 'Kabo Хоби', price: 119, weight: 1.2, sortOrder: 1 };
const order = {
    _id: ID, orderNumber: 7, firstName: 'Иван', lastName: 'Петров', phoneNumber: '0888123456', email: 'ivan@example.bg',
    city: 9, cityName: 'Видин', regionName: 'Видин', postCode: '3700', countryCode: 'BGR', countryName: 'България',
    deliveryMethod: DELIVERY_METHOD.ECONT_ADDRESS, address: 'ул. Дунав 5', paymentMethod: 'on-delivery',
    isInvoice: false, invoiceDetails: null, products: [{ _id: ID, name: 'Kabo Хоби', price: 119, quantity: 2 }],
    productsPrice: 238, deliveryPrice: 7.43, totalPrice: 245.43, currency: 'EUR', isDelivered: false, isPaid: false,
    createdAt: '2026-11-08T10:00:00.000Z', updatedAt: '2026-11-08T10:00:00.000Z', termsAcceptedAt: '2026-11-08T10:00:00.000Z'
};

describe('endpoint descriptions', () => {
    test.each(Object.entries(endpoints))('%s has a method, an absolute path and a response schema', (name, endpoint) => {
        expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).toContain(endpoint.method);
        expect(endpoint.path).toMatch(/^\//);
        expect(endpoint.response.safeParse).toBeTypeOf('function');
        // every :param in the path is described by the params schema
        const pathParams = [...endpoint.path.matchAll(/:(\w+)/g)].map(match => match[1]);
        expect(Object.keys(endpoint.params?.shape ?? {})).toEqual(pathParams);
    });

    test('method + path pairs are unique', () => {
        const routes = Object.values(endpoints).map(({ method, path }) => `${method} ${path}`);
        expect(new Set(routes).size).toBe(routes.length);
    });
});

describe('fillPath', () => {
    test('fills and encodes path parameters', () => {
        expect(fillPath(endpoints.getProduct.path, { productId: ID })).toBe(`/products/${ID}`);
        expect(fillPath('/a/:x', { x: 'с/лаш' })).toBe('/a/%D1%81%2F%D0%BB%D0%B0%D1%88');
        expect(fillPath('/products')).toBe('/products');
    });

    test('a missing parameter is an error, not "/products/undefined"', () => {
        expect(() => fillPath(endpoints.getProduct.path, {})).toThrow('productId');
    });
});

describe('inputs the backend checks', () => {
    test('query values arrive as strings and are converted', () => {
        expect(endpoints.getEcontOffices.query.parse({ countryCode: 'BGR', cityId: '9' }).cityId).toBe(9);
        expect(endpoints.searchCities.query.parse({ searchTerm: ' Видин ', limit: '5' })).toEqual({ searchTerm: 'Видин', limit: 5 });
    });

    test('invalid inputs are rejected', () => {
        expect(endpoints.getProduct.params.safeParse({ productId: 'nope' }).success).toBe(false);
        expect(endpoints.searchCities.query.safeParse({ searchTerm: '' }).success).toBe(false);
        expect(endpoints.searchCities.query.safeParse({ searchTerm: 'x'.repeat(51) }).success).toBe(false);
        expect(endpoints.getProducts.query.safeParse({ category: 'shoes' }).success).toBe(false);
    });
});

describe('responses', () => {
    test('products, a missing product, an order', () => {
        expect(endpoints.getProducts.response.safeParse({ products: [product] }).success).toBe(true);
        expect(endpoints.getProduct.response.safeParse({ product: null }).success).toBe(true);
        expect(endpoints.createOrder.response.safeParse(order).success).toBe(true);
        expect(endpoints.getOrder.response.safeParse({ ...order, products: [{ ...product, quantity: 2 }] }).success).toBe(true);
    });

    test('a changed field is caught', () => {
        expect(endpoints.createOrder.response.safeParse({ ...order, totalPrice: '245.43' }).success).toBe(false);
        expect(endpoints.getDeliveryPrices.response.safeParse({ currency: 'EUR', prices: { [DELIVERY_METHOD.ECONT_OFFICE]: 5.59 } }).success).toBe(false);
    });

    test('Econt objects may carry more fields than described', () => {
        const office = { id: 1, code: '760', name: 'Видин', address: { fullAddress: 'ул. 1', city: {} }, phones: [] };
        expect(endpoints.getEcontOffices.response.safeParse({ offices: [office] }).success).toBe(true);
    });

    test('errors are { message }', () => {
        expect(errorResponseSchema.safeParse({ message: 'phoneNumber: …' }).success).toBe(true);
    });
});
