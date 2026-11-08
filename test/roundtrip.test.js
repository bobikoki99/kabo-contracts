import { expect, test } from 'vitest';

import { checkoutSchema, createOrderSchema, contactMessageSchema, wholesaleMessageSchema, createMessageSchema, deliveryPriceRequestSchema } from '../src/index.js';

// The frontend submits the parsed form values and the backend parses them again,
// so every schema's output must be valid input that parses to the same value.
const products = [{ _id: '66116cd169abda882949e942', quantity: 1 }];
const customer = { firstName: ' Иван ', lastName: 'Петров', phoneNumber: '0888 123 456', email: 'ivan@example.bg', city: '9', termsAccepted: true };

const cases = [
    ['checkout, address delivery, no invoice', checkoutSchema, { ...customer, deliveryMethod: 'econt-address', address: 'ул. Дунав 5', office: '', invoiceDetails: { city: '' } }],
    ['checkout, office delivery, company invoice', checkoutSchema, {
        ...customer, deliveryMethod: 'econt-office', office: '55', officeCode: '760', officeName: 'Видин',
        isInvoice: true, invoiceDetails: { invoiceType: 'LE', companyName: 'Кабо', materialResponsiblePerson: 'Иван', companyIdentificationNumber: '123456789', city: '9', address: 'ул. Дунав 5' }
    }],
    ['order', createOrderSchema, { ...customer, deliveryMethod: 'econt-address', address: 'ул. Дунав 5', products }],
    ['contact message', contactMessageSchema, { name: ' Иван ', email: 'ivan@example.bg', message: 'Здравейте' }],
    ['wholesale message', wholesaleMessageSchema, { name: 'Иван', email: 'ivan@example.bg', company: 'Магазин', message: 'Здравейте' }],
    ['POST /messages', createMessageSchema, { name: 'Иван', email: 'ivan@example.bg', message: 'Здравейте' }],
    ['delivery price', deliveryPriceRequestSchema, { city: '9', items: products }]
];

test.each(cases)('%s: output parses again to the same value', (name, schema, input) => {
    const once = schema.parse(input);

    expect(schema.parse(once)).toEqual(once);
});
