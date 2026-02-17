/**
 * Utility functions for log drain management
 * Extracted for testability
 */

import { z } from 'zod'

import { LogDrainType } from './LogDrains.constants'

/**
 * Get the description text for the custom headers section based on log drain type
 */
export function getHeadersSectionDescription(type: LogDrainType): string {
  if (type === 'webhook') {
    return 'Set custom headers when draining logs to the Endpoint URL'
  }
  if (type === 'loki') {
    return 'Set custom headers when draining logs to the Loki HTTP(S) endpoint'
  }
  if (type === 'otlp') {
    return 'Set custom headers for OTLP authentication (e.g., Authorization, X-API-Key)'
  }
  return ''
}

/**
 * Validation errors for header management
 */
export const HEADER_VALIDATION_ERRORS = {
  MAX_LIMIT: 'You can only have 20 custom headers',
  DUPLICATE: 'Header name already exists',
  REQUIRED: 'Header name and value are required',
} as const

/**
 * Validates if a new header can be added to the existing headers
 */
export function validateNewHeader(
  existingHeaders: Record<string, string>,
  newHeader: { name: string; value: string }
): { valid: boolean; error?: string } {
  const headerKeys = Object.keys(existingHeaders)

  if (headerKeys.length >= 20) {
    return { valid: false, error: HEADER_VALIDATION_ERRORS.MAX_LIMIT }
  }

  if (headerKeys.includes(newHeader.name)) {
    return { valid: false, error: HEADER_VALIDATION_ERRORS.DUPLICATE }
  }

  if (!newHeader.name || !newHeader.value) {
    return { valid: false, error: HEADER_VALIDATION_ERRORS.REQUIRED }
  }

  return { valid: true }
}

/**
 * Zod schema for OTLP log drain configuration
 * Extracted for testing purposes
 */
export const otlpConfigSchema = z.object({
  type: z.literal('otlp'),
  endpoint: z
    .string()
    .min(1, { message: 'OTLP endpoint is required' })
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'OTLP endpoint must start with http:// or https://'
    ),
  protocol: z.string().optional().default('http/protobuf'),
  gzip: z.boolean().optional().default(true),
  headers: z.record(z.string(), z.string()).optional(),
})

export type OtlpConfig = z.infer<typeof otlpConfigSchema>
