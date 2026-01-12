const NIMBUS_PROD_PROJECTS_URL = process.env.NIMBUS_PROD_PROJECTS_URL

export const isValidEdgeFunctionURL = (url: string) => {
  if (NIMBUS_PROD_PROJECTS_URL !== undefined) {
    const apexDomain = NIMBUS_PROD_PROJECTS_URL.replace('https://*.', '').replace(/\./g, '\\.')
    const nimbusRegex = new RegExp('^https://[a-z]*\\.' + apexDomain + '/functions/v[0-9]{1}/.*$')
    return nimbusRegex.test(url)
  }

  const regexValidEdgeFunctionURL = new RegExp(
    '^https://[a-z]*.supabase.(red|co)/functions/v[0-9]{1}/.*$'
  )

  return regexValidEdgeFunctionURL.test(url)
}
