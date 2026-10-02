#!/usr/bin/env node
/**
 * Generates lib/bulk-redirects/docs-redirects-md-variants.json — a checked-in
 * generated file, not a build step. Run after editing lib/bulk-redirects/docs.json:
 *   pnpm run generate:docs-redirects-md-variants
 * CI verifies this output is in sync (see .github/workflows/www-tests.yml).
 * Matches the .md-variant logic in next.config.mjs's redirects().
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsPath = path.join(__dirname, '../lib/bulk-redirects/docs.json')
const outputPath = path.join(__dirname, '../lib/bulk-redirects/docs-redirects-md-variants.json')

const docs = JSON.parse(fs.readFileSync(docsPath, 'utf-8'))

const mdVariants = docs
  .filter(
    (r) =>
      r.source.startsWith('/docs/guides/') &&
      typeof r.destination === 'string' &&
      r.destination.startsWith('/')
  )
  .map((r) => ({ ...r, source: `${r.source}.md`, destination: `${r.destination}.md` }))

if (mdVariants.length > 0) {
  fs.writeFileSync(outputPath, JSON.stringify(mdVariants, null, 2) + '\n')
  console.log(`✓ docs-redirects-md-variants.json (${mdVariants.length} variants)`)
} else {
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
}
