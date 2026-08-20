import dayjs from 'dayjs'
import { z, type SafeParseReturnType } from 'zod'

import { DEFAULT_ASSISTANT_LOGS_QUERY_TITLE } from './AssistantQueryCell.utils'
import { type QueryResult } from '@/components/interfaces/Explorer/types'
import { type TimeRange } from '@/data/content/notebooks/notebook-schema'
import { isoDateTimeString } from '@/lib/iso-datetime'

const UNTRUSTED_DATA_CLOSE_RE = /<\/untrusted-data-([^>]+)>/g
const unknownRecordSchema = z.record(z.string(), z.unknown())

/** Matches the MCP `query_logs` window when the model omits timestamps. */
export const DEFAULT_ASSISTANT_LOGS_TIME_RANGE: TimeRange = {
  _tag: 'relative_time_range',
  unit: 'day',
  amount: 1,
}

const queryLogsInputSchema = z.object({
  sql: z.string().min(1),
  iso_timestamp_start: z.string().optional(),
  iso_timestamp_end: z.string().optional(),
})

export function parseQueryLogsInput(
  input: unknown
): SafeParseReturnType<unknown, z.infer<typeof queryLogsInputSchema>> {
  return queryLogsInputSchema.safeParse(input)
}

export function getAssistantLogsQueryTitle(sql: string): string {
  const title = sql
    .trim()
    .match(/^--[ \t]*([^\r\n]+)/)?.[1]
    ?.trim()
  return title || DEFAULT_ASSISTANT_LOGS_QUERY_TITLE
}

export function getAssistantLogsTimeRange(start?: string, end?: string): TimeRange {
  const parsedStart = start ? isoDateTimeString(start) : null
  const parsedEnd = end ? isoDateTimeString(end) : null
  if (parsedStart && parsedEnd && dayjs(parsedEnd).isAfter(parsedStart)) {
    return { _tag: 'absolute_time_range', start: parsedStart, end: parsedEnd }
  }

  return DEFAULT_ASSISTANT_LOGS_TIME_RANGE
}

export function toQueryLogsResult(output: unknown): QueryResult | undefined {
  return parseQueryResult(output)
}

function parseQueryResult(output: unknown, depth = 0): QueryResult | undefined {
  if (depth > 6 || output == null) return undefined

  if (Array.isArray(output)) return toRowResult(output)

  if (typeof output === 'string') {
    const extracted = extractUntrustedDataJson(output) ?? tryParseJson(output)
    return extracted !== undefined ? parseQueryResult(extracted, depth + 1) : undefined
  }

  const parsedRecord = unknownRecordSchema.safeParse(output)
  if (!parsedRecord.success) return undefined

  const record = parsedRecord.data
  const mcpError = readMcpToolError(record)
  if (mcpError) return { rows: [], error: { message: mcpError } }

  const error = readErrorMessage(record.error)
  const rows = Array.isArray(record.rows)
    ? toRowResult(record.rows)
    : Array.isArray(record.result)
      ? toRowResult(record.result)
      : undefined
  if (rows) return error ? { ...rows, error } : rows

  if ('result' in record) {
    const result = parseQueryResult(record.result, depth + 1)
    if (error) return { ...(result ?? { rows: [] }), error }
    if (result) return result
  }

  if (record.structuredContent != null) {
    const result = parseQueryResult(record.structuredContent, depth + 1)
    if (result) return result
  }

  if (Array.isArray(record.content)) {
    return parseQueryResult(textFromMcpContent(record.content), depth + 1)
  }

  return error ? { rows: [], error } : undefined
}

function toRowResult(rows: unknown[]): QueryResult {
  return {
    rows: rows.filter(
      (row): row is Record<string, unknown> =>
        row !== null && typeof row === 'object' && !Array.isArray(row)
    ),
  }
}

function textFromMcpContent(content: unknown[]): string | undefined {
  const texts = content.flatMap((part) => {
    if (typeof part === 'string' && part.length > 0) return [part]
    const parsedPart = unknownRecordSchema.safeParse(part)
    if (!parsedPart.success) return []
    if (typeof parsedPart.data.text === 'string') return [parsedPart.data.text]
    if (typeof parsedPart.data.value === 'string') return [parsedPart.data.value]
    return []
  })
  return texts.length > 0 ? texts.join('\n') : undefined
}

function readMcpToolError(record: Record<string, unknown>): string | undefined {
  if (record.isError !== true) return undefined

  const text = Array.isArray(record.content) ? textFromMcpContent(record.content) : undefined
  return text?.trim() || 'Failed to query logs'
}

function readErrorMessage(error: unknown): { message: string } | undefined {
  if (typeof error === 'string' && error.length > 0) return { message: error }
  const parsedError = unknownRecordSchema.safeParse(error)
  const message = parsedError.success ? parsedError.data.message : undefined
  if (typeof message === 'string' && message.length > 0) return { message }
  return undefined
}

function extractUntrustedDataJson(value: string): unknown {
  for (const match of value.matchAll(UNTRUSTED_DATA_CLOSE_RE)) {
    const boundaryId = match[1]
    const closingIndex = match.index
    if (!boundaryId || closingIndex === undefined) continue

    const openingTag = `<untrusted-data-${boundaryId}>`
    // The MCP wrapper mentions the tag in its explanatory prose before opening
    // the real JSON boundary, so select the final opening tag before the close.
    const openingIndex = value.lastIndexOf(openingTag, closingIndex)
    if (openingIndex === -1) continue

    const parsed = tryParseJson(value.slice(openingIndex + openingTag.length, closingIndex).trim())
    if (parsed !== undefined) return parsed
  }

  return undefined
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}
