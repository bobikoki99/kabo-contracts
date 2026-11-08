import { z } from 'zod';

import { mongoId } from './common.js';
import { SITE, PRODUCT_AUDIENCE } from './enums.js';

// Latin, lower case, words joined by dashes: the article's address, e.g. /guides/kakvo-e-varoa
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// An article ("Полезно") as the admin writes it
export const articleInputSchema = z.object({
    slug: z.string().trim().regex(SLUG_REGEX, { error: 'Само малки латински букви, цифри и тирета, напр. kakvo-e-varoa.' }),
    site: z.enum(Object.values(SITE)),
    title: z.string().trim().min(1).max(200),
    excerpt: z.string().trim().max(500).default(''),
    audience: z.enum(Object.values(PRODUCT_AUDIENCE)).optional(),
    readMinutes: z.number().int().positive().max(120).default(3),
    image: z.string().trim().default(''),
    sections: z.array(z.object({
        heading: z.string().trim().default(''),
        paragraphs: z.array(z.string().trim().min(1)).default([])
    })).default([]),
    published: z.boolean().default(false)
});

// An article as returned by the API (dates as ISO strings after JSON)
export const articleSchema = articleInputSchema.extend({
    _id: mongoId,
    createdAt: z.string(),
    updatedAt: z.string()
});

/** @typedef {import('zod').infer<typeof articleSchema>} Article */
