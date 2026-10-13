export type RecoveryCodesPreview = 0 | 1 | 2 | 3 | 'missing' | 'healthy' | 'backup' | 'mfa-off'

export const getRecoveryCodesPreview = ({
  value,
  environment,
  hostname,
}: {
  value: string | null
  environment: string | undefined
  hostname: string
}): RecoveryCodesPreview | undefined => {
  if (environment !== 'development' || !['localhost', '127.0.0.1'].includes(hostname))
    return undefined
  if (value === '0') return 0
  if (value === '3') return 3
  if (value === 'missing' || value === 'healthy' || value === 'backup' || value === 'mfa-off')
    return value
  if (value === '1') return 1
  if (value === '2') return 2
  return undefined
}
