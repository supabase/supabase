import { z } from 'zod'

import {
  ARRAY_DELIMITER,
  LEVELS,
  RANGE_DELIMITER,
} from 'components/ui/DataTable/DataTable.constants'
import { LOG_TYPES, METHODS, REGIONS } from './UnifiedLogs.constants'

export const columnSchema = z.object({
  id: z.string(),
  log_type: z.enum(LOG_TYPES),
  method: z.enum(METHODS),
  pathname: z.string(),
  level: z.enum(LEVELS),
  status: z.number(),
  date: z.date(),
  timestamp: z.number(),
  event_message: z.string().optional(),
  log_count: z.number().optional(), // used to count function logs for a given execution_id
  logs: z.array(z.any()).optional(), // array of function logs
  auth_user: z.string().optional(),
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
