import { z } from 'zod'

import { METHODS, REGIONS, SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import {
  ARRAY_DELIMITER,
  LEVELS,
  RANGE_DELIMITER,
} from '@/components/ui/DataTable/DataTable.constants'

export const columnSchema = z.object({
  id: z.string(),
  log_type: z.string(),
  method: z.string().nullable(),
  pathname: z.string().nullable(),
  level: z.enum(LEVELS).nullable(),
  status: z.union([z.string(), z.number()]).nullable(),
  date: z.date(),
  timestamp: z.union([z.string(), z.number()]),
  event_message: z.string().optional(),
  log_count: z.number().nullish(),
  logs: z.array(z.any()).optional(), // array of function logs
  auth_user: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type ColumnSchema = z.infer<typeof columnSchema>

export const columnFilterSchema = z.object({
  level: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.enum(LEVELS).array())
    .optional(),
  method: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.enum(METHODS).array())
    .optional(),
  pathname: z.string().optional(),
  status: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.string().array())
    .optional(),
  regions: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.enum(REGIONS).array())
    .optional(),
  date: z
    .string()
    .transform((val) => val.split(RANGE_DELIMITER).map(Number))
    .pipe(z.coerce.date().array())
    .optional(),
  auth_user: z.string().optional(),
})

export type ColumnFilterSchema = z.infer<typeof columnFilterSchema>

export const facetMetadataSchema = z.object({
  rows: z.array(z.object({ value: z.any(), total: z.number() })),
  total: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
})

export type FacetMetadataSchema = z.infer<typeof facetMetadataSchema>

export type BaseChartSchema = { timestamp: number; [key: string]: number }

export const timelineChartSchema = z.object({
  timestamp: z.number(), // UNIX
  ...LEVELS.reduce(
    (acc, level) => ({
      ...acc,
      [level]: z.number().default(0),
    }),
    {} as Record<(typeof LEVELS)[number], z.ZodNumber>
  ),
  // REMINDER: make sure to have the `timestamp` field in the object
}) satisfies z.ZodType<BaseChartSchema>

export type TimelineChartSchema = z.infer<typeof timelineChartSchema>

export const querySearchParamsSchema = z.object({
  filter: z.array(z.string()).optional(),
  latency: z.array(z.number()).optional(),
  'timing.dns': z.array(z.number()).optional(),
  'timing.connection': z.array(z.number()).optional(),
  'timing.tls': z.array(z.number()).optional(),
  'timing.ttfb': z.array(z.number()).optional(),
  'timing.transfer': z.array(z.number()).optional(),
  date: z.array(z.date()).optional(),
  sort: z.object({ id: z.string(), desc: z.boolean() }).optional(),
  size: z.number().default(SEARCH_PARAMS_PARSER.size.defaultValue),
  start: z.number().default(SEARCH_PARAMS_PARSER.start.defaultValue),
  direction: z.enum(['prev', 'next']).default(SEARCH_PARAMS_PARSER.direction.defaultValue),
  cursor: z.date().default(SEARCH_PARAMS_PARSER.cursor.defaultValue),
  uuid: z.string().optional(),
  show_connection_logs: z.boolean().default(SEARCH_PARAMS_PARSER.show_connection_logs.defaultValue),
  edge_auth: z.boolean().default(SEARCH_PARAMS_PARSER.edge_auth.defaultValue),
  edge_storage: z.boolean().default(SEARCH_PARAMS_PARSER.edge_storage.defaultValue),
  edge_postgrest: z.boolean().default(SEARCH_PARAMS_PARSER.edge_postgrest.defaultValue),
  user: z.string().optional(),
})
