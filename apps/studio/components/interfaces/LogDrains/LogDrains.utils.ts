/**
 * Utility functions for log drain management
 * Extracted for testability
 */

import { getKeyValueFieldArrayValidationIssues } from 'ui-patterns/form/KeyValueFieldArray/validation'
import { z } from 'zod'

import { LogDrainType } from './LogDrains.constants'
import { httpEndpointUrlSchema } from '@/lib/validation/http-url'

export type LogDrainHeaderRow = {
  key: string
  value: string
}

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
  KEY_REQUIRED: 'Header name is required',
  VALUE_REQUIRED: 'Header value is required',
} as const

const DEFAULT_HEADERS_BY_TYPE: Partial<Record<LogDrainType, Record<string, string>>> = {
  webhook: { 'Content-Type': 'application/json' },
  otlp: { 'Content-Type': 'application/x-protobuf' },
}

export function getDefaultHeadersByType(type: LogDrainType): Record<string, string> {
  return DEFAULT_HEADERS_BY_TYPE[type] ?? {}
}

export function headerRecordToRows(headers: Record<string, string> = {}): LogDrainHeaderRow[] {
  return Object.entries(headers).map(([key, value]) => ({ key, value }))
}

export function headerRowsToRecord(rows: LogDrainHeaderRow[] = []): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim()
    const value = row.value.trim()

    if (key && value) {
      acc[key] = value
    }

    return acc
  }, {})
}

export const logDrainHeaderEntriesSchema = z
  .array(
    z.object({
      key: z.string().trim(),
      value: z.string().trim(),
    })
  )
  .max(20, HEADER_VALIDATION_ERRORS.MAX_LIMIT)
  .superRefine((rows, ctx) => {
    getKeyValueFieldArrayValidationIssues({
      rows,
      keyFieldName: 'key',
      valueFieldName: 'value',
      keyRequiredMessage: HEADER_VALIDATION_ERRORS.KEY_REQUIRED,
      valueRequiredMessage: HEADER_VALIDATION_ERRORS.VALUE_REQUIRED,
      duplicateKeyMessage: HEADER_VALIDATION_ERRORS.DUPLICATE,
    }).forEach((issue) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: issue.path,
      })
    })
  })

/**
 * Zod schema for OTLP log drain configuration
 * Extracted for testing purposes
 */
export const otlpConfigSchema = z.object({
  type: z.literal('otlp'),
  endpoint: httpEndpointUrlSchema({
    requiredMessage: 'OTLP endpoint is required',
    invalidMessage: 'OTLP endpoint must be a valid URL',
    prefixMessage: 'OTLP endpoint must start with http:// or https://',
  }),
  protocol: z.string().optional().default('http/protobuf'),
  gzip: z.boolean().optional().default(true),
  headers: z.record(z.string(), z.string()).optional(),
})

export type OtlpConfig = z.infer<typeof otlpConfigSchema>
