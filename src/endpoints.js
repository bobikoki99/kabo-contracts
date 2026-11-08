import { z } from 'zod';

import { mongoId, MESSAGES } from './common.js';
import { PRODUCT_CATEGORY } from './enums.js';
import { productSchema, productInputSchema } from './product.js';
import { articleSchema, articleInputSchema, SLUG_REGEX } from './article.js';
import { loginSchema, adminSchema, imageUploadSchema } from './admin.js';
import { SITE } from './enums.js';
import { createOrderSchema, orderSchema } from './order.js';
import { deliveryPriceRequestSchema } from './cart.js';
import { createMessageSchema } from './message.js';
import { citySchema, econtOfficeSchema, deliveryPricesSchema } from './econt.js';

// Every HTTP endpoint of kabobee-backend, described once:
//   method + path   – Express path syntax; `fillPath` turns it into a URL on the client
//   params / query  – checked by the backend (query values arrive as strings, hence z.coerce)
//   body            – checked by the frontend form and by the backend
//   response        – what a successful (2xx) answer looks like; checked by backend tests and,
//                     in development, by the frontend
//   auth: 'admin'   – only for a logged-in admin (session cookie); otherwise 401
// Every error answer (400, 404, 500) is `errorResponseSchema`.
export const endpoints = Object.freeze({
    getProducts: {
        method: 'GET',
        path: '/products',
        query: z.object({ category: z.enum(Object.values(PRODUCT_CATEGORY), { error: MESSAGES.INVALID_CHOICE }).optional() }),
        response: z.object({ products: z.array(productSchema) })
    },
    getProduct: {
        method: 'GET',
        path: '/products/:productId',
        params: z.object({ productId: mongoId }),
        response: z.object({ product: productSchema.nullable() })   // null: no product with that id
    },
    createOrder: {
        method: 'POST',
        path: '/orders',
        body: createOrderSchema,
        response: orderSchema
    },
    getOrder: {
        method: 'GET',
        path: '/orders/:orderId',
        params: z.object({ orderId: mongoId }),
        response: orderSchema.extend({
            // Order lines joined with the product as it is now, plus the quantity and price paid
            products: z.array(productSchema.extend({ quantity: z.number().int().positive() }))
        })
    },
    getCities: {
        method: 'GET',
        path: '/econt/cities',
        response: z.array(citySchema)
    },
    searchCities: {
        method: 'GET',
        path: '/econt/cities/search',
        query: z.object({
            searchTerm: z.string().trim().min(1).max(50),
            limit: z.coerce.number().int().min(1).max(50).optional()
        }),
        response: z.array(citySchema)
    },
    getEcontOffices: {
        method: 'GET',
        path: '/econt/offices',
        query: z.object({
            countryCode: z.string().min(2).max(3),
            cityId: z.coerce.number().int().positive()
        }),
        response: z.object({ offices: z.array(econtOfficeSchema) })
    },
    getDeliveryPrices: {
        method: 'POST',
        path: '/econt/delivery/price',
        body: deliveryPriceRequestSchema,
        response: deliveryPricesSchema
    },
    sendMessage: {
        method: 'POST',
        path: '/messages',
        body: createMessageSchema,
        response: z.object({ success: z.literal(true) })
    },

    // Articles ("Полезно"): published ones only
    getArticles: {
        method: 'GET',
        path: '/articles',
        query: z.object({ site: z.enum(Object.values(SITE), { error: MESSAGES.INVALID_CHOICE }) }),
        response: z.object({ articles: z.array(articleSchema) })
    },
    getArticle: {
        method: 'GET',
        path: '/articles/:slug',
        params: z.object({ slug: z.string().regex(SLUG_REGEX) }),
        query: z.object({ site: z.enum(Object.values(SITE), { error: MESSAGES.INVALID_CHOICE }) }),
        response: z.object({ article: articleSchema.nullable() })   // null: no published article with that slug
    },

    // Admin panel (admin.kabo.bg)
    adminLogin: {
        method: 'POST',
        path: '/admin/login',
        body: loginSchema,
        response: z.object({ admin: adminSchema })
    },
    adminLogout: {
        method: 'POST',
        path: '/admin/logout',
        response: z.object({ success: z.literal(true) })
    },
    adminMe: {
        method: 'GET',
        path: '/admin/me',
        auth: 'admin',
        response: z.object({ admin: adminSchema })
    },
    adminCreateProduct: {
        method: 'POST',
        path: '/admin/products',
        auth: 'admin',
        body: productInputSchema,
        response: z.object({ product: productSchema })
    },
    adminUpdateProduct: {
        method: 'PUT',
        path: '/admin/products/:productId',
        auth: 'admin',
        params: z.object({ productId: mongoId }),
        body: productInputSchema,
        response: z.object({ product: productSchema })
    },
    adminDeleteProduct: {
        method: 'DELETE',
        path: '/admin/products/:productId',
        auth: 'admin',
        params: z.object({ productId: mongoId }),
        response: z.object({ success: z.literal(true) })
    },
    adminGetArticles: {
        method: 'GET',
        path: '/admin/articles',
        auth: 'admin',
        response: z.object({ articles: z.array(articleSchema) })   // drafts included
    },
    adminCreateArticle: {
        method: 'POST',
        path: '/admin/articles',
        auth: 'admin',
        body: articleInputSchema,
        response: z.object({ article: articleSchema })
    },
    adminUpdateArticle: {
        method: 'PUT',
        path: '/admin/articles/:articleId',
        auth: 'admin',
        params: z.object({ articleId: mongoId }),
        body: articleInputSchema,
        response: z.object({ article: articleSchema })
    },
    adminDeleteArticle: {
        method: 'DELETE',
        path: '/admin/articles/:articleId',
        auth: 'admin',
        params: z.object({ articleId: mongoId }),
        response: z.object({ success: z.literal(true) })
    },
    adminUploadImage: {
        method: 'POST',
        path: '/admin/images',
        auth: 'admin',
        body: imageUploadSchema,
        response: z.object({ url: z.string() })
    }
});

export const errorResponseSchema = z.object({ message: z.string() });

// '/products/:productId' + { productId: 'abc' } → '/products/abc'
export const fillPath = (path, params = {}) => path.replace(/:(\w+)/g, (_, name) => {
    if (params[name] === undefined || params[name] === null) {
        throw new Error(`Missing path parameter "${name}" for ${path}`);
    }
    return encodeURIComponent(params[name]);
});
