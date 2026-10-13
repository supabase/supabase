export const getRecoveryCodesPreview = ({
  value,
  environment,
  hostname,
}: {
  value: string | null
  environment: string | undefined
  hostname: string
}): 1 | 2 | undefined => {
  if (environment !== 'development' || !['localhost', '127.0.0.1'].includes(hostname))
    return undefined
  if (value === '1') return 1
  if (value === '2') return 2
  return undefined
}
