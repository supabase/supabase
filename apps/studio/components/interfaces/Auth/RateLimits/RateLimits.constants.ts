export const AUTH_RATE_LIMIT_FIELD_COPY = {
  RATE_LIMIT_OTP: {
    label: 'Rate limit for OTP requests',
    description:
      'Number of OTP and magic link requests that can be sent per hour from your project',
    unit: 'requests/h',
    showHourlyEstimate: false,
  },
} as const
