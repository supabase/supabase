import * as z from 'zod'

export const MAX_JWT_EXP = 604800

export const MAX_SESSIONS_TIMEBOX_HOURS = 8760 // 1 year
export const MAX_SESSIONS_INACTIVITY_TIMEOUT_HOURS = 8760 // 1 year
export const MAX_REFRESH_TOKEN_REUSE_INTERVAL_SECONDS = 300 // 5 mins

export const MAX_SESSIONS_TIMEBOX_MESSAGE = `Must be ${MAX_SESSIONS_TIMEBOX_HOURS} hours (1 year) or less`
export const MAX_SESSIONS_INACTIVITY_TIMEOUT_MESSAGE = `Must be ${MAX_SESSIONS_INACTIVITY_TIMEOUT_HOURS} hours (1 year) or less`
export const MAX_REFRESH_TOKEN_REUSE_INTERVAL_MESSAGE = `Must be ${MAX_REFRESH_TOKEN_REUSE_INTERVAL_SECONDS} seconds (5 minutes) or less`

const isWithinMaxOrUnchanged = (max: number, savedValue: number) => (value: number) =>
  value <= max || value === savedValue

export const AccessTokenSchema = z.object({
  JWT_EXP: z.coerce
    .number()
    .int('Must be a whole number')
    .positive('Must be greater than 0')
    .max(MAX_JWT_EXP, `Must be less than ${MAX_JWT_EXP}`),
})

export type AccessTokenFormValues = z.infer<typeof AccessTokenSchema>

export const createRefreshTokenSchema = ({ savedReuseInterval }: { savedReuseInterval: number }) =>
  z.object({
    REFRESH_TOKEN_ROTATION_ENABLED: z.boolean(),
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: z.coerce
      .number()
      .min(0, 'Must be 0 or greater')
      .refine(
        isWithinMaxOrUnchanged(MAX_REFRESH_TOKEN_REUSE_INTERVAL_SECONDS, savedReuseInterval),
        MAX_REFRESH_TOKEN_REUSE_INTERVAL_MESSAGE
      ),
  })

export type RefreshTokenFormValues = z.infer<ReturnType<typeof createRefreshTokenSchema>>

export const createUserSessionsSchema = ({
  savedTimebox,
  savedInactivityTimeout,
}: {
  savedTimebox: number
  savedInactivityTimeout: number
}) =>
  z.object({
    SESSIONS_TIMEBOX: z.coerce
      .number()
      .min(0, 'Must be 0 or greater')
      .refine(
        isWithinMaxOrUnchanged(MAX_SESSIONS_TIMEBOX_HOURS, savedTimebox),
        MAX_SESSIONS_TIMEBOX_MESSAGE
      ),
    SESSIONS_INACTIVITY_TIMEOUT: z.coerce
      .number()
      .multipleOf(0.1, 'Must be a multiple of 0.1')
      .min(0, 'Must be 0 or greater')
      .refine(
        isWithinMaxOrUnchanged(MAX_SESSIONS_INACTIVITY_TIMEOUT_HOURS, savedInactivityTimeout),
        MAX_SESSIONS_INACTIVITY_TIMEOUT_MESSAGE
      ),
    SESSIONS_SINGLE_PER_USER: z.boolean(),
  })

export type UserSessionsFormValues = z.infer<ReturnType<typeof createUserSessionsSchema>>
