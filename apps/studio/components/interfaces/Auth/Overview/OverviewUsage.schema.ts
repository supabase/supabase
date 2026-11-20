import { z } from 'zod'

export const AuthMetricsPeriodSchema = z.enum(['current', 'previous'])

export const RawAuthMetricsRowSchema = z.object({
  period: AuthMetricsPeriodSchema,
  active_users: z.number().min(0),
  api_error_requests: z.number().min(0),
  api_total_requests: z.number().min(0),
  auth_total_errors: z.number().min(0),
  auth_total_requests: z.number().min(0),
  password_reset_requests: z.number().min(0),
  sign_up_count: z.number().min(0),
})

export const RawAuthMetricsResponseSchema = z.object({
  result: z.array(RawAuthMetricsRowSchema),
  error: z.unknown().nullable(),
})

export type RawAuthMetricsRow = z.infer<typeof RawAuthMetricsRowSchema>
export type RawAuthMetricsResponse = z.infer<typeof RawAuthMetricsResponseSchema>
