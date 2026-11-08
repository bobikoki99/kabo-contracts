import { z } from 'zod';

import { mongoId } from './common.js';
import { PRODUCT_CATEGORY, PRODUCT_AUDIENCE } from './enums.js';

// A product as stored by the seed script (kabobee-backend/scripts/seedPlaceholderModels.js).
// Sublimators use audience, warrantyMonths and inTheBox; honey products leave them out.
// `specs` keys differ per category (hives, powerSource… / honeyType, netWeight…), so they stay free-form.
export const productInputSchema = z.object({
    modelKey: z.string().min(1),
    category: z.enum(Object.values(PRODUCT_CATEGORY)),
    name: z.string().min(1),
    tagline: z.string().default(''),
    price: z.number({ error: 'Въведете цена.' }).positive({ error: 'Цената трябва да е положително число.' }),   // EUR incl. VAT
    weight: z.number({ error: 'Въведете тегло.' }).positive({ error: 'Теглото трябва да е положително число.' }),   // kg incl. packaging, used for Econt prices
    sortOrder: z.number({ error: 'Въведете число.' }).int({ error: 'Въведете цяло число.' }),
    specs: z.record(z.string(), z.string()).default({}),
    highlights: z.array(z.string()).default([]),
    briefSummary: z.string().default(''),
    description: z.string().default(''),
    mainImage: z.string().default(''),
    imageUrls: z.array(z.string()).default([]),
    videoUrl: z.string().default(''),
    audience: z.enum(Object.values(PRODUCT_AUDIENCE)).optional(),
    warrantyMonths: z.number().int().positive().optional(),
    inTheBox: z.array(z.string()).optional(),
    isPlaceholder: z.boolean().optional()
});

// A product as returned by GET /products and GET /products/:productId
export const productSchema = productInputSchema.extend({ _id: mongoId });

/** @typedef {import('zod').infer<typeof productSchema>} Product */
