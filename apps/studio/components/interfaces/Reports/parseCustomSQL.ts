const escapeValue = (value: string) => value.replace(/'/g, "''")

export const parseCustomSQL = (
  sqlString: string,
  variables: { timerange_from?: string; timerange_to?: string }
) => {
  if (!sqlString) return sqlString

  const replacements: Record<string, string | undefined> = {
    timerange_from: variables.timerange_from,
    timerange_to: variables.timerange_to,
  }

  return Object.entries(replacements).reduce((acc, [key, value]) => {
    if (!value) return acc
    const safeValue = escapeValue(value)
    const pattern = new RegExp(`@${key}\\b`, 'gi')
    return acc.replace(pattern, `'${safeValue}'`)
  }, sqlString)
}

