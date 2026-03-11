import { toString as CronToString } from 'cronstrue'
import z from 'zod'

import { urlRegex } from 'components/interfaces/Auth/Auth.constants'
import { cronPattern, secondsPattern } from '../CronJobs.constants'

const convertCronToString = (schedule: string) => {
  // pg_cron can also use "30 seconds" format for schedule. Cronstrue doesn't understand that format so just use the
  // original schedule when cronstrue throws
  try {
    return CronToString(schedule)
  } catch (error) {
    return schedule
  }
}

const edgeFunctionSchema = z.object({
  type: z.literal('edge_function'),
  method: z.enum(['GET', 'POST']),
  edgeFunctionName: z.string().trim().min(1, 'Please select one of the listed Edge Functions'),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
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
  endpoint: z
    .string()
    .trim()
    .min(1, 'Please provide a URL')
    .regex(urlRegex(), 'Please provide a valid URL')
    .refine((value) => value.startsWith('http'), 'Please include HTTP/HTTPs to your URL'),
  timeoutMs: z.coerce.number().int().gte(1000).lte(5000).default(1000),
  httpHeaders: z.array(z.object({ name: z.string(), value: z.string() })),
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
  })

export type CreateCronJobForm = z.infer<typeof FormSchema>
export type CronJobType = CreateCronJobForm['values']
