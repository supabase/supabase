import { z } from 'zod'

import { isValidHttpUrl } from '@/lib/helpers'

const httpRequestSchema = z.object({
  function_type: z.literal('http_request'),
  http_url: z
    .string()
    .min(1, 'Please provide a URL')
    .refine((val) => val.startsWith('http'), 'Please prefix your URL with http or https')
    .refine((val) => isValidHttpUrl(val), 'Please provide a valid URL'),
})

const supabaseFunctionSchema = z.object({
  function_type: z.literal('supabase_function'),
  http_url: z
    .string()
    .min(1, 'Please select an edge function')
    .refine((val) => !val.includes('undefined'), 'No edge functions available for selection'),
})

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
    httpHeaders: z.array(z.object({ id: z.string(), name: z.string(), value: z.string() })),
    httpParameters: z.array(z.object({ id: z.string(), name: z.string(), value: z.string() })),
  })
  .and(z.discriminatedUnion('function_type', [httpRequestSchema, supabaseFunctionSchema]))

export type WebhookFormValues = z.infer<typeof FormSchema>
