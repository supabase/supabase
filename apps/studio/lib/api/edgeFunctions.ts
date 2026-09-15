import { IS_PLATFORM } from '@/lib/constants'

const NIMBUS_PROD_PROJECTS_URL = process.env.NIMBUS_PROD_PROJECTS_URL
// Cron jobs and database hooks run inside Postgres, where Kong is available by this network alias.
const SELF_HOSTED_EDGE_FUNCTIONS_URL = 'http://kong:8000/functions/v1'
const PLATFORM_TLDS = ['co', 'red'] as const

export const buildDatabaseEdgeFunctionUrl = (
  slug: string,
  projectRef: string,
  restUrl?: string,
  isPlatform = IS_PLATFORM
) => {
  if (!isPlatform) return `${SELF_HOSTED_EDGE_FUNCTIONS_URL}/${slug}`

  const projectOrigin = restUrl ? new URL(restUrl).origin : `https://${projectRef}.supabase.co`
  return `${projectOrigin}/functions/v1/${slug}`
}

export const isEdgeFunctionUrl = (
  url: string,
  projectRef: string,
  restUrl?: string,
  isPlatform = IS_PLATFORM
) => {
  if (!isPlatform && url.startsWith(`${SELF_HOSTED_EDGE_FUNCTIONS_URL}/`)) return true

  const projectOrigin = restUrl ? new URL(restUrl).origin : undefined
  if (projectOrigin && url.startsWith(`${projectOrigin}/functions/v1/`)) return true

  return PLATFORM_TLDS.some(
    (tld) =>
      url.startsWith(`https://${projectRef}.functions.supabase.${tld}/`) ||
      url.startsWith(`https://${projectRef}.supabase.${tld}/functions/`)
  )
}

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
