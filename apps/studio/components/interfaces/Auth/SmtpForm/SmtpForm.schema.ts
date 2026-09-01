import * as z from 'zod'

import { urlRegex } from '../Auth.constants'

export const smtpUserSchema = z
  .string()
  .trim()
  .min(1, 'SMTP Username is required')
  .regex(/^\S+$/, 'SMTP Username must not contain spaces')

export const smtpEnabledSchema = z.object({
  ENABLE_SMTP: z.literal(true),
  SMTP_ADMIN_EMAIL: z
    .string()
    .trim()
    .min(1, 'Sender email address is required')
    .email('Must be a valid email'),
  SMTP_SENDER_NAME: z.string().trim().min(1, 'Sender name is required'),
  SMTP_HOST: z
    .string()
    .trim()
    .min(1, 'Host URL is required')
    .regex(urlRegex({ excludeSimpleDomains: false }), 'Must be a valid URL or IP address'),
  SMTP_PORT: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce
      .number({
        required_error: 'Port number is required',
        invalid_type_error: 'Port number is required',
      })
      .min(1, 'Must be a valid port number more than 0')
      .max(65535, 'Must be a valid port number no more than 65535')
  ),
  SMTP_MAX_FREQUENCY: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce
      .number({
        required_error: 'Rate limit is required',
        invalid_type_error: 'Rate limit is required',
      })
      .min(1, 'Must be more than 0')
      .max(32767, 'Must not be more than 32,767 an hour')
  ),
  SMTP_USER: smtpUserSchema,
  SMTP_PASS: z.string().trim().optional(),
})

export const smtpDisabledSchema = z.object({
  ENABLE_SMTP: z.literal(false),
  SMTP_ADMIN_EMAIL: z.string().optional(),
  SMTP_SENDER_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce.number().optional()
  ),
  SMTP_MAX_FREQUENCY: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce.number().optional()
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
})

export const smtpSchema = z.discriminatedUnion('ENABLE_SMTP', [
  smtpEnabledSchema,
  smtpDisabledSchema,
])

export type SmtpFormValues = z.infer<typeof smtpSchema>
