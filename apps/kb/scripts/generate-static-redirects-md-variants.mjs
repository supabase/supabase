#!/usr/bin/env node
// Generates the Vercel bulk redirects file for apps/kb from redirects/static-redirects.json.
//
// Every entry with a destination on this site also gets a `.md` variant, so a renamed or removed
// page redirects correctly when fetched as markdown. Shape rules (/kb/ sources, no .md, valid
// destinations) are checked by scripts/static-redirects.test.ts.
//
// Usage:
//   pnpm run redirects:generate
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const redirectsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'redirects')
const OUTPUT_PATH = join(redirectsDir, 'generated', 'static-redirects-md-variants.json')

const source = JSON.parse(readFileSync(join(redirectsDir, 'static-redirects.json'), 'utf8'))

// Only destinations on this site have a markdown export, so other destinations (a /docs path or
// an https:// URL) get no `.md` variant.
const withMdVariant = (r) =>
  r.destination.startsWith('/kb/')
    ? [r, { ...r, source: `${r.source}.md`, destination: `${r.destination}.md` }]
    : [r]

// Bulk redirects drop the query string unless `preserveQueryParams` is set.
const output = source
  .flatMap(withMdVariant)
  .map((entry) => ({ ...entry, preserveQueryParams: true }))

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
