import dayjs from 'dayjs'
import { z } from 'zod'

import type { PermissionMode } from '../../AccessToken.permissions'

export const EXPIRY_PRESETS = ['24h', '7d', '30d', '90d', 'custom'] as const
export type ExpiryPreset = (typeof EXPIRY_PRESETS)[number]

export const DEFAULT_EXPIRY: ExpiryPreset = '7d'

export interface ExpiryOption {
  value: ExpiryPreset
  label: string
  recommended?: boolean
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days', recommended: true },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom' },
]

/** Resolves the final ISO expiry date for a preset, or `undefined` when the caller supplies a custom date. */
export const getExpiryDate = (preset: ExpiryPreset): string | undefined => {
  switch (preset) {
    case '24h':
      return dayjs().add(24, 'hours').toISOString()
    case '7d':
      return dayjs().add(7, 'days').toISOString()
    case '30d':
      return dayjs().add(30, 'days').toISOString()
    case '90d':
      return dayjs().add(90, 'days').toISOString()
    default:
      return undefined
  }
}

/** The default custom date sits ~7 days out, matching the recommended preset. */
export const getDefaultCustomExpiryDate = (): string =>
  dayjs().add(7, 'days').endOf('day').toISOString()

export const RESOURCE_ACCESS_MODES = ['project', 'organization', 'account'] as const

/**
 * The form schema is intentionally permissive: resource-selection and permission-count validation
 * happen imperatively on step transitions so errors only surface after an attempt (never
 * preemptively), and can be scrolled into view. Zod only guards always-required basics.
 */
export const TokenFormSchema = z
  .object({
    tokenName: z.string().trim().min(1, 'Please enter a name for the token'),
    expiresAt: z.enum(EXPIRY_PRESETS),
    customExpiryDate: z.string().datetime().optional(),
    resourceAccess: z.enum(RESOURCE_ACCESS_MODES),
    organizationSlugs: z.string().array().optional().default([]),
    projectRefs: z.string().array().optional().default([]),
    accountConfirmed: z.boolean().optional(),
    permissions: z.record(z.string(), z.enum(['none', 'read', 'readwrite'])),
  })
  .superRefine((data, ctx) => {
    if (data.expiresAt === 'custom' && !data.customExpiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['customExpiryDate'],
      })
    }

    if (data.resourceAccess === 'project') {
      if (data.organizationSlugs.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select an organization to continue.',
          path: ['organizationSlugs'],
        })
      }
      if (data.projectRefs.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a project to continue.',
          path: ['projectRefs'],
        })
      }
    }

    if (data.resourceAccess === 'organization' && data.organizationSlugs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select an organization to continue.',
        path: ['organizationSlugs'],
      })
    }
  })

export type TokenFormValues = Omit<z.infer<typeof TokenFormSchema>, 'permissions'> & {
  permissions: Record<string, PermissionMode>
}
