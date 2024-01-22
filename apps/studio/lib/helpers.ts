import { post } from 'lib/common/fetch'
import { API_URL, DEFAULT_MINIMUM_PASSWORD_STRENGTH, PASSWORD_STRENGTH } from 'lib/constants'
import { toast } from 'react-hot-toast'
import { v4 as _uuidV4 } from 'uuid'

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

export const uuidv4 = () => {
  return _uuidV4()
}

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const getURL = () => {
  const url =
    process?.env?.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL !== ''
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process?.env?.VERCEL_URL && process.env.VERCEL_URL !== ''
      ? process.env.VERCEL_URL
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
    return parseInt(str, 10)
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
  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const snakeToCamel = (str: string) =>
  str.replace(/([-_][a-z])/g, (group: string) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  )

/**
 * Copy text content (string or Promise<string>) into Clipboard.
 * Safari doesn't support write text into clipboard async, so if you need to load
 * text content async before coping, please use Promise<string> for the 1st arg.
 */
export const copyToClipboard = async (str: string | Promise<string>, callback = () => {}) => {
  const focused = window.document.hasFocus()
  if (focused) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      const text = await Promise.resolve(str)
      Promise.resolve(window.navigator?.clipboard?.writeText(text)).then(callback)

      return
    }

    Promise.resolve(str)
      .then((text) => window.navigator?.clipboard?.writeText(text))
      .then(callback)
  } else {
    console.warn('Unable to copy to clipboard')
  }
}

export async function passwordStrength(value: string) {
  let message: string = ''
  let warning: string = ''
  let strength: number = 0

  if (value && value !== '') {
    if (value.length > 99) {
      message = `${PASSWORD_STRENGTH[0]} Maximum length of password exceeded`
      warning = `Password should be less than 100 characters`
    } else {
      // [Joshen] Unable to use RQ atm due to our Jest tests being in JS
      const response = await post(`${API_URL}/profile/password-check`, { password: value })
      if (!response.error) {
        const { result } = response
        const resultScore = result?.score ?? 0

        const score = (PASSWORD_STRENGTH as any)[resultScore]
        const suggestions = result.feedback?.suggestions
          ? result.feedback.suggestions.join(' ')
          : ''

        message = `${score} ${suggestions}`
        strength = resultScore

        // warning message for anything below 4 strength :string
        if (resultScore < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
          warning = `${
            result?.feedback?.warning ? result?.feedback?.warning + '.' : ''
          } You need a stronger password.`
        }
      } else {
        toast.error(`Failed to check password strength: ${response.error.message}`)
      }
    }
  }

  return {
    message,
    warning,
    strength,
  }
}

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

const currencyFormatter = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
})

export const formatCurrency = (amount: number | undefined | null): string | null => {
  if (amount === undefined || amount === null) {
    return null
  } else {
    return currencyFormatter.format(amount)
  }
}
