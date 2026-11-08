import { describe, it, expect } from 'vitest';

import { articleInputSchema, loginSchema, imageUploadSchema, endpoints, MAX_IMAGE_BYTES } from '../src/index.js';

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
