/**
 * Compiles a generated page's inline scripts on the server, without running them, so a
 * syntax error comes back to the model as a rejected tool call it can fix straight away.
 * Otherwise the user approves the page and only then sees it fail.
 *
 * Server only: `node:vm` is not available in the browser, which is why this lives apart
 * from `generated-page-schema.ts`.
 */
import { Script } from 'node:vm'

const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
const SRC_ATTRIBUTE = /\bsrc\s*=/i
const TYPE_ATTRIBUTE = /\btype\s*=\s*["']?([^"'\s>]+)/i
const CLASSIC_SCRIPT_TYPES = new Set(['', 'text/javascript', 'application/javascript'])

/**
 * Returns one message per inline classic script that fails to compile. Scripts with a
 * `src`, modules, and data blocks such as `application/json` are skipped: they are not
 * compiled as classic scripts, so this check would misjudge them.
 */
export function findGeneratedPageScriptSyntaxErrors(html: string): string[] {
  const errors: string[] = []
  let index = 0

  for (const [, attributes, source] of html.matchAll(INLINE_SCRIPT)) {
    index += 1
    if (SRC_ATTRIBUTE.test(attributes)) continue
    const type = TYPE_ATTRIBUTE.exec(attributes)?.[1]?.toLowerCase() ?? ''
    if (!CLASSIC_SCRIPT_TYPES.has(type)) continue

    try {
      // Compiling is parsing only; nothing in the script is executed.
      new Script(source, { filename: `script ${index}` })
    } catch (error) {
      // Compared by name: an error from another realm (a test environment) fails instanceof.
      if (!isSyntaxError(error)) continue
      const line = getErrorLine(error, `script ${index}`)
      errors.push(
        `Inline <script> #${index} has a syntax error${line ? ` on line ${line}` : ''}: ${error.message}`
      )
    }
  }

  return errors
}

function isSyntaxError(error: unknown): error is Error {
  return typeof error === 'object' && error !== null && (error as Error).name === 'SyntaxError'
}

/** V8 puts the failing location in the stack's first line, as `<filename>:<line>`. */
function getErrorLine(error: Error, filename: string): number | undefined {
  const match = error.stack?.match(new RegExp(`${filename}:(\\d+)`))
  return match ? Number(match[1]) : undefined
}
