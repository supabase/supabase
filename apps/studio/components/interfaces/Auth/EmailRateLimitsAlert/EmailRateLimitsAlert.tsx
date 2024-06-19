import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, IconAlertTriangle } from 'ui'

export function EmailRateLimitsAlert() {
  return (
    <Alert_Shadcn_ variant="warning">
      <IconAlertTriangle strokeWidth={2} />
      <AlertTitle_Shadcn_>Built-in email service is rate-limited!</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        You're using the built-in email service. The service has rate limits and it's not meant to
        be used for production apps. Check the{' '}
        <a
          href="https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits"
          className="underline"
          target="_blank"
        >
          documentation
        </a>{' '}
        for an up-to-date information on the current rate limits. Please use a custom SMTP server if
        you're planning on having large number of users.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
