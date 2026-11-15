import { describe, it, expect } from 'vitest';

import { articleInputSchema, loginSchema, imageUploadSchema, endpoints, MAX_IMAGE_BYTES, MESSAGES, productInputSchema, resellerInputSchema } from '../src/index.js';

describe('articles', () => {
    it('fills defaults and accepts a minimal article', () => {
        const article = articleInputSchema.parse({ slug: 'kakvo-e-varoa', site: 'equipment', title: ' Вароа ' });
        expect(article).toMatchObject({ title: 'Вароа', excerpt: '', readMinutes: 3, sections: [], published: false });
    });

    it('rejects slugs that are not latin-lowercase-with-dashes', () => {
        for (const slug of ['Какво', 'Kakvo', 'kakvo e', 'kakvo--e', '-kakvo', 'kakvo/e']) {
            expect(articleInputSchema.safeParse({ slug, site: 'equipment', title: 'x' }).success, slug).toBe(false);
        }
    });

    it('rejects an unknown site', () => {
        expect(articleInputSchema.safeParse({ slug: 'a', site: 'shop', title: 'x' }).success).toBe(false);
    });
});

describe('admin', () => {
    it('normalises the login email', () => {
        expect(loginSchema.parse({ email: ' Boris@Kabo.BG ', password: 'x' }).email).toBe('boris@kabo.bg');
    });

    it('limits image uploads to JPEG/PNG/WebP up to 7 MB', () => {
        expect(imageUploadSchema.safeParse({ contentType: 'image/gif', data: 'AAAA' }).success).toBe(false);
        const tooBig = 'A'.repeat(Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 4);
        expect(imageUploadSchema.safeParse({ contentType: 'image/jpeg', data: tooBig }).success).toBe(false);
        expect(imageUploadSchema.safeParse({ contentType: 'image/png', data: 'AAAA' }).success).toBe(true);
    });

    it('marks every /admin endpoint except login and logout as admin-only', () => {
        for (const [name, endpoint] of Object.entries(endpoints)) {
            const open = ['adminLogin', 'adminLogout'].includes(name) || !endpoint.path.startsWith('/admin');
            expect(endpoint.auth, name).toBe(open ? undefined : 'admin');
        }
    });
});

describe('site content', () => {
    it('fills defaults for a minimal shop, review and question', async () => {
        const { resellerInputSchema, reviewInputSchema, questionInputSchema } = await import('../src/index.js');
        expect(resellerInputSchema.parse({ site: 'honey', name: ' Пчелица ', city: 'Варна' }))
            .toMatchObject({ name: 'Пчелица', address: '', phone: '', website: '', models: [], sortOrder: 0 });
        expect(reviewInputSchema.parse({ site: 'equipment', name: 'Иван', text: 'Добър' }).detail).toBe('');
        expect(questionInputSchema.safeParse({ site: 'honey', question: 'Защо?', answer: '' }).success).toBe(false);
    });

    it('registers create/update/delete for every list, admin only', async () => {
        const { endpoints } = await import('../src/index.js');
        for (const name of ['Reseller', 'Review', 'Question']) {
            for (const action of ['Create', 'Update', 'Delete']) {
                expect(endpoints[`admin${action}${name}`]?.auth, `admin${action}${name}`).toBe('admin');
            }
        }
        expect(endpoints.getSiteContent.auth).toBeUndefined();
    });
});

describe('orders and messages in the admin', () => {
    it('reads older orders without a status as new, and checks status changes', async () => {
        const { orderUpdateSchema, ORDER_STATUS } = await import('../src/index.js');
        expect(orderUpdateSchema.parse({ status: 'sent', isPaid: false, trackingNumber: ' 123 ' }))
            .toEqual({ status: ORDER_STATUS.SENT, isPaid: false, trackingNumber: '123', adminNote: '' });
        expect(orderUpdateSchema.safeParse({ status: 'lost', isPaid: false }).success).toBe(false);
    });
});

describe('Bulgarian messages for numbers typed in the admin panel', () => {
    const messageFor = (schema, data, field) => schema.safeParse(data).error?.issues.find(issue => issue.path[0] === field)?.message;
    const article = { slug: 'test', site: 'equipment', title: 'Тест' };
    const product = { modelKey: 'gas', category: 'sublimator', name: 'Kabo Gas', price: 100, weight: 1.5, sortOrder: 1 };
    const shop = { site: 'equipment', name: 'Магазин', city: 'София' };

    it('warranty months: whole and at least 1, still optional', () => {
        expect(messageFor(productInputSchema, { ...product, warrantyMonths: 1.5 }, 'warrantyMonths')).toBe(MESSAGES.WHOLE_NUMBER);
        expect(messageFor(productInputSchema, { ...product, warrantyMonths: 0 }, 'warrantyMonths')).toBe('Въведете число не по-малко от 1.');
        expect(productInputSchema.safeParse({ ...product, warrantyMonths: 24 }).success).toBe(true);
        expect(productInputSchema.safeParse(product).success).toBe(true);
    });

    it('minutes to read: whole, from 1 to 120, 3 by default', () => {
        expect(messageFor(articleInputSchema, { ...article, readMinutes: 2.5 }, 'readMinutes')).toBe(MESSAGES.WHOLE_NUMBER);
        expect(messageFor(articleInputSchema, { ...article, readMinutes: 121 }, 'readMinutes')).toBe('Въведете число от 1 до 120.');
        expect(articleInputSchema.parse(article).readMinutes).toBe(3);
    });

    it('excerpt: up to 500 characters', () => {
        expect(messageFor(articleInputSchema, { ...article, excerpt: 'x'.repeat(501) }, 'excerpt')).toBe(MESSAGES.TOO_LONG);
        expect(articleInputSchema.parse({ ...article, excerpt: ' кратко ' }).excerpt).toBe('кратко');
    });

    it('position of a shop, review or question: whole, from 0 to 9999', () => {
        expect(messageFor(resellerInputSchema, { ...shop, sortOrder: -1 }, 'sortOrder')).toBe('Въведете число от 0 до 9999.');
        expect(messageFor(resellerInputSchema, { ...shop, sortOrder: 1.2 }, 'sortOrder')).toBe(MESSAGES.WHOLE_NUMBER);
        expect(resellerInputSchema.parse(shop).sortOrder).toBe(0);
    });
});
