import { z } from 'zod';

import { MESSAGES, requiredText, requiredEmail, optionalText, optionalPhoneNumber } from './common.js';
import { MESSAGE_TYPE } from './enums.js';

const contactFields = {
    name: requiredText(100),
    email: requiredEmail(200),
    phoneNumber: optionalPhoneNumber(30),
    company: optionalText(150),
    city: optionalText(100),
    message: requiredText(5000)
};

// Contacts page form
export const contactMessageSchema = z.object(contactFields);

// For-resellers page form: the shop or company is required
export const wholesaleMessageSchema = z.object({ ...contactFields, company: requiredText(150) });

// POST /messages: either form, told apart by `type` (missing means a contact message)
export const createMessageSchema = z.preprocess(
    body => (body && typeof body === 'object' && body.type === undefined ? { ...body, type: MESSAGE_TYPE.CONTACT } : body),
    z.discriminatedUnion('type', [
        contactMessageSchema.extend({ type: z.literal(MESSAGE_TYPE.CONTACT) }),
        wholesaleMessageSchema.extend({ type: z.literal(MESSAGE_TYPE.WHOLESALE) })
    ], { error: MESSAGES.INVALID_CHOICE })
);

/** @typedef {import('zod').infer<typeof contactMessageSchema>} ContactMessage */
/** @typedef {import('zod').infer<typeof wholesaleMessageSchema>} WholesaleMessage */
/** @typedef {import('zod').infer<typeof createMessageSchema>} CreateMessage */
