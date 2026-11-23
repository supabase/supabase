type SentryEventTags = {
  tags?: {
    globalErrorBoundary?: string | number | boolean | null
    third_party_code?: string | number | boolean | null
    codeSampleRate?: string | number | boolean | null
    empty_body_diagnostic?: string | number | boolean | null
    browser_translation?: string | number | boolean | null
  }
}

const NON_CRASH_ERROR_SAMPLE_RATE = 0.01

export function isSentryErrorBoundaryCrash(event: SentryEventTags): boolean {
  return event.tags?.globalErrorBoundary === true || event.tags?.globalErrorBoundary === 'true'
}

export function filterSentryEvent<T extends SentryEventTags>(
  event: T,
  { isPlatform, hasConsent }: { isPlatform: boolean; hasConsent: boolean }
): T | null {
  if (!isPlatform || !hasConsent) return null

  const isErrorBoundaryCrash = isSentryErrorBoundaryCrash(event)
  const isThirdPartyOnly =
    event.tags?.third_party_code === true || event.tags?.third_party_code === 'true'

  // Browser-translation DOM errors carry their own `sample_rate` tag (applied later in Studio's
  // `beforeSend`), so the 1% here would multiply with it and under-count them.
  const isBrowserTranslation =
    event.tags?.browser_translation === true || event.tags?.browser_translation === 'true'

  // Studio's once-per-session empty-body diagnostic is too rare to sample
  const isUnsampled =
    isErrorBoundaryCrash ||
    isBrowserTranslation ||
    event.tags?.empty_body_diagnostic === true ||
    event.tags?.empty_body_diagnostic === 'true'

  if (isThirdPartyOnly && !isErrorBoundaryCrash) return null
  if (!isUnsampled && Math.random() >= NON_CRASH_ERROR_SAMPLE_RATE) return null

  event.tags = {
    ...event.tags,
    codeSampleRate: isUnsampled ? '1' : NON_CRASH_ERROR_SAMPLE_RATE.toString(),
  }

  return event
}

/**
 * Insert/remove node errors thrown when browser translation (e.g. Chrome Translate) or an extension
 * rewrites DOM text nodes under React. Apps that don't sample these (docs, www) add this list to
 * `ignoreErrors`; Studio leaves it out and samples the matches in `beforeSend` instead.
 *
 * Matched like Sentry's `ignoreErrors`: strings by substring, RegExps by test, against the event
 * message and the last exception.
 */
export const BROWSER_TRANSLATION_DOM_ERRORS: (string | RegExp)[] = [
  'Node.insertBefore: Child to insert before is not a child of this node',
  'Node.removeChild: The node to be removed is not a child of this node',
  "NotFoundError: Failed to execute 'removeChild' on 'Node'",
  "NotFoundError: Failed to execute 'insertBefore' on 'Node'",
  'NotFoundError: The object can not be found here.',
]

// Of the events we keep, the share of browser-translation DOM errors we send. Applied through the
// `sample_rate` tag in Studio's `beforeSend`, instead of the 1% non-crash sampling.
export const BROWSER_TRANSLATION_SAMPLE_RATE = 0.05

type SentryExceptionEvent = {
  message?: string
  exception?: { values?: { type?: string; value?: string }[] }
}

function matchesPattern(text: string, pattern: string | RegExp): boolean {
  return typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)
}

export function isBrowserTranslationDomError(event: SentryExceptionEvent): boolean {
  // Same candidates as Sentry's `ignoreErrors`: the event message and the last exception (the main
  // one; an AggregateError's members come before it), as both `value` and `Type: value`.
  const values = event.exception?.values ?? []
  const lastException = values[values.length - 1]
  const candidates = [
    event.message,
    lastException?.value,
    lastException?.value && lastException.type
      ? `${lastException.type}: ${lastException.value}`
      : undefined,
  ].filter((text): text is string => !!text)

  return candidates.some((text) =>
    BROWSER_TRANSLATION_DOM_ERRORS.some((pattern) => matchesPattern(text, pattern))
  )
}

/**
 * Best-effort: Chrome adds `translated-ltr` / `translated-rtl` to `<html>`, and Google Translate
 * wraps text in `<font>` elements. Firefox and Edge are less reliable, so `false` is not proof.
 */
export function isPageTranslated(
  doc: Pick<Document, 'documentElement' | 'querySelector'> | undefined = typeof document ===
  'undefined'
    ? undefined
    : document
): boolean {
  // `documentElement` is null for a document with no root element
  if (!doc?.documentElement) return false
  const classes = doc.documentElement.classList
  if (classes.contains('translated-ltr') || classes.contains('translated-rtl')) return true
  return doc.querySelector('font[style*="vertical-align: inherit"]') !== null
}

export const BROWSER_NOISE_IGNORE_ERRORS: (string | RegExp)[] = [
  // === Network / infrastructure (not actionable on FE) ===
  /504 Gateway Time-out/,
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  'AbortError',
  'TypeError: cancelled',
  'TypeError: Cancelled',

  // === Browser extensions: generic DOM null reads ===
  // Too many unrelated causes to attribute to browser translation, so these stay ignored.
  // The insert/remove node errors live in BROWSER_TRANSLATION_DOM_ERRORS.
  "Cannot read properties of null (reading 'parentNode')",
  "Cannot read properties of null (reading 'removeChild')",
  "TypeError: can't access dead object",
  /^NS_ERROR_/,
  // Extension messaging API (chrome.runtime / browser.runtime), never called by our code
  /Invalid call to runtime\.sendMessage\(\)/,

  // === Non-Error throws (extensions, third-party libs throwing strings/objects) ===
  'Non-Error exception captured',
  'Non-Error promise rejection captured',
  /^Object captured as exception with keys:/,

  // === Cross-origin script errors (no useful info) ===
  'Script error.',
  'Script error',
]
