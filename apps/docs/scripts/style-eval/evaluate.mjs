/**
 * Score one docs guide against the docs style guide and write the result next
 * to the page it graded. For every guide at once, see evaluate-all.mjs.
 *
 * Usage:
 *   node scripts/style-eval/evaluate.mjs guides/database/functions
 *
 * Output: content/<slug>.style-eval.json
 */
import { evaluatePage, loadApiKey, loadStyleGuide, writeResult } from './evaluate-page.mjs'

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: node scripts/style-eval/evaluate.mjs <slug>, e.g. guides/database/functions')
  process.exit(1)
}

const apiKey = loadApiKey()
if (!apiKey) {
  console.error('Set AI_GATEWAY_API_KEY, in apps/docs/.env.local or in your shell.')
  process.exit(1)
}

const styleGuide = await loadStyleGuide()
const output = await evaluatePage({ slug, styleGuide, apiKey })
const destination = await writeResult(slug, output)

console.log(`Wrote ${destination}`)
for (const [name, { percent, rung }] of Object.entries(output.scores)) {
  console.log(`  ${name.padEnd(20)} ${String(percent).padStart(5)}%  ${rung}`)
}
