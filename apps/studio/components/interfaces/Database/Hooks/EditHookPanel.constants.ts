import { getKeyValueFieldArrayValidationIssues } from 'ui-patterns/form/KeyValueFieldArray/validation'
import { z } from 'zod'

import { httpEndpointUrlSchema } from '@/lib/validation/http-url'

const httpRequestSchema = z.object({
  function_type: z.literal('http_request'),
  http_url: httpEndpointUrlSchema({
    requiredMessage: 'Please provide a URL',
    invalidMessage: 'Please provide a valid URL',
    prefixMessage: 'Please prefix your URL with http:// or https://',
  }),
})

const supabaseFunctionSchema = z.object({
  function_type: z.literal('supabase_function'),
  http_url: z
    .string()
    .min(1, 'Please select an edge function')
    .refine((val) => !val.includes('undefined'), 'No edge functions available for selection'),
})

const httpHeadersSchema = z.array(
  z.object({ id: z.string(), name: z.string().trim(), value: z.string().trim() })
)

const httpParametersSchema = z.array(
  z.object({ id: z.string(), name: z.string().trim(), value: z.string().trim() })
)

const addKeyValueIssues = (
  rows: z.infer<typeof httpHeadersSchema> | z.infer<typeof httpParametersSchema>,
  ctx: z.RefinementCtx,
  pathPrefix: 'httpHeaders' | 'httpParameters'
) => {
  const isHeaderField = pathPrefix === 'httpHeaders'

  getKeyValueFieldArrayValidationIssues({
    rows,
    keyFieldName: 'name',
    valueFieldName: 'value',
    keyRequiredMessage: isHeaderField ? 'Header name is required' : 'Parameter name is required',
    valueRequiredMessage: isHeaderField
      ? 'Header value is required'
      : 'Parameter value is required',
  }).forEach((issue) => {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: issue.message,
      path: [pathPrefix, ...issue.path],
    })
  })
}

export const FormSchema = z
  .object({
    name: z.string().min(1, 'Please provide a name for your webhook'),
    table_id: z.string().min(1, 'Please select a table'),
    http_method: z.enum(['GET', 'POST']),
    timeout_ms: z.coerce
      .number()
      .int()
      .gte(1000, 'Timeout should be at least 1000ms')
      .lte(10000, 'Timeout should not exceed 10,000ms'),
    events: z.array(z.string()).min(1, 'Please select at least one event'),
    httpHeaders: httpHeadersSchema,
    httpParameters: httpParametersSchema,
  })
  .and(z.discriminatedUnion('function_type', [httpRequestSchema, supabaseFunctionSchema]))
  .superRefine((data, ctx) => {
    addKeyValueIssues(data.httpHeaders, ctx, 'httpHeaders')
    addKeyValueIssues(data.httpParameters, ctx, 'httpParameters')
  })

export type WebhookFormValues = z.infer<typeof FormSchema>
