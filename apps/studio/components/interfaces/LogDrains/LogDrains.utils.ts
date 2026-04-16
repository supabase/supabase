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

/**
 * Sentinel value returned by the API for secret header values.
 * The real value is stored server-side and hidden from API responses.
 */
export const REDACTED_HEADER_VALUE = 'REDACTED'

/**
 * Computes the headers payload to include in a PATCH request.
 *
 * Returns only what the user explicitly changed:
 * - `undefined`            – all headers are REDACTED sentinels (nothing changed, omit field)
 * - `{}`                   – user cleared every header row (signal server to delete them)
 * - `Record<string,string>` – only the non-REDACTED entries (user-supplied values)
 */
export function computePatchHeaders(
  headers: Record<string, string>
): Record<string, string> | undefined {
  const entries = Object.entries(headers)

  if (entries.length === 0) {
    // Empty record means the user deleted all rows → signal deletion
    return {}
  }

  const changed = entries.filter(([, v]) => v !== REDACTED_HEADER_VALUE)

  if (changed.length === 0) {
    // Every header is a REDACTED sentinel → nothing the user touched changed
    return undefined
  }

  return Object.fromEntries(changed)
}

type LogDrainPatchValues = {
  name?: string
  description?: string
  config?: Record<string, unknown>
}

/**
 * Computes a minimal PATCH payload by diffing submitted form values against the
 * original log drain data. Only includes fields that actually changed.
 *
 * - `type` is always omitted — it cannot change on update.
 * - `headers: undefined` in config means "all REDACTED, nothing changed" — skipped.
 * - `headers: {}` means "user cleared all headers" — included.
 * - Other config fields are compared by strict equality (primitives) or JSON (objects).
 * - Returns `{}` when nothing changed — the caller should skip the API call.
 */
export function computePatchPayload(
  submitted: {
    name: string
    description?: string
    type: LogDrainType
    config: Record<string, unknown>
  },
  original: {
    name: string
    description?: string
    type: LogDrainType
    config: Record<string, unknown>
  }
): LogDrainPatchValues {
  const patchPayload: LogDrainPatchValues = {}

  if (submitted.name !== original.name) {
    patchPayload.name = submitted.name
  }

  if ((submitted.description ?? '') !== (original.description ?? '')) {
    patchPayload.description = submitted.description ?? ''
  }

  const configPatch: Record<string, unknown> = {}
  for (const key of Object.keys(submitted.config)) {
    const submittedVal = submitted.config[key]
    const originalVal = original.config[key]

    // headers: undefined means computePatchHeaders determined nothing changed — skip
    if (key === 'headers' && submittedVal === undefined) continue

    const isEqual =
      typeof submittedVal === 'object' && submittedVal !== null
        ? JSON.stringify(submittedVal) === JSON.stringify(originalVal)
        : submittedVal === originalVal

    if (!isEqual) {
      configPatch[key] = submittedVal
    }
  }

  if (Object.keys(configPatch).length > 0) {
    patchPayload.config = configPatch
  }

  return patchPayload
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
