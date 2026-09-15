/**
 * Mechanical checks on a generated page's markup, run at tool-input time.
 *
 * The bar for a rule here is that it is *certainly* wrong, not usually wrong. A false
 * positive costs the model a retry out of a budget of ten steps, so a check that fires on
 * a judgment call is worse than no check at all — it turns a mediocre page into a failed
 * request. Composition and hierarchy are judgment; they belong in the prompt and in the
 * eval judge, not here.
 *
 * Every rule carries the sentence that states it in the system prompt. A check the model
 * was never told about is a retry it pays for after writing the whole page, and the retry
 * is the expensive half of the request — so the rule and its prompt line are declared
 * together, and a new rule cannot be added without writing one. An earlier revision kept
 * the two apart and they drifted: the prompt advertised three checks that had been deleted
 * and none of the two that had replaced them.
 *
 * (Those deleted rules — nested cards, a card around every item, a repeated summary strip
 * — were keyed to the injected `studio-*` class names, and went with the kit itself.
 * Restating them against arbitrary class names would mean guessing which of a page's boxes
 * were meant to be boxes, which is exactly the kind of judgment this file is wrong for.)
 */

/**
 * Literal colors are allowed in one place: a `--chart-*` custom property. Charts genuinely
 * need concrete values that no semantic token provides, and forcing them through a named
 * variable keeps them centralized and reviewable instead of scattered through the markup.
 */
const CHART_TOKEN_DECLARATION = /--chart-[a-z0-9-]*\s*:\s*[^;]+;?/gi

const HEX_COLOR = /#[0-9a-f]{3,8}\b/gi
/** `hsl(var(--brand-link))` is the sanctioned legacy-token form, so only flag literals. */
const FUNCTIONAL_COLOR = /\b(?:rgba?|hsla?)\(\s*(?!var\()/gi

const ROLE_STATUS = /role\s*=\s*["']status["']/i
const ROLE_ALERT = /role\s*=\s*["']alert["']/i

/**
 * Character-level wrapping applied to every cell rather than to one chosen prose column.
 * Scoped to bare `table`/`td`/`th` element selectors: a class selector may well be the one
 * column that should wrap anywhere, but breaking the whole table turns every URL, id, and
 * timestamp into an unreadable column two characters wide.
 */
const TABLE_WIDE_BREAK =
  /(^|[,{}>])\s*(?:[^,{}]*\s)?(?:table|td|th)\s*(?:,[^{]*)?\{[^}]*(?:word-break\s*:\s*break-all|overflow-wrap\s*:\s*anywhere)/gi

/** Comments are stripped so a commented-out color or role does not count either way. */
function withoutComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

/**
 * Two things share the `#` that opens a hex color and are not colors: a numeric character
 * reference (`&#8212;` — an em dash reads as `#8212`) and a fragment link (`href="#feed"`
 * — four hex letters). Both were rejected as literal colors, which sent the model back to
 * rewrite a whole page over an em dash. Strip them before the color scan rather than
 * narrowing the hex pattern, which would start missing real three-digit colors.
 */
const NUMERIC_CHARACTER_REFERENCE = /&#x?[0-9a-f]+;?/gi
const FRAGMENT_HREF = /href\s*=\s*["']#[^"']*["']/gi

type GeneratedPageMarkupRule = {
  rule: string
  patterns: RegExp[]
  /** Returned to the model when the rule fires, addressed to the fix. */
  message: (matches: string[]) => string
  /**
   * How the rule is stated in the system prompt, before the model writes any markup.
   * Required: a rule the model only meets as a rejection is a wasted generation.
   */
  promptLine: string
}

const STUDIO_MARKUP_RULES: GeneratedPageMarkupRule[] = [
  {
    rule: 'literal-color',
    patterns: [HEX_COLOR, FUNCTIONAL_COLOR],
    message: (matches) =>
      `literal color value(s) found (${matches.slice(0, 5).join(', ')}). Use the injected Studio tokens — \`var(--foreground)\`, \`var(--border)\`, \`color-mix(in oklab, var(--primary) 12%, transparent)\`. If a chart needs a concrete value no token provides, declare it once as a \`--chart-*\` custom property.`,
    promptLine:
      'Every color is a token. A hex value or an `rgb()`/`hsl()` literal anywhere in the markup — including a box-shadow, an SVG fill, or a color set from JavaScript — is rejected. The one exception is a `--chart-*` custom property, which may hold a concrete value.',
  },
  {
    rule: 'table-wide-break',
    patterns: [TABLE_WIDE_BREAK],
    message: () =>
      '`word-break: break-all` or `overflow-wrap: anywhere` is applied to the table or to every cell. Put it on the single column that holds prose, give the short columns `white-space: nowrap`, and let the table scroll inside an `overflow-x: auto` container instead.',
    promptLine:
      '`word-break: break-all` and `overflow-wrap: anywhere` are rejected on a bare `table`, `td`, or `th` selector. Put either one on the class of the single prose column that needs it.',
  },
]

export type GeneratedPageMarkupIssue = { rule: string; message: string }

/**
 * Returns every mechanical problem with a Studio-design page. An empty array means the
 * markup cleared these checks — not that the page is well designed, which is a judgment
 * the user and the eval judge make.
 */
export function findGeneratedPageMarkupIssues(html: string): GeneratedPageMarkupIssue[] {
  const source = withoutComments(html)
    .replace(CHART_TOKEN_DECLARATION, '')
    .replace(NUMERIC_CHARACTER_REFERENCE, '')
    .replace(FRAGMENT_HREF, '')

  return STUDIO_MARKUP_RULES.flatMap((rule) => {
    const matches = rule.patterns.flatMap((pattern) =>
      Array.from(source.matchAll(pattern)).map((match) => match[0].trim())
    )
    if (matches.length === 0) return []
    return [{ rule: rule.rule, message: rule.message(Array.from(new Set(matches))) }]
  })
}

/**
 * States a generated page must be able to show when it depends on a declared query.
 * A page that renders nothing while it waits, or silently blanks on failure, reads as
 * broken — and this is the requirement the model most often drops once the layout gets
 * long. Unlike a composition rule, it has one correct answer.
 *
 * The check is for the two ARIA roles rather than for "a loading state", because that is
 * the only part of it a regex can see. The prompt therefore has to ask for the roles by
 * name — a page with a perfectly good `<p class="loading">` fails this, and asking for
 * "a loading state" is not the same instruction.
 */
export function findGeneratedPageStateIssue(html: string, queryCount: number): string | null {
  if (queryCount === 0) return null

  const body = withoutComments(html)
  const missing: string[] = []
  if (!ROLE_STATUS.test(body)) missing.push('a loading state with `role="status"`')
  if (!ROLE_ALERT.test(body)) missing.push('an error state with `role="alert"`')
  if (missing.length === 0) return null

  return `the page runs ${queryCount} declared quer${queryCount === 1 ? 'y' : 'ies'} but is missing ${missing.join(' and ')}. Every query-dependent region needs a loading, empty, and error state.`
}

/** The Studio-only markup rules, as the system prompt states them. */
export const GENERATED_PAGE_STUDIO_MARKUP_RULES_PROMPT = STUDIO_MARKUP_RULES.map(
  (rule) => `- ${rule.promptLine}`
).join('\n')

/** The query-state rule, which holds for a custom design too. */
export const GENERATED_PAGE_QUERY_STATE_RULE_PROMPT =
  '- A page that declares any query must contain the literal attributes `role="status"` (on its loading state) and `role="alert"` (on its error state). These are checked as strings: a loading element without `role="status"` is rejected however good the state itself is. Add both on the first pass, on the elements that really do announce loading and failure.'
