import { ERRORS } from '@internal/errors'

// RFC 9110 sections 5.6.2, 5.6.4 and 5.6.6: token, quoted-string and parameters.
const TOKEN = "[!#$%&'*+.^_`|~0-9A-Za-z-]+"
const QUOTED_STRING = String.raw`"(?:[\t\x20\x21\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\t\x20-\x7e\x80-\xff])*"`
const MEDIA_TYPE = new RegExp(String.raw`^[\t ]*(${TOKEN})/(${TOKEN})[\t ]*`)
const PARAMETER = new RegExp(
  String.raw`;[\t ]*(?:${TOKEN}=(?:${TOKEN}|${QUOTED_STRING})[\t ]*)?`,
  'y'
)

function parseMediaType(mimeType: string, allowSubtypeWildcard = false) {
  const match = MEDIA_TYPE.exec(mimeType)
  if (!match) {
    return
  }

  const type = match[1].toLowerCase()
  const subtype = match[2].toLowerCase()
  if (type.includes('*') || (subtype.includes('*') && !(allowSubtypeWildcard && subtype === '*'))) {
    return
  }

  let offset = match[0].length
  while (offset < mimeType.length) {
    PARAMETER.lastIndex = offset
    if (!PARAMETER.test(mimeType)) {
      return
    }
    offset = PARAMETER.lastIndex
  }

  return `${type}/${subtype}`
}

// Store only the media types that bucket restrictions actually compare.
export function normalizeAllowedMimeTypes(mimeTypes: string[]) {
  const normalized = new Set<string>()
  for (const mimeType of mimeTypes) {
    const parsed = mimeType.length <= 1000 ? parseMediaType(mimeType, true) : undefined
    if (!parsed) {
      throw ERRORS.InvalidMimeType(mimeType)
    }
    normalized.add(parsed)
  }
  return [...normalized]
}

// Compare validated media types without modifying the object's Content-Type.
export function validateMimeType(mimeType: string, allowedMimeTypes: string[]) {
  const requested = parseMediaType(mimeType)
  if (!requested) {
    throw ERRORS.InvalidMimeType(mimeType)
  }

  const wildcard = requested.slice(0, requested.indexOf('/') + 1) + '*'
  for (const allowedMimeType of allowedMimeTypes) {
    if (allowedMimeType === requested || allowedMimeType === wildcard) {
      return true
    }

    const allowed = parseMediaType(allowedMimeType, true)
    if (allowed === requested || allowed === wildcard) {
      return true
    }
  }

  throw ERRORS.InvalidMimeType(mimeType)
}
