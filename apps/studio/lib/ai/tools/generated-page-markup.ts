/**
 * Mechanical checks on a generated page's markup, run at tool-input time.
 *
 * The bar for a rule here is that it is *certainly* wrong, not usually wrong. A false
 * positive costs the model a retry out of a budget of ten steps, so a check that fires on
 * a judgment call is worse than no check at all — it turns a mediocre page into a failed
 * request. Composition and hierarchy are judgment; they belong in the prompt and in the
 * eval judge, not here.
 *
 * An earlier revision also checked for nested cards, a card around every item, and a
 * repeated summary strip. Those rules were keyed to the injected `studio-*` class names,
 * and were removed with the kit itself. Restating them against arbitrary class names would
 * mean guessing which of a page's boxes were meant to be boxes, which is exactly the kind
 * of judgment this file is the wrong place for.
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

export type GeneratedPageMarkupIssue = { rule: string; message: string }

/**
 * Returns every mechanical problem with a Studio-design page. An empty array means the
 * markup cleared these checks — not that the page is well designed, which is a judgment
 * the user and the eval judge make.
 */
export function findGeneratedPageMarkupIssues(html: string): GeneratedPageMarkupIssue[] {
  const issues: GeneratedPageMarkupIssue[] = []
  const source = withoutComments(html).replace(CHART_TOKEN_DECLARATION, '')

  const literalColors = [
    ...Array.from(source.matchAll(HEX_COLOR)).map((match) => match[0]),
    ...Array.from(source.matchAll(FUNCTIONAL_COLOR)).map((match) => match[0].trim()),
  ]
  if (literalColors.length > 0) {
    const sample = Array.from(new Set(literalColors)).slice(0, 5).join(', ')
    issues.push({
      rule: 'literal-color',
      message: `literal color value(s) found (${sample}). Use the injected Studio tokens — \`var(--foreground)\`, \`var(--border)\`, \`color-mix(in oklab, var(--primary) 12%, transparent)\`. If a chart needs a concrete value no token provides, declare it once as a \`--chart-*\` custom property.`,
    })
  }

  if (TABLE_WIDE_BREAK.test(source)) {
    TABLE_WIDE_BREAK.lastIndex = 0
    issues.push({
      rule: 'table-wide-break',
      message:
        '`word-break: break-all` or `overflow-wrap: anywhere` is applied to the table or to every cell. Put it on the single column that holds prose, give the short columns `white-space: nowrap`, and let the table scroll inside an `overflow-x: auto` container instead.',
    })
  }

  return issues
}

/**
 * States a generated page must be able to show when it depends on a declared query.
 * A page that renders nothing while it waits, or silently blanks on failure, reads as
 * broken — and this is the requirement the model most often drops once the layout gets
 * long. Unlike a composition rule, it has one correct answer.
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
