import { z } from 'zod';

import { MESSAGES, econtId, mongoId } from './common.js';
import { MAX_ITEM_QUANTITY } from './enums.js';

// What the client sends for each cart line; prices and weights always come from the database
export const cartItemSchema = z.object({
    _id: mongoId,
    quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY)
}, { error: MESSAGES.INVALID_CART_ITEM });

export const cartItemsSchema = z
    .array(cartItemSchema, { error: MESSAGES.CART_EMPTY })
    .min(1, MESSAGES.CART_EMPTY);

// POST /econt/delivery/price
export const deliveryPriceRequestSchema = z.object({
    city: econtId.refine(city => city !== null, MESSAGES.REQUIRED),
    items: cartItemsSchema
});

/** @typedef {import('zod').infer<typeof cartItemSchema>} CartItem */
/** @typedef {import('zod').infer<typeof deliveryPriceRequestSchema>} DeliveryPriceRequest */
