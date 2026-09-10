// Media ranges (RFC 9110 §5.3.2) ordered most to least specific.
const RANGES = ['text/markdown', 'text/html', 'text/*', '*/*'] as const
type Range = (typeof RANGES)[number]

const Q_PARAM = /^\s*q\s*=\s*([\d.]+)\s*$/i

function isRange(s: string): s is Range {
  return (RANGES as readonly string[]).includes(s)
}

function parseQ(params: string[]): number {
  for (const p of params) {
    const q = parseFloat(p.match(Q_PARAM)?.[1] ?? '')
    if (Number.isFinite(q) && q >= 0 && q <= 1) return q
  }
  return 1
}

// `markdownExplicit` lets callers avoid flipping a bare `Accept: */*` to
// markdown — generic clients sending */* aren't expressing a preference.
function parseAccept(header: string) {
  const seen = new Map<Range, number>()

  for (const entry of header.toLowerCase().split(',')) {
    const [rawType, ...params] = entry.trim().split(';')
    const range = rawType.trim()
    if (!isRange(range)) continue
    seen.set(range, Math.max(seen.get(range) ?? -1, parseQ(params)))
  }

  return {
    html: seen.get('text/html') ?? seen.get('text/*') ?? seen.get('*/*') ?? 0,
    markdown: seen.get('text/markdown') ?? seen.get('text/*') ?? seen.get('*/*') ?? 0,
    markdownExplicit: seen.has('text/markdown') || seen.has('text/*'),
  }
}

function shouldServeMarkdown(accept: ReturnType<typeof parseAccept>): boolean {
  if (accept.markdown === 0) return false
  if (accept.markdown > accept.html) return true
  return accept.markdown === accept.html && accept.markdownExplicit
}

export type MarkdownDecision = 'markdown' | 'not-acceptable' | 'pass'

/**
 * Content negotiation for routes that can serve either HTML or markdown.
 *
 * Markdown is served only on an explicit client signal: a `.md` request
 * (`isMarkdownSuffix`) or an Accept header preferring text/markdown. There is
 * deliberately no user-agent detection: responses that vary by UA poison
 * UA-blind CDN caches, and at least one major agent's reader hard-fails on
 * markdown it did not explicitly ask for.
 *
 * `hasMarkdownVariant` is false for paths with no markdown representation
 * (they never negotiate).
 */
export function negotiateMarkdown(
  { acceptHeader }: { acceptHeader: string },
  {
    hasMarkdownVariant,
    isMarkdownSuffix = false,
  }: { hasMarkdownVariant: boolean; isMarkdownSuffix?: boolean }
): MarkdownDecision {
  if (!hasMarkdownVariant) return 'pass'

  if (isMarkdownSuffix) return 'markdown'

  // No Accept header = browser/default client: serve HTML, never 406.
  if (!acceptHeader) return 'pass'

  const accept = parseAccept(acceptHeader)

  // 406 when Accept rejects every type this route can produce, so a
  // deliberate `Accept: application/json` gets a clean 406 instead of HTML.
  if (accept.markdown === 0 && accept.html === 0) return 'not-acceptable'

  return shouldServeMarkdown(accept) ? 'markdown' : 'pass'
}
