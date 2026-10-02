import { ERRORS } from '@internal/errors'

const SIMPLE_RULES = [
  'all',
  'noindex',
  'nofollow',
  'none',
  'nosnippet',
  'indexifembedded',
  'notranslate',
  'noimageindex',
] as const

const PARAMETRIC_RULES = [
  'max-snippet',
  'max-image-preview',
  'max-video-preview',
  'unavailable_after',
] as const

const simpleRulesPattern = SIMPLE_RULES.join('|')
const parametricRulesPattern = PARAMETRIC_RULES.join('|')
const SIMPLE_RULE_REGEX = new RegExp(`^(${simpleRulesPattern})$`)
const PARAMETRIC_RULE_REGEX = new RegExp(`^(${parametricRulesPattern}):\\s*(.*)$`)
const PARAMETRIC_RULE_START_REGEX = new RegExp(`^(${parametricRulesPattern}):`)
const DECIMAL_INTEGER_REGEX = /^-?\d+$/
const UNAVAILABLE_AFTER_END_REGEX = new RegExp(
  `^unavailable_after:\\s*(.+?)(?=,\\s*(?:${simpleRulesPattern}|${parametricRulesPattern}|[a-zA-Z0-9_-]+:)|$)`
)
const VALID_IMAGE_PREVIEW_VALUES = new Set(['none', 'standard', 'large'])

/**
 * Validates the X-Robots-Tag header value according to MDN specification
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Robots-Tag
 *
 * @param value - The X-Robots-Tag header value to validate
 * @throws {Error} If the header value is invalid
 */
export function validateXRobotsTag(value: string): void {
  if (!value || typeof value !== 'string') {
    throw ERRORS.InvalidXRobotsTag('X-Robots-Tag header value must be a non-empty string')
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    throw ERRORS.InvalidXRobotsTag('X-Robots-Tag header value must be a non-empty string')
  }

  const parts = splitRules(trimmedValue)

  for (const part of parts) {
    if (!part) {
      throw ERRORS.InvalidXRobotsTag('X-Robots-Tag header contains empty rule')
    }

    // Check if this is a parametric rule
    const parametricMatch = part.match(PARAMETRIC_RULE_REGEX)
    if (parametricMatch) {
      const [, ruleName, ruleValue] = parametricMatch
      validateParametricRule(ruleName, ruleValue.trim(), VALID_IMAGE_PREVIEW_VALUES)
      continue
    }

    // Check if this is a simple rule
    if (SIMPLE_RULE_REGEX.test(part)) {
      continue
    }

    // Check if this has a colon (could be user agent prefix)
    const colonIndex = part.indexOf(':')
    if (colonIndex !== -1) {
      const beforeColon = part.substring(0, colonIndex).trim()
      const afterColon = part.substring(colonIndex + 1).trim()

      if (!afterColon) {
        throw ERRORS.InvalidXRobotsTag(
          `X-Robots-Tag user agent "${beforeColon}" has no rules specified`
        )
      }

      // Recursively validate user agent rules
      validateXRobotsTag(afterColon)
      continue
    }

    throw ERRORS.InvalidXRobotsTag(`Invalid X-Robots-Tag rule: "${part}"`)
  }
}

/**
 * Splits rules by comma, handling parametric rules with dates that contain commas
 */
function splitRules(value: string): string[] {
  const parts: string[] = []
  let remaining = value

  while (remaining) {
    remaining = remaining.trim()
    if (!remaining) break

    const match = remaining.match(PARAMETRIC_RULE_START_REGEX)
    if (match) {
      const ruleName = match[1]

      // For unavailable_after, extract date value (may contain commas)
      if (ruleName === 'unavailable_after') {
        // Find the end of the date by looking for a comma + known rule or user agent
        const dateEndMatch = remaining.match(UNAVAILABLE_AFTER_END_REGEX)

        if (dateEndMatch) {
          const fullRule = `unavailable_after: ${dateEndMatch[1].trim()}`
          parts.push(fullRule)
          remaining = remaining.substring(dateEndMatch[0].length).replace(/^,\s*/, '').trim()
        } else {
          parts.push(remaining)
          remaining = ''
        }
        continue
      }
    }

    // Default: split by comma (for other parametric rules and simple rules)
    const nextComma = remaining.indexOf(',')
    if (nextComma === -1) {
      parts.push(remaining)
      remaining = ''
    } else {
      parts.push(remaining.substring(0, nextComma).trim())
      remaining = remaining.substring(nextComma + 1).trim()
    }
  }

  return parts
}

/**
 * Validates a parametric rule value
 */
function validateParametricRule(
  ruleName: string,
  ruleValue: string,
  validImagePreviewValues: Set<string>
): void {
  if (!ruleValue) {
    throw ERRORS.InvalidXRobotsTag(`X-Robots-Tag rule "${ruleName}" requires a value`)
  }

  switch (ruleName) {
    case 'max-snippet': {
      const num = Number(ruleValue)
      // -1 ("no limit", the default) and 0 ("no snippet") are both valid per the
      // robots meta spec, alongside any positive length.
      if (!DECIMAL_INTEGER_REGEX.test(ruleValue) || !Number.isInteger(num) || num < -1) {
        throw ERRORS.InvalidXRobotsTag(
          `X-Robots-Tag "max-snippet" value must be an integer >= -1, got: "${ruleValue}"`
        )
      }
      break
    }

    case 'max-image-preview': {
      if (!validImagePreviewValues.has(ruleValue)) {
        throw ERRORS.InvalidXRobotsTag(
          `X-Robots-Tag "max-image-preview" value must be one of: none, standard, large, got: "${ruleValue}"`
        )
      }
      break
    }

    case 'max-video-preview': {
      const num = Number(ruleValue)
      if (!DECIMAL_INTEGER_REGEX.test(ruleValue) || !Number.isInteger(num) || num < -1) {
        throw ERRORS.InvalidXRobotsTag(
          `X-Robots-Tag "max-video-preview" value must be an integer >= -1, got: "${ruleValue}"`
        )
      }
      break
    }

    case 'unavailable_after': {
      // Check if it's a valid date string (try parsing it)
      const date = new Date(ruleValue)
      if (isNaN(date.getTime())) {
        throw ERRORS.InvalidXRobotsTag(
          `X-Robots-Tag "unavailable_after" value must be a valid date, got: "${ruleValue}"`
        )
      }
      break
    }
  }
}
