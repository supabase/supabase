import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
} from 'components/interfaces/DataTableDemo/lib/delimiters'
import { METHODS } from './constants/method'
import { REGIONS } from './constants/region'
import { z } from 'zod'
import { LEVELS } from './constants/levels'

// https://github.com/colinhacks/zod/issues/2985#issue-2008642190
const stringToBoolean = z
  .string()
  .toLowerCase()
  .transform((val) => {
    try {
      return JSON.parse(val)
    } catch (e) {
      console.log(e)
      return undefined
    }
  })
  .pipe(z.boolean().optional())

// export const timingSchema = z.object({
//   'timing.dns': z.number(),
//   'timing.connection': z.number(),
//   'timing.tls': z.number(),
//   'timing.ttfb': z.number(),
//   'timing.transfer': z.number(),
// })

export const LOG_TYPES = [
  'edge',
  'auth',
  'edge function',
  'postgres',
  'function events',
  'supavisor',
  'postgres upgrade',
  'storage',
] as const

export const columnSchema = z.object({
  id: z.string(),
  log_type: z.enum(LOG_TYPES),
  uuid: z.string(),
  method: z.enum(METHODS),
  host: z.string(),
  pathname: z.string(),
  level: z.enum(LEVELS),
  latency: z.number(),
  status: z.number(),
  regions: z.enum(REGIONS).array(),
  date: z.date(),
  headers: z.record(z.string()),
  message: z.string().optional(),
  timestamp: z.number(),
  // percentile: z.number().optional(),
})
// .merge(timingSchema)

export type ColumnSchema = z.infer<typeof columnSchema>
// export type TimingSchema = z.infer<typeof timingSchema>

// TODO: can we get rid of this in favor of nuqs search-params?
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
  host: z.string().optional(),
  pathname: z.string().optional(),
  // latency: z
  //   .string()
  //   .transform((val) => val.split(SLIDER_DELIMITER))
  //   .pipe(z.coerce.number().array().max(2))
  //   .optional(),
  // 'timing.dns': z
  //   .string()
  //   .transform((val) => val.split(SLIDER_DELIMITER))
  //   .pipe(z.coerce.number().array().max(2))
  //   .optional(),
  // 'timing.connection': z
  //   .string()
  //   .transform((val) => val.split(SLIDER_DELIMITER))
  //   .pipe(z.coerce.number().array().max(2))
  //   .optional(),
  // 'timing.tls': z
  //   .string()
  //   .transform((val) => val.split(SLIDER_DELIMITER))
  //   .pipe(z.coerce.number().array().max(2))
  //   .optional(),
  // 'timing.ttfb': z
  //   .string()
  //   .transform((val) => val.split(SLIDER_DELIMITER))
  //   .pipe(z.coerce.number().array().max(2))
  //   .optional(),
  // 'timing.transfer': z
  //   .string()
  //   .transform((val) => val.split(SLIDER_DELIMITER))
  //   .pipe(z.coerce.number().array().max(2))
  //   .optional(),
  status: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.coerce.number().array())
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
