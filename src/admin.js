import { z } from 'zod';

import { IMAGE_CONTENT_TYPE } from './enums.js';

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email({ error: 'Невалиден имейл адрес.' }),
    password: z.string().min(1, { error: 'Въведете парола.' }).max(200)
});

// The logged-in admin, as the API shows it (never the password hash)
export const adminSchema = z.object({ email: z.string() });

// Up to ~7 MB image as base64 (the backend checks the file really is that type)
export const MAX_IMAGE_BYTES = 7 * 1024 * 1024;

export const imageUploadSchema = z.object({
    contentType: z.enum(Object.values(IMAGE_CONTENT_TYPE), { error: 'Само JPEG, PNG или WebP.' }),
    data: z.string().min(1).max(Math.ceil(MAX_IMAGE_BYTES / 3) * 4, { error: 'Снимката е твърде голяма (до 7 MB).' })
});
