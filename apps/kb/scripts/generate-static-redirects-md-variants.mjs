#!/usr/bin/env node
// Generates the Vercel bulk redirects file for apps/kb from redirects/static-redirects.json.
//
// Every entry also gets a `.md` variant, so a renamed or removed page redirects correctly when
// fetched as markdown. Shape rules (/kb/ paths, no .md, internal destinations) are checked by
// scripts/static-redirects.test.ts.
//
// Usage:
//   pnpm run redirects:generate
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const redirectsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'redirects')
const OUTPUT_PATH = join(redirectsDir, 'generated', 'static-redirects-md-variants.json')

const source = JSON.parse(readFileSync(join(redirectsDir, 'static-redirects.json'), 'utf8'))

// Bulk redirects drop the query string unless `preserveQueryParams` is set.
const output = source.flatMap((r) =>
  [r, { ...r, source: `${r.source}.md`, destination: `${r.destination}.md` }].map((entry) => ({
    ...entry,
    preserveQueryParams: true,
  }))
)

// Bulk redirects match the source as a literal path, so route syntax would never match.
const invalid = output.find((r) => /[:*()\\]/.test(r.source))
if (invalid) throw new Error(`${invalid.source} is not static. Move it to vercel.json.`)

// Also catches a hand-written .md entry, which would collide with its generated variant.
const sources = output.map((r) => r.source)
const duplicate = sources.find((s, i) => sources.indexOf(s) !== i)
if (duplicate) throw new Error(`Duplicate source: ${duplicate}`)

mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n')
console.log(`Wrote ${OUTPUT_PATH}`)
