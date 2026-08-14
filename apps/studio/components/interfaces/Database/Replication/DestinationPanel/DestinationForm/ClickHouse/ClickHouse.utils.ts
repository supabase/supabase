import { type DestinationPanelSchemaType } from '../DestinationForm.schema'

export type ClickHouseApiConfig = {
  url: string
  user: string
  password?: string
  database: string
  engine?: 'merge_tree' | 'replacing_merge_tree'
}

type ClickHouseFieldPath = 'clickhouseUrl' | 'clickhouseUser' | 'clickhouseDatabase'

export type ClickHouseValidationIssue = {
  path: ClickHouseFieldPath
  message: string
}

/**
 * Client-side check that the URL does not target an obviously internal address.
 * This is a UX-level guard to surface mistakes before the validate round-trip;
 * server-side validation remains authoritative.
 */
const isClickHouseHostInternal = (host: string): boolean => {
  if (host === '' || host === 'localhost' || host.endsWith('.localhost')) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)

  if (ipv4) {
    const a = Number(ipv4[1])
    const b = Number(ipv4[2])

    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT (RFC 6598)
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) || // benchmarking (RFC 2544)
      a >= 224
    )
  }

  if (host.includes(':')) {
    const lower = host.toLowerCase()

    return (
      lower === '::1' ||
      lower === '::' ||
      /^fe[89ab][0-9a-f]?:/.test(lower) ||
      /^f[cd][0-9a-f]{2}:/.test(lower) ||
      lower.startsWith('::ffff:') ||
      lower.startsWith('64:ff9b:') // NAT64 (RFC 6052 well-known + RFC 8215 local-use)
    )
  }

  return false
}

export const getClickHouseValidationIssues = (
  data: Pick<DestinationPanelSchemaType, ClickHouseFieldPath>
): ClickHouseValidationIssue[] => {
  const issues: ClickHouseValidationIssue[] = []

  if (!data.clickhouseUrl?.length) {
    issues.push({ path: 'clickhouseUrl', message: 'URL is required' })
  } else {
    let parsed: URL | undefined

    try {
      parsed = new URL(data.clickhouseUrl)
    } catch {
      issues.push({ path: 'clickhouseUrl', message: 'ClickHouse URL must be a valid URL' })
    }

    if (parsed) {
      if (parsed.protocol !== 'https:') {
        issues.push({ path: 'clickhouseUrl', message: 'ClickHouse URL must use https://' })
      } else {
        const host = parsed.hostname.replace(/^\[|\]$/g, '')

        if (isClickHouseHostInternal(host)) {
          issues.push({
            path: 'clickhouseUrl',
            message: 'ClickHouse URL must not target an internal address',
          })
        }
      }
    }
  }

  if (!data.clickhouseUser?.length) {
    issues.push({ path: 'clickhouseUser', message: 'User is required' })
  }

  if (!data.clickhouseDatabase?.length) {
    issues.push({ path: 'clickhouseDatabase', message: 'Database is required' })
  }

  return issues
}
