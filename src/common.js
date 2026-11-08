import { z } from 'zod';

// Error messages are shown to customers next to the form fields, so they are in Bulgarian
export const MESSAGES = Object.freeze({
    REQUIRED: 'Това поле е задължително.',
    TOO_LONG: 'Текстът е твърде дълъг.',
    INVALID_EMAIL: 'Невалиден имейл адрес.',
    INVALID_PHONE: 'Въведете валиден български телефонен номер, напр. 0888 123 456.',
    TERMS_REQUIRED: 'Необходимо е да приемете Общите условия.',
    INVALID_CHOICE: 'Изберете една от възможностите.',
    CART_EMPTY: 'Количката е празна.',
    INVALID_CART_ITEM: 'Невалиден продукт в количката.',
    INVALID_ID: 'Невалиден идентификатор.'
});

export const MAX_TEXT_LENGTH = 300;

// One address with a dot in the domain; deliberately simple, the same rule everywhere
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Bulgarian mobile or landline number once spaces, dashes and brackets are removed:
// 0888123456, +359888123456, 00359888123456, 029876543
export const PHONE_NUMBER_REGEX = /^(\+359|00359|0)\d{8,9}$/;

export const MONGO_ID_REGEX = /^[0-9a-f]{24}$/i;

export const isEmail = (value) => EMAIL_REGEX.test(value);
export const isPhoneNumber = (value) => PHONE_NUMBER_REGEX.test(value.replace(/[\s\-()]/g, ''));

// Trimmed text that may be empty; missing becomes ''
export const optionalText = (max = MAX_TEXT_LENGTH) => z.string().trim().max(max, MESSAGES.TOO_LONG).default('');

// Trimmed text that must not be empty
export const requiredText = (max = MAX_TEXT_LENGTH) => z
    .string({ error: MESSAGES.REQUIRED })
    .trim()
    .min(1, { error: MESSAGES.REQUIRED, abort: true }) // an empty field gets only "required"
    .max(max, MESSAGES.TOO_LONG);

export const requiredEmail = (max = MAX_TEXT_LENGTH) => requiredText(max).refine(isEmail, MESSAGES.INVALID_EMAIL);

export const optionalPhoneNumber = (max = MAX_TEXT_LENGTH) => optionalText(max)
    .refine(value => !value || isPhoneNumber(value), MESSAGES.INVALID_PHONE);

// Econt city and office ids: numbers, but forms hold them as '' until chosen.
// Anything that is not a positive number becomes null, so "required" can be checked separately.
// null is accepted as input too, so the parsed output can be parsed again (form → API).
export const econtId = z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform(value => (Number(value) > 0 ? Number(value) : null));

export const mongoId = z.string().regex(MONGO_ID_REGEX, MESSAGES.INVALID_ID);
