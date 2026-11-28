export function requireEnvironmentVariables(values: Record<string, string | undefined>) {
  const missing = Object.entries(values)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}. ` +
        'Set them in apps/www/.env.local for local development and restart www. ' +
        'See https://github.com/supabase/supabase/blob/master/apps/www/README.md#environment-variables'
    )
  }
}
