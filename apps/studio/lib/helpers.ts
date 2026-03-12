import { UIEvent } from 'react'
import { v4 as _uuidV4 } from 'uuid'

import type { TablesData } from '../data/tables/tables-query'

export const uuidv4 = () => {
  return _uuidV4()
}

export const isAtBottom = ({ currentTarget }: UIEvent<HTMLElement>): boolean => {
  return currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight
}

export const tryParseJson = (jsonString: any) => {
  try {
    const parsed = JSON.parse(jsonString)
    return parsed
  } catch (error) {
    return undefined
  }
}

export const minifyJSON = (prettifiedJSON: string) => {
  try {
    if (prettifiedJSON.trim() === '') {
      return null
    }
    const res = JSON.stringify(JSON.parse(prettifiedJSON))
    if (!isNaN(Number(res))) {
      return Number(res)
    } else {
      return res
    }
  } catch (err) {
    throw err
  }
}

export const prettifyJSON = (minifiedJSON: string) => {
  try {
    if (minifiedJSON && minifiedJSON.length > 0) {
      return JSON.stringify(JSON.parse(minifiedJSON), undefined, 2)
    } else {
      return minifiedJSON
    }
  } catch (err) {
    // dont need to throw error, just return text value
    // Users have to fix format if they want to save
    return minifiedJSON
  }
}

export const removeJSONTrailingComma = (jsonString: string) => {
  /**
   * Remove trailing commas: Delete any comma immediately preceding the closing brace '}' or
   * bracket ']' using a regular expression.
   */
  return jsonString.replace(/,\s*(?=[\}\]])/g, '')
}

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getURL = () => {
  const url =
    process?.env?.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL !== ''
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process?.env?.NEXT_PUBLIC_VERCEL_BRANCH_URL &&
          process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL !== ''
        ? process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL
        : 'https://supabase.com/dashboard'
  return url.includes('http') ? url : `https://${url}`
}

/**
 * Generates a random string using alpha characters
 */
export const makeRandomString = (length: number) => {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result.toString()
}

/**
 * Get a subset of fields from an object
 * @param {object} model
 * @param {array} fields a list of properties to pluck. eg: ['first_name', 'last_name']
 */
export const pluckObjectFields = (model: any, fields: any[]) => {
  let o: any = {}
  fields.forEach((field) => {
    o[field] = model[field]
  })
  return o
}

/**
 * Returns undefined if the string isn't parse-able
 */
export const tryParseInt = (str: string) => {
  try {
    const int = parseInt(str, 10)
    return isNaN(int) ? undefined : int
  } catch (error) {
    return undefined
  }
}

// Used as checker for memoized components
export const propsAreEqual = (prevProps: any, nextProps: any) => {
  try {
    Object.keys(prevProps).forEach((key) => {
      if (typeof prevProps[key] !== 'function') {
        if (prevProps[key] !== nextProps[key]) {
          throw new Error()
        }
      }
    })
    return true
  } catch (e) {
    return false
  }
}

export const formatBytes = (
  bytes: any,
  decimals = 2,
  size?: 'bytes' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB'
) => {
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (bytes === 0 || bytes === undefined) return size !== undefined ? `0 ${size}` : '0 bytes'

  // Handle negative values
  const isNegative = bytes < 0
  const absBytes = Math.abs(bytes)

  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(absBytes) / Math.log(k))
  const formattedValue = parseFloat((absBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]

  return isNegative ? '-' + formattedValue : formattedValue
}

export const snakeToCamel = (str: string) =>
  str.replace(/([-_][a-z])/g, (group: string) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  )

export const detectBrowser = () => {
  if (!navigator) return undefined

  if (navigator.userAgent.indexOf('Chrome') !== -1) {
    return 'Chrome'
  } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
    return 'Firefox'
  } else if (navigator.userAgent.indexOf('Safari') !== -1) {
    return 'Safari'
  }
}

export const detectOS = () => {
  if (typeof window === 'undefined' || !window) return undefined
  if (typeof navigator === 'undefined' || !navigator) return undefined

  const userAgent = window.navigator.userAgent.toLowerCase()
  const macosPlatforms = /(macintosh|macintel|macppc|mac68k|macos)/i
  const windowsPlatforms = /(win32|win64|windows|wince)/i

  if (macosPlatforms.test(userAgent)) {
    return 'macos'
  } else if (windowsPlatforms.test(userAgent)) {
    return 'windows'
  } else {
    return undefined
  }
}

export const getModKeyLabel = () => {
  const os = detectOS()
  return os === 'macos' ? '⌘' : 'Ctrl+'
}

/**
 * Convert a list of tables to SQL
 * @param t - The list of tables
 * @returns The SQL string
 */
export function tablesToSQL(t: TablesData) {
  if (!Array.isArray(t)) return ''
  const warning =
    '-- WARNING: This schema is for context only and is not meant to be run.\n-- Table order and constraints may not be valid for execution.\n\n'
  const sql = t
    .map((table) => {
      if (!table || !Array.isArray((table as any).columns)) return ''

      const columns = (table as { columns?: any[] }).columns ?? []
      const columnLines = columns.map((c) => {
        let line = `  ${c.name} ${c.data_type}`
        if (c.is_identity) {
          line += ' GENERATED ALWAYS AS IDENTITY'
        }
        if (c.is_nullable === false) {
          line += ' NOT NULL'
        }
        if (c.default_value !== null && c.default_value !== undefined) {
          line += ` DEFAULT ${c.default_value}`
        }
        if (c.is_unique) {
          line += ' UNIQUE'
        }
        if (c.check) {
          line += ` CHECK (${c.check})`
        }
        return line
      })

      const constraints: string[] = []

      if (Array.isArray(table.primary_keys) && table.primary_keys.length > 0) {
        const pkCols = table.primary_keys.map((pk: any) => pk.name).join(', ')
        constraints.push(`  CONSTRAINT ${table.name}_pkey PRIMARY KEY (${pkCols})`)
      }

      if (Array.isArray(table.relationships)) {
        table.relationships.forEach((rel: any) => {
          if (rel && rel.source_table_name === table.name) {
            constraints.push(
              `  CONSTRAINT ${rel.constraint_name} FOREIGN KEY (${rel.source_column_name}) REFERENCES ${rel.target_table_schema}.${rel.target_table_name}(${rel.target_column_name})`
            )
          }
        })
      }

      const allLines = [...columnLines, ...constraints]
      return `CREATE TABLE ${table.schema}.${table.name} (\n${allLines.join(',\n')}\n);`
    })
    .join('\n')
  return warning + sql
}

/**
 * Pluralize a word based on a count
 */
export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : plural || singular + 's'
}

export const isValidHttpUrl = (value: string) => {
  let url: URL
  try {
    url = new URL(value)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

/**
 * Remove markdown code blocks (fenced and inline) from text
 */
export const stripMarkdownCodeBlocks = (text: string): string => {
  // Remove fenced code blocks (```...```)
  const withoutFenced = text.replace(/```[\s\S]*?```/g, '')
  // Remove inline code (`...`)
  return withoutFenced.replace(/`[^`]+`/g, '')
}

interface ExtractUrlsOptions {
  excludeCodeBlocks?: boolean
  excludeTemplates?: boolean
}

/**
 * Extract URLs from text using regex for URL detection
 * Matches URLs with protocols (http/https) and common domain patterns
 * @param text - The text to extract URLs from
 * @param options - Optional filtering options
 * @returns Array of extracted URLs with trailing punctuation removed
 */
export const extractUrls = (text: string, options?: ExtractUrlsOptions): string[] => {
  const { excludeCodeBlocks = false, excludeTemplates = false } = options ?? {}

  let processedText = text
  if (excludeCodeBlocks) {
    processedText = stripMarkdownCodeBlocks(processedText)
  }

  // Regex matches URLs with protocols (http/https)
  // Handles: domains, ports, paths, query params, and fragments
  // Pattern: https?://domain(:port)?(/path)?(?query)?(#fragment)?
  const urlRegex = /https?:\/\/(?:[-\w.])+(?::\d+)?(?:\/(?:[\w\/_.~!*'();:@&=+$,?#[\]%-])*)?/gi

  const urls: string[] = []
  let match

  while ((match = urlRegex.exec(processedText)) !== null) {
    // Remove trailing punctuation that might have been captured (common in text)
    const url = match[0].replace(/[.,;:!?)*]+$/, '')

    if (excludeTemplates) {
      // Skip URLs that were truncated at an angle bracket (template URL)
      const endPos = match.index + match[0].length
      if (processedText[endPos] === '<') {
        continue
      }
    }

    urls.push(url)
  }

  return urls
}

/**
 * Helper function to remove comments from SQL.
 * Disclaimer: Doesn't work as intended for nested comments.
 */
export const removeCommentsFromSql = (sql: string) => {
  // Removing single-line comments:
  let cleanedSql = sql.replace(/--.*$/gm, '')

  // Removing multi-line comments:
  cleanedSql = cleanedSql.replace(/\/\*[\s\S]*?\*\//gm, '')

  return cleanedSql
}

const formatSemver = (version: string) => {
  // e.g supabase-postgres-14.1.0.88
  // There's 4 segments instead so we can't use the semver package
  const segments = version.split('supabase-postgres-')
  const semver = segments[segments.length - 1]

  // e.g supabase-postgres-14.1.0.99-vault-rc1
  const formattedSemver = semver.split('-')[0]

  return formattedSemver
}

export const getSemanticVersion = (version: string) => {
  if (!version) return 0

  const formattedSemver = formatSemver(version)
  return Number(formattedSemver.split('.').join(''))
}

export const getDatabaseMajorVersion = (version: string) => {
  if (!version) return 0

  const formattedSemver = formatSemver(version)
  return Number(formattedSemver.split('.')[0])
}

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180)
}

export const getDistanceLatLonKM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371 // Radius of the earth in kilometers
  const dLat = deg2rad(lat2 - lat1) // deg2rad below
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in KM
  return d
}

const currencyFormatterDefault = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const currencyFormatterSmallValues = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
})

export const formatCurrency = (amount: number | undefined | null): string | null => {
  if (amount === undefined || amount === null) {
    return null
  } else if (amount > 0 && amount < 0.01) {
    return currencyFormatterSmallValues.format(amount)
  } else {
    return currencyFormatterDefault.format(amount)
  }
}

/**
 * [Joshen] This is to address an incredibly weird bug that's happening between Data Grid + Shadcn ContextMenu + Shadcn Overlay
 * This trifecta is causing a pointer events none style getting left behind on the body element which makes the dashboard become
 * unresponsive, hence the attempt to clean things up here
 *
 * Timeout is made configurable as I've observed it requires a higher timeout sometimes (e.g when closing the cron job sheet)
 */
export const cleanPointerEventsNoneOnBody = (timeoutMs: number = 300) => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = ''
      }
    }, timeoutMs)
  }
}

export const createWrappedSymbol = (name: string, display: string): Symbol => {
  const sym = Symbol(name)
  const wrapper = Object(sym)

  wrapper.toString = () => display

  Object.freeze(wrapper)
  return wrapper
}

// Intentional for generic use; does not affect type safety since this branch is
// unreachable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function neverGuard(_: never): any {}
