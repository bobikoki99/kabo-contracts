import { z } from 'zod';

import { DELIVERY_METHOD, CURRENCY } from './enums.js';

// A city from the Econt city list the backend keeps in sync (GET /econt/cities, /econt/cities/search)
export const citySchema = z.object({
    cityCode: z.number().int(),
    name: z.string(),
    nameEn: z.string().optional(),
    postCode: z.string(),
    regionName: z.string().optional(),
    countryCode: z.string(),
    countryName: z.string().optional()
});

// An Econt office as Econt returns it; only the fields the shop relies on are described
export const econtOfficeSchema = z.object({
    id: z.number().int(),
    code: z.string(),
    name: z.string(),
    address: z.object({ fullAddress: z.string() })
});

// Price per delivery method for one city + cart; null when Econt cannot deliver that way
export const deliveryPricesSchema = z.object({
    currency: z.literal(CURRENCY),
    prices: z.object({
        [DELIVERY_METHOD.ECONT_OFFICE]: z.number().nonnegative().nullable(),
        [DELIVERY_METHOD.ECONT_ADDRESS]: z.number().nonnegative().nullable()
    })
});

/** @typedef {import('zod').infer<typeof citySchema>} City */
/** @typedef {import('zod').infer<typeof econtOfficeSchema>} EcontOffice */
/** @typedef {import('zod').infer<typeof deliveryPricesSchema>} DeliveryPrices */
