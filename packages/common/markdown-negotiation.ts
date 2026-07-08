// Live-fetch agents only. Training crawlers (GPTBot, ClaudeBot, CCBot) are
// governed by robots.txt; serving them content that differs from the HTML
// page risks SEO and cloaking penalties.
const LLM_USER_AGENT = /\bClaude-User\b|\bClaude-Web\b|\bChatGPT-User\b|\bPerplexityBot\b/i

// Media ranges (RFC 9110 §5.3.2) ordered most to least specific.
const RANGES = ['text/markdown', 'text/html', 'text/*', '*/*'] as const
type Range = (typeof RANGES)[number]

const Q_PARAM = /^\s*q\s*=\s*([\d.]+)\s*$/i

// Cap UA length before the regex test to bound CPU on the edge hot path.
const MAX_UA_LENGTH = 512

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
 * `hasMarkdownVariant` is false for paths with no markdown representation (they
 * never negotiate). `isMarkdownSuffix` forces markdown for an explicit `.md`
 * request; callers that handle `.md` upstream can leave it false.
 */
export function negotiateMarkdown(
  { acceptHeader, userAgent }: { acceptHeader: string; userAgent: string },
  {
    hasMarkdownVariant,
    isMarkdownSuffix = false,
  }: { hasMarkdownVariant: boolean; isMarkdownSuffix?: boolean }
): MarkdownDecision {
  if (!hasMarkdownVariant) return 'pass'

  // LLM agents and an explicit `.md` request always get markdown.
  if (LLM_USER_AGENT.test(userAgent.slice(0, MAX_UA_LENGTH)) || isMarkdownSuffix) {
    return 'markdown'
  }

  // No Accept header = browser/default client: serve HTML, never 406.
  if (!acceptHeader) return 'pass'

  const accept = parseAccept(acceptHeader)

  // 406 when Accept rejects every type this route can produce. Only reached for
  // non-LLM, non-`.md` clients that sent an Accept header (guards above), so a
  // deliberate `Accept: application/json` gets a clean 406 instead of HTML.
  if (accept.markdown === 0 && accept.html === 0) return 'not-acceptable'

  return shouldServeMarkdown(accept) ? 'markdown' : 'pass'
}
