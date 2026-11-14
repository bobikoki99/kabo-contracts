import { z } from 'zod';

import { mongoId, optionalText, requiredText } from './common.js';
import { SITE } from './enums.js';

// Short lists the admin edits for each storefront: shops, customer reviews and FAQ.
// Shown in sortOrder (then oldest first).
const base = {
    site: z.enum(Object.values(SITE)),
    sortOrder: z.number().int().min(0).max(9999).default(0)
};

// "Магазини" – a shop that sells our products
export const resellerInputSchema = z.object({
    ...base,
    name: requiredText(200),
    city: requiredText(100),
    address: optionalText(300),
    phone: optionalText(50),
    website: optionalText(300),
    models: z.array(requiredText(100)).default([])   // what the shop sells
});

// "Отзиви" – a real customer's review, published with their permission
export const reviewInputSchema = z.object({
    ...base,
    name: requiredText(100),
    detail: optionalText(200),   // e.g. "Видин · 40 кошера"
    text: requiredText(2000)
});

// "Често задавани въпроси"
export const questionInputSchema = z.object({
    ...base,
    question: requiredText(300),
    answer: requiredText(3000)
});

const withId = (schema) => schema.extend({ _id: mongoId });
export const resellerSchema = withId(resellerInputSchema);
export const reviewSchema = withId(reviewInputSchema);
export const questionSchema = withId(questionInputSchema);

// Everything a storefront shows from these lists, in one answer (GET /content?site=)
export const siteContentSchema = z.object({
    resellers: z.array(resellerSchema),
    reviews: z.array(reviewSchema),
    questions: z.array(questionSchema)
});

/** @typedef {import('zod').infer<typeof siteContentSchema>} SiteContent */
