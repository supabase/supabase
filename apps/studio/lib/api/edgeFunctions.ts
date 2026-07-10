const NIMBUS_PROD_PROJECTS_URL = process.env.NIMBUS_PROD_PROJECTS_URL

export const isValidEdgeFunctionURL = (url: string, isPlatform: boolean) => {
  if (NIMBUS_PROD_PROJECTS_URL !== undefined) {
    const apexDomain = NIMBUS_PROD_PROJECTS_URL.replace('https://*.', '').replace(/\./g, '\\.')
    const nimbusRegex = new RegExp('^https://[a-z]*\\.' + apexDomain + '/functions/v[0-9]{1}/.*$')
    return nimbusRegex.test(url)
  }

  if (!isPlatform) {
    const regexValidLocalEdgeFunctionURL = new RegExp(
      /^https?:\/\/[^\s/?#]+\/functions\/v[0-9]{1}\/.*$/
    )

    return regexValidLocalEdgeFunctionURL.test(url)
  }

  const regexValidEdgeFunctionURL = new RegExp(
    /^https:\/\/[a-z]{20}\.supabase\.(red|co)\/functions\/v[0-9]{1}\/.*$/
  )

  return regexValidEdgeFunctionURL.test(url)
}

// Self-hosted (Kong-fronted) edge runtime errors use `message`, while
// platform errors use `error` - check both rather than assuming one shape.
export const getEdgeFunctionErrorMessage = (responseBody: string): string => {
  try {
    const errorBody = JSON.parse(responseBody)

    if (typeof errorBody?.message === 'string' && errorBody.message) return errorBody.message
    if (typeof errorBody?.error === 'string' && errorBody.error) return errorBody.error

    return 'Edge function returned an error'
  } catch {
    return responseBody || 'Edge function returned an error'
  }
}
