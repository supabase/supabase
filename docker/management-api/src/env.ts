const required = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 8085),
  databaseUrl: required('DATABASE_URL'),
  apiToken: required('MANAGEMENT_API_TOKEN'),
  authConfigDir: process.env.AUTH_CONFIG_DIR ?? '/etc/auth-runtime',
  selfUrl: process.env.SELF_URL ?? 'http://management-api:8085',
  authCallbackUrl:
    process.env.AUTH_CALLBACK_URL ??
    (process.env.API_EXTERNAL_URL ? `${process.env.API_EXTERNAL_URL}/auth/v1/callback` : ''),
  encryptionKey: process.env.MANAGEMENT_ENC_KEY || required('VAULT_ENC_KEY'),
}
