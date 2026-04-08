import { toString as CronToString } from 'cronstrue'
import { getKeyValueFieldArrayValidationIssues } from 'ui-patterns/form/KeyValueFieldArray/validation'
import z from 'zod'

import { cronPattern, secondsPattern } from '../CronJobs.constants'
import { httpEndpointUrlSchema } from '@/lib/validation/http-url'

const convertCronToString = (schedule: string) => {
  // pg_cron can also use "30 seconds" format for schedule. Cronstrue doesn't understand that format so just use the
  // original schedule when cronstrue throws.
  // pg_cron uses '$' for "last day of month"; cronstrue uses 'L' — normalize before parsing.
  try {
    return CronToString(schedule.replace(/\$/g, 'L'))
  } catch (error) {
    return schedule
  }
}

const httpHeadersSchema = z.array(z.object({ name: z.string().trim(), value: z.string().trim() }))

const addHttpHeaderIssues = (
  rows: z.infer<typeof httpHeadersSchema>,
  ctx: z.RefinementCtx,
  pathPrefix: string[]
) => {
  getKeyValueFieldArrayValidationIssues({
    rows,
    keyFieldName: 'name',
    valueFieldName: 'value',
    keyRequiredMessage: 'Header name is required',
    valueRequiredMessage: 'Header value is required',
  }).forEach((issue) => {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: issue.message,
      path: [...pathPrefix, ...issue.path],
    })
  })
}

const edgeFunctionSchema = z.object({
  type: z.literal('edge_function'),
  method: z.enum(['GET', 'POST']),
  edgeFunctionName: z.string().trim().min(1, 'Please select one of the listed Edge Functions'),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: httpHeadersSchema,
  httpBody: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, 'Input must be valid JSON'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})

const httpRequestSchema = z.object({
  type: z.literal('http_request'),
  method: z.enum(['GET', 'POST']),
  endpoint: httpEndpointUrlSchema({
    requiredMessage: 'Please provide a URL',
    invalidMessage: 'Please provide a valid URL',
    prefixMessage: 'Please prefix your URL with http:// or https://',
  }),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: httpHeadersSchema,
  httpBody: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    }, 'Input must be valid JSON'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})

const sqlFunctionSchema = z.object({
  type: z.literal('sql_function'),
  schema: z.string().trim().min(1, 'Please select one of the listed database schemas'),
  functionName: z.string().trim().min(1, 'Please select one of the listed database functions'),
  // When editing a cron job, we want to keep the original command as a snippet in case the user wants to manually edit it
  snippet: z.string().trim(),
})

const sqlSnippetSchema = z.object({
  type: z.literal('sql_snippet'),
  snippet: z.string().trim().min(1),
})

export const FormSchema = z
  .object({
    name: z.string().trim().min(1, 'Please provide a name for your cron job'),
    supportsSeconds: z.boolean(),
    schedule: z
      .string()
      .trim()
      .min(1)
      .refine((value) => {
        if (cronPattern.test(value)) {
          try {
            convertCronToString(value)
            return true
          } catch {
            return false
          }
        } else if (secondsPattern.test(value)) {
          return true
        }
        return false
      }, 'Invalid Cron format'),
    values: z.discriminatedUnion('type', [
      edgeFunctionSchema,
      httpRequestSchema,
      sqlFunctionSchema,
      sqlSnippetSchema,
    ]),
  })
  .superRefine((data, ctx) => {
    if (!cronPattern.test(data.schedule)) {
      if (!(data.supportsSeconds && secondsPattern.test(data.schedule))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Seconds are supported only in pg_cron v1.5.0+. Please use a valid Cron format.',
          path: ['schedule'],
        })
      }
    }

    if (data.values.type === 'edge_function' || data.values.type === 'http_request') {
      addHttpHeaderIssues(data.values.httpHeaders, ctx, ['values', 'httpHeaders'])
    }
  })

export type CreateCronJobForm = z.infer<typeof FormSchema>
export type CronJobType = CreateCronJobForm['values']
